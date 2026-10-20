import { existsSync } from "node:fs";
import { join } from "node:path";

export interface FfmpegFound {
  ok: true;
  path: string;
  filters: number;
  webp: boolean;
}

export interface FfmpegMissing {
  ok: false;
  reason: string;
}

// A stripped ffmpeg reports a missing filter as a syntax error, so the build
// is checked by counting filters instead of trusting what is on PATH.
const MIN_FILTERS = 200;

async function runText(path: string, args: string[]): Promise<string | null> {
  try {
    const proc = Bun.spawn([path, ...args], { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    return out;
  } catch {
    return null;
  }
}

async function inspect(path: string): Promise<FfmpegFound | null> {
  const filters = await runText(path, ["-hide_banner", "-filters"]);
  if (filters === null) return null;
  const count = filters
    .split("\n")
    .filter((l) => /^\s*[.A-Z]{2,3}\s+\S+\s+\S+->\S+/.test(l)).length;
  if (count < MIN_FILTERS) return null;
  const encoders = await runText(path, ["-hide_banner", "-encoders"]);
  return {
    ok: true,
    path,
    filters: count,
    webp: encoders !== null && /\blibwebp\b/.test(encoders),
  };
}

function wingetCandidates(): string[] {
  const local = process.env["LOCALAPPDATA"];
  if (!local) return [];
  const root = join(local, "Microsoft", "WinGet", "Packages");
  if (!existsSync(root)) return [];
  const glob = new Bun.Glob("Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe");
  return [...glob.scanSync({ cwd: root, absolute: true })];
}

export async function findFfmpeg(): Promise<FfmpegFound | FfmpegMissing> {
  const candidates: string[] = [];
  const env = process.env["SCROLL_FFMPEG"];
  if (env) candidates.push(env);
  candidates.push(...wingetCandidates());
  candidates.push(
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "ffmpeg",
  );
  const tried = candidates.filter((c) => c === "ffmpeg" || existsSync(c));
  const firstFull = async (i: number): Promise<FfmpegFound | null> => {
    const c = tried[i];
    if (c === undefined) return null;
    return (await inspect(c)) ?? firstFull(i + 1);
  };
  const found = await firstFull(0);
  if (found) return found;
  return {
    ok: false,
    reason:
      `No full ffmpeg build found (need ${MIN_FILTERS}+ filters). Tried: ${tried.join(", ") || "nothing on disk"}. ` +
      "Install the Gyan full build (winget install Gyan.FFmpeg) or set SCROLL_FFMPEG to a full build.",
  };
}

export async function runFfmpeg(
  path: string,
  args: string[],
): Promise<{ code: number; stderr: string }> {
  const proc = Bun.spawn([path, "-hide_banner", "-loglevel", "error", ...args], {
    stdout: "ignore",
    stderr: "pipe",
  });
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, stderr };
}
