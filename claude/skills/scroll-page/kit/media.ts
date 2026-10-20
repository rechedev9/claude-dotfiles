const MOBILE_MAX_WIDTH = 860;

function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

export function prefersReducedMotion(): boolean {
  return matches("(prefers-reduced-motion: reduce)");
}

export function hasFinePointer(): boolean {
  return matches("(hover: hover) and (pointer: fine)");
}

export function isMobileViewport(): boolean {
  return (
    matches("(hover: none) and (pointer: coarse)") || matches(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
  );
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function clamp(x: number, range: { lo: number; hi: number }): number {
  return x < range.lo ? range.lo : x > range.hi ? range.hi : x;
}

// Monotone remap that lingers mid-act where the copy peaks. f(0)=0 and f(1)=1
// hold for every L, so the first and last frames of a clip stay exact.
export function dwellCurve(x: number, amount: number): number {
  if (amount <= 0) return x;
  const l = clamp(amount, { lo: 0, hi: 0.6 });
  const c = x - 0.5;
  return (1 - l) * x + l * (4 * c * c * c + 0.5);
}
