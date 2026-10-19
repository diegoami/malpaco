T91 review (Opus Medium)
rework
DW1: ran `node --test tests/tools/ci-*.test.mjs` → exit 0; 16 tests, 16 pass, 0 fail, 0 skipped (`.review-tmp/dw1.txt`). But the workflow guard misses the step-level bypasses in R1/R2, so the clause "each predicted bypass has a failing deletion/mutation control" is not fully met.
DW2: ran `npm test && npm run build` → exit 0; harness 9/9 pass, Vitest 60 files / 818 tests pass, both `tsc --noEmit` checks and `vite build` pass. My worktree is a full checkout, so this is not a sparse-input run (`.review-tmp/dw2.txt`).
DW3: ran `node tools/ci/verify.mjs` → exit 0. `passed: true`; head and `BUILD.json.sourceCommit` are both `ad6fe08cefb05127df95441a911a313d4e39b15c`; 384 identical case/project identities across source and release configs. Retained evidence: `docs/prototypes/ci/T91/runs/verify-praYa0`. Limits: `presentExcludedFiles: 7904` because my review worktree is not sparse, so physical omission is not proven here. Browser inventory was listed, not executed.

Worktree: the assigned review worktree, HEAD `ad6fe08cefb05127df95441a911a313d4e39b15c`. Diff is base `87512385274ad556b9a3227f5b8d12f2d0431cd4`..HEAD: 147 files, exactly equal to `inventory.json`.
Commands I ran:
- the three DW lines
- `git diff --check` over the PR, excluding raw TXT/run evidence → clean
- `sha256sum -c docs/prototypes/ci/T91/implementation-02/SHA256SUMS` → all OK
- frozen-spec hashes in `preflight/frozen-specs-01.json` → all three frozen tests match
- `workflow-original-01.yml` compared with the base `ci.yml` → byte-identical
- confirmed no changes under `src/`, `tests/{core,ui,e2e}`, `docs/tasks`, `package.json` or the Playwright configs
- greps for consumers of the prose allowlist and of excluded docs binaries → none found
- 8 bounded in-place mutations through `.review-tmp/mut.mjs`, each restored from saved bytes in a `finally` and checked after restore; `git status` afterwards showed only scratch/evidence files.

Mutation results (all run against the four CI guard test files):
- A: plan diffs `parents[1]` instead of the base parent → killed by the ci-plan prose test and the ci-cli NUL test
- B: `if: github.event_name == 'push'` added to the extracted-playable Playwright step → **survived**
- C: `--update-snapshots` added to the release Playwright command → **survived**
- D: `-g slice` added to the release Playwright command → **survived**
- E: `CLASSIFICATION_RESULT` replaced with the literal `success` → killed by "workflow: stable ci gate …"
- F: `if: false` added to the `npm test` step → **survived**
- G: the `sourceCommit` assertion deleted from verify.mjs → **survived**
- H: docs allowlist widened to `docs/**/*.md` → killed by the "protected: …" policy test

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
FILE: docs/prototypes/ci/T91/implementation-01/mutation-check.mjs
FILE: docs/prototypes/ci/T91/implementation-02/mutation-check.mjs
FILE: docs/prototypes/ci/T91/preflight/mock-policy.mjs
FILE: docs/prototypes/ci/T91/preflight/plan-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/verify-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/workflow-mock-01.yml
FILE: docs/prototypes/ci/T91/preflight/workflow-original-01.yml
FILE: docs/ci-development.md
FILE: RUN-NOTES.md
FILE: docs/prototypes/ci/T91/BOUNDARY.md
FILE: docs/prototypes/ci/T91/preflight/REPORT.md
FILE: docs/prototypes/ci/T91/implementation-02/SHA256SUMS
EVIDENCE: docs/prototypes/ci/T91/

