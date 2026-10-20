---
name: scroll-page
description: >
  Build a scroll-driven marketing page (landing page, homepage, hero) in a React, Vite and Tailwind project from the user's own photos, footage, CSS, SVG and type. Use for scrollytelling, a hero where scrolling plays a video, a layered or cinematic hero, or a page that "looks like a template". Not for app UI, dashboards or product components: those follow ~/.claude/skills/emil-design-eng/SKILL.md.
---

# scroll-page

Scroll is the only input every visitor already knows. Treat it as a timeline: the wheel is a scrubber, the page is a film with real text on top, and each act behaves differently enough that the visitor keeps going to find out what the next one does. The deliverable is one page in the user's project plus `docs/scroll-plan.md`, the planning file every step reads from and writes to.

Chrome (nav, buttons, forms, drawers, menus) follows `~/.claude/skills/emil-design-eng/SKILL.md`. Read that file when you build chrome; never invoke it as a skill, because its canned first response and review table would fire. The boundary: scroll acts are driven by progress, not duration, so that skill's duration caps and "should this animate at all" frequency table do not apply to acts. They apply to everything the visitor clicks.

## Step 1: Brief and plan

Read `references/plan.md` now; every build needs it. It holds the six interview questions, the journey beats, the feeling curve, the peak, the tell-someone test, pacing, and the layout of `docs/scroll-plan.md`.

The user is usually their own client. When they delegate ("use your judgment"), answer the six questions yourself in the brand's voice, mark the plan `Self-authored under delegation`, and continue without an approval checkpoint. Otherwise ask the six questions in one pass and record the answers in their words, because paraphrase into marketing prose is where a brand's voice leaves the page.

Then write the journey (four to seven beats, each a shift in what the visitor knows or feels), the feeling curve, the peak and the tell-someone sentence. Curve before devices, because a device chosen before the feeling is a device looking for a reason.

Done when `docs/scroll-plan.md` has: the six answers or authored decisions; four to seven beats; one emotion and one cause per beat; a peak written as the sentence a visitor would say to a friend; a completed "it's the site where ___" that names an experience, not a device; and any authored silence.

## Step 2: Structure

Read `references/grammars.md` now; every build needs it. Read `<skill>/sites.md` too: it lists the finished sites' grammar, nav, hero and close. The new site must not repeat all four of those against any line, because a page that only changes world is a re-skin.

Pick one grammar and obey its bans. Decide the six shapes on purpose (grammar, nav, hero, act sequence, close, signature move), because any shape left undecided inherits the default skeleton. Invent the signature move from interview question 5; it should be the thing inside the tell-someone sentence.

Done when the plan names the grammar and why it fits the brief, all six shapes, the signature move in one phrase, and the sites.md check.

## Step 3: Score

Assign each beat a device and write the reason, as a table in the plan:

| Beat | Device | Why this one |
|---|---|---|
| Recognition | scrub | The camera moving under the reader's own hand is the strongest possible open |
| Tension | pin + kinetic | Copy assembles word by word while the frame holds still |
| Turn | reveal | A wipe is a change of state, which is what this beat is |

The device names are scrub, pin, pan, flow, cue, kinetic, reveal, parallax, count, in/stagger, ground, progress, and the pointer devices tilt, magnet, spotlight. What each one reads as is in `references/grammars.md`; how each is built is in `references/build.md`, which you read at Step 5.

Done when every beat has a device and a reason, and these hold: the grammar's bans are respected; no device appears twice in a row, since two identical acts are one act shown twice; adjacent beats carry different feelings; the peak has the largest span by a visible margin and the act before it is quieter; clips are few, because each is the heaviest thing on the page and the third stops being a surprise; specs, FAQ and credentials flow at short stagger, because they are information, not experience; no act exists to reach a length.

## Step 4: Assets

Read `references/assets.md` when the page uses any photo or footage. Read `references/hero-depth.md` only when the hero is a photograph you will cut into planes; a type, CSS, SVG or real-3D hero does not need it.

