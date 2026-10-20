import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Page } from "playwright-core";
import { flagBool, flagNumber, flagString, parseArgs } from "./args";
import { findFfmpeg, runFfmpeg } from "./ffmpeg";

type Playwright = typeof import("playwright-core");

interface BridgeClip {
  src: string;
  ready: boolean;
  painted: boolean;
  seeking: boolean;
  live: boolean;
  cur: number;
  target: number;
  currentTime: number;
  duration: number;
}

interface BridgeAct {
  device: string;
  pinned: boolean;
  top: number;
  height: number;
  hasClip: boolean;
}

interface Bridge {
  version: string;
  clips: () => BridgeClip[];
  acts: () => BridgeAct[];
}

declare global {
  interface Window {
    scrollPageBridge?: Bridge;
  }
}

interface ActPlan extends BridgeAct {
  index: number;
  peaks: number[];
}

interface Sample {
  index: number;
  act: number;
  device: string;
  p: number;
  y: number;
  label: string;
}

interface CueSnap {
  id: number;
  text: string;
  opacity: number;
  visible: boolean;
  kinetic: boolean;
  kinMin: number | null;
  wraps: boolean;
  color: string;
  ownFill: string | null;
  textRect: [number, number, number, number];
}

interface PageSnap {
  y: number;
  cues: CueSnap[];
  clips: BridgeClip[];
}

interface Contrast {
  min: number;
  failFrac: number;
  thinFrac: number;
  ownFill: boolean;
}

interface SampleResult extends Sample {
  settled: boolean;
  snap: PageSnap;
  contrast: Record<number, Contrast>;
  file: string;
}

interface Finding {
  type: string;
  act?: number;
  sample?: number;
  message: string;
}

const FRACS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const SLIDES = [0.6, 0.75, 0.9];
const DEAD_GAP_VH = 0.25;
const FROZEN_EPS_S = 0.012;
const FROZEN_MIN_P = 0.01;
const CLIP_VISIBLE = 0.55;
const PEAK_MIN = 0.8;
const LIT = 0.5;
const CONTRAST_FAIL = 3;
const CONTRAST_THIN = 4.5;
const LABEL_H = 40;

function usage(): void {
  console.log(
    "usage: bun shoot.ts --url <url> --out <dir> [--width N --height N] [--dpr N] [--reduced-motion]\n" +
      "  writes NN.png frames, sheet.png and report.json; prints dead-scroll, frozen-clip,\n" +
      "  never-peaks and contrast findings. Needs playwright-core in the project and an\n" +
      "  installed Chrome or Edge (or SCROLL_CHROME=<path>).",
  );
}

async function loadPlaywright(): Promise<Playwright | null> {
  let resolved: string;
  try {
    resolved = Bun.resolveSync("playwright-core", process.cwd());
  } catch {
    return null;
  }
  const mod: Playwright = await import(Bun.pathToFileURL(resolved).href);
  return mod;
}

