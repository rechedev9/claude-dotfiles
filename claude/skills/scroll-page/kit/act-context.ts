import { createContext, useContext } from "react";

export type ActDevice = "scrub" | "pin" | "pan" | "flow";

export interface ActInfo {
  device: ActDevice;
  pinned: boolean;
  dwell: number;
  clipMap: "life" | "travel";
}

export const ActContext = createContext<ActInfo>({
  device: "flow",
  pinned: false,
  dwell: 0,
  clipMap: "life",
});

export function useAct(): ActInfo {
  return useContext(ActContext);
}

// A pinned act's travel is its `contain` range; a flow act's life is `cover`.
export function rangeName(pinned: boolean): "contain" | "cover" {
  return pinned ? "contain" : "cover";
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

export function actRange(options: { pinned: boolean; from: number; to: number }): string {
  const name = rangeName(options.pinned);
  return `${name} ${pct(options.from)} ${name} ${pct(options.to)}`;
}
