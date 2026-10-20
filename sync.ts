#!/usr/bin/env bun
/**
 * Copies the Claude Code configuration between this repo and ~/.claude.
 *
 *   bun sync.ts status    what differs
 *   bun sync.ts apply     repo to this machine (a replaced file is backed up first)
 *   bun sync.ts capture   this machine to the repo (then commit and push)
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const REPO = join(import.meta.dir, "claude");
const MACHINE = join(homedir(), ".claude");

/** The parts of ~/.claude that are configuration. The rest is state, cache or a secret. */
const ENTRIES = [
  "CLAUDE.md",
  "settings.json",
  "hooks",
  "statusline.sh",
  "scripts",
  "skills",
];
/** Skipped at any depth. `synced` holds the skills the app downloads by itself. */
const SKIP = new Set(["node_modules", "synced"]);
/** Skills that other tools install and update: the ones in the `skills` CLI lock, plus REA's. */
const SKIP_PATHS = new Set(
  [...installedSkills(), "reverse-engineer-anything"].map(
    (name) => `skills/${name}`,
  ),
);

function installedSkills(): string[] {
  const lock = join(homedir(), ".agents", ".skill-lock.json");
  if (!existsSync(lock)) return [];
  const skills: unknown = JSON.parse(readFileSync(lock, "utf8")).skills;
  return typeof skills === "object" && skills !== null
    ? Object.keys(skills)
    : [];
}

function walk(root: string, entry: string): string[] {
  const path = join(root, entry);
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [entry];
  return readdirSync(path)
    .filter((name) => !SKIP.has(name) && !SKIP_PATHS.has(`${entry}/${name}`))
    .flatMap((name) => walk(root, `${entry}/${name}`));
}

const files = (root: string): string[] =>
  ENTRIES.flatMap((entry) => walk(root, entry));

function same(a: string, b: string): boolean {
  return (
    existsSync(a) && existsSync(b) && readFileSync(a).equals(readFileSync(b))
  );
}

function copy(from: string, to: string): void {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

function status(): void {
  const all = [...new Set([...files(REPO), ...files(MACHINE)])].sort();
  let different = 0;
  for (const file of all) {
    const inRepo = existsSync(join(REPO, file));
    const onMachine = existsSync(join(MACHINE, file));
    if (inRepo && onMachine && same(join(REPO, file), join(MACHINE, file)))
      continue;
    different += 1;
    const state = !onMachine
      ? "only in the repo"
      : !inRepo
        ? "only on this machine"
        : "differs";
    console.log(`${state.padEnd(22)}${file}`);
  }
  console.log(`${all.length} files, ${different} different`);
}

function apply(): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = join(homedir(), ".claude-dotfiles-backup", stamp);
  let copied = 0;
  for (const file of files(REPO)) {
    const from = join(REPO, file);
    const to = join(MACHINE, file);
    if (same(from, to)) continue;
    if (existsSync(to)) copy(to, join(backup, file));
    copy(from, to);
    copied += 1;
    console.log(`applied  ${file}`);
  }
  console.log(`${copied} files applied`);
  if (existsSync(backup)) console.log(`replaced files are in ${backup}`);
}

function capture(): void {
  const onMachine = files(MACHINE);
  let changed = 0;
  for (const file of onMachine) {
    if (same(join(MACHINE, file), join(REPO, file))) continue;
    copy(join(MACHINE, file), join(REPO, file));
    changed += 1;
    console.log(`captured  ${file}`);
  }
  const kept = new Set(onMachine);
  for (const file of files(REPO)) {
    if (kept.has(file)) continue;
    rmSync(join(REPO, file));
    changed += 1;
    console.log(`removed   ${file}`);
  }
  console.log(`${changed} files changed in the repo`);
}

const commands: Record<string, () => void> = { status, apply, capture };
const command = commands[process.argv[2] ?? ""];
if (!command) {
  console.error("usage: bun sync.ts status | apply | capture");
  process.exit(1);
}
command();
