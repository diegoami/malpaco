I've finished the checks and am writing up the review.

T78 review (Opus Medium)
rework
DW1: ran `npx vitest run tests/ui/workspace-state.test.ts` → exit 0. 1 test file passed; 19 of 19 tests passed (17 frozen tests plus 2 the implementer appended).
DW2: ran `npm test && npm run build` → EXIT=0. The harness passed 9 of 9. Vitest passed 61 of 61 files and 837 of 837 tests. Both `tsc` checks passed, and `vite build` printed "✓ built in 361ms".

Where I worked: worktree root. `git rev-parse HEAD` returned e010d533bc138a38a62ab7de698c139e3d94778c. I diffed against the exact base 25a41da6028478401ad8d823555b42f810e02735: 51 files, +7640/−0, the same list as inventory.json. `git status` shows only the inherited untracked `.cache/`.

Commands and checks I ran:
- **Whitespace:** `git diff --check <base> HEAD -- . ':(exclude)*.txt'` → clean.
- **Frozen test prefix:** the current test file starts with the exact bytes of `19f2565c:tests/ui/workspace-state.test.ts` → True. Its sha256 is e868afd9…, matching frozen-tests-01.json.
- **Evidence receipts:** for all 13 receipts under `implementation/`, the recorded `output_sha256` matches the retained TXT. Native exits are red 1/1, green 0/0, all 8 negatives 1, done-when-full 0. The green, restored-green and done-when-full receipts record source sha 01e4f882…, which matches the current `src/ui/workspaceState.ts`.
- **Live-game no-op:** a grep of `src` and `tests` for `workspaceState` finds no importer other than the test file. The only file changed under `src/` is the new `src/ui/workspaceState.ts`. No controller, core, generator, save, input or CSS file changed. BOUNDARY.md and the task file were not changed after the base.
- **RUN-NOTES.md:** the diff only adds lines (+14/−0).
- **Mutations:** I ran 7 bounded production mutations with `/tmp/opencode/mlp-review-91EfBq/mut.py`. It saved the source bytes and wrote them back in `finally`; restoring was confirmed True and the worktree is clean afterwards. Results:
  - drop-confirmed-term **survived** (19/19 pass)
  - drop-null-check killed
  - focus-not-kept killed
  - same-match reset killed
  - offered-set indices alias killed
  - speed constant killed
  - hand alias killed
- I did not rerun the historical preflight runners. I read them as code only.

Findings

R1: blocking (Blocking means item 4, and the protected "confirmation" property). At `src/ui/workspaceState.ts:70-71`, nothing tests that `reconcileWorkspace` needs an earlier confirmation before it reports one.
- **Reproduction:** change line 71 to drop the `&& state.attack.confirmed` term, so it reads `&& state.attack.from === context.from && state.attack.to === context.to;`. All 19 tests in `tests/ui/workspace-state.test.ts` still pass.
- **Effect of that mutation:** an unconfirmed staged pair that stays the same within one match comes back with `confirmed: true`. The UI would invent an attack confirmation the player never gave.
- **Why no test catches it:** every confirmation test either starts from `customized()` with `confirmed: true` or changes the pair or the match. The six replay fixtures reconcile with pairs that are not complete, so they never reach this case.
- **Coverage gaps:** the implementer's 8-mutation set (`run-mutations.py`) does not cover this either. Main's preflight `negative-confirmation` used `true ||`, which the invalidation tests already catch.
- **Likelihood:** the current code is correct. Without this check, a T82 refactor that breaks it would go unnoticed.
- **Fix:** append a test, for example `reconcileWorkspace({...customized(),attack:{from:'province_1',to:'province_2',confirmed:false}},context()).attack.confirmed === false`. Then keep a red/negative receipt for this mutation under `implementation/`.

R2: not blocking, follow-up for main's boundary; unverified, from reading the code. At `src/ui/workspaceState.ts:52-66`, `updateWorkspaceState(s,{matchGeneration:n})` adopts a new generation but keeps the old match's drafts and confirmation. A later `reconcileWorkspace` for generation n then sees the same match and keeps them. The frozen `Partial<WorkspaceState>` API already lets a caller write `attack.confirmed` directly, so this is no wider than what main's API design already allows. T82 should decide whether `matchGeneration` and `attack` belong in patches at all.

R3: not blocking; unverified, from reading the code. At `src/ui/workspaceState.ts:53-55`, a patch with an explicit `undefined` value, such as `{camera: undefined}`, is accepted by `Partial` without `exactOptionalPropertyTypes`. The spread then makes `next.camera` undefined and the function throws a TypeError. No code calls it today.

SCOPE: complete
FILE: src/ui/workspaceState.ts
FILE: tests/ui/workspace-state.test.ts
FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T78/implementation/run-check.py
FILE: docs/prototypes/new-game/T78/implementation/run-mutations.py
FILE: docs/prototypes/new-game/T78/implementation/audit-preservation.py
FILE: docs/prototypes/new-game/T78/preflight/run-preflight.py
FILE: docs/prototypes/new-game/T78/preflight/run-regression-preflight.py
FILE: docs/prototypes/new-game/T78/implementation/REPORT.md
FILE: docs/prototypes/new-game/T78/preflight/REPORT.md
FILE: docs/prototypes/new-game/T78/preflight/frozen-tests-01.json
FILE: docs/prototypes/new-game/T78/implementation/mutation-results-01.json
FILE: docs/prototypes/new-game/T78/preflight/mock-boundary.txt
EVIDENCE: docs/prototypes/new-game/T78/implementation/ (I checked the hashes and native exits of the red/green/restored/negative/done-when TXT and JSON receipts and preservation-01.json)
EVIDENCE: docs/prototypes/new-game/T78/preflight/ (main-authored raw outputs and results JSON. I audited them as a group against the REPORT and did not rerun them)

The fixtures are real: all six come from replaying versioned T40 fixtures through `deserializeVersionedMatch`, and friendly movement goes through the real `startFriendlyMove`. Opponent hands and the draw pile are wrapped in read traps. The projection reads only `battle.view` values, `playbackPaused`, `gameGeneration` and the public `CardControllerView` fields. Every one of those fields is a plain value or is copied. Nothing in the source uses the wall clock or random numbers, and nothing depends on iteration order.

Final pass done
rework