import { clamp, clamp01, dwellCurve, isMobileViewport } from "./media";
import { installVerifyBridge } from "./verify-bridge";
import type { ClipState } from "./verify-bridge";

export interface ClipRegistration {
  video: HTMLVideoElement;
  act: HTMLElement;
  src: string;
  srcMobile: string | undefined;
  lerp: number;
  dwell: number;
  map: "life" | "travel";
  onPainted: () => void;
}

interface Clip extends ClipRegistration {
  top: number;
  height: number;
  startY: number;
  endY: number;
  cur: number;
  target: number;
  live: boolean;
  ready: boolean;
  loading: boolean;
  failedAt: number;
  painted: boolean;
  primed: boolean;
  priming: boolean;
  stuckAt: number;
  dead: boolean;
  chosenSrc: string;
  objectUrl: string | null;
  abort: AbortController | null;
  revealTimer: number;
  primeTimer: number;
  onMeta: (() => void) | null;
  onSeeked: (() => void) | null;
}

const RETRY_AFTER_MS = 8000;
const STUCK_SEEK_MS = 700;
const REVEAL_TIMEOUT_MS = 2500;
const PRIME_RELEASE_MS = 2000;
const GESTURES = ["touchstart", "touchend", "pointerdown", "click", "scroll"] as const;

const clips = new Set<Clip>();
let vh = 0;
let maxY = 1;
let lastW = 0;
let wired = false;
let tickFrame = 0;
let readFrame = 0;
let layoutFrame = 0;
let primedCount = 0;
let gesturesOn = false;

function clipStates(): ClipState[] {
  const out: ClipState[] = [];
  for (const c of clips) {
    out.push({
      src: c.chosenSrc,
      ready: c.ready,
      painted: c.painted,
      seeking: c.video.seeking,
      live: c.live,
      cur: c.cur,
      target: c.target,
      currentTime: c.video.currentTime,
      duration: c.video.duration || 0,
    });
  }
  return out;
}

function scheduleRead(): void {
  if (readFrame) return;
  readFrame = requestAnimationFrame(() => {
    readFrame = 0;
    readAll();
  });
}

function scheduleLayout(): void {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    layoutAll();
  });
}

function onResize(): void {
  // A phone's URL bar changes the height alone. Relaying out on that jumps the
  // page under the reader's thumb, so only the cached viewport height moves.
  if (window.innerWidth === lastW && isMobileViewport()) {
    vh = window.innerHeight;
    return;
  }
  lastW = window.innerWidth;
  scheduleLayout();
}

function wire(): void {
  if (wired) return;
  wired = true;
  lastW = window.innerWidth;
  window.addEventListener("scroll", scheduleRead, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.fonts.ready.then(() => {
    if (wired) scheduleLayout();
  });
  installVerifyBridge(clipStates);
}

function unwire(): void {
  wired = false;
  window.removeEventListener("scroll", scheduleRead);
  window.removeEventListener("resize", onResize);
  stopGestures();
  cancelAnimationFrame(tickFrame);
  cancelAnimationFrame(readFrame);
  cancelAnimationFrame(layoutFrame);
  tickFrame = 0;
  readFrame = 0;
  layoutFrame = 0;
}

function layoutAll(): void {
  vh = window.innerHeight;
  maxY = Math.max(document.documentElement.scrollHeight - vh, 1);
  const y = window.scrollY;
  for (const c of clips) {
    const r = c.act.getBoundingClientRect();
    c.top = r.top + y;
    c.height = r.height;
    if (c.map === "travel") {
      c.startY = c.top;
      c.endY = c.top + Math.max(c.height - vh, 1);
    } else {
      // The stage is on screen one viewport before the pin and one after it, so
      // the clip plays across that whole life, clamped to scroll that exists.
      c.startY = c.top - Math.min(vh, c.top);
      c.endY = Math.min(c.top + c.height, maxY);
    }
  }
  readAll();
}

function readAll(): void {
  const y = window.scrollY;
  let wake = false;
  for (const c of clips) {
    const raw = clamp01((y - c.startY) / Math.max(c.endY - c.startY, 1));
    c.live = y > c.top - vh * 1.25 && y < c.top + c.height + vh * 1.25;
    const warm = y > c.top - vh * 3 && y < c.top + c.height + vh * 1.5;
    if (warm) loadClip(c);
    if (c.ready) {
      c.target = dwellCurve(raw, c.dwell);
      if (Math.abs(c.cur - c.target) > 0.0005) wake = true;
    }
  }
  if (wake) startTick();
}

function loadClip(c: Clip): void {
  if (c.ready || c.loading || c.dead) return;
  if (c.failedAt && performance.now() - c.failedAt < RETRY_AFTER_MS) return;
  const src = c.srcMobile && isMobileViewport() ? c.srcMobile : c.src;
  c.chosenSrc = src;
  c.loading = true;
  const abort = new AbortController();
  c.abort = abort;
  // Fetched as a Blob so seeking never depends on HTTP range support.
  fetch(src, { signal: abort.signal })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    })
    .then((blob) => {
      if (c.dead) return;
      attachClip(c, blob);
    })
    .catch(() => {
      c.loading = false;
      c.failedAt = performance.now();
    });
}

