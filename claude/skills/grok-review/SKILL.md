---
name: grok-review
description: "Adversarial code review of a pull request, branch or diff by a second model: one Grok CLI agent (grok-4.7, xhigh, build mode) that tries to break the change and proves findings by running code. Use whenever the user asks to review something with Grok, wants a second opinion or an adversarial, independent or cross-model review of a PR or branch, or runs /grok-review. Prefer this over spawning several Claude review agents when the user names Grok."
argument-hint: "[PR number, branch or path; default: current branch against the default branch]"
---

# Grok review

One Grok agent reviews the change, in build mode, and you verify what it reports
before the user sees it. The value is an independent model that did not write the
code and is told to refute it.

Three choices are fixed because the owner asked for them. Do not "improve" them:

- **One agent.** A single `grok` process for the whole change, with
  `--no-subagents`. Do not split the diff across several runs: it multiplies cost
  and the findings then need merging. A large diff is handled by telling Grok
  where the risk is, not by adding agents.
- **Build mode, never plan mode.** `--permission-mode auto`. Plan mode cannot run
  tests or repro scripts, so every finding stays a guess.
- **`grok-4.7` at `--reasoning-effort xhigh`** unless the user names another.

## Steps

1. **Scope.** Resolve what is under review and its base:
   - PR number: `gh pr view <n> --json baseRefName,headRefName,title`. Check out
     the head branch if it is not the current one (ask first if the tree is dirty).
   - Otherwise the current branch against `origin/<default branch>`.
   - `git fetch origin <base>` so the base is current, then
     `git diff --stat origin/<base>...HEAD` to see size and which areas changed.
2. **Risk notes.** From the diff stat, the PR body and what you know of the
   change, write 3 to 8 specific things worth attacking (a migration, an auth
   change, code moved between packages, a "refactor" that might change
   behaviour). This is the part that makes a single agent effective on a big
   diff. If you wrote the change yourself, list what you were least sure of.
3. **Prompt.** Copy [`prompt-template.md`](prompt-template.md) into a work
   directory in your scratchpad and fill the placeholders. Keep its rules: prove
   by execution, do not touch the repository, write the report to the report file.
4. **Run it**, from the repository root, in the background (at xhigh it can
   take tens of minutes):

   ```bash
   grok --prompt-file "$WORK/prompt.md" -m grok-4.7 --reasoning-effort xhigh \
     --permission-mode auto --no-subagents --disable-web-search \
     > "$WORK/progress.log" 2> "$WORK/err.log"
   ```

   stdout is Grok's running narration, not the review. The review is the file the
   prompt tells it to write (`$WORK/review.md`). Tell the user it is running and
   what you asked it to attack; do not poll in a loop.
5. **Check it left the tree alone.** `git status --short` must be what it was
   before. If Grok edited tracked files, show the user the diff and ask; do not
   keep or discard it on your own.
6. **Verify every finding yourself** before relaying it. Open the file at the
   cited line; rerun the repro command if there is one. Sort each finding into
   confirmed, could not confirm, or wrong, and say why for the last two. A
   second model is confidently wrong often enough that an unverified list wastes
   the user's time.
7. **Report** to the user, most severe first: confirmed findings with
   `path:line`, the failure scenario and the smallest fix; then what you could
   not confirm; then one line on what Grok got wrong. Do not fix anything unless
   the user asks. If they ask, fix it yourself and rerun the relevant tests.

## Things that go wrong

- `grok` is at `~/.grok/bin/grok`. `grok models` can print "You are not
  authenticated" while headless runs work. Test with
  `grok -p "Reply with: ok" -m grok-4.7 --reasoning-effort low` before
  concluding it needs `grok login`. Only the user can log in.
- Grok reads the repo's `CLAUDE.md` and `AGENTS.md` and the user's global
  instructions by itself. Do not paste them into the prompt.
- It may answer in the user's language whatever the prompt says. That is fine.
- If the run dies or the report file is missing, the tail of `progress.log`
  usually holds the findings so far. Say the review is partial.
- Killing the wrapper shell does not kill `grok.exe` on Windows. To stop a run,
  stop the `grok` process whose command line contains your work directory.
- The code goes to xAI. That is what the user asked for when they named Grok;
  do not run this on a repository they have not asked you to review this way.
