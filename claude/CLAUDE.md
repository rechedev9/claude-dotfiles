# Global instructions

## GitHub Actions: no CI on pull requests

### Reason
- Coding agents push many times each day, so CI on each PR costs too much.

### Rules
- Do not add a `pull_request` or `pull_request_target` trigger to a test or build workflow.
- Do not add a bare `push:` trigger. Limit `push` to the default branch. The default branch is the dev branch.
- Run the full test suite on these triggers:
  - `schedule` (nightly, `cron: '0 3 * * *'`).
  - `workflow_dispatch`.
  - The release trigger: a `v*` tag push, or the release PR if the repo uses one.
- In a private repo, do not put a plain nightly `schedule` on each test workflow. Use one `nightly.yml` that dispatches the tests only when the default branch changed in the last 24 hours.
- Do not add a `schedule` to a workflow that deploys or applies infrastructure.
- Add `[skip ci]` to a commit only when it changes workflow files and nothing else, and a deploy workflow will start on that push.
- Do not tell me to wait for PR checks. Run the tests locally before you open or merge a PR.

## Language and tools

### Reason
- I want the same language and the same tools in all my projects.

### Rules
- Write all code in TypeScript, including scripts and tooling. Do not add another programming language.
- Exception: you can use Python for the throwaway scripts you write for your own work, such as bulk edits and data checks. Do not commit them to a project.
- In an existing project, keep the language and the tools it already uses unless I ask to change them.
- In a new project, use these tools:
  - Runtime and package manager: Bun.
  - Compiler: TypeScript 7 (`typescript@7`, the native compiler).
  - Linter and type check: oxlint with `oxlint-tsgolint`.
  - Formatter: oxfmt.
  - Unused code: knip.
  - Web app: React with React Compiler, Vite, Tailwind CSS, shadcn, TanStack Router, TanStack Query and Zustand.
  - API: Elysia with Eden.
  - Validation: TypeBox with Elysia, Zod without Elysia.
  - Database: PostgreSQL with Drizzle.
  - Tests: `bun test` for unit and integration tests, Playwright for end-to-end tests.

### Template for a new project
- Start a new full-stack project from my template repo `rechedev9/magic-johnson`. It already has this stack, Better Auth and the Docker deploy.
- Run `gh repo create <name> --template rechedev9/magic-johnson --private --clone`. Then follow `docs/new-project.md` in the new repo.
- When a tool rule in this file changes, make the same change in the template.

### Tool setup in a new project
- oxlint: set `options.typeAware` and `options.typeCheck` to `true` in `.oxlintrc.json`. Then `oxlint` does the lint and the type check in one pass. Do not add a separate `tsc --noEmit` script.
- oxfmt: pin the exact version. oxfmt is 0.x and its output can change between releases.
- React Compiler: install `@rolldown/plugin-babel`, `@babel/core` and `babel-plugin-react-compiler`, and add `babel({ presets: [reactCompilerPreset()] })` after `react()` in the Vite config. Do not use `react({ compiler: true })`, because the Rust compiler is experimental.
- React Compiler memoizes the components. Do not write `useMemo`, `useCallback` or `React.memo` unless a measurement shows that the code needs it.
- shadcn: use the Base UI primitives. Run `shadcn init` with `-b base -p nova`, because `-b base` alone installs Radix in an existing project. Do not add Radix.
- Tests: do not add Vitest or Jest.

### Versions on hold (checked on 2026-10-12)
- Elysia: use 1.4.x, the npm `latest` tag. Do not use Elysia 2, which is a beta on the `next` tag.
- TypeBox: use `@sinclair/typebox` 0.34.x, because Elysia 1.4 needs a version below 1. Do not install the `typebox` 1.x package before the move to Elysia 2.
- Drizzle: in a new project, use `drizzle-orm@rc` and `drizzle-kit@rc` (1.0 RC) with `defineRelations`, and pin the exact version. Version 1.0 removes the relational queries of 0.x. In an existing project, stay on 0.45.x until 1.0 is the npm `latest` tag.
- Do not add TanStack DB, which is 0.x.
- Do not add TanStack Start unless I ask for server rendering.
- Do not add Vite+ (`vite-plus`). It manages Node.js and the Node.js package managers, which is the job of Bun here.
- When you see that Elysia 2 or Drizzle 1.0 is the npm `latest` tag, tell me, so that I can update this list.

## Code rules

### Reason
- Agents write most of my code, so the rules must be explicit.

