T91 review (Sonnet Medium)
approve
DW1: ran `node --test tests/tools/ci-*.test.mjs` → exit 0; 18 tests, 18 pass, 0 fail, 0 skipped.
DW2: ran `npm test && npm run build` → exit 0; harness 9/9, Vitest 61 files / 838 tests pass, both type checks and `vite build` pass. My worktree is a full checkout, so this is not a run from the sparse input set.
DW3: ran `node tools/ci/verify.mjs` → exit 0; `passed: true`; `package.sourceCommit` is b67a1bc242f72310ee9c7ca18c88b2f6009b465f (the HEAD SHA). The browser inventory is 384 cases across 2 projects, source and release equal. Evidence is in `docs/prototypes/ci/T91/runs/verify-oc1N7c`. Limits: the inventory was listed, not executed, and the full browser suite was not run locally, as the brief says. Physical omission by sparse checkout is not proven in a full checkout.

Worked in the assigned review worktree at HEAD b67a1bc242f72310ee9c7ca18c88b2f6009b465f. The diff base is e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d.

Commands I ran:
- The three DW commands.
- `git diff ad6fe08c..HEAD -- .github tools tests/tools`. It shows the only change since the first review's head is the new `tests/tools/ci-review-regressions.test.mjs` (+22 lines), so the workflow and tools are unchanged. `reviewed-input-audit.json` also reports all nine reviewed inputs as unchanged.
- `git diff --check` over the new test, `RUN-NOTES.md`, `docs/ci-development.md` and the correction `REPORT.md` → clean.
- An in-place mutation script (`/tmp/opencode/mut.mjs`) with 11 mutations of `.github/workflows/ci.yml`. It ran the workflow and regression tests against each mutation. It restored the saved bytes in a `finally`, and `cmp` against the backup confirmed the file matches.

Mutation results (a mutation is "killed" when at least one test fails):
- **Step-skip mutations:**
  - `if:` on the `npm test` step → killed by "review R1".
  - `if: false` on the `node tools/ci/verify.mjs` step → killed by "review R1".
  - `if:` on the extracted-playable Playwright step → killed by "review R1".
- **Browser-flag mutations:**
  - `-g slice` → killed by "review R1" and "review R2".
  - `--update-snapshots` → killed by "review R1" and "review R2".
  - `--retries=3` → killed by "review R1" and "review R2".
  - `--max-failures=1` → killed by "review R1" and "review R2".
  - `--ignore-snapshots` → killed by "review R1" and "review R2".
  - `|| true` appended to the Playwright command → killed by "review R1" and "review R2".
- **Extra controls:**
  - Step-level `continue-on-error` on `npm test` → killed by "review R1" and the existing "stable ci gate" test.
  - Job-level `continue-on-error` on `verify` → killed by the existing "stable ci gate" test.

SCOPE: complete
FILE: .github/workflows/ci.yml
FILE: tools/ci/policy.mjs
FILE: tools/ci/plan.mjs
FILE: tools/ci/gate.mjs
FILE: tools/ci/verify.mjs
FILE: tests/tools/ci-cli.test.mjs
FILE: tests/tools/ci-plan.test.mjs
FILE: tests/tools/ci-policy.test.mjs
FILE: tests/tools/ci-workflow.test.mjs
FILE: tests/tools/ci-review-regressions.test.mjs
FILE: docs/prototypes/ci/T91/implementation-01/mutation-check.mjs
FILE: docs/prototypes/ci/T91/implementation-02/mutation-check.mjs
FILE: docs/prototypes/ci/T91/preflight/mock-policy.mjs
FILE: docs/prototypes/ci/T91/preflight/plan-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/verify-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/workflow-mock-01.yml
FILE: docs/prototypes/ci/T91/preflight/workflow-original-01.yml
FILE: docs/ci-development.md
FILE: RUN-NOTES.md
EVIDENCE: docs/prototypes/ci/T91/

Scope notes: the first review covered every file above except the new test, and the workflow, tools and tests it inspected are byte-identical now. Besides the new test, the files that changed since the first review are the correction evidence under `docs/prototypes/ci/T91/correction-local-20261019/` and `RUN-NOTES.md`. The rest are T78 changes that came in with the main merge: `src/ui/workspaceState.ts`, `tests/ui/workspace-state.test.ts`, `docs/prototypes/new-game/T78/**`. They are not part of this task. The main merge also touches `docs/tasks/T91.md`, which main owns. I did not read these files line by line.

**Findings**

No blocking findings. The first review's R1 and R2 are fixed. `ci-review-regressions.test.mjs` requires `npm test`, `node tools/ci/verify.mjs` and the release Playwright command to each appear exactly once, with no `if:` and no `continue-on-error`. It also requires the two Playwright commands to equal the exact strings, which kills all six flag mutations. All eleven mutations are killed.

- **R1 (not blocking, unchanged from the first review's R3):** `tools/ci/verify.mjs`'s provenance (`sourceCommit`) and sparse-blob checks have no repeatable negative control. I did not re-test this.
- **R2 (not blocking, unverified, first review's R4):** the Git calls in `verify.mjs` at lines 27, 43, 45 and 126 omit `safe.directory`. If the container's Git refuses the checkout, verify fails closed, so this is not a bypass. The final ordinary CI run will show whether it happens.
- **R3 (not blocking, first review's R5):** the `ci-verification` artifact keeps default retention. `docs/ci-development.md` documents this as deliberate.

The step-skip assertion guards the verify job's required steps. The `plan` job's guard-test and classify steps are not covered by that assertion. That is outside the first review's R1 and R2. Skipping the classify step leaves `mode` empty and the gate fails closed. I did not mutate the guard-test step.

Final pass done
approve