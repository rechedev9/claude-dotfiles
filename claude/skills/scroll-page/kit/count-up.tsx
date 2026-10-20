import { useEffect, useMemo, useRef } from "react";
import { prefersReducedMotion } from "./media";

export interface CountUpProps {
  from: number;
  to: number;
  decimals?: number;
  durationMs?: number;
  locale?: string;
  className?: string;
}

// Renders the final value so crawlers index it; the tween starts in view.
export function CountUp(props: CountUpProps): React.JSX.Element {
  const { from, to, decimals = 0, durationMs = 1400, locale = "en", className } = props;
  const ref = useRef<HTMLSpanElement | null>(null);
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || durationMs <= 0) return undefined;
    let frame = 0;
    const run = (): void => {
      let t0 = 0;
      let last = "";
      const step = (now: number): void => {
        if (!t0) t0 = now;
        const t = Math.min((now - t0) / durationMs, 1);
        const eased = 1 - (1 - t) ** 3;
        const out = fmt.format(from + (to - from) * eased);
        if (out !== last) {
          el.textContent = out;
          last = out;
        }
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      run();
      return () => cancelAnimationFrame(frame);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [from, to, durationMs, fmt]);

  return (
    <span ref={ref} className={className}>
      {fmt.format(to)}
    </span>
  );
}
