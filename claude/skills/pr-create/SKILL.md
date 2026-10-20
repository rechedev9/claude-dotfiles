---
name: pr-create
description: "Use when opening, creating or updating a GitHub pull request (\"abre un PR\", \"open a PR\", \"create a PR\", \"gh pr create\", \"update the PR description\"); load it BEFORE running gh pr create or gh pr edit. Runs the CI gate, then writes a problem-and-impact body (What Problem This Solves, User Impact, Why, Evidence, Merge Danger) with verified evidence. Not for review-only requests."
metadata:
  credits: "Body headings from openclaw/openclaw's PR template; Merge Danger and the small-visual idea from Dex Horthy's show-me. Worked example in references/example.md."
---

# PR Create

Write for a reviewer who has not seen the conversation: lead with the concrete problem and the resulting behavior, and use technical detail only for the solution, a tradeoff, or the limits of the evidence.

## Ground

- Read `AGENTS.md`, `CLAUDE.md`, the PR template and recent PR bodies; their fields and conventions override the defaults below. Write the PR in the repository's language, else English; talk to the user in theirs.
- New PR: branch off the default branch if needed, resolve the base (user's choice, else `gh repo view --json defaultBranchRef`), `git fetch origin <base>`, and use `origin/<base>...HEAD` as the range everywhere.
- Existing PR: read its current body, head diff, checks and reviews. Do not assume an old body describes the final patch.
- Reuse the evidence gathered during implementation. For a body-only rewrite of an old PR, say it is based on reported evidence.

## Before opening

Only for a new PR; skip for updates and draft-only requests.

1. Commit the implementation. Stop if the range is empty.
2. Run the CI-equivalent gate on the final head: read `.github/workflows/*.yml` and run locally every job whose paths the diff touches. Never open on a red gate. Failures the repository documents as pre-existing locally do not count if they also fail on `origin/<base>`; list them in `Evidence`. Do not launch review agents or run `/code-review` here; the evidence comes from the implementation.
3. Commit fixes as `fix(scope): outcome`. No commit when nothing changed.

## Evidence

- Separate observed behavior from author-reported results and expectations. Tie each check to the revision and environment it covers; if code changed afterward, rerun or qualify it.
- Prefer a reproduced failure followed by a passing check, with the test as short pseudocode. Claim red-to-green only when both runs were observed. Do not manufacture a baseline for a new feature.
- Give each check and its outcome with a command or test name, not only a count. Separate local runs from hosted CI. No checked boxes for unrun work.
- Name the tier reached (unit, mocked, real data, installed app, delivered artifact); a lower tier does not prove a higher one.
- Say `independent review` only when a separate reviewer inspected the stated revision. Link only reviewer-accessible evidence.

### Screenshots for UI changes

A PR that changes what a user sees embeds screenshots in `Evidence`; a description or local path does not count.

- Capture from the PR head at the narrowest supported width (~360 px), a short window (~700 px) and a desktop width. Fix what breaks and rerun the gate before capturing. Add a before capture when an existing screen changes.
- Caption each image with what it shows (fixture or real data, width).
- Reference the local file in the body and pass `--attach <file>` to `gh pr create|edit|comment` (gh >= 2.99). Never commit screenshots or leave a local path in the published body.
- If no screenshot can be produced, open as draft and say so in `Evidence`.

## Title and body

Title: `type(scope): concrete outcome`. For a fix, name the symptom and trigger; for a feature, the capability. No function names unless they are the product.

Default headings when the repository has no template:

- `## What Problem This Solves`: the broken workflow and its trigger, or the missing capability. One short paragraph.
- `## User Impact`: what users, operators or developers can now do, plus migrations, required actions and breaks. One short paragraph; for a refactor, state that behavior is preserved.
- `## Why This Change Was Made`: the mechanism and any material tradeoff, briefly.
- `## Evidence`: as above.
- `## Merge Danger`: as below.

Style: describe the final implementation, not the path to it. Long output and tables go in `<details>`. No file inventories, checklists or confidence scores. End with `🤖 Generated with [Claude Code](https://claude.com/claude-code)` and no other signature. When editing, preserve bot blocks and others' attribution. `Closes` only if the PR resolves the issue, else `Related`.

### Merge Danger

Build it from the diff: callers and stored data the change touches, and what a revert would not undo. Reuse an existing repository risk section instead of duplicating it.

```markdown
**Door:** <one-way or two-way>

<optional: what a revert would not undo, and how to recover>

**Blast Radius:** <one word: none, local, feature, shared, consumers, data>

<optional: affected workflows or data and the plausible regression>
```

Add `**Rollback:**` only when recovery needs more than a revert (coordination, data restoration, regeneration), and say whether that path was exercised or only inspected.

### Diagrams

One compact visual beside the text it supports, when it helps; none for a one-line fix. Mermaid flowchart for pipelines, states or gates; sequence diagram for UI/service/worker interactions; otherwise a labeled `diff` sketch, pseudocode or a shallow tree. Product terms, 4-8 nodes, no theme directives. A diagram explains behavior; it does not prove it. See [references/example.md](references/example.md).

## Publish

- A draft-only request gets title and body in chat. A request to create or update a PR authorizes that; do not ask again. Never merge, release or deploy from this skill.
- Reread the body against `git diff origin/<base>...HEAD`: every path, command, test name and claim must hold on the final head.
- `git push -u origin <head>`, then `gh pr create --body-file <utf-8 file> [--attach ...]`; never inline a multiline body in a shell command. Draft only for a stated blocking gap.
- Before `gh pr edit`, reread the current body. Afterwards, `gh pr view --json title,body`: no local image paths, links resolve, fences balanced.
