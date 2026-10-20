import { useCallback } from "react";
import { registerPointer } from "./pointer";

// Tilt and magnet both write `transform`; put them on separate elements.
export function usePointerTilt(options: { maxDeg: number }): React.RefCallback<HTMLElement> {
  const { maxDeg } = options;
  return useCallback<React.RefCallback<HTMLElement>>(
    (el) => (el ? registerPointer(el, { tilt: maxDeg }) : undefined),
    [maxDeg],
  );
}

export function useMagnet(options: { strength: number }): React.RefCallback<HTMLElement> {
  const { strength } = options;
  return useCallback<React.RefCallback<HTMLElement>>(
    (el) => (el ? registerPointer(el, { magnet: strength }) : undefined),
    [strength],
  );
}

export function useSpotlight(): React.RefCallback<HTMLElement> {
  return useCallback<React.RefCallback<HTMLElement>>(
    (el) => (el ? registerPointer(el, { spotlight: true }) : undefined),
    [],
  );
}
