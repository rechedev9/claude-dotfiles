import { useCallback } from "react";
import type { StyleWithVars } from "./css-vars";
import { useInViewOnce } from "./use-in-view-once";

export interface InViewProps {
  stagger?: number;
  as?: "div" | "section" | "ul" | "p";
  className?: string;
  children: React.ReactNode;
}

// Fires once. Hidden only under html.sc-js, so no-JS and crawlers see the copy.
export function InView(props: InViewProps): React.JSX.Element {
  const { stagger, as: Tag = "div", className, children } = props;
  const { ref: viewRef, seen } = useInViewOnce();
  const ref = useCallback<React.RefCallback<HTMLElement>>(
    (el) => {
      if (el && stagger !== undefined) {
        let i = 0;
        for (const kid of el.children) {
          if (kid instanceof HTMLElement) kid.style.setProperty("--sc-i", String(i));
          i += 1;
        }
      }
      return viewRef(el);
    },
    [viewRef, stagger],
  );
  const classes = [seen ? "sc-in" : undefined, className].filter((c) => c !== undefined).join(" ");
  const style: StyleWithVars = {};
  if (stagger !== undefined) style["--sc-stagger"] = `${stagger}ms`;
  return (
    <Tag
      ref={ref}
      className={classes}
      data-sc-in=""
      data-sc-stagger={stagger === undefined ? undefined : ""}
      style={style}
    >
      {children}
    </Tag>
  );
}
