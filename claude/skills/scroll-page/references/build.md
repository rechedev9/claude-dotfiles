# Build: the kit in a project

Read this when you start building a page with the kit. Read `verify.md` when the page renders and you want to check it.

## Copy the kit in

1. Copy `kit/` from this skill to `src/scroll/` in the project. Keep the file names: the components import each other by relative path.
2. Import the CSS once, after Tailwind, in the components layer so a utility class on a kit element still wins: `@import "./scroll/scroll.css" layer(components);`
3. Add this to `<head>` before any stylesheet: `<script>document.documentElement.classList.add("sc-js")</script>`. In-view reveals hide only under `html.sc-js`, so a reader without JavaScript, a crawler and the pre-hydration paint all see the copy.
4. The kit depends on React 19 only (it uses hoistable `<style>` for cue keyframes). No other runtime package.

Tailwind `@theme` must define `--color-canvas` (page background, set on `body` and nowhere else, since the ground layers sit at z-index -1 and a background on a wrapper paints over them) and `--color-accent`, because the kit's CSS reads both. The page's other roles (surface, ink, ink-soft, accent-ink, the display and text faces) are `@theme` tokens too; `taste.md` sets what they resolve to.

## Devices to components

Every act is a `<section data-sc-act>` with its own `view-timeline`. Inside a pinned act a `<Stage>` sticks for `span` viewports; every animated child reads the act's timeline, so nothing is computed in JavaScript per frame.

| Device | Component | Range |
| --- | --- | --- |
| Scrub act | `<ScrollAct device="scrub" span={2.6}>` + `<Stage>` + `<ScrubClip>` | pinned travel, `contain` |
| Pin act | `<ScrollAct device="pin" span={2}>` + `<Stage>` | pinned travel |
| Pan act | `<ScrollAct device="pan" span={3}>` + `<Stage>` + `<PanRail>` | pinned travel |
| Flow act | `<ScrollAct device="flow">` | passage through the viewport, `cover` |

`from`, `to` and `peak` values are fractions of that range: in a pinned act 0 is the moment the stage sticks and 1 the moment it releases.

```tsx
<ScrollAct device="scrub" span={2.6} ground="#0a0806">
  <Stage>
    <ScrubClip src="/clips/hero.mp4" srcMobile="/clips/hero-m.mp4"
      poster="/clips/hero.webp" posterMobile="/clips/hero-m.webp"
      posterWidth={1920} posterHeight={1080} alt="" />
    <div className="sc-scrim sc-scrim--lead" aria-hidden="true" />
    <Cue from={0} to={0.78} rampIn={0} className="sc-copy sc-copy--lead">
      <Cue as="h1" from={0} to={0.78} rampIn={0} kinetic="words">Your line here.</Cue>
      <p>Supporting copy.</p>
    </Cue>
    <Cue from={0.82} className="sc-copy sc-copy--trail">Hold cue: lit until the act leaves.</Cue>
  </Stage>
</ScrollAct>
```

- `ScrollAct` props: `device`, `span` (viewports, minimum 1.2 because a shorter pin has a few pixels of travel and every cue snaps), `dwell` (0 to 0.6, holds the clip's middle so the reader gets the frame that matters), `clipMap` (`life` maps the clip to the act's visible life including the slides, `travel` to the pinned travel only), `ground` (a colour; one fixed layer per act fades in over its first 35% and later acts stack on it, which is the drift).
- `Cue`: `from`, `to` (omit `to` for a hold cue that stays lit), `rampIn` and `rampOut` as fractions of the window (0.3 default; `rampIn={0}` greets: lit from before the range so the entry slide carries it), `rise` (multiplies the 2.4vh lift), `kinetic="words" | "chars"`, `as`. A kinetic cue keeps its plain text in a visually hidden span and splits an `aria-hidden` copy, so a screen reader hears one sentence; inline children such as `<em>` stay one unit. Hidden cues animate `visibility`, so they are out of the tab order and the accessibility tree while hidden. Put copy in `.sc-copy` with `--lead`, `--center` or `--trail` and pair it with the matching `.sc-scrim`.
- `Reveal dir="up" | "down" | "left" | "right" | "iris"` with `from` and `to`: a clip-path wipe. `Parallax rate={-0.6}`: a translate of `rate * 100px` across the range. `PanRail extra={0.08}`: the rail moves by its own overflow plus `extra`; it measures with container units, so it never reads widths in JavaScript.
- `ScrollProgress`: a top bar on the root scroll timeline.
- `InView stagger={90}` and `useInViewOnce()`: a one-time reveal when the element enters, staggered per child. `CountUp from={0} to={450000} locale="en"` renders the final value in markup (crawlers and no-JS see the number) and tweens once in view.
- Pointer: `usePointerTilt({ maxDeg })`, `useMagnet({ strength })`, `useSpotlight()` return ref callbacks. One `pointermove` listener feeds a lerp loop that stops when it converges; touch is ignored and reduced motion turns them off.
- `useScrubClip({ src, srcMobile, lerp })` returns `{ videoRef, painted }` for a custom media block. It applies every clip lesson: Blob fetch with abort, listeners before `src`, forced first seek, reveal on `seeked` or after 2.5 s, priming on load and on the first gesture, stuck-seek reissue after 700 ms, seek deadband, lerp that idles when converged, mobile URL-bar resizes ignored, and one retry 8 s after a failed fetch, not a storm.
- Keyboard: `ScrollAct` installs one focus rescue. When focus lands in a cue that is not lit, the page scrolls to the position where that cue peaks (`data-sc-peak`), because the browser otherwise parks the control at the scroll position where its cue is still hidden.

