import { useEffect } from "react";

let users = 0;

// The browser parks a focused control barely on screen, which is the scroll
// position where its cue has not opened yet. Scroll to where the cue is lit.
function onFocusIn(e: FocusEvent): void {
  const el = e.target;
  if (!(el instanceof Element)) return;
  const cue = el.closest<HTMLElement>("[data-sc-act] .sc-cue");
  const act = cue?.closest<HTMLElement>("[data-sc-act]");
  if (!cue || !act) return;
  if (parseFloat(getComputedStyle(cue).opacity || "1") > 0.85) return;
  const peak = parseFloat(cue.dataset["scPeak"] ?? "");
  if (act.dataset["scAct"] === "flow" || Number.isNaN(peak)) {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    return;
  }
  // In a pinned act the element sits still while the page scrolls, so centring
  // it would scroll out of the cue; go to the act progress where it peaks.
  const r = act.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const travel = Math.max(r.height - window.innerHeight, 1);
  window.scrollTo({ top: top + peak * travel, behavior: "instant" });
}

export function useFocusRescue(): void {
  useEffect(() => {
    if (users === 0) document.addEventListener("focusin", onFocusIn);
    users += 1;
    return () => {
      users -= 1;
      if (users === 0) document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