function findChrome(): string | null {
  const env = process.env["SCROLL_CHROME"];
  const pf = process.env["PROGRAMFILES"] ?? "C:\\Program Files";
  const pf86 = process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
  const local = process.env["LOCALAPPDATA"] ?? "";
  const candidates = [
    env,
    join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    join(local, "Google", "Chrome", "Application", "chrome.exe"),
    join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/microsoft-edge",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) if (c && existsSync(c)) return c;
  return null;
}

// Runs ffmpeg on an in-memory image and returns the raw rgb24 pixels of the
// filtered result, so no image decoder is needed in the tool.
async function rasterize(options: {
  ff: string;
  image: Uint8Array;
  filter: string;
}): Promise<Uint8Array | null> {
  const { ff, image, filter } = options;
  const proc = Bun.spawn(
    [
      ff,
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-i",
      "pipe:0",
      "-vf",
      filter,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ],
    { stdin: image, stdout: "pipe", stderr: "ignore" },
  );
  const bytes = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
  const code = await proc.exited;
  return code === 0 && bytes.length > 0 ? bytes : null;
}

function linear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function ratio(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(color: string): [number, number, number] | null {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function contrastOf(text: [number, number, number], pixels: Uint8Array): Omit<Contrast, "ownFill"> {
  const lt = luminance(text);
  let min = Infinity;
  let fail = 0;
  let thin = 0;
  const n = Math.floor(pixels.length / 3);
  for (let i = 0; i < n; i += 1) {
    const r = pixels[i * 3] ?? 0;
    const g = pixels[i * 3 + 1] ?? 0;
    const b = pixels[i * 3 + 2] ?? 0;
    const c = ratio(lt, luminance([r, g, b]));
    if (c < min) min = c;
    if (c < CONTRAST_FAIL) fail += 1;
    if (c < CONTRAST_THIN) thin += 1;
  }
  return { min, failFrac: n ? fail / n : 0, thinFrac: n ? thin / n : 0 };
}

function frameDiff(a: Uint8Array, b: Uint8Array): { mean: number; max: number } {
  let sum = 0;
  let max = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const d = Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    sum += d;
    if (d > max) max = d;
  }
  return { mean: n ? sum / n : 0, max };
}

function readActs(): ActPlan[] {
  const bridge = window.scrollPageBridge;
  const els = [...document.querySelectorAll<HTMLElement>("[data-sc-act]")];
  const acts = bridge
    ? bridge.acts()
    : els.map((el) => {
        const r = el.getBoundingClientRect();
        const device = el.dataset["scAct"] ?? "flow";
        return {
          device,
          pinned: device !== "flow",
          top: r.top + window.scrollY,
          height: r.height,
          hasClip: el.querySelector("video.sc-clip") !== null,
        };
      });
  return acts.map((a, index) =>
    Object.assign(a, {
      index,
      peaks: [...(els[index]?.querySelectorAll<HTMLElement>(".sc-cue[data-sc-peak]") ?? [])]
        .map((c) => parseFloat(c.dataset["scPeak"] ?? ""))
        .filter((p) => Number.isFinite(p)),
    }),
  );
}

function readSnap(): PageSnap {
  const cues = [...document.querySelectorAll<HTMLElement>(".sc-cue")].map((el, id): CueSnap => {
    const cs = getComputedStyle(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect();
    const units = [...el.querySelectorAll<HTMLElement>(".sc-kin__u")].map((u) =>
      parseFloat(getComputedStyle(u).opacity),
    );
    const bgm = /^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*([\d.]+))?\)$/.exec(cs.backgroundColor);
    const alpha = bgm ? (bgm[1] === undefined ? 1 : Number(bgm[1])) : 0;
    const text = (el.querySelector(".sc-sr")?.textContent ?? el.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ");
    return {
      id,
      text: text.slice(0, 48),
      opacity: parseFloat(cs.opacity),
      visible: cs.visibility !== "hidden",
      kinetic: units.length > 0,
      kinMin: units.length > 0 ? Math.min(...units) : null,
      wraps: el.querySelector(".sc-cue") !== null,
      color: cs.color,
      ownFill: alpha > 0.5 ? cs.backgroundColor : null,
      textRect: [t.left, t.top, t.width, t.height],
    };
  });
  return { y: window.scrollY, cues, clips: window.scrollPageBridge?.clips() ?? [] };
}

// How lit a cue is: kinetic cues keep opacity 1 and animate their units.
function litness(c: CueSnap): number {
  if (!c.visible) return 0;
  return c.kinetic && c.kinMin !== null ? Math.min(c.opacity, c.kinMin) : c.opacity;
}

function planSamples(options: { acts: ActPlan[]; vh: number; maxY: number }): Sample[] {
  const { acts, vh, maxY } = options;
  const raw: Omit<Sample, "index">[] = [];
  const push = (s: { act: ActPlan; p: number; y: number; label: string }): void => {
    const { act, p, y, label } = s;
    raw.push({
      act: act.index,
      device: act.device,
      p,
      y: Math.round(Math.min(Math.max(y, 0), maxY)),
      label,
    });
  };
  for (const act of acts) {
    const travel = Math.max(act.height - vh, 1);
    const yAt = (p: number): number =>
      act.pinned ? act.top + p * travel : act.top - vh + p * (act.height + vh);
    for (const f of FRACS) {
      const p = 0.02 + f * 0.96;
      push({ act, p, y: yAt(p), label: "" });
    }
    for (const p of act.peaks) push({ act, p, y: yAt(p), label: "peak" });
    if (act.hasClip && act.pinned) {
      for (const c of SLIDES) {
        if (act.top > 0) push({ act, p: 0, y: act.top - vh * (1 - c), label: `entry ${c}` });
        push({ act, p: 1, y: act.top + act.height - vh * c, label: `exit ${c}` });
      }
    }
  }
  raw.sort((a, b) => a.y - b.y || a.act - b.act);
  const out: Sample[] = [];
  for (const s of raw) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.y - s.y) < 2 && last.act === s.act) continue;
    out.push({ ...s, index: out.length });
  }
  return out;
}

