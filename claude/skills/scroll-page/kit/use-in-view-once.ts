import { useCallback, useState } from "react";

export interface InViewOnceOptions {
  rootMargin?: string;
  threshold?: number;
}

export interface InViewOnce {
  ref: React.RefCallback<HTMLElement>;
  seen: boolean;
}

export function useInViewOnce(options: InViewOnceOptions = {}): InViewOnce {
  const { rootMargin = "0px 0px -12% 0px", threshold = 0.01 } = options;
  const [seen, setSeen] = useState(false);
  const ref = useCallback<React.RefCallback<HTMLElement>>(
    (el) => {
      if (!el) return undefined;
      if (!("IntersectionObserver" in window)) {
        setSeen(true);
        return undefined;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setSeen(true);
            io.disconnect();
          }
        },
        { rootMargin, threshold },
      );
      io.observe(el);
      // Disconnect on unmount: an observer keeps a strong ref to its targets.
      return () => io.disconnect();
    },
    [rootMargin, threshold],
  );
  return { ref, seen };
}
