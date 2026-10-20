# The taste floor

Read this before writing markup, not after. Build without announcing the checklist. Everything here is a check on the rendered result, not on intention: "I used a spacing scale" is not evidence; a computed value is. Tokens live in Tailwind `@theme` (build.md says which two the kit itself reads); these rules are about the values they resolve to.

## Spacing

Rhythm comes from the contrast between tight and generous, never from one value repeated until everything weighs the same. If you cannot point at which intervals are the breaks, the page has no rhythm.

- A 4px-base scale; it has the useful middle steps an 8-only scale misses.
- **More space above a heading than below it.** The gap belongs to the boundary between sections, not to the heading-and-body pair. Backwards, a page reads as a list.
- Section padding is fluid. A phone should not inherit desktop air; 8rem of padding on a 375px screen is a scroll tax.
- Group by proximity before reaching for a container. If you added a border to show two things are related, the spacing was wrong first.
- Gutters scale with the viewport. Full-bleed media goes edge to edge; text never does.
- Optical, not mathematical: equal computed padding around uneven visual weight looks wrong. Correct against the render.

## Typography

- **Two families maximum.** Display carries voice, text carries prose. A third is a costume.
- **Tracking tightens as size grows.** A face at 6rem with default tracking reads loose and amateur. This is optical correction, not decoration.
- **Body measure 45 to 75ch.** A full-width paragraph on a 1600px monitor is unreadable at any font size.
- **Line height inverse to measure.** Display at 0.94 to 1.06, body at 1.6.
- **Light text on dark needs compensation on three axes**: slightly more line height, a touch more tracking, one step more weight, or it looks thin and blurry.
- `text-wrap: balance` on headings, `pretty` on body. Free, and it removes the orphan word that makes a headline look accidental.
- Display tops out near 6rem outside a genuine hero moment. Bigger is not more confident.
- **Step the hero down one rung below about 700px.** A desktop display floor wraps a normal headline to six lines at 390px. This is the portrait crop of the type, missed more often than the portrait crop of the image.
- Inter is the most-used face in AI-generated pages and reads as a non-decision. Reach first for Geist, Archivo, Outfit, Satoshi, Cabinet Grotesk, or the brand's own face. Inter is right when the brand asks for neutral.
- Serif is not a synonym for premium. Use one only when the brand names it or the work is genuinely editorial, luxury or heritage and you can say why this serif fits this brand. Emphasis inside a headline is italic or bold of the same family.

## Colour

- **Six roles, one accent**: canvas, surface, ink, ink-soft, accent, accent-ink. The accent owns a region or a role; scattered tiny accents are confetti.
- **Lock the accent for the whole page.** The one exception is a page that hard-cuts between light and dark grounds, which cannot clear 4.5:1 on both with one stop: it carries one hue at two lightnesses, keyed to the ground. Still one hue for the page.
- **Secondary text is tinted, never flat grey.** Derive it from the surface hue; `#888` on a warm dark ground looks dirty.
- **No pure black.** `#000` has no air in it.
- Contrast, measured on the render: body at least 4.5:1, large text 3:1, controls and focus indicators 3:1.
- Ground drift stays inside one theme family; a grammar that hard-cuts grounds paints them per section instead.

**Redefining an ink token on a subtree does not re-ink the text under it.** `color` is inherited as a computed value, so text whose colour resolved on `body` keeps the body's ink whatever the section redefines. Every page that inverts a ground mid-page hits this and it fails silently at 1.15:1. Restate `color` wherever you restate the token, on the same subtree.

**The premium-consumer palette trap.** Warm cream, brass or clay accent, espresso text is the default reach for every artisan, food, wellness and craft brief, and it makes every such brand identical. Rotate: cold silver and chrome; deep forest with bone and amber; off-black with warm tan; cobalt against one neutral; olive with brick. **The AI-purple trap**: violet-to-blue gradients, neon glow, glowing buttons, not unless the brand asks.

## Text over media

