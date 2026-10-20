import { existsSync, statSync } from "node:fs";
import { flagBool, flagNumber, parseArgs } from "./args";
import { findFfmpeg, runFfmpeg } from "./ffmpeg";

const USAGE =
  "usage: bun encode.ts <input> <output.mp4> [--mobile] [--portrait] [--crf N]\n" +
  "  desktop: 1080p, keyframe every 8 frames, CRF 20\n" +
  "  --mobile: 720p, keyframe every 4 frames, CRF 24\n" +
  "  --portrait: 9:16 crop from the centre, 720 wide, mobile settings\n" +
  "  writes the poster (first frame of the encoded clip) as <output>.webp";

interface Profile {
  filter: string;
  gop: number;
  crf: number;
}

function profile(options: {
  mobile: boolean;
  portrait: boolean;
  crf: number | undefined;
}): Profile {
  // A seek decodes from the previous keyframe; 8 frames (4 on phones) keeps
  // every scrub position a few frames away.
  if (options.portrait) {
    return { filter: "crop=ih*9/16:ih,scale=720:-2", gop: 4, crf: options.crf ?? 24 };
  }
  if (options.mobile) return { filter: "scale=-2:720", gop: 4, crf: options.crf ?? 24 };
  return { filter: "scale=-2:1080", gop: 8, crf: options.crf ?? 20 };
}

function mb(path: string): string {
  return `${(statSync(path).size / 1048576).toFixed(2)} MB`;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const [input, output] = args.positional;
  if (!input || !output) {
    console.error(USAGE);
    return 2;
  }
  if (!existsSync(input)) {
    console.error(`input not found: ${input}`);
    return 2;
  }
  if (!output.endsWith(".mp4")) {
    console.error("output must end with .mp4");
    return 2;
  }
  const crfFlag = flagNumber(args, "crf");
  if (crfFlag !== undefined && (crfFlag < 0 || crfFlag > 51)) {
    console.error("--crf must be between 0 and 51");
    return 2;
  }
  const ff = await findFfmpeg();
  if (!ff.ok) {
    console.error(ff.reason);
    return 1;
  }
  if (!ff.webp) {
    console.error(
      `${ff.path} has no libwebp encoder, so the poster cannot be written. Use a full build.`,
    );
    return 1;
  }
  const p = profile({
    mobile: flagBool(args, "mobile"),
    portrait: flagBool(args, "portrait"),
    crf: crfFlag,
  });
  const poster = `${output.slice(0, -4)}.webp`;

  const enc = await runFfmpeg(ff.path, [
    "-y",
    "-i",
    input,
    "-an",
    "-vf",
    `${p.filter}:flags=lanczos,format=yuv420p`,
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-preset",
    "slow",
    "-crf",
    String(p.crf),
    "-g",
    String(p.gop),
    "-keyint_min",
    String(p.gop),
    "-sc_threshold",
    "0",
    "-movflags",
    "+faststart",
    output,
  ]);
  if (enc.code !== 0) {
    console.error(`ffmpeg failed (${enc.code}):\n${enc.stderr}`);
    return 1;
  }
  // The poster comes from the encoded file, so it matches the first frame the
  // decoder will paint, pixel for pixel.
  const post = await runFfmpeg(ff.path, [
    "-y",
    "-i",
    output,
    "-frames:v",
    "1",
    "-vf",
    "scale='min(1600,iw)':-2",
    "-c:v",
    "libwebp",
    "-quality",
    "82",
    poster,
  ]);
  if (post.code !== 0) {
    console.error(`poster failed (${post.code}):\n${post.stderr}`);
    return 1;
  }
  console.log(`ffmpeg: ${ff.path} (${ff.filters} filters)`);
  console.log(`clip:   ${output} ${mb(output)} (${p.filter}, GOP ${p.gop}, CRF ${p.crf})`);
  console.log(`poster: ${poster} ${mb(poster)}`);
  return 0;
}

process.exitCode = await main();