function coverage(options: { act: BridgeAct; y: number; vh: number }): number {
  const { act, y, vh } = options;
  const a = Math.max(act.top, y);
  const b = Math.min(act.top + act.height, y + vh);
  return Math.max(0, b - a) / vh;
}

interface ShootOptions {
  page: Page;
  ff: string;
  out: string;
  samples: Sample[];
  digits: number;
}

function hideCue(id: number): void {
  const el = document.querySelectorAll<HTMLElement>(".sc-cue")[id];
  if (el) el.style.visibility = "hidden";
  for (const f of document.querySelectorAll<HTMLElement>(".sc-progress, #sc-shoot-label"))
    f.style.display = "none";
}

function showCue(id: number): void {
  const el = document.querySelectorAll<HTMLElement>(".sc-cue")[id];
  if (el) el.style.visibility = "";
  for (const f of document.querySelectorAll<HTMLElement>(".sc-progress, #sc-shoot-label"))
    f.style.display = "";
}

async function contrastOfCue(o: {
  page: Page;
  ff: string;
  cue: CueSnap;
}): Promise<Contrast | null> {
  const { page, ff, cue } = o;
  const text = parseRgb(cue.color);
  if (!text) return null;
  if (cue.ownFill) {
    const fill = parseRgb(cue.ownFill);
    if (!fill) return null;
    const r = ratio(luminance(text), luminance(fill));
    return {
      min: r,
      failFrac: r < CONTRAST_FAIL ? 1 : 0,
      thinFrac: r < CONTRAST_THIN ? 1 : 0,
      ownFill: true,
    };
  }
  const vw = page.viewportSize()?.width ?? 0;
  const vh = page.viewportSize()?.height ?? 0;
  const [tx, ty, tw, th] = cue.textRect;
  const x0 = Math.max(tx, 0);
  const y0 = Math.max(ty, LABEL_H);
  const x1 = Math.min(tx + tw, vw);
  const y1 = Math.min(ty + th, vh);
  if (x1 - x0 < 8 || y1 - y0 < 8) return null;
  // The cue is hidden so the sample sees what sits behind its text.
  await page.evaluate(hideCue, cue.id);
  const clip = await page.screenshot({
    type: "png",
    clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
  });
  await page.evaluate(showCue, cue.id);
  const px = await rasterize({ ff, image: clip, filter: "scale=32:16:flags=area" });
  return px ? { ...contrastOf(text, px), ownFill: false } : null;
}

interface ShootState {
  results: SampleResult[];
  rasters: (Uint8Array | null)[];
  settleTimeout: number;
}

async function shootOne(o: ShootOptions & { sample: Sample; state: ShootState }): Promise<void> {
  const { page, ff, out, digits, sample: s, state: st } = o;
  await page.evaluate(
    ({ y, text }) => {
      window.scrollTo({ top: y, behavior: "instant" });
      const el = document.getElementById("sc-shoot-label");
      if (el) el.textContent = text;
    },
    {
      y: s.y,
      text: `#${String(s.index).padStart(digits, "0")} act ${s.act} ${s.device} p=${s.p.toFixed(2)} y=${s.y} ${s.label}`.trim(),
    },
  );
  await page.waitForTimeout(180);
  let settled = true;
  try {
    // A frame taken mid-lerp or mid-seek is one the page never holds.
    await page.waitForFunction(
      () =>
        (window.scrollPageBridge?.clips() ?? []).every(
          (c) =>
            !c.live || (c.ready && c.painted && !c.seeking && Math.abs(c.cur - c.target) < 0.002),
        ),
      undefined,
      { timeout: st.settleTimeout },
    );
  } catch {
    settled = false;
    st.settleTimeout = 1200;
  }
  const snap = await page.evaluate(readSnap);
  const png = await page.screenshot({ type: "png" });
  const file = `${String(s.index).padStart(digits, "0")}.png`;
  writeFileSync(join(out, file), png);
  st.rasters.push(
    await rasterize({
      ff,
      image: png,
      filter: `crop=iw:ih-${LABEL_H}:0:${LABEL_H},scale=64:36:flags=area`,
    }),
  );
  const contrast: Record<number, Contrast> = {};
  // A cue that wraps other cues shares their text; the inner ones are measured.
  const lit = snap.cues.filter((c) => litness(c) >= LIT && !c.wraps);
  await lit.reduce(
    (chain, cue) =>
      chain.then(async () => {
        const k = await contrastOfCue({ page, ff, cue });
        if (k) contrast[cue.id] = k;
      }),
    Promise.resolve(),
  );
  st.results.push({ ...s, settled, snap, contrast, file });
  process.stdout.write(`\r  frame ${s.index + 1}/${o.samples.length}`);
}