## Page-local code: the signature move

The kit publishes each act's progress as the named view timeline `--sc-act`, in scope for every descendant of that `ScrollAct`. Page code reads it from the page's own CSS and components, and `src/scroll/` stays unedited.

- A property that follows the scroll (an SVG that draws itself, a scale, a travelling divider): write your own `@keyframes` and put `animation: <name> linear both; animation-timeline: --sc-act; animation-range: contain 10% contain 90%` on the element. Use `cover` in a flow act. In TSX, `actRange({ pinned, from, to })` with `useAct()` builds the range string.
- A number (a readout, a canvas, a real 3D camera): register `@property --p { syntax: "<number>"; inherits: true; initial-value: 0; }`, animate it to 1 on the act timeline on a wrapper, and consume it below with `calc(var(--p) * ...)`. JavaScript reads it with `getComputedStyle(el).getPropertyValue("--p")` from a render loop that runs only while an `IntersectionObserver` reports the act on screen.
- The whole page (a trace rail, a running receipt in fixed chrome): `animation-timeline: scroll(root block)`, as `ScrollProgress` does, because fixed chrome sits outside every act and `--sc-act` is out of its scope. For one step per act, observe each act with an `IntersectionObserver`.
- Put page-local scroll CSS inside `@supports (animation-timeline: scroll())` with the settled state outside it, and add a `prefers-reduced-motion` rule that drops position changes, because the kit's fallbacks cover kit classes only.
- A canvas or real 3D scene is page-local too; ship a rendered poster for reduced motion and for no WebGL.

## Rendering rules

- Prerender every page (TanStack Start `prerender`, or your framework's static output), because the kit's hidden states are CSS driven and the prerendered HTML already carries the keyframes: a crawler and a reader without JavaScript get the settled copy.
- Never decide in render what depends on the viewport or the pointer (`srcMobile`, touch, reduced motion). The kit reads those in effects, so the server and client markup match and hydration does not flash.
- Give `ScrubClip` the poster's intrinsic `posterWidth` and `posterHeight`, because the `<img>` reserves its box before the file arrives and the stage does not jump.
- Posters come from `tools/encode.ts`: the poster is the clip's first frame, so the handover from poster to video has no visible cut.
- Load display and body fonts with `font-display: swap` or preloaded, and keep the kit's layout free of font metrics: cue ranges are fractions, the rail measures in container units, and the playhead relayouts on `document.fonts.ready`.
- Set `history.scrollRestoration = "manual"` when the router restores scroll itself, because a restored deep position is handled: the playhead snaps the clip to the target on metadata instead of lerping from frame 0.
- Keep `overflow` off every ancestor of a `Stage` (the kit uses `overflow-x: clip` on `body`), because `overflow: hidden` on an ancestor disables `position: sticky`.
- Keep span and ranges in the component props, and colour and type in Tailwind classes and `@theme` tokens: the CSS file is mechanism only.

## Browsers

Scroll-driven animations ship in Chrome and Edge 115+, and Safari 26.0+. Firefox renders the `@supports` fallback (the settled page, rail as a native horizontal scroller) until it ships them. Reduced motion keeps opacity cues and removes every position change. Read `verify.md` for the Safari range-edge and Firefox notes.
