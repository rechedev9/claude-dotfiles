# Verify: harness, runs and limits

Read this when the page renders and before you call it done. Read `build.md` first if a finding points at a rule you have not applied.

## Tools

Both tools run with Bun from the project root, so they resolve `playwright-core` and the project's files. `playwright-core` must be a dev dependency of the project (`bun add -d playwright-core`); the harness drives the Chrome or Edge already installed on the machine (or `SCROLL_CHROME=<path>`), so no browser download. Both tools find the full ffmpeg build themselves (Gyan WinGet build, `C:\ffmpeg`, Homebrew, PATH, or `SCROLL_FFMPEG=<path>`) and say plainly when none is full enough.

### encode.ts

```
bun <skill>/tools/encode.ts <input> <output.mp4> [--mobile] [--portrait] [--crf N]
```

Writes an H.264 high-profile clip tuned for seeking (GOP 8 desktop, GOP 4 mobile, `faststart`) and the poster `<output>.webp` as the encoded clip's first frame. `--mobile` is 720p, `--portrait` crops the centre to 9:16 at 720 wide. Run it twice for a scrub act: desktop and `--mobile`.

### shoot.ts

```
bun <skill>/tools/shoot.ts --url <url> --out <dir> [--width N --height N] [--dpr N] [--reduced-motion]
```

Loads the page, waits for fonts and `window.scrollPageBridge`, plans samples per act (six positions, every cue peak, and entry and exit slides for scrub acts), scrolls to each, waits until every live clip has settled (`cur` equals `target`, not seeking), then writes `NN.png` frames with a label, `sheet.png` (five per row) and `report.json`. Exit code 1 when a finding other than `contrast-thin` is present.

Findings and what to do:

- `dead-scroll`: two consecutive frames inside a pinned act are the same across more than 0.25 viewports of scroll. Something must move: add a cue, shorten `span`, or give the clip `dwell` instead of a plateau in its mapping. Silence the plan names as authored stays: list the finding with that reason.
- `frozen-clip`: the clip's target moved but `currentTime` did not while the stage was on screen. Check the encode (re-run `encode.ts`), that the file serves with a 200, and that no other code sets `src` on the video.
- `clip-missing`: the video is in the DOM but never registered, never became ready, or never painted. The first means `ScrubClip` is not mounted or motion is reduced; the second is a wrong path, a 404 or a codec the browser cannot decode; the third is a seek that never completed (see the real-phone pass).
- `never-peaks`: a cue never reaches opacity 0.8 in any sample. Its window is too narrow for its ramps, or it lies outside the act's range (a `from` above 1 in a flow act, for instance).
- `contrast-fail` and `contrast-thin`: with the cue hidden, the pixels behind its text were sampled in a 32 by 16 grid and compared with its text colour. `fail` is 20% or more of cells under 3:1, `thin` is 30% or more under 4.5:1. Fix by moving the copy to a quieter part of the frame, adding the matching `.sc-scrim`, or choosing a different clip moment with `dwell`. A cue on its own fill is measured against that fill only.
- `no-bridge`, `no-sda`, `no-js-class`, `unsettled`, `page-error`: environment problems; the message says which rule of `build.md` is missing or which resource failed.

## The three runs

Run all three on every page before it ships and read each `sheet.png` yourself; the detectors cover timing and legibility, not taste.

1. Desktop: `--width 1440 --height 900`.
2. Phone: `--width 390 --height 844` (touch and mobile emulation switch on below 768 wide, so `srcMobile` and `posterMobile` are the ones exercised).
3. Reduced motion: desktop size with `--reduced-motion`. Clips do not register and the pan act unpins, so `dead-scroll` is not checked; what you verify here is that every cue still appears and that nothing moves.

A green run shows that the page animates correctly in headless Chrome on this machine. It does not cover: whether an iPhone paints seeks, Low Power Mode, network stalls, Safari's range edges, Firefox, taste, and copy that is readable but says nothing.

## Real-phone pass

Serve the built site on the local network (`vite preview --host`) and open `tools/device-diag.html` on the phone with the clip in the query string, for example `http://<lan-ip>:4173/device-diag.html?clip=/clips/hero-m.mp4` (copy the file into `public/` for the duration of the check). Scroll the page a few times. Three panes show the same clip: `blob` loads it the way the kit does, `direct` sets the URL as `src` and so depends on HTTP range support, `play` just plays it. Each pane hashes its frame every animation frame and reports MOVING once it has seen three distinct frames, or FROZEN once you have scrolled past 35% with fewer. Tap Copy report and paste the JSON into the thread.

- `blob` FROZEN and `play` MOVING: the seek path is broken on that device; check priming (a gesture happened), Low Power Mode, and the stuck counter.
- All three FROZEN or ERROR: the file itself does not decode; re-encode with `encode.ts --mobile`.
- `direct` FROZEN only: the host does not serve byte ranges; the kit's Blob path is unaffected.

Then open the real page on the phone and check the hero clip scrubs, the copy is readable in portrait, and the rail pans.

## Known limits

- Firefox has no scroll-driven animations until it ships them (planned for 160). It renders the `@supports` fallback: every cue settled, reveals open, rail as a native horizontal scroller, progress bar hidden, no ground drift. Check that the settled page reads well on its own; that is the page a Firefox reader gets.
- Safari 26.0 to 26.3 evaluates an animation range's edge differently from Chrome, so a cue with a range that starts at `contain 0%` can be one frame late or early at the edge. Keep `from` at 0.02 or more and `to` at 0.98 or less when the edge matters. 26.4 runs these animations on the compositor and 26.5 fixes the range edge.
- Keyboard focus inside pinned acts: the rescue scrolls to a cue's peak when a control inside it receives focus while it is hidden, which is right for one control per cue. Several controls in one cue, or a control in a cue that peaks at the same position as another, still get one scroll each; keep interactive controls to one per cue.
- The contrast sample uses the cue's colour at full strength and ignores text shadows; a cue that relies on a shadow for legibility is reported thin even when it reads.