"No full-frame overlay" on its own sends people to a slightly weaker full-frame overlay. Three shapes, chosen by where the copy is: **a corner** of density sized to the copy block, when the copy is corner-anchored on a wide screen; **a band**, transparent above roughly 58% of the frame, whenever the copy spans the full width, which both corner anchors become on a phone; **a column** of density under a text column on a full-bleed image. Better than any scrim: **mask the image away from the text** with `mask-image` or a clip ending where the column begins, so the type gets a clean ground and the photograph keeps its contrast.

Then measure it. A scrim tuned by eye is routinely 9:1 where 4.5:1 was needed, a photograph thrown away for nothing, or 2.8:1 on the one frame the clip brightens under the copy.

**`width` and `height` attributes come in pairs.** Overriding only one in CSS leaves the other at the attribute's raw pixels, so `width: 100%` on a 1920x1080 image in a narrow column renders 1080px tall. Override both or neither: `width: 100%; height: auto`, or an explicit height with `object-fit: cover`.

**If the canvas is light**, the scrim washes toward the canvas and its density goes up; type over media stays ink, because light text on a bright frame is unrecoverable; edge highlights and shadow alphas tuned for near-black read as dirt on paper, so invert or halve them and re-tint toward the canvas hue.

## Depth

Not one property. Five tools, together: **shadow with offset and blur**, tinted to the canvas hue, because real raised things cast light downward and a zero-offset halo is decoration; **edge light**, a 1px top highlight that sells a raised surface better than any blur; **scale and blur as distance**, without which parallax reads as sliding; **overlap**, one element crossing another's boundary, free and underused; **grain** at 4 to 5% opacity, the difference between a dark page and a lit room. Three elevation steps and no more; if everything is elevated, nothing is.

## Cards

Cards are the lazy container. Never a grid of identical icon, heading and text cards as the page structure; it is the most recognisable AI-page tell. Never nest cards. Never three equal feature columns: an asymmetric grid, a two-column zigzag (max two in a row), a rail, or plain type on space. An empty trailing cell means the grid was planned wrong. One corner-radius scale across the page.

## Motion

The scroll devices are the page's motion and are paced by the hand, not by a duration. Everything the visitor clicks or that enters on its own (hover, press, chrome, drawers, menus) is small and fast and follows `~/.claude/skills/emil-design-eng/SKILL.md`; read it when you build chrome. Two things from it also hold on acts: continuous motion uses `transform` and `opacity` only (`clip-path` for wipes), and reduced motion means fewer and gentler, not zero: keep the opacity that carries comprehension, drop every position change.

## States and content

- Every interactive element gets hover, focus-visible, active and disabled; focus-visible is themed to the accent, with offset.
- Button text fits one line at desktop; primary CTA labels are one to three words. One label per intent across the page.
- Check button contrast: white text on a light button, or a ghost button on a photo with no scrim, fails.
- Real copy, real names, real numbers or no numbers: fake precision (`4.1x`, `92%`, `48k`) is a legal and credibility liability.
- The parts you did not draw still carry the design: selection colour, caret, focus ring, scrollbar, underline offset and thickness, tabular numerals in anything that counts.

## The refuse list

Category defaults, not bans on principle. The brief's own words can earn any of them; reaching for one when the axis is free means you were not deciding.

**Structure:** identical cards as structure; the hero-metric template (big number, small label, supporting stats); more than two consecutive zigzags; the same layout family twice on one page; a giant headline left with a small explainer floating right.

**Labels:** decoration text strips across the hero bottom; locale, time and weather strips unless the brand is about a place; pills and tags on photos.

**Surface:** gradient text; neon and outer glows; zero-blur offset shadows outside a genuinely neobrutalist world; glass and blur as decoration; coloured `border-left` above 1px; monospace as a costume for "technical"; emoji as icons; custom cursors.

**Content:** div-built fake screenshots, dashboards or terminals; filler verbs (elevate, seamless, unleash, next-gen, revolutionize, supercharge); a hero that overflows the viewport (headline two lines, subtext twenty words, CTA visible without scrolling); more than four text elements in the hero.

## The squint test

Blur the page until detail is gone. You should still name the primary element, the secondary element and the major groups, in that order. If everything greys into one even field, the problem is hierarchy, and no amount of shadow, gradient or motion will fix it.
