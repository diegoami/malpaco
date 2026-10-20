T91 review (Sonnet Medium ownership correction)
approve

SCOPE: complete

FILE: .github/workflows/ci.yml
FILE: tools/ci/git.mjs
FILE: tools/ci/verify.mjs
FILE: tools/ci/gate.mjs
FILE: tools/ci/plan.mjs
FILE: tools/ci/policy.mjs
FILE: tests/tools/ci-git.test.mjs
FILE: tests/tools/ci-cli.test.mjs
FILE: tests/tools/ci-plan.test.mjs
FILE: tests/tools/ci-policy.test.mjs
FILE: tests/tools/ci-review-regressions.test.mjs
FILE: tests/tools/ci-workflow.test.mjs
FILE: docs/prototypes/ci/T91/implementation-01/mutation-check.mjs
FILE: docs/prototypes/ci/T91/implementation-02/mutation-check.mjs
FILE: docs/prototypes/ci/T91/implementation-02/SHA256SUMS
FILE: docs/prototypes/ci/T91/preflight/mock-policy.mjs
FILE: docs/prototypes/ci/T91/preflight/plan-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/verify-mock-source-01.mjs
FILE: docs/prototypes/ci/T91/preflight/workflow-mock-01.yml
FILE: docs/prototypes/ci/T91/preflight/workflow-original-01.yml
FILE: docs/ci-development.md
FILE: RUN-NOTES.md
EVIDENCE: docs/prototypes/ci/T91/

I read all the executable, script and YAML files above in full. I did not read `ci-plan.test.mjs`, `ci-policy.test.mjs` or `RUN-NOTES.md` line by line, because they are unchanged since the earlier approved rounds, but all of their tests ran. I did not open each generated evidence file. For the evidence tree I checked only the `implementation-02/SHA256SUMS` hashes: 135 of 135 OK. I did not rerun any historical runner. I read the first diff pass at the file level, not hunk by hunk.

Where I worked: the review worktree at HEAD 5c5bfb68644e1e1123146d881a75b6d9388be9ad, with a clean tree at start. The base is e8e3f908, and the inventory lists 248 changed files. My launcher gave a full checkout, so I make no claim of physical sparse omission. The verifier ran with 7908 present files that the sparse rules would exclude, and it reported them as such.

DW1: ran `node --test tests/tools/ci-*.test.mjs` → 20 pass, 0 fail, 0 cancelled, 0 skipped.
DW2: ran `npm test && npm run build` → harness tests passed. Vitest passed 61 files and 838 tests. The build exited 0 (tsc and vite).
DW3: ran `node tools/ci/verify.mjs` → exit 0, `passed: true`.
- The verifier's browser inventory listed 384 cases across the 1280x800 and 1920x1080 projects, and the source and release inventories were equal.
- Package `sourceCommit` equals HEAD 5c5bfb68.
- The 135-of-135 hash check above is the separate `SHA256SUMS` audit.
- That run only lists the browser inventory. No browser suite ran locally, as the brief permits. The single final-head CI must run the complete packaged suite.

**Ownership controls.** I mutated each one in place, ran `node --test tests/tools/ci-git.test.mjs`, and restored the exact saved bytes afterwards. The final `diff` against the saved copies matched and the worktree was clean.
- **Absent scoped trust** (drop the `-c safe.directory` argument): both tests fail.
- **Wildcard trust** (`safe.directory=*`): the unrelated-checkout test fails, because it expects exit 128 and gets success.
- **Read-helper bypass** (verifier `run()` calls plain `spawnSync` for git): the actual-verifier test fails.
- **Final status-helper bypass** (the status capture in `finally` uses plain `spawnSync`): the actual-verifier test fails.
- **Original verifier** (`verify.mjs` from e327eabf swapped in): the actual-verifier test fails.
- **Real-Git rejection:** the tests force a mismatch with `GIT_TEST_ASSUME_DIFFERENT_OWNER`. Unscoped `git ls-files` exits 128 with "dubious ownership", and the scoped call from `scopedGit` succeeds. A scoped call aimed at the unrelated checkout (`-C other`) is still rejected with exit 128.
- **Receipt accuracy:** the receipt records the actual argv, `['git','-c','safe.directory=<root>',...]`, for git commands and the plain argv otherwise.
- **Other Git callers:** `plan.mjs` runs on the host runner, not in the container, so ownership does not apply. `package-playable.mjs` already scopes `safe.directory`. The expected failure in the integration fixture (`package-acceptance`, after every Git read succeeds) matches the brief.

**Other checks.**
- The workflow is unchanged by this round, and its guard tests pass.
- The gate (`ci`) uses `if: always()` and consumes the actual plan result, mode and verify result.
- Cancelled or unexpectedly skipped verification does not green the gate (`ci-cli` cases).
- The checkout steps carry no `filter` input.
- `git diff --check` over the new executable files, tests, workflow and docs is clean.
- The `docs/ci-development.md` paragraph on scoped Git matches the code. It states that global Git config is untouched and unrelated checkouts are not trusted.
- Every changed path falls under the task's Owns list or the T91 evidence directory.

R1 (non-blocking, follow-up): `tools/release/package-playable.mjs:38` and `tools/ci/git.mjs` hand-roll the same `safe.directory` pattern separately. A shared helper would remove the duplication, but it is outside this task's Owns list.

R2 (non-blocking, carried from earlier rounds): repeatable provenance negative controls are still not automated. The 5 ownership controls above were my own manual mutations, not committed tests. Artifact retention for the default uploads is documented, as the brief states.

No blocking findings.

Final pass done

approve