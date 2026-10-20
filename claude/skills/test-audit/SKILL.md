---
name: test-audit
description: "Audit and clean up tests: find low-value, duplicated, or implementation-coupled tests (and the test-only production code they keep alive), fix or remove them, and verify the suite still passes. Use when the user runs /test-audit or asks to audit, prune, or clean up tests. Also apply its authoring gate whenever writing new tests."
argument-hint: "[path or package, optional]"
---

# Test Audit

Just do it end to end: scope → baseline → find → fix → verify → short report.
No approval stops, no plans, no ledger files. Do not commit or push unless asked;
the user reviews the diff.

## 1. Scope

- `$ARGUMENTS` given → that path/package.
- Otherwise → files changed on the current branch vs the default branch, plus
  their tests. If nothing changed, the whole repo's tests.

Read `CLAUDE.md`/`AGENTS.md`, and find the real test command (`package.json`
scripts, Makefile, CI workflows). Run the in-scope tests once as a baseline
(long runs in background). A test failing at baseline is a possible product
bug: note it, do not delete it.

## 2. Find

Read each in-scope test fully along with the production code it covers. For a
large scope, fan out read-only `Explore`/`general-purpose` agents by directory
in one message and have them return candidates only.

Flag tests that match these patterns:

- no real assertion (just calls/renders);
- asserts a value against itself, or an expected value computed by the code under test (incl. blindly regenerated snapshots);
- copied fixtures, export lists, manifests; greps of source text or imports;
- mocks that implement the behavior being asserted;
- private helper / call-shape tests already covered at a real boundary;
- the same contract tested twice, or each consumer re-testing a shared helper;
- negative tests that pass for an unrelated reason;
- test name promises something the assertions don't check;
- exists only to keep a test-only export, flag, or wrapper alive; production code whose only callers are tests.

**Keep** anything that guards a public API, config, protocol, storage,
migration, security, default value, user-facing text, observable ordering, or a
real past regression, even if it looks static or slow. Before removing a
test, confirm another test still covers what it protects; if unsure, keep it.

## 3. Fix

Apply directly, per candidate:

- **delete** it when stronger proof exists elsewhere;
- **consolidate** near-duplicates into one table-driven test;
- **repair** the assertion when the contract matters but the check is vacuous;
- remove test-only exports/wrappers and dead production code it unlocks.

Do not write replacement tests that restate the implementation.

## 4. Verify

Run the in-scope tests, then the repo's lint/typecheck/test gate. If something
you touched fails, fix or restore it. Never claim a check you did not run.

## 5. Report (short)

- what was removed/merged/fixed and why (one line per group, `path:line`);
- what looked suspicious but was kept, and why;
- commands run and results; test vs production lines (`git diff --numstat`);
- baseline failures that look like real bugs.

## Writing new tests (always)

Only add a test if you can say what behavior it protects, what regression makes
it fail, and why existing tests don't catch it — and it matches none of the
patterns above. A bug regression test must be seen failing without the fix.
