import { useEffect, useMemo } from "react";
import { ActContext } from "./act-context";
import type { ActDevice, ActInfo } from "./act-context";
import type { StyleWithVars } from "./css-vars";
import { ensureVerifyBridge } from "./playhead";
import { useFocusRescue } from "./use-focus-rescue";

export interface ScrollActProps {
  device: ActDevice;
  span?: number;
  dwell?: number;
  clipMap?: "life" | "travel";
  ground?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

const MIN_SPAN = 1.2;

export function ScrollAct(props: ScrollActProps): React.JSX.Element {
  const {
    device,
    span = 1.5,
    dwell = 0,
    clipMap = "life",
    ground,
    id,
    className,
    children,
  } = props;
  const pinned = device !== "flow";
  useFocusRescue();
  useEffect(ensureVerifyBridge, []);
  const info = useMemo<ActInfo>(
    () => ({ device, pinned, dwell, clipMap }),
    [device, pinned, dwell, clipMap],
  );
  // Below 1.2 viewports a pin has a few pixels of travel and every cue snaps.
  const style: StyleWithVars = { "--sc-span": pinned ? Math.max(span, MIN_SPAN) : 0 };
  if (ground !== undefined) style["--sc-ground"] = ground;
  const classes = ["sc-act", pinned ? "sc-act--pinned" : "sc-act--flow", className]
    .filter((c) => c !== undefined)
    .join(" ");
  return (
    <ActContext.Provider value={info}>
      <section id={id} className={classes} data-sc-act={device} style={style}>
        {ground === undefined ? null : <div className="sc-ground" aria-hidden="true" />}
        {children}
      </section>
    </ActContext.Provider>
  );
}
