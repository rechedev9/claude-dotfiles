import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

type Gate = {
  skill: string;
  commands: RegExp[];
  sinceLastMatch: boolean;
  requiredSteps?: string[];
  exemptInTurnOf?: string;
  exemptIfOnlyDocs?: boolean;
};

// A command counts only at the start of the shell line or of a chained command, so text inside sed or echo does not.
const START = String.raw`(?:^|[;&|({\n]|\$\()\s*(?:\w+=\S*\s+)*`;
const command = (body: string): RegExp => new RegExp(START + body, "s");
const DOCS = /\.(md|mdx|txt|rst)$/i;

const GATES: Gate[] = [
  {
    skill: "pr-create",
    commands: [
      command(String.raw`gh\s+pr\s+create\b`),
      command(String.raw`gh\s+pr\s+edit\b.*\s(--body|--body-file|-b|-F|--title|-t)\b`),
      command(
        String.raw`gh\s+api\b(?=.*\/pulls(\/\d+)?\b(?!\/))(?=.*(-X\s*(POST|PATCH)|--method\s+(POST|PATCH)|\s-[fF]\s|--field|--raw-field|--input))`,
      ),
    ],
    sinceLastMatch: false,
  },
  {
    skill: "pre-commit-review",
    commands: [command(String.raw`git\b(\s+-[cC]\s+\S+)*\s+commit\b`)],
    sinceLastMatch: true,
    requiredSteps: ["code-review", "simplify", "comment-sweep"],
    exemptInTurnOf: "pr-create",
    exemptIfOnlyDocs: true,
  },
];

function get(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

function text(value: unknown, key: string): string {
  const found = get(value, key);
  return typeof found === "string" ? found : "";
}

function contentItems(entry: unknown): unknown[] {
  const content = get(get(entry, "message"), "content");
  return Array.isArray(content) ? content : [];
}

function entries(path: string): unknown[] {
  if (!path || !existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function loadsSkill(entry: unknown, skill: string): boolean {
  const slash = `<command-name>/${skill}</command-name>`;
  const raw = get(get(entry, "message"), "content");
  if (typeof raw === "string") return raw.includes(slash);
  return contentItems(entry).some(
    (item) =>
      (get(item, "type") === "text" && text(item, "text").includes(slash)) ||
      (get(item, "type") === "tool_use" && get(item, "name") === "Skill" && text(get(item, "input"), "skill") === skill),
  );
}

function missingInOrder(log: unknown[], steps: string[], from: number): string[] {
  let position = from;
  for (const [index, step] of steps.entries()) {
    position = log.findIndex((entry, at) => at > position && loadsSkill(entry, step));
    if (position < 0) return steps.slice(index);
  }
  return [];
}

// What is still missing since the last gated command that succeeded (or ever, without sinceLastMatch).
// Reloading the skill does not reset the steps already done.
function missingSteps(gate: Gate, path: string, currentToolUseId: string): string[] {
  const log = entries(path);
  const failed = new Set(
    log
      .flatMap(contentItems)
      .filter((item) => get(item, "type") === "tool_result" && get(item, "is_error") === true)
      .map((item) => text(item, "tool_use_id")),
  );
  const lastMatch = log.findLastIndex((entry) =>
    contentItems(entry).some((item) => {
      const id = text(item, "id");
      return (
        get(item, "type") === "tool_use" &&
        id !== currentToolUseId &&
        !failed.has(id) &&
        gate.commands.some((pattern) => pattern.test(text(get(item, "input"), "command")))
      );
    }),
  );
  if (gate.exemptInTurnOf) {
    const exempt = gate.exemptInTurnOf;
    const lastHuman = log.findLastIndex((entry) => get(get(entry, "origin"), "kind") === "human");
    const lastExempt = log.findLastIndex((entry) => loadsSkill(entry, exempt));
    if (lastExempt >= 0 && lastExempt >= lastHuman) return [];
  }
  const from = gate.sinceLastMatch ? lastMatch : -1;
  const skillLoaded = log.some((entry, index) => index > from && loadsSkill(entry, gate.skill));
  return [...(skillLoaded ? [] : [gate.skill]), ...missingInOrder(log, gate.requiredSteps ?? [], from)];
}

// Every pending change (staged, unstaged, untracked), so `git add -A && git commit` is judged before its add runs.
function onlyDocsChanged(cwd: string, shellCommand: string): boolean {
  const dir = /\bgit\s+-C\s+("[^"]+"|\S+)/.exec(shellCommand)?.[1]?.replaceAll('"', "") ?? "";
  const result = Bun.spawnSync(["git", "-C", dir ? join(cwd, dir) : cwd, "status", "--porcelain", "-uall"]);
  if (result.exitCode !== 0) return false;
  const files = result.stdout
    .toString()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).split(" -> ").at(-1) ?? "");
  return files.length > 0 && files.every((file) => DOCS.test(file.replaceAll('"', "")));
}

const input: unknown = JSON.parse(await Bun.stdin.text());
const shellCommand = text(get(input, "tool_input"), "command");
const transcript = text(input, "transcript_path");
const agentId = text(input, "agent_id");
// Subagents log to <session>/subagents/agent-<id>.jsonl next to the main transcript.
const transcripts = agentId
  ? [join(dirname(transcript), text(input, "session_id"), "subagents", `agent-${agentId}.jsonl`), transcript]
  : [transcript];

for (const gate of GATES) {
  if (!gate.commands.some((pattern) => pattern.test(shellCommand))) continue;
  if (gate.exemptIfOnlyDocs && onlyDocsChanged(text(input, "cwd"), shellCommand)) continue;
  const missing = transcripts
    .map((path) => missingSteps(gate, path, text(input, "tool_use_id")))
    .reduce((fewest, current) => (current.length < fewest.length ? current : fewest));
  if (missing.length === 0) continue;
  const when = gate.sinceLastMatch ? " since the last successful commit" : "";
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Missing${when}: ${missing.join(", then ")}. Run only these, in this order, with the Skill tool. Steps already done still count.`,
      },
    }),
  );
  break;
}