### Rules
- Strict TypeScript: do not use `any`, `as` (except `as const`), `!`, `@ts-ignore`, `@ts-expect-error` or a lint disable comment. Test files can use casts to build mocks.
- Do not re-export. Keep the static imports in one block at the top of the file.
- A function with more than two parameters takes one typed options object. Callbacks passed as arguments are exempt.
- Keep a comment to one or two lines. Write one only for a reason or an invariant that is not obvious. New code has at most 20% comment lines.
- In a new project, name source files in kebab-case. In an existing project, keep its naming convention.
- Do not run `git stash`, `git checkout -- .`, `git restore .`, `git reset --hard` or `git clean -fd`. Do not force push unless I approve that push. Do not bulk autofix files outside the task.
- Do not add gate scripts (`check-*.ts`, `run-gates.ts`) or git hooks to a project, and do not copy them from another project.
- When a project's own CLAUDE.md or AGENTS.md sets a different rule, the project rule wins.

## Tool scope: lint and type check read only source folders

### Reason
- On 2026-10-17, `oxlint --type-aware .` read a stale Next build folder and used 106 GB of memory. Windows does not stop a process that uses too much memory, so the PC froze.

### Rules
- A lint script names its source folders and root config files, such as `oxlint src scripts tests next.config.ts`. Do not run `oxlint .` or a bare `oxlint` in a project with build output.
- A tsconfig `include` lists the source folders, such as `src/**/*.ts`. Do not use `**/*.ts` or `**/*`, because that also reads build folders and nested worktrees in `.claude/worktrees/`.
- When you move build or test output to another folder, delete the old folders in the same change. Do not remove a build folder from `.gitignore` or a lint ignore while that folder can still be on disk.
- Do not add a background process or a watchdog to limit memory. Fix the scope of the tool.

## Google services: gog CLI

### Reason
- `gog` is installed on this machine and is already authorized, so you can read Google data yourself instead of asking me for it.

### Rules
- Use `gog` (gogcli) for Google services. If the shell does not find it, the binary is at `%LOCALAPPDATA%\Microsoft\WinGet\Links\gog.exe`.
- Account: `rsnoverwatch@gmail.com`. Pass `-a rsnoverwatch@gmail.com` or set `GOG_ACCOUNT`.
- Authorized services: `searchconsole`, `gmail`, `calendar` and `drive`. Run `gog auth list` to see the current list.
- Search Console covers sites, sitemaps, search analytics and URL inspection. Verified sites: `socialpro.es`, `gravityroom.app`, `rechedev.cloud`, `luisreche.dev`.
- `gog` has no Google Business Profile service, and `gog maps places` needs a Places API key that is not set. To see a Business Profile, use the built-in browser, which is signed in to this Google account.
- Add `--json` when you parse the output.
- To add a service, run `gog auth add rsnoverwatch@gmail.com --services searchconsole,gmail,calendar,drive,<new>` and keep the existing services in the list. Ask me before you add one.
- The OAuth client is in the Google Cloud project "GWS CLI" (`gws-cli-552441`), which is in testing mode. If a call fails with an expired or revoked token, run `gog auth add` again.

## Cloud environments (Claude Code on the web)

### Reason
- Cloud sessions keep working when this PC sleeps, but they do not read `~/.claude/` from this machine, so they need their own setup.

### Rules
- A cloud session needs a GitHub repo and a pushed branch. Push before you start one, and tell me when a task fits the cloud better than this PC (long runs, parallel tasks).
- The environments are edited only in the UI (desktop app environment picker or claude.ai/code). The CLI only picks the default with `/remote-env`.
- The environment setup script writes the portable part of this file to `~/.claude/CLAUDE.md` in the VM. When a rule in this file changes, tell me to update the setup script.
- Per-repo setup goes in `.claude/settings.json` as a `SessionStart` hook that exits early unless `CLAUDE_CODE_REMOTE` is `true`. Commit `.claude/` and `.mcp.json` so the cloud sees them.
- I use cloud sessions like Cursor cloud agents. When I say "mándalo a la nube", "cloud agent" or similar, start one cloud session per task with `start_session` (`target: "cloud"`, `repository: "owner/name"`), with a brief that ends in "open a PR". Then tell me which sessions you started.
- To check on cloud agents, read their branches and PRs on GitHub, because cloud sessions do not report back.
- Do not put secrets in environment variables. Use network secrets, which the proxy adds to requests.
- In the cloud, PostgreSQL 16, Redis 7 and Docker are installed but not started. Start them in the session, because the setup script cache does not keep running processes.
- In the cloud, `gh pr` and `gh issue` fail because the GitHub proxy blocks GraphQL. Use `gh api` (REST).

## Text

### Rules
- Do not use em dashes or en dashes in user-facing text.
