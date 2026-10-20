---
name: comment-sweep
description: "Delete useless comments from code. Use when asked to sweep, clean or prune comments (\"limpia comentarios\", \"quita comentarios inútiles\", \"comment sweep\"), and as step 3 of pre-commit-review. Defaults to the comments the uncommitted diff adds or edits; with path arguments, sweeps those files whole."
---

# Comment Sweep

The default for a comment is DELETE. A comment stays only when it tells a reader something the code cannot: a non-obvious reason, or an invariant they would otherwise break.

## Scope

- No arguments: the comments on lines that `git diff HEAD` adds or changes, plus every comment in new untracked files that will be committed.
- Path arguments: every comment in those files.
- Never touch a comment outside the scope, and never change code. A project `AGENTS.md` or `CLAUDE.md` comment policy overrides the rules below.

## Delete

- Restates the name, the type, the signature or the line below it (`// increment counter`, `@param id the id`).
- Narrates history: what the code used to do, an incident, a bug that was fixed, why a number changed, a commit or PR ref, "now", "added", "changed X to Y".
- Speaks to the reviewer or the session: "as requested", "here we", "note that we", "this function".
- Commented-out code.
- Banners, section dividers and file-header essays.
- A TODO with no concrete next step.

## Shorten

A comment that holds a real reason but runs past two lines: cut it to the reason in one or two lines.

## Keep

- A non-obvious why: a workaround (with the upstream link), a performance or concurrency constraint, a security reason.
- An invariant, unit or format that the type does not show.
- Doc comments on a public API that add information beyond the signature.
- Directives and required headers: shebangs, license headers, `@jsx`, test-environment pragmas, generated-file markers.

## Procedure

1. List each comment in scope with `file:line` and a verdict: delete, shorten or keep.
2. Apply the edits. Remove the blank line a deleted comment leaves behind when it doubles a gap.
3. Run the project's formatter on the touched files only.
4. Report counts (deleted, shortened, kept) and the `file:line` of each shortened comment.
