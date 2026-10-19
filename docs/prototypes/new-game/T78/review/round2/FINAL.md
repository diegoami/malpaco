T78 review (Sonnet Medium)
approve
DW1: ran `npx vitest run tests/ui/workspace-state.test.ts` → exit 0; 1 file, 20 of 20 tests passed.
DW2: ran `npm test && npm run build` → exit 0; the harness passed 9 of 9. Vitest passed 61 of 61 files and 838 of 838 tests. Both `tsc` checks passed, and `vite build` printed "✓ built in 398ms".

Where I worked: the review worktree, HEAD 7528b9446026210d34dd3aaab6d8abe64db3daa9.
- **Diff:** I diffed against the exact base 25a41da6028478401ad8d823555b42f810e02735: 68 files, +8605/−0. Of the pre-existing files, only `RUN-NOTES.md` changes, and it is append-only.
- **Source scope:** the only changed file under `src/` is the new `src/ui/workspaceState.ts`, so the live game is untouched. I did not grep for importers of the module.
- **Production source:** its sha256 is 01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34, identical to the value the first review gave.
- **Whitespace:** `git diff --check <base> HEAD -- . ':(exclude)*.txt'` is clean.
- **R1 mutation:** in scratch I removed only `&& state.attack.confirmed` at `src/ui/workspaceState.ts:71`.
  - The focused file exited 1, with exactly one failure: `T78 confirmation prerequisite > keeps an unchanged complete staged pair unconfirmed` (`tests/ui/workspace-state.test.ts:142-145`). It received `confirmed: true` where `false` was expected.
  - I restored the source in a `finally`. The sha256 afterwards matches the value above, and `git status` shows only the untracked `.cache/`.
- **Rework scripts:** I read `run-control.py` and `audit-rework.py` as code and did not rerun any historical runner. They save the source, restore it in a `finally`, refuse to overwrite existing receipts, and check that only allowed paths changed. `mutation-restoration-01.json` agrees with my result: 1 failed, 19 passed, source restored byte-exact.
- **Corrections:**
  - The only test change is one appended test (R1). It follows the original 19-test bytes, and its confirmed-pair mutation is now killed.
  - The implementer's REPORT and RUN-NOTES entries match what I measured: 20 focused tests, 838 unit tests plus 9 harness tests, and the build.
  - No API or runtime change was made, which fits the instruction not to invent a feature or change the frozen API.
- **Boundary checks:**
  - The module has no wall clock, random numbers or order-dependent iteration.
  - Updates and reconciliation return detached copies.
  - The projection reads only the published scalars and the public `CardControllerView` fields. It never touches opponent hands or the draw pile; the private-read trap test covers this.
  - The six fixtures come from real versioned T40 replays and pass through `startFriendlyMove`.
  - The staged confirmation stays inert data, with nothing mounted until T82.

Findings
- **R1 (from round 1, now resolved):** the missing test for an unchanged, unconfirmed complete pair is closed by `tests/ui/workspace-state.test.ts:142-145`. I reproduced that it fails under the mutation and passes on the real source.
- **R2, R3 (carried forward, not blocking, unverified):** `updateWorkspaceState` accepts a `matchGeneration` or `attack` patch, and an explicit-`undefined` patch would throw (`src/ui/workspaceState.ts:52-66`). Main has said it will carry patch ownership to T82, and `exactOptionalPropertyTypes` rules out the explicit-`undefined` case for typed callers. Neither is a regression, and neither lets anything past what the task protects.
- No new findings.

SCOPE: complete
FILE: src/ui/workspaceState.ts
FILE: tests/ui/workspace-state.test.ts
FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T78/implementation/run-check.py
FILE: docs/prototypes/new-game/T78/implementation/run-mutations.py
FILE: docs/prototypes/new-game/T78/implementation/audit-preservation.py
FILE: docs/prototypes/new-game/T78/implementation/rework-r1-20261019/run-control.py
FILE: docs/prototypes/new-game/T78/implementation/rework-r1-20261019/audit-rework.py
FILE: docs/prototypes/new-game/T78/preflight/run-preflight.py
FILE: docs/prototypes/new-game/T78/preflight/run-regression-preflight.py
EVIDENCE: docs/prototypes/new-game/T78/implementation/
EVIDENCE: docs/prototypes/new-game/T78/preflight/
EVIDENCE: docs/prototypes/new-game/T78/review/
The evidence groups were audited as groups. I read the rework REPORT, the mutation receipt and the RUN-NOTES entries. I did not recompute the hashes of the generated TXT/JSON receipts, the `review/round1` archive or the preflight outputs. The preflight and implementation Python runners were read, not rerun.

Final pass done
approve