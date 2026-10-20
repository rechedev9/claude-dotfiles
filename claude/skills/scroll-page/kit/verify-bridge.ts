export interface ClipState {
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

export interface ActState {
  device: string;
  pinned: boolean;
  top: number;
  height: number;
  hasClip: boolean;
}

export interface VerifyBridge {
  version: string;
  clips: () => ClipState[];
  acts: () => ActState[];
}

declare global {
  interface Window {
    scrollPageBridge?: VerifyBridge;
  }
}

function readActs(): ActState[] {
  const out: ActState[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("[data-sc-act]")) {
    const r = el.getBoundingClientRect();
    const device = el.dataset["scAct"] ?? "flow";
    out.push({
      device,
      pinned: device !== "flow",
      top: r.top + window.scrollY,
      height: r.height,
      hasClip: el.querySelector("video.sc-clip") !== null,
    });
  }
  return out;
}

// The harness settles on this before every screenshot: a frame taken mid-lerp
// is a frame the page never holds.
export function installVerifyBridge(clipSource: () => ClipState[]): void {
  if (typeof window === "undefined") return;
  window.scrollPageBridge = { version: "1", clips: clipSource, acts: readActs };
}
