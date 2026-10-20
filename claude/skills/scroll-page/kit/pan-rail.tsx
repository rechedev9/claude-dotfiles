import type { StyleWithVars } from "./css-vars";

export interface PanRailProps {
  extra?: number;
  className?: string;
  children: React.ReactNode;
}

// The rail travels its own overflow across the act; `extra` adds a fraction
// of that overflow so the last item can clear the edge.
export function PanRail(props: PanRailProps): React.JSX.Element {
  const style: StyleWithVars = { "--sc-pan-extra": props.extra ?? 0 };
  const classes = props.className === undefined ? "sc-rail" : `sc-rail ${props.className}`;
  return (
    <div className="sc-rail-box">
      <div className={classes} style={style}>
        {props.children}
      </div>
    </div>
  );
}
