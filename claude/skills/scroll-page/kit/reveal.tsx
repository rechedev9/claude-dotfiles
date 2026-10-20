import { actRange, useAct } from "./act-context";

export type RevealDirection = "up" | "down" | "left" | "right" | "iris";

export interface RevealProps {
  dir?: RevealDirection;
  from?: number;
  to?: number;
  className?: string;
  children: React.ReactNode;
}

export function Reveal(props: RevealProps): React.JSX.Element {
  const { dir = "up", from = 0, to = 0.5, className, children } = props;
  const act = useAct();
  const range = actRange({ pinned: act.pinned, from, to: Math.max(to, from + 0.001) });
  const classes = className === undefined ? "sc-reveal" : `sc-reveal ${className}`;
  return (
    <div className={classes} style={{ animationName: `sc-reveal-${dir}`, animationRange: range }}>
      {children}
    </div>
  );
}