function attachClip(c: Clip, blob: Blob): void {
  const v = c.video;
  const reveal = (): void => {
    if (c.painted || c.dead) return;
    c.painted = true;
    c.onPainted();
  };
  c.onMeta = (): void => {
    c.ready = true;
    readAll();
    c.cur = c.target;
    // Force one seek even at target 0: the reveal waits for 'seeked', and the
    // loop only seeks when the time has to change.
    try {
      v.currentTime = Math.max(c.target * (v.duration || 1), 0.001);
    } catch {
      /* decoder not ready for a seek yet; the loop retries */
    }
    primeClip(c);
    startTick();
  };
  c.onSeeked = reveal;
  // Listeners before src: assigning src starts the load, and a load() after
  // that aborts the first request.
  v.addEventListener("loadedmetadata", c.onMeta, { once: true });
  v.addEventListener("seeked", c.onSeeked, { once: true });
  // iOS can accept a seek and never fire 'seeked'; a timer reveal is the floor.
  c.revealTimer = window.setTimeout(reveal, REVEAL_TIMEOUT_MS);
  v.preload = "auto";
  v.muted = true;
  v.playsInline = true;
  c.objectUrl = URL.createObjectURL(blob);
  v.src = c.objectUrl;
  startGestures();
}

function startTick(): void {
  if (!tickFrame) tickFrame = requestAnimationFrame(tick);
}

function tick(): void {
  tickFrame = 0;
  // A phone decoder cannot service a seek per frame; 20ms is under a frame.
  const eps = isMobileViewport() ? 0.02 : 0.008;
  let busy = false;
  for (const c of clips) {
    if (!c.ready || c.dead) continue;
    const v = c.video;
    if (v.seeking) {
      // Never queue a seek on a seeking decoder, but a seek stuck past 700ms is
      // re-issued rather than waited on forever.
      const now = performance.now();
      if (!c.stuckAt) c.stuckAt = now;
      else if (now - c.stuckAt > STUCK_SEEK_MS) {
        c.stuckAt = now;
        try {
          v.currentTime = v.currentTime + 0.001;
        } catch {
          /* retried next frame */
        }
      }
      busy = true;
      continue;
    }
    c.stuckAt = 0;
    const delta = c.target - c.cur;
    if (Math.abs(delta) < 0.0005) {
      c.cur = c.target;
      continue;
    }
    busy = true;
    c.cur += delta * c.lerp;
    const t = clamp(c.cur, { lo: 0, hi: 0.999 }) * (v.duration || 1);
    if (Math.abs(v.currentTime - t) > eps) {
      try {
        v.currentTime = t;
      } catch {
        /* retried next frame */
      }
    }
  }
  if (busy) tickFrame = requestAnimationFrame(tick);
}