async function shoot(o: ShootOptions): Promise<ShootState> {
  const st: ShootState = { results: [], rasters: [], settleTimeout: 4000 };
  await o.page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "sc-shoot-label";
    el.style.cssText =
      "position:fixed;top:0;left:0;z-index:2147483647;padding:6px 10px;height:28px;font:13px/16px monospace;color:#fff;background:rgba(0,0,0,.72);pointer-events:none;white-space:nowrap";
    document.body.append(el);
  });
  // Frames must be taken one after another: each one scrolls the same page.
  const next = async (i: number): Promise<void> => {
    const s = o.samples[i];
    if (!s) return;
    await shootOne({ ...o, sample: s, state: st });
    return next(i + 1);
  };
  await next(0);
  process.stdout.write("\n");
  return st;
}

interface AnalyseOptions {
  acts: ActPlan[];
  results: SampleResult[];
  rasters: (Uint8Array | null)[];
  vh: number;
  reduced: boolean;
}

function analyse(o: AnalyseOptions): Finding[] {
  const { acts, results, rasters, vh, reduced } = o;
  const findings: Finding[] = [];
  for (const act of acts) {
    const own = results.filter((r) => r.act === act.index);
    for (let i = 1; i < own.length; i += 1) {
      const a = own[i - 1];
      const b = own[i];
      if (!a || !b) continue;
      const gap = (b.y - a.y) / vh;
      if (act.pinned && !reduced && gap > DEAD_GAP_VH) {
        const ra = rasters[a.index];
        const rb = rasters[b.index];
        if (ra && rb) {
          const d = frameDiff(ra, rb);
          if (d.mean < 1 && d.max < 12) {
            findings.push({
              type: "dead-scroll",
              act: act.index,
              sample: b.index,
              message: `act ${act.index} (${act.device}): frames ${a.file} and ${b.file} are the same across ${gap.toFixed(2)}vh of scroll (y ${a.y} to ${b.y})`,
            });
          }
        }
      }
      if (act.hasClip && act.pinned) {
        const ca = a.snap.clips[0];
        const cb = b.snap.clips[0];
        if (ca && cb && ca.ready && cb.ready && coverage({ act, y: b.y, vh }) >= CLIP_VISIBLE) {
          const dp = Math.abs(cb.target - ca.target);
          const dt = Math.abs(cb.currentTime - ca.currentTime);
          if (dp > FROZEN_MIN_P && dt < FROZEN_EPS_S) {
            findings.push({
              type: "frozen-clip",
              act: act.index,
              sample: b.index,
              message: `act ${act.index}: clip target moved ${dp.toFixed(3)} between ${a.file} and ${b.file} but currentTime stayed at ${cb.currentTime.toFixed(3)}s`,
            });
          }
        }
      }
    }
    if (act.hasClip && !reduced) {
      const onScreen = own.filter((r) => coverage({ act, y: r.y, vh }) >= CLIP_VISIBLE);
      const last = onScreen[onScreen.length - 1];
      const clip = last?.snap.clips[0];
      if (last && !clip) {
        findings.push({
          type: "clip-missing",
          act: act.index,
          message: `act ${act.index}: the video is in the DOM but no clip registered with the playhead (reduced motion, or useScrubClip not mounted)`,
        });
      } else if (last && clip && !clip.ready) {
        findings.push({
          type: "clip-missing",
          act: act.index,
          sample: last.index,
          message: `act ${act.index}: clip ${clip.src} never became ready while on screen (fetch failed, wrong path, or codec)`,
        });
      } else if (last && clip && !clip.painted) {
        findings.push({
          type: "clip-missing",
          act: act.index,
          sample: last.index,
          message: `act ${act.index}: clip ${clip.src} loaded but never painted its first frame (seek never completed)`,
        });
      }
    }
  }
  const peak = new Map<number, { max: number; text: string }>();
  for (const r of results) {
    for (const c of r.snap.cues) {
      const cur = peak.get(c.id);
      const l = litness(c);
      if (!cur) peak.set(c.id, { max: l, text: c.text });
      else if (l > cur.max) cur.max = l;
    }
  }
  for (const [id, p] of peak) {
    if (p.max < PEAK_MIN) {
      findings.push({
        type: "never-peaks",
        message: `cue ${id} "${p.text}" peaks at opacity ${p.max.toFixed(2)}: its range is too narrow or lies outside the act`,
      });
    }
  }
  const worst = new Map<number, { r: SampleResult; c: Contrast; text: string }>();
  for (const r of results) {
    for (const c of r.snap.cues) {
      const k = r.contrast[c.id];
      if (!k) continue;
      const w = worst.get(c.id);
      if (
        !w ||
        k.failFrac > w.c.failFrac ||
        (k.failFrac === w.c.failFrac && k.thinFrac > w.c.thinFrac)
      ) {
        worst.set(c.id, { r, c: k, text: c.text });
      }
    }
  }
  for (const [id, w] of worst) {
    const where = w.c.ownFill ? "on its own fill" : `behind its text in ${w.r.file}`;
    if (w.c.failFrac >= 0.2) {
      findings.push({
        type: "contrast-fail",
        sample: w.r.index,
        message: `cue ${id} "${w.text}": ${(w.c.failFrac * 100).toFixed(0)}% of the area ${where} is under 3:1 (min ${w.c.min.toFixed(2)})`,
      });
    } else if (w.c.thinFrac >= 0.3) {
      findings.push({
        type: "contrast-thin",
        sample: w.r.index,
        message: `cue ${id} "${w.text}": ${(w.c.thinFrac * 100).toFixed(0)}% of the area ${where} is under 4.5:1 (min ${w.c.min.toFixed(2)})`,
      });
    }
  }
  return findings;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const url = flagString(args, "url");
  const out = flagString(args, "out");
  if (!url || !out || flagBool(args, "help")) {
    usage();
    return 2;
  }
  const width = flagNumber(args, "width") ?? 1440;
  const height = flagNumber(args, "height") ?? 900;
  const dpr = flagNumber(args, "dpr") ?? 1;
  const reduced = flagBool(args, "reduced-motion");
  mkdirSync(out, { recursive: true });
  const ff = await findFfmpeg();
  if (!ff.ok) {
    console.error(ff.reason);
    return 2;
  }
  const pw = await loadPlaywright();
  if (!pw) {
    console.error("playwright-core is not installed in this project: bun add -d playwright-core");
    return 2;
  }
  const exe = findChrome();
  if (!exe) {
    console.error("No Chrome or Edge found. Install one or set SCROLL_CHROME to the executable.");
    return 2;
  }
  console.log(`shoot ${url} at ${width}x${height} dpr ${dpr}${reduced ? " reduced-motion" : ""}`);
  console.log(`browser ${exe}`);
  const mobile = width < 768;
  let browser: Browser;
  try {
    browser = await pw.chromium.launch({ executablePath: exe, headless: true });
  } catch (e) {
    console.error(`could not launch the browser: ${e instanceof Error ? e.message : String(e)}`);
    return 2;
  }
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      const at = m.location().url;
      if (m.type() === "error" && !at.endsWith("/favicon.ico")) errors.push(`${m.text()} (${at})`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const findings: Finding[] = [];
    let bridge = true;
    try {
      await page.waitForFunction(() => window.scrollPageBridge !== undefined, undefined, {
        timeout: 8000,
      });
    } catch {
      bridge = false;
      findings.push({
        type: "no-bridge",
        message:
          "window.scrollPageBridge never appeared: the kit did not mount (no ScrubClip registered) or hydration failed; clip checks are skipped",
      });
    }
    const env = await page.evaluate(() => ({
      sda: CSS.supports("animation-timeline: scroll()"),
      scJs: document.documentElement.classList.contains("sc-js"),
      vh: window.innerHeight,
      maxY: Math.max(document.documentElement.scrollHeight - window.innerHeight, 0),
      version: window.scrollPageBridge?.version ?? null,
    }));
    if (!env.sda)
      findings.push({
        type: "no-sda",
        message:
          "this browser has no scroll-driven animations; frames show the @supports fallback, not the scrolled page",
      });
    if (!env.scJs)
      findings.push({
        type: "no-js-class",
        message:
          "html.sc-js is missing: the in-view reveals stay visible from the start (add the head script from build.md)",
      });
    const acts = await page.evaluate(readActs);
    if (acts.length === 0) {
      console.error("no [data-sc-act] on the page; nothing to shoot");
      return 1;
    }
    const samples = planSamples({ acts, vh: env.vh, maxY: env.maxY });
    const digits = Math.max(2, String(samples.length - 1).length);
    console.log(
      `bridge ${bridge ? `v${env.version}` : "missing"}, scroll-driven animations ${env.sda ? "yes" : "no"}, html.sc-js ${env.scJs ? "yes" : "no"}, page ${env.maxY + env.vh}px`,
    );
    console.log(
      `acts ${acts.map((a) => `${a.index}:${a.device}${a.hasClip ? "+clip" : ""} ${(a.height / env.vh).toFixed(1)}vh`).join(", ")}`,
    );
    console.log(`${samples.length} samples`);
    const { results, rasters } = await shoot({ page, ff: ff.path, out, samples, digits });
    findings.push(...analyse({ acts, results, rasters, vh: env.vh, reduced }));
    const unsettled = results.filter((r) => !r.settled).map((r) => r.file);
    if (unsettled.length > 0)
      findings.push({
        type: "unsettled",
        message: `clip never settled before ${unsettled.length} frame(s): ${unsettled.slice(0, 6).join(", ")}${unsettled.length > 6 ? "..." : ""}`,
      });
    for (const e of errors.slice(0, 5)) findings.push({ type: "page-error", message: e });
    const rows = Math.ceil(results.length / 5);
    const sheet = await runFfmpeg(ff.path, [
      "-y",
      "-framerate",
      "1",
      "-i",
      join(out, `%0${digits}d.png`),
      "-frames:v",
      "1",
      "-vf",
      `scale=520:-1,tile=5x${rows}`,
      join(out, "sheet.png"),
    ]);
    if (sheet.code !== 0)
      findings.push({ type: "sheet", message: `sheet.png failed: ${sheet.stderr.trim()}` });
    const report = {
      url,
      viewport: { width, height, dpr, mobile },
      reducedMotion: reduced,
      browser: exe,
      bridge: env.version,
      scrollDrivenAnimations: env.sda,
      scJs: env.scJs,
      pageHeight: env.maxY + env.vh,
      acts,
      samples: results.map((r) => ({
        index: r.index,
        file: r.file,
        act: r.act,
        p: r.p,
        y: r.y,
        label: r.label,
        settled: r.settled,
        clips: r.snap.clips,
        cues: r.snap.cues.map((c) => ({
          id: c.id,
          text: c.text,
          lit: Number(litness(c).toFixed(3)),
          contrast: r.contrast[c.id] ?? null,
        })),
      })),
      findings,
    };
    writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(`wrote ${results.length} frames, sheet.png and report.json to ${out}`);
    if (findings.length === 0) console.log("findings: none");
    else {
      console.log(`findings: ${findings.length}`);
      for (const f of findings) console.log(`  ${f.type.padEnd(14)} ${f.message}`);
    }
    if (reduced)
      console.log(
        "note: dead-scroll is not checked under reduced motion, where still stretches are expected",
      );
    return findings.some((f) => f.type !== "contrast-thin") ? 1 : 0;
  } finally {
    await browser.close();
  }
}

process.exitCode = await main();
