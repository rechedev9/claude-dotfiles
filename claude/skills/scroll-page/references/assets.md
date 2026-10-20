# Assets: the user's own photos and footage

Read this when the page uses any photo or clip. The source is what the user shot or owns. Where there is no photo, the world is type, CSS, SVG or real 3D in the browser: a first-class route, not a fallback.

## How many

Fewer than you think: a six-act page needs roughly two clips (one hero move, one detail move) and four to six stills. Each clip is the heaviest thing on the page and the third stops being a surprise, so if the user has twenty clips the job is choosing two.

## Cohesion: one shoot

Separately sourced images read as one page when they share one light direction, one grade and one level of realism. Lay the chosen set side by side and check: one light direction, or a deliberate reason it changes; one grade, fixing a stray image in ffmpeg or an editor before it reaches the page, because a CSS filter over a full-bleed image flattens the whole frame; one level of realism, since a phone snapshot next to a product render is worse than either used consistently; the brand object identical everywhere, because a label that drifts between shots is the first thing a client notices.

Write the look as three lines in the plan (light, grade, texture) and hold every asset to it. The vocabulary, each reachable with a camera and a grade: **low-key cinematic** (dark, one warm key, deep falloff, grain); **high-key editorial** (bright, shadowless, bone ground, one soft contact shadow); **natural documentary** (available light, handheld, honest surfaces, nobody looking at camera); **hard-light graphic** (one undiffused source, shadows as shapes, saturated seamless ground); **macro texture** (closer than the eye gets, thin focus, backlit edges); **architectural** (corrected verticals, vast negative space, raking light); **nocturne** (practical lights, wet surfaces, warm points in blue-black); **technical drawing** (patent-style line work, which is SVG); **drawn by CSS** (gradients, noise, grain, light sweeps, honest about being drawn); **real 3D** (a model the user owns or a CC0 model; a generic primitive is not the actual object).

Low-poly clay dioramas and tilt-shift toy worlds are the house style of AI scroll sites and announce that nothing on the page is real. Use an illustrated world only when the brand's identity is drawn, and then match its real style.

## Choosing and cropping stills

Copy sits on these images, so choose or crop for the empty space (a shadowed upper-left, the subject low right with air above) rather than scrimming over the subject later; where a photo has no room, mask it away from the text column (taste.md). Never put text in the image. Phones crop a 16:9 frame to its middle third, so left-side negative space is exactly what a phone loses: keep the subject in the centre third and the copy in a bottom band, or crop a portrait variant for the hero and serve it with `<picture>`. Not `object-fit: contain`; letterboxed media reads as a broken embed.

## Footage for scrubbing

A clip the reader can park anywhere in is a different thing from a clip that plays. Choose or shoot for: **one continuous move, one direction** (a dolly-in, a drift, a slow orbit), because any cut or reversal becomes a jolt the reader will sit on; **slower than feels right**, since the move is spread over two or three viewport-heights of scroll; **the subject in frame throughout and nothing entering or leaving**, because a person walking in at second nine is a different shot at frame 120 and the poster matches neither, so trim before anyone enters; **five to ten seconds**, which a stage can hold.

Supplied footage is usually flat: log or picture-profiled, no white point. Straight into the page it gives washed-out acts no scrim rescues. Grade it into an intermediate first:

```bash
# 1. measure: YMIN / YMAX / YAVG say whether the clip ever reaches white
ffmpeg -i raw.mov -vf signalstats,metadata=print:key=lavfi.signalstats.YMAX -f null -

# 2. expand levels to what step 1 measured, lift saturation a touch, land 24 to 30fps
ffmpeg -y -i raw.mov -vf "colorlevels=rimin=0.09:gimin=0.09:bimin=0.09:rimax=0.64:gimax=0.64:bimax=0.64,eq=saturation=1.08,fps=30,scale=1920:-2" -c:v libx264 -crf 16 -an graded.mp4

# 3. encode for scrubbing; the poster is written beside each output
bun <skill>/tools/encode.ts graded.mp4 public/media/01.mp4
bun <skill>/tools/encode.ts graded.mp4 public/media/01-m.mp4 --mobile
```

Decimate 60fps phone footage to 30 in the intermediate; dense keyframes cost half as much at half the frames. Re-encode, never stream-copy: cuts made with `-c copy` decode badly under a scrubber. `encode.ts` sets a dense keyframe interval, because a normal web encode seeks by walking forward from the last keyframe and scrubs like mud; strips audio, because these clips are scrubbed, never played; and writes the poster as the encoded clip's own first frame, because a poster from any other source jumps the moment the video paints. `--portrait` is for a phone hero shot upright; `--crf` trades size for grain-heavy footage.

Expect roughly 3MB per 5s desktop clip and half that for mobile; grain and foliage double it. Cutouts and clean plates are only needed by a layered photographic hero; hero-depth.md gives the free routes.
