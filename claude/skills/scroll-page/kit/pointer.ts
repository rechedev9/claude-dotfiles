import { clamp, clamp01, hasFinePointer, prefersReducedMotion } from "./media";

interface Entry {
  el: HTMLElement;
  tilt: number | null;
  magnet: number | null;
  spotlight: boolean;
  rect: DOMRect | null;
  tx: number;
  ty: number;
  x: number;
  y: number;
  mtx: number;
  mty: number;
  mx: number;
  my: number;
  written: string;
}

const entries = new Map<HTMLElement, Entry>();
let wired = false;
let frame = 0;

function invalidateRects(): void {
  for (const e of entries.values()) e.rect = null;
}

function onMove(ev: PointerEvent): void {
  if (ev.pointerType === "touch") return;
  const vh = window.innerHeight;
  for (const e of entries.values()) {
    // One rect per element until the page scrolls or resizes, not one per move.
    const r = e.rect ?? e.el.getBoundingClientRect();
    e.rect = r;
    const cx = ev.clientX - (r.left + r.width / 2);
    const cy = ev.clientY - (r.top + r.height / 2);
    if (e.tilt !== null) {
      const off = r.bottom < -200 || r.top > vh + 200;
      const nx = cx / (r.width / 2);
      const ny = cy / (r.height / 2);
      const inside = !off && Math.abs(nx) < 1.6 && Math.abs(ny) < 1.6;
      e.tx = inside ? clamp(ny, { lo: -1, hi: 1 }) * -e.tilt : 0;
      e.ty = inside ? clamp(nx, { lo: -1, hi: 1 }) * e.tilt : 0;
    }
    if (e.magnet !== null) {
      const near = Math.abs(cx) < r.width && Math.abs(cy) < r.height * 2.5;
      e.mtx = near ? cx * e.magnet : 0;
      e.mty = near ? cy * e.magnet : 0;
    }
    if (e.spotlight) {
      e.el.style.setProperty("--sc-mx", clamp01((ev.clientX - r.left) / r.width).toFixed(3));
      e.el.style.setProperty("--sc-my", clamp01((ev.clientY - r.top) / r.height).toFixed(3));
    }
  }
  if (!frame) frame = requestAnimationFrame(tick);
}

function onLeave(): void {
  for (const e of entries.values()) {
    e.tx = 0;
    e.ty = 0;
    e.mtx = 0;
    e.mty = 0;
  }
  if (!frame) frame = requestAnimationFrame(tick);
}

// Lerp toward the target so the motion carries weight; stop once it lands.
function tick(): void {
  frame = 0;
  let busy = false;
  for (const e of entries.values()) {
    e.x += (e.tx - e.x) * 0.09;
    e.y += (e.ty - e.y) * 0.09;
    e.mx += (e.mtx - e.mx) * 0.12;
    e.my += (e.mty - e.my) * 0.12;
    const moving =
      Math.abs(e.tx - e.x) > 0.002 ||
      Math.abs(e.ty - e.y) > 0.002 ||
      Math.abs(e.mtx - e.mx) > 0.05 ||
      Math.abs(e.mty - e.my) > 0.05;
    if (!moving) {
      e.x = e.tx;
      e.y = e.ty;
      e.mx = e.mtx;
      e.my = e.mty;
    } else busy = true;
    const parts: string[] = [];
    if (e.magnet !== null) parts.push(`translate3d(${e.mx.toFixed(2)}px, ${e.my.toFixed(2)}px, 0)`);
    if (e.tilt !== null) {
      parts.push(`perspective(1100px) rotateX(${e.x.toFixed(3)}deg) rotateY(${e.y.toFixed(3)}deg)`);
    }
    const next = parts.join(" ");
    if (next !== e.written) {
      e.el.style.transform = next;
      e.written = next;
    }
  }
  if (busy) frame = requestAnimationFrame(tick);
}

function wire(): void {
  if (wired) return;
  if (prefersReducedMotion() || !hasFinePointer()) return;
  wired = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", invalidateRects, { passive: true });
  window.addEventListener("resize", invalidateRects, { passive: true });
}

function unwire(): void {
  if (!wired) return;
  wired = false;
  window.removeEventListener("pointermove", onMove);
  document.removeEventListener("pointerleave", onLeave);
  window.removeEventListener("scroll", invalidateRects);
  window.removeEventListener("resize", invalidateRects);
  cancelAnimationFrame(frame);
  frame = 0;
}

export type PointerPart = { tilt: number } | { magnet: number } | { spotlight: true };

export function registerPointer(el: HTMLElement, part: PointerPart): () => void {
  const e: Entry = entries.get(el) ?? {
    el,
    tilt: null,
    magnet: null,
    spotlight: false,
    rect: null,
    tx: 0,
    ty: 0,
    x: 0,
    y: 0,
    mtx: 0,
    mty: 0,
    mx: 0,
    my: 0,
    written: "",
  };
  if ("tilt" in part) e.tilt = part.tilt;
  else if ("magnet" in part) e.magnet = part.magnet;
  else {
    e.spotlight = true;
    el.dataset["scSpotlight"] = "";
  }
  if (e.tilt !== null || e.magnet !== null) el.style.willChange = "transform";
  entries.set(el, e);
  wire();
  return () => {
    if ("tilt" in part) e.tilt = null;
    else if ("magnet" in part) e.magnet = null;
    else {
      e.spotlight = false;
      delete el.dataset["scSpotlight"];
    }
    if (e.tilt === null && e.magnet === null) {
      el.style.transform = "";
      el.style.willChange = "";
    }
    if (e.tilt === null && e.magnet === null && !e.spotlight) entries.delete(el);
    if (entries.size === 0) unwire();
  };
}