// iOS paints nothing from a muted video that has never played: prime each clip
// once it has a source, and keep retrying on gestures until all are primed.
function primeClip(c: Clip): void {
  if (c.primed || c.priming || c.dead || !c.video.src) return;
  c.priming = true;
  const v = c.video;
  const done = (): void => {
    c.priming = false;
    if (!c.primed) {
      c.primed = true;
      primedCount += 1;
    }
    try {
      v.pause();
      // A primed decoder still shows the stale frame until a different time is
      // asked for, and the deadband will not ask if it already matches.
      const dur = v.duration || 1;
      const at = clamp(c.cur, { lo: 0, hi: 0.999 }) * dur + 0.05;
      v.currentTime = clamp(at, { lo: 0, hi: dur * 0.999 });
    } catch {
      /* harmless: the next scroll seeks anyway */
    }
    startTick();
  };
  const fail = (): void => {
    c.priming = false;
  };
  // A play() promise may never settle; release the flag so a gesture can retry.
  c.primeTimer = window.setTimeout(() => {
    if (c.priming) fail();
  }, PRIME_RELEASE_MS);
  let pr: Promise<void> | undefined;
  try {
    pr = v.play();
  } catch {
    fail();
    return;
  }
  if (pr) pr.then(done, fail);
  else done();
}

function primeAll(): void {
  for (const c of clips) primeClip(c);
  if (clips.size > 0 && primedCount >= clips.size) stopGestures();
}

// touchend and click are activation-triggering events; touchstart is not, so a
// Low Power Mode device that rejects the touchstart prime gets a valid retry.
function startGestures(): void {
  if (gesturesOn) return;
  gesturesOn = true;
  for (const g of GESTURES) window.addEventListener(g, primeAll, { passive: true });
}

function stopGestures(): void {
  if (!gesturesOn) return;
  gesturesOn = false;
  for (const g of GESTURES) window.removeEventListener(g, primeAll);
}

function releaseClip(c: Clip): void {
  c.dead = true;
  c.abort?.abort();
  window.clearTimeout(c.revealTimer);
  window.clearTimeout(c.primeTimer);
  const v = c.video;
  if (c.onMeta) v.removeEventListener("loadedmetadata", c.onMeta);
  if (c.onSeeked) v.removeEventListener("seeked", c.onSeeked);
  if (c.primed) primedCount -= 1;
  if (c.objectUrl) {
    // Drop the source before revoking so the decoder releases the Blob.
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(c.objectUrl);
  }
}

export function registerClip(reg: ClipRegistration): () => void {
  const c: Clip = {
    ...reg,
    lerp: clamp(reg.lerp, { lo: 0.02, hi: 1 }),
    top: 0,
    height: 0,
    startY: 0,
    endY: 1,
    cur: 0,
    target: 0,
    live: false,
    ready: false,
    loading: false,
    failedAt: 0,
    painted: false,
    primed: false,
    priming: false,
    stuckAt: 0,
    dead: false,
    chosenSrc: reg.src,
    objectUrl: null,
    abort: null,
    revealTimer: 0,
    primeTimer: 0,
    onMeta: null,
    onSeeked: null,
  };
  clips.add(c);
  wire();
  scheduleLayout();
  return () => {
    releaseClip(c);
    clips.delete(c);
    if (clips.size === 0) unwire();
  };
}

export function relayoutClips(): void {
  if (wired) scheduleLayout();
}

// Acts call this so the harness can read the page when no clip registers
// (reduced motion, or a page without a scrub act).
export function ensureVerifyBridge(): void {
  if (typeof window !== "undefined" && window.scrollPageBridge === undefined)
    installVerifyBridge(clipStates);
}
