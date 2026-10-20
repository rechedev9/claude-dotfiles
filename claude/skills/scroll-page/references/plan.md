# Plan: brief, journey, feeling

A page is a sequence of states a person passes through with their hand on a wheel. The grammar decides what a page is, the devices decide how it looks, and this file decides what it does to somebody. Design the feeling before the acts: an act list written first is a list of things that happen, and a page of things happening is a page nobody can describe afterwards. Everything here goes into `docs/scroll-plan.md`; the layout is at the end.

## 1. The interview

Six questions, one pass, answers recorded in the user's words. If the user delegates, answer them yourself in the brand's voice, mark the plan `Self-authored under delegation`, and do not invent user quotations.

1. **What is this, who is it for, what must the visitor believe by the end, and what do they do next?** One sentence the page exists to install; if they give three, make them pick. One action, one label, used everywhere.
2. **Vibe in three to five words, plus up to three references from any medium.** A film, an album cover, a shop, a game. Not websites: naming sites is how a page ends up looking like an existing site.
3. **The scroll journey, section by section, in their words.** Their sequence, not a menu you offered.
4. **How should someone feel while scrolling, stage by stage, and what is the one moment they should remember?** The stages seed the feeling curve, the moment is the peak. Ask where it should feel calm and where intense; a page loud the whole way is as flat as one quiet the whole way.
5. **One thing this site should do that no site they have seen does.** The seed of the signature move. "Be memorable" is not an answer.
6. **Range and assets.** How far from premium-minimal (the families are in grammars.md); their answer governs the aesthetic, not your taste. Then what they have: photos, footage, product shots, logo, palette, brand doc. "Nothing" is a fine answer and means a world of type, CSS, SVG or real 3D.

Do not infer a brand from its name or offer a fabricated list of industries; a made-up menu reads as you deciding their business. If a brand kit exists, obey its hard rules: a brand that forbids invented numbers means no counters, however good they look.

## 2. The journey

Four to seven beats, each a shift in what the visitor knows or feels:

```
1  Recognition   they see their own morning
2  Tension       the cost of it, named plainly
3  Turn          the thing that changes
4  Substance     why it holds up
5  Range         what they can choose
6  Commitment    the one action
```

Beats are the spine. Sections serve beats; a section that serves no beat is cut, however nice the shot is. Where the brief allows, give the visitor agency tied to the offer: a selection made mid-page carries into the ask rather than resetting at the CTA.

## 3. The feeling curve

One line per beat: the emotion, then the thing on screen that causes it. The emotion column is the constraint; the cause column is the only place a device name may appear, and it appears second, because the feeling picks the device and never the other way round. Useful states: curiosity, recognition, unease, doubt, tension, awe, delight, relief, intimacy, confidence, resolve, calm.

**If two adjacent acts produce the same feeling, one of them is filler.** Every emotion is defined by what preceded it: relief needs tension in front of it, awe needs quiet, intimacy needs scale. When the curve and the beats disagree, the curve wins, because nobody remembers what they learned on a page that made them feel nothing.

A canned drink:

```
1  Recognition   their own kitchen counter at 7am, shot at eye height
2  Fatigue       the two containers, the mess, held still while copy names it
3  Delight       a wipe, and the whole frame is one cold can, condensation running
4  Trust         macro texture at a scale the eye cannot get in a shop
5  Appetite      the flavours travelling sideways, each one landing whole
6  Resolve       everything stops, one can, one line, one place to buy it
```

On a live-event page made entirely of cuts, the peak is the one held frame of the crowd, because there stopping is the loudest thing available. The peak is defined by contrast with its own page, not by an absolute amount of spectacle.

## 4. The peak

People remember one peak moment and the ending; the middle compresses and goes. So every build engineers one deliberate peak, written as the sentence a visitor would say to a friend: "the screen went black and then the whole ocean lit up under me". Not "the hero is impressive". A described moment, with a before and an after.

The peak gets three things, at the expense of the other acts: **the asset budget** (the best footage goes here, not to act two); **the silence before it** (a quiet act or an empty viewport, so the change has something to be a change from); **the most scroll room** (the largest span on the page, with the settle landing on it). A page with three peaks has none; if a second act competes, demote it: shorter span, less asset, plainer device.

**The ending must resolve.** The last feeling is the one they carry, and a page that trails off into a footer overwrites everything the peak did. Resolution means the page arrives somewhere and stops: the divider collapses, the type shrinks to its quietest setting, the surface hands over an input. The final screen still has something on it; a close that fades to an empty stage is the page apologising for existing.

## 5. The tell-someone test

Complete: "it's the site where ___". "It has a scrub video" is a device name. "You dive to the bottom of the ocean and the pressure readout keeps climbing" is an experience, from the visitor's side. If the sentence only makes sense to someone who has read the plan, it fails. The signature move usually lives inside this sentence; if they point at different moments, one is decoration. Merge them, or cut the one that is not the peak.

## 6. Pacing as emotion

Scroll distance is emotional time, the only clock this medium has, and the instrument most often left at default.

| Pacing | Reads as | Built with |
|---|---|---|
| Short acts, hard cuts | Adrenaline, pulse, impatience | Acts under about 1.4 viewport-heights, no pin, no dwell |
| A long pin | Held breath, pressure, attention | Span 3 or more, overlapping cues, one idea |
| An empty viewport before a reveal | Silence before the drop | A ground-only act, no cue until the next one |
| A slow settle mid-act | The shot landing | Dwell on the scrub, cue peak on the settle |
| A fast cue with a long plateau | Confidence, arrival | Short ramp in, long hold |
| A slow ramp in | Hesitation, dawning | Use it once; it is close to feeling broken |

If every act is the same span the page has no shape, whatever the curve says. Specs, logistics, FAQ and credentials are information, not experience: flow them at short stagger. Length follows the journey; a page that needs twenty viewport-heights to land its curve has too many acts, and a short editorial or gallery page stays short when the journey is complete. Silence has to be authored: an empty screen you meant reads as anticipation, one you did not reads as a page that failed to load, and the harness reports both as dead scroll, so name intended silence in the plan.

## 7. Being in it, not watching it

A film plays whether you are there or not. The page becomes a place when it acknowledges that somebody specific is here. Pick **one or two** per page, the ones that serve the peak; a page that reacts to everything feels haunted and the visitor stops reading to poke at it: pointer parallax that moves the world, not a card; dwell-triggered detail that arrives when they hold still, never needed for comprehension; scroll velocity shaping grain, blur or saturation; one line in second person at the emotional turn, which works because it is the only time; a trace of where they have been, so the end is a record rather than a footer. All are gated to fine pointers and off under reduced motion, so none may carry the page's meaning alone.

## 8. The plan file

`docs/scroll-plan.md`, each section appended as its step completes:

1. **Brief**: the six answers, verbatim or marked as authored; brand-kit hard rules.
2. **Journey**: the beats.
3. **Feeling curve**, one line per beat. **Peak**: the sentence and its beat. **Tell-someone**: the sentence. **Authored silence**: where, if any.
4. **Structure** (Step 2): grammar and why; the six shapes; the signature move; the sites.md check.
5. **Score** (Step 3): beat / device / why, spans, peak span.
6. **Assets** (Step 4): per beat, source and encoded outputs.
7. **Verification and feel check** (Steps 6 and 7): findings, felt curve against intended, what changed.