**R1 (blocking): a step-level skip of required verification still turns `ci` green, and no test covers it.**
- Where: `.github/workflows/ci.yml:70-75`; the guard is `tests/tools/ci-workflow.test.mjs:12-21`.
- `gatePass` only sees job conclusions. If the `npm test` step or the extracted-playable Playwright step has a step-level `if:`, the step is skipped, the `verify` job still ends `success`, and `ci` passes with no unit/harness or browser coverage.
- The workflow test only checks that the run lines exist, not that they are unconditional. `verify.mjs:29-38` does not check this either (I read the code; I did not run DW3 under the mutation).
- Proof: mutations B and F survive all 16 DW1 tests.
- This is the "unexpected skip cannot green the gate" and "full unit/browser coverage" protection the task names.
- Fix: append a test asserting that the `npm test`, `node tools/ci/verify.mjs` and release Playwright steps carry no `if:`. Only the source-preview step and the uploads may have one.

**R2 (blocking, same root cause as R1): the browser-command guard is a denylist and misses coverage-weakening flags.**
- Where: `tests/tools/ci-workflow.test.mjs:17`, which forbids only `--grep|--project|--shard|--last-failed|--only-changed|tests/e2e`.
- `-g <pattern>` (short grep), `--update-snapshots`/`-u` (rewrites goldens instead of asserting them), `--ignore-snapshots`, `--retries=N` and `--max-failures` all pass.
- Proof: mutations C and D survive DW1.
- Fix: assert the routine command equals exactly `npx playwright test --config playwright.release.config.ts --workers=2`, and the source-preview command equals exactly `npx playwright test --workers=2`.

**R3 (not blocking, likelihood low): verify.mjs's provenance and sparse checks have no automated mutation control.**
- Where: `tools/ci/verify.mjs:56` (blob check) and `:96` (`sourceCommit` assertion).
- Deleting the `sourceCommit` assertion survives DW1 (mutation G). The blob check only has one retained historical negative (`implementation-02/byte-drift-negative.txt`), not a repeatable control.
- DW1 lists classification, uncertainty, gate and workflow cases, not verifier internals, so I rate this as a follow-up: factor the checks into testable functions with negative tests.

**R4 (not blocking, unverified): possible Git ownership failure in the container.**
- Where: `tools/ci/verify.mjs:27,43,45,126`.
- These git calls omit `-c safe.directory=…`, unlike `:40` and `tools/release/package-playable.mjs`.
- If the Playwright container's Git refuses the checkout as dubious ownership, verify fails. That fails closed, so it is not a bypass; the final ordinary CI run will show whether it happens.

**R5 (not blocking, note): the `ci-verification` artifact keeps the default retention (`ci.yml:93-99`).**
- This is documented as deliberate in `docs/ci-development.md:112-115`. Screenshots and failure reports are bounded at 14 days, and the playable archive keeps the default retention as a durable artifact.

**Checked and sound:**
- **Classification:** `plan.mjs` binds HEAD to the event SHA and both merge parents to the event base/head. It reads the base→merge diff NUL-delimited with `--no-ext-diff --no-renames`, and type changes or unknown statuses go to full.
- **Event handling:** every non-PR event selects full. Nothing in `src/`, the tests, the tools or the configs reads `README.md`, `RUN-NOTES.md`, `docs/tasks` or `docs/plans` Markdown.
- **Gate failures:** the gate always runs and reads actual `needs.*.result`. A failed or cancelled plan, a missing or empty mode, and a cancelled or skipped verify in full mode all fail the gate, and an empty mode also makes verify run.
- **Concurrency:** only runs of the same PR are cancelled; push and manual runs get a unique run_id group.
- **Checkout:** there is no checkout `filter` input. Sparse exclusions are limited to binaries and archives under `docs/`. Tests and source import only docs JSON/MJS/HTML, and the goldens live under `tests/`.
- **Package:** acceptance always rebuilds through `package:playable` (`npm run build`, including both type checks), so there is no stale-dist path.
- **Browsers:** the source and release inventories are identical, and no e2e test skips depending on the server. Release mode is an explicit `workflow_dispatch` `full_release`.
- **Untouched files:** game code, existing test assertions, task contracts and the frozen tests are unchanged.
- **Docs:** they cover operations, rollout/rollback, measured versus estimated savings, retention and billing. The Goal2 guidance keeps its manual-only `python3 tools/check_premerge.py --expected-head "$GITHUB_SHA"` design.

Final pass done
rework