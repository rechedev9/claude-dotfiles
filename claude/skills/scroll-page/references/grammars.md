# Structure: grammars, shapes, signature move

Devices change how a page looks. Structure is a separate axis, and left undecided every build inherits the same skeleton: full-bleed scrub hero under a fixed minimal bar, lead-corner kinetic headline, a pinned type act, a tilted card rail, a pinned close with a magnetic CTA. The grammar changes what a page is.

## 1. The six shapes

Write each one down before markup. An undecided shape is a default.

| # | Shape | What it records |
|---|---|---|
| 1 | Grammar | One of section 2, or a new one whose nav, sequence, ending and bans describe a different structure. A new label alone is not a grammar |
| 2 | Nav treatment | What the chrome is and what it is for |
| 3 | Hero | What the first screen does |
| 4 | Act sequence | The device order and act count |
| 5 | Close | How the last screen behaves and what the CTA sits in |
| 6 | Signature move | The one bespoke interaction, in a phrase |

Then read `<skill>/sites.md`. Against every line there, the new site must differ on at least one of grammar, nav, hero and close. Shape 6 is unique by construction and does not count.

## 2. The grammars

A grammar is the page's organising logic: what a section is, what the chrome is for, how the visitor knows where they are, and what the ending is. Two pages in one grammar feel related however far apart their palettes are. Each names what it forbids, and the forbids are the point: they stop a build drifting back to the filmic default halfway through. Pick one; a chaptered page with a continuous world underneath is a filmic one-shot with extra headings.

