import { useScrubClip } from "./use-scrub-clip";

export interface ScrubClipProps {
  src: string;
  srcMobile?: string;
  poster: string;
  posterMobile?: string;
  posterWidth: number;
  posterHeight: number;
  lerp?: number;
  alt?: string;
}

// The poster holds the frame until a real video frame has painted.
export function ScrubClip(props: ScrubClipProps): React.JSX.Element {
  const { src, srcMobile, poster, posterMobile, posterWidth, posterHeight, lerp, alt = "" } = props;
  const { videoRef, painted } = useScrubClip({ src, srcMobile, lerp });
  return (
    <div className={painted ? "sc-media sc-has-clip" : "sc-media"}>
      <picture className="sc-poster">
        {posterMobile === undefined ? null : (
          <source media="(max-width: 860px)" srcSet={posterMobile} />
        )}
        <img src={poster} width={posterWidth} height={posterHeight} alt={alt} />
      </picture>
      <video
        ref={videoRef}
        className="sc-clip"
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
