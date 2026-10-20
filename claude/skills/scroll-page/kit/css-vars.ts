import type { CSSProperties } from "react";

export type CssVars = Record<`--${string}`, string | number>;

export type StyleWithVars = CSSProperties & CssVars;