Devices: **scrub** (a clip plays under the wheel), **pin** (the frame holds while content advances), **pan** (lateral travel; breadth where vertical is argument), **flow** (ordinary sections entering with **in/stagger**), **cue** (copy with an opacity window), **kinetic** (type assembling by word or character), **reveal** (a wipe; a change of state), **parallax** (planes at different rates), **count** (a real number landing), **ground** (page colour drifting between acts), **progress** (a bar on the page's own scroll timeline), and the pointer devices **tilt**, **magnet**, **spotlight**.

### 2.1 Filmic one-shot
**Fits:** one linear argument with one emotional arc; launches, consumer products, anything where the visitor should feel carried through a film with no seams. **Nav, hero, close:** fixed minimal bar with wordmark and one CTA; full-bleed scrub hero with corner-anchored kinetic headline; pinned close with spotlight and magnetic CTA. **Leans on:** scrub, pin, ground, kinetic. **Forbids:** visible sequence (chapter numbers, index, progress readout), hard cuts between grounds, chrome that implies a tool. This is the default every page drifts to, so choose it only when the brief earns it and say in the plan why the others did not fit.

### 2.2 Chaptered editorial
**Fits:** long-form substance; a method, a manifesto, a founder story; the visitor should feel they read something, turning pages through intertitles and dense asymmetric spreads on hard-cut grounds. **Nav, hero, close:** no bar; a margin folio with chapter number and title; a title page of type on paper with no media above the fold; a colophon close with the CTA as a line of running text. **Leans on:** flow, reveal at chapter boundaries, parallax inside a media column, count for real figures in prose. **Forbids:** continuous ground drift, the full-bleed scrub hero, scrub beyond one chapter, pinned crossfade type acts, spotlight, magnet, centred hero copy; media sits in its own column with a caption.

### 2.3 Live surface
**Fits:** software and tools, where the demo is the argument and the visitor should feel they are operating something: panels populate, a log fills, a selection moves. The natural fit for a developer's own product. **Nav, hero, close:** app chrome replaces nav (sidebar, tab strip, status bar), real enough to be the navigation; the surface already in a state; an actual input the visitor puts a cursor in. **Leans on:** pin while state advances, count on real telemetry, pointer devices where the product has them, progress-driven page code. **Forbids:** marketing chrome (wordmark-plus-CTA bar, scrims, full-bleed photography, kinetic headline stacks, display-size headings), scrub, spotlight, ground past two stops; copy lives in the surface's idiom (labels, tooltips, empty states). The surface is real markup computing its state from data in the page, labelled as sample data if the product is a concept; if the panels cannot compute, pick another grammar.

### 2.4 Continuous world
**Fits:** a journey with real geography: a process with physical stages, a place, a build; the visitor moves through one space that never cuts. **Nav, hero, close:** a clickable map (waypoints, a position marker); an establishing position inside the world; arrival at a place with the CTA as an object in it. **Forbids:** section boundaries of any kind; copy arrives inside the canvas at waypoints. Needs one unbroken world: one real long take (a drone pass, a walk-through) that page-local code scrubs across the whole page, or a browser-rendered scene (real 3D or canvas) whose camera is driven by progress. Without one of those it is unavailable; built from pinned acts it is a document with seams, a different and worse page.

### 2.5 Typographic poster
**Fits:** a brand whose asset is a sentence; manifestos, agencies with a strong verbal identity, one-claim launches; words at wildly different weights, a word at 40vw, a paragraph at 16px, then silence. The right answer when there are no good photos, because a stock-looking image weakens a page more than its absence. **Nav, hero, close:** the wordmark at composition scale, possibly no persistent nav; one word or line at extreme scale with a real `h1`; a close that inverts to the smallest type on the site with the CTA as a plain underlined link. **Leans on:** kinetic (the one grammar where character splitting can be right), pin with scale from progress, reveal across letterforms, ground. **Forbids:** photographic ground, scrub, scrims, cards, decorative motion, pan rails, tilt, parallax on text. At 40vw default tracking is a visible defect.

### 2.6 Gallery / catalog
**Fits:** a range: variants, a portfolio, a menu, a materials library, case studies; the question is "what are the options", and the visitor walks a room of labelled objects. **Nav, hero, close:** a clickable index of objects; object one already in view and labelled, no title treatment; the last object, or an inquiry plate typeset like a label. **Leans on:** pan as the spine, reveal per object, tilt on objects the visitor would pick up, count for real specs. **Forbids:** the argument-shaped pinned type act, a single hero claim, scrim copy over media, kinetic headlines, spotlight, magnet, more than one scrub, persuasion in labels (`Cedar. Air-dried 18 months.` not `Craftsmanship you can feel.`). Every object uses one label schema, because the schema is what makes a collection instead of a grid, and labels must survive being read half cropped.

### 2.7 Split stage
**Fits:** any argument with two sides: before and after, manual and automated; both halves always present, a balance tipping towards the moment one side wins. **Nav, hero, close:** no bar, the divider is the chrome and carries both labels and the progress; a 50/50 first screen with both headlines readable; the collapse, the divider travelling to one edge and the CTA in the winning column, which should be the most satisfying moment on the page. **Leans on:** pin with the divider driven from progress, reveal per side, count for real comparison figures. **Forbids:** full-bleed anything before the resolve, centred copy, the corner-anchored hero, a symmetric close, pan, spotlight, magnet, more than one scrub, ground drift (two grounds, held); a decorative column collapses it into a zigzag.

### 2.8 Rhythmic cutlist
**Fits:** energy brands: streetwear, sport, events, music, drinks; a cut every second, twelve to twenty short sections rather than six long ones. **Nav, hero, close:** a loud full-width bar, possibly a marquee, the CTA at the wordmark's weight; a hero that cuts away in under a viewport; an abrupt full-bleed close with the CTA as the last cut. **Leans on:** flow with short front-loaded stagger (legible within the first third of a span, because fast is not an excuse for an entrance the reader outruns), reveal on nearly every section, hard ground steps per section. **Forbids:** acts over about 1.4 viewport-heights, pin, dwell, overlapping cue windows, slow easing, spotlight, magnet, parallax. Its peak cannot pin, so the peak lives in the fixed chrome: the loud bar unfurls, runs a long choreography and holds while the acts keep cutting. The general form: when a grammar bans the device your peak wants, move the peak out of the act stack rather than breaking the grammar.

## 3. The signature move

Every build invents one bespoke interaction that exists on this site alone, coded in the page off the act timeline the kit publishes (build.md, "Page-local code"). It is what makes a page memorable after the tab closes, and the only part of a build that cannot be arrived at by following rules.

**What counts:** scroll as a playhead over a persistent trace rail that stamps a marker per act, so the footer is a record and doubles as navigation; a wordmark the pointer pulls apart, letters with different masses settling back into exact lockup; an SVG drawing whose `stroke-dashoffset` is driven from progress, so scrolling draws the object, then the callouts; a running receipt that accumulates a line per claim passed, with real numbers; one control that regrades the whole page (time of day, temperature, load), which must affect everything at once or it is a widget.

**What does not count:** a recoloured or resized spotlight; a different tilt or magnet value; a different easing on kinetic words; more items in a rail; a third scrub; anything the kit already does under a project class name.

The test: describe the move to someone who has seen the kit. If they cannot tell it apart from something the kit already does, it is not a signature move.

## 4. Aesthetic range

Premium-minimal is a choice, not the default costume. Go where the interview points; if the user says "loud" and the page comes back in charcoal with one accent, the interview was decorative. The families: **brutalist** (blunt, structural, unstyled on purpose; tools, infrastructure, anti-marketing), **maximalist** (dense, layered, loud; culture, events, food), **playful** (bouncy, coloured, informal; kids, games, community), **retro** (specific to a decade, not vaguely nostalgic; heritage, music), **dense** (information-forward, small type; data products, catalogues, finance), **editorial** (paper, folios, measure; long-form substance), **premium-minimal** (quiet, dark, one accent; luxury, only when asked for).

What does not flex is the taste floor: a brutalist page still needs 4.5:1 body contrast, and a maximalist page needs a spacing scale more, because density without rhythm is noise.
