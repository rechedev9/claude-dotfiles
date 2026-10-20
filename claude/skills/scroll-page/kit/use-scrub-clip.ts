import { useEffect, useRef, useState } from "react";
import { useAct } from "./act-context";
import { prefersReducedMotion } from "./media";
import { registerClip } from "./playhead";

export interface ScrubClipOptions {
  src: string;
  srcMobile?: string | undefined;
  lerp?: number | undefined;
}

export interface ScrubClipHandle {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  painted: boolean;
}

export function useScrubClip(options: ScrubClipOptions): ScrubClipHandle {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paintedSrc, setPaintedSrc] = useState<string | null>(null);
  const act = useAct();
  const { src, srcMobile, lerp = 0.18 } = options;

  useEffect(() => {
    const video = videoRef.current;
    const actEl = video?.closest<HTMLElement>("[data-sc-act]");
    if (!video || !actEl) return undefined;
    // Under reduced motion the clip is never fetched; the poster is the frame.
    if (prefersReducedMotion()) return undefined;
    return registerClip({
      video,
      act: actEl,
      src,
      srcMobile,
      lerp,
      dwell: act.dwell,
      map: act.clipMap,
      onPainted: () => setPaintedSrc(src),
    });
  }, [src, srcMobile, lerp, act.dwell, act.clipMap]);

  return { videoRef, painted: paintedSrc === src };
}
