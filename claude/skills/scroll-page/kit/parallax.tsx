import { rangeName, useAct } from "./act-context";
import type { StyleWithVars } from "./css-vars";

export interface ParallaxProps {
  rate: number;
  className?: string;
  children: React.ReactNode;
}

// rate 1 travels 100px across the act; the unit is hundreds of pixels.
export function Parallax(props: ParallaxProps): React.JSX.Element {
  const act = useAct();
  const style: StyleWithVars = { "--sc-rate": props.rate, animationRange: rangeName(act.pinned) };
  const classes = props.className === undefined ? "sc-parallax" : `sc-parallax ${props.className}`;
  return (
    <div className={classes} style={style}>
      {props.children}
    </div>
  );
}