Inventory what the user has. Grade, trim and encode footage with `bun <skill>/tools/encode.ts <input> <output.mp4> [--mobile] [--portrait] [--crf N]`, which writes the poster as the encoded clip's first frame beside it. Pick stills from one shoot, or grade them to one look. Where there is no photo, the world is type, CSS, SVG or a real 3D scene, and that is a first-class route.

Done when every clip has an encoded desktop and mobile file with its poster, every still has been looked at, and the plan lists the assets per beat.

## Step 5: Build

Read `references/build.md` now; it maps each device to its component in `<skill>/kit/`, which you copy into the project at `src/scroll/`, and holds the rendering rules (prerendered HTML, hydration, tokens in Tailwind `@theme`). Write real markup: a real `h1`, real paragraphs, real links, real reading order. The signature move is page-local code driven off the act timeline the kit publishes (build.md, "Page-local code"); the kit stays unedited, because a bespoke behaviour patched into the shared mechanism is one every later page inherits.

Read `references/taste.md` before writing markup, not after, and build without announcing its checklist. Read the design skill when you build chrome.

Done when the page renders at desktop and phone widths with no horizontal overflow, every interactive element has hover, focus-visible, active and disabled states, and the plan's score matches the built acts.

## Step 6: Verify

Read `references/verify.md` now. Run `bun <skill>/tools/shoot.ts --url <url> --out <dir> [--width N --height N] [--reduced-motion]` for desktop, phone and reduced motion; it writes numbered frames, `sheet.png` and `report.json`. A scroll page has no single state, so the failures live between the two positions you looked at. Read the sheet yourself: the harness proves a clip advances and cannot tell you the composition is good. Then the real-phone pass from verify.md, since headless Chrome cannot reproduce a phone's decoder, autoplay policy or touch scroll.

Done when the three runs are clean or every remaining finding is listed with a reason, the page has been scrolled on a real phone, and keyboard focus order has been tabbed through.

## Step 7: Feel check and ship

Read `references/feel-check.md` now. Scroll the page cold, write one word per act, then diff against the plan. Fix, reshoot, and report: grammar and why, the six shapes, the journey, the intended and felt curves and what changed, the score table, what was verified and what was not, and whether the brief was self-authored.

Done when the report is written and one line for this site is appended to `<skill>/sites.md`.

## Hard rules

Ship-blockers. Each one makes a page read as machine-made.

| Never | Instead |
|---|---|
| A "scroll" cue, arrow or animated mouse icon | Nothing. They are looking at the hero; they know |
| `01 / 06` section counters, or an eyebrow above every heading | Delete them; the heading carries itself. Counters only where the sequence is information |
| An em dash or en dash anywhere visible | Period, comma, colon or parentheses |
| Centred copy in every act | Vary the anchor: lead, trail, centre, split |
| The same device in two adjacent acts | Rescore in Step 3 |
| Building before the plan exists | Step 1 first; everything downstream reads from it |
| No engineered peak, or three competing ones | One peak, with the asset budget, the silence before it and the most scroll room (plan.md) |
| An ending that trails off, fades out or just becomes a footer | The close resolves and holds; the last feeling is the one they carry |
| Shipping without a signature move, or calling a kit parameter one | Invent one (grammars.md) |
| Repeating all of grammar, nav, hero and close from a line in sites.md | Change at least one shape |
| Editing `src/scroll/` kit code for a bespoke behaviour | Page-local code driven from the act timeline (build.md) |
| A full-frame dark overlay to fix contrast | A scrim only where the text sits, or mask the image away from the text (taste.md) |
| Text baked into an image | Real markup, always: selectable, translatable, sharp |
| Invented statistics in a counter | Only real numbers. No number, no counter |
| `transition: all`, or animating width, height, top or left | `transform` and `opacity`; `clip-path` for wipes |
| Audio on a scrub clip, or any autoplaying audio | Strip the track; `encode.ts` does |
| Shipping without Step 6 and Step 7 | Run them |

Adapted from nateherkai/scroll-craft (MIT, see LICENSE).
