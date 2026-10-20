---
name: pre-commit-review
description: "Use before every git commit (\"commit\", \"haz commit\", \"commitea\", \"git commit\"); load it BEFORE running git commit. Runs four steps in order over the uncommitted change: code-review high --fix, simplify, comment-sweep, then verification that the final code solves the task. A hook blocks git commit until this skill has run since the last commit."
---

# Pre-commit Review

Four steps over the change you are about to commit, one after another. Each step starts only after the previous one has finished and its edits are on disk, because each one works on the result of the one before.

## Scope

1. Run `git status --short`. If nothing would be committed, stop. If every changed file is documentation (`.md`, `.mdx`, `.txt`, `.rst`), skip this skill and commit: the hook lets docs-only changes through.
2. Stage exactly the files this commit will contain (`git add <paths>`), so new files are part of the reviewed diff. Leave unrelated changes unstaged.

## Passes

Run them in this order. Never run two at the same time. The hook checks that this skill loaded and that `code-review`, `simplify` and `comment-sweep` ran in this order since the last commit. When it blocks, run only the steps it names.

1. **Correctness:** call the Skill tool with `skill: "code-review"`, `args: "high --fix"`. Wait until it has applied its fixes.
2. **Simplification:** call the Skill tool with `skill: "simplify"`. Wait until it has applied its fixes.
3. **Comments:** call the Skill tool with `skill: "comment-sweep"`. Wait until it has applied its edits.
4. **Verification:** prove that the final code, after the three passes, solves the task:
   - Restate in one line the problem or feature this commit is for, from the user's request.
   - **Local environment:** always design and build a local environment for this verification, then delete it. Do this for every change, also when the project's tests could run alone.
     - Plan it first: list what the check needs (app server, database, other services, env vars, seed data, fixtures, throwaway scripts) and how you will start each one.
     - Build it isolated: files in the scratchpad, never in the repository; free ports; ephemeral databases and containers; env vars set for the command only. Never reuse or touch a shared, staging or production resource.
     - Run every check below inside this environment.
     - Tear it down when verification ends, also when it fails or is interrupted: stop the servers and processes you started, remove the containers and volumes, stop ephemeral databases and delete their data folders, and delete the scratchpad files you created. Keep only the captures you report.
     - Confirm the teardown: no process of yours still listens on the ports you used, `docker ps -a` shows none of your containers, and `git status` shows no file from the environment.
   - Run the check that shows it works: the test or reproduction that failed before the change, or a new test for a feature. A test that only exercises a mock of the changed code does not count.
   - **UI or UX change** (anything a user sees or interacts with): drive the real app with Playwright on this code.
     - Take screenshots at ~360 px wide, a short ~700 px tall window and a desktop width. Add a before capture from `HEAD` when an existing screen changes.
     - Record a video (`recordVideo` on the browser context) when the change is an interaction, a flow, an animation or a transition.
     - Open every screenshot and look at it, then fix what is broken and capture again.
     - Use the project's Playwright if it has one; otherwise run a throwaway script with `bunx playwright` from the scratchpad. Never add Playwright to the project for this.
     - Save captures outside the repository and never commit them. Report their paths.
   - **Pure backend change:** check the result against ground truth, never against the code's own idea of the answer.
     - Run the real path: call the endpoint, job or function against a real database or service, not a mock.
     - If the path needs a database that is not running locally, start an ephemeral one. This is mandatory: never skip the check, and never point it at a shared, staging or production database.
       - With Docker: the project's compose service, or `docker run --rm -p <free port>:5432 postgres:<project version>`.
       - Without Docker, native PostgreSQL in `C:\Program Files\PostgreSQL\<16|17>\bin`: `initdb -D <scratchpad>\pg-eph -U postgres -A trust -E UTF8`, then `pg_ctl -D <scratchpad>\pg-eph -o "-p <free port>" -l <scratchpad>\pg-eph.log -w start`.
       - Apply the project's migrations, seed only what the check needs, and pass the connection string through env vars for that command only.
       - It is part of the local environment, so the teardown above stops it and deletes its data folder.
       - Start other services (Redis, queues) the same way: Docker, else WSL.
     - Compare with an independent source: rows read back from the database, the real response of the external API, a value computed by hand from the spec or docs, or the output of `HEAD` for a refactor that must preserve behavior.
     - Report the expected value, where it came from, and the actual value.
   - A change that touches both does both.
   - If verification cannot run, do not commit. Tell the user what is missing.
   - Run the project's lint, format and the tests for the touched files.
   - If a check fails, fix the code and rerun this step. If the fix is more than a small correction, go back to pass 1.

If one of the first three passes finds nothing, say so in one line and go to the next. Verification always runs.

## Commit

1. `git add` the files the passes changed, but only files already in this commit's scope.
2. Commit. Report one line per pass: what it changed, or "nothing", and for verification the check that proved the fix: capture paths for UI, expected vs actual with its source for backend, and one line that the local environment was built and torn down.
3. If the commit fails (hook or check), fix the cause and commit again without rerunning the passes, unless the fix changed code.
