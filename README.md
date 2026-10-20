# claude-dotfiles

My Claude Code configuration, the same on every PC. One script copies it between this repo and `~/.claude`.

## A new PC

1. Install Git, [Bun](https://bun.sh), Node 22.18 or later, pnpm, `jq` and Claude Code. On Windows, Git for Windows gives the Bash that the status line needs.
2. Clone and apply:

   ```bash
   git clone https://github.com/rechedev9/claude-dotfiles.git
   cd claude-dotfiles
   bun sync.ts apply
   ```

3. Install the dependencies of the scripts:

   ```bash
   cd ~/.claude/scripts && pnpm install
   ```

4. Sign in to Claude Code. No credential is in this repo.

## Keeping the PCs the same

After a change on one PC:

```bash
bun sync.ts capture
git add -A && git commit -m "chore: update the configuration" && git push
```

On the others:

```bash
git pull
bun sync.ts apply
```

`bun sync.ts status` shows what differs between the repo and the machine, and changes nothing.

## What the script does

| Command   | Direction       | Notes                                                                                                         |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `status`  | none            | Lists the files that differ.                                                                                  |
| `apply`   | repo to machine | A file it replaces is copied first to `~/.claude-dotfiles-backup/<time>/`. It never deletes a file on the PC. |
| `capture` | machine to repo | Mirrors the machine: a file that is gone from the machine is removed from the repo.                           |

## What is here

| Path                   | What it is                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `claude/CLAUDE.md`     | The global instructions for every project.                                                           |
| `claude/settings.json` | Settings: output style, language, effort per model, the status line, the marketplace and the plugin. |
| `claude/statusline.sh` | The status line. Needs Bash, `git` and `jq`.                                                         |
| `claude/hooks/`        | `skill-gates.ts`, the commit and PR gate below, and the SessionStart hook that herdr installs.       |
| `claude/skills/`       | My skills, plus `humanizer` and `scroll-page`, which are MIT forks with their `LICENSE`.             |
| `claude/scripts/`      | `trash` and `browser-tools`, with their `.cmd` and Bash launchers.                                   |
| `sync.ts`              | The script above. No dependencies.                                                                   |

`settings.json` sets `permissions.defaultMode` to `bypassPermissions`. `apply` carries that to the PC where it runs. Its hook commands use the absolute path `C:\Users\reche\.claude\hooks`, so on another user or OS, edit them after `apply`.

## The commit and PR gates

`hooks/skill-gates.ts` runs before every Bash or PowerShell call and reads the session transcript.

- `gh pr create`, `gh pr edit --body` and `gh api` writes to `/pulls` are blocked until the `pr-create` skill has loaded in the session.
- `git commit` is blocked until `pre-commit-review` has loaded and `code-review`, `simplify` and `comment-sweep` ran in that order since the last successful commit. A commit that changes only docs (`.md`, `.mdx`, `.txt`, `.rst`) passes, and so does a commit in the same turn as `pr-create`.

| Skill               | What it does                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pr-create`         | Runs the CI gate, then writes a PR body with the problem, the user impact, the evidence and the merge risk.               |
| `pre-commit-review` | Runs `code-review high --fix`, `simplify` and `comment-sweep`, then verifies the change in a throwaway local environment. |
| `comment-sweep`     | Deletes the comments that add nothing to the code.                                                                        |
| `grok-review`       | An adversarial review by a second model through the Grok CLI.                                                             |

## What is not here

- Credentials, history, sessions and caches.
- `settings.local.json`, which is per machine.
- The memory of each project, which is tied to the paths of one machine.
- `skills/synced/` and the plugin cache, which the app downloads by itself.
- The skills that other tools install and update. `sync.ts` skips every skill in the lock of the `skills` CLI (`~/.agents/.skill-lock.json`), such as the HyperFrames family, and `reverse-engineer-anything`.

## Checked on

Windows 11. The script uses only `node:fs`, `node:os` and `node:path`, but it has not run on macOS yet.

The earlier content of this repo (shell hooks, the old `install.sh` and the `workflow` folder) is in the git history before the commit that added `sync.ts`.
