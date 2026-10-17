# Direct and repeat attacks — issue138

An owned source followed by a legal enemy now performs one ordinary exchange. Activate that enemy again to repeat without reselection. Mouse, Enter/Space and touch agree; held-key repeat events are ignored in the modern host. Shift-click, Shift-Enter and Shift-Space select only, retaining separate Single exchange and Fight on controls. Invalid target/one-army input shows the engine reason. Stop, human/computer/phase gates and explicit capture transfer remain.

MapHandlers carries optional activation metadata; old consumers ignore it, preserving legacy routes. ReferenceBattleGame uses the existing guarded controller select and singleExchange; BattleController and core are unchanged. Battle guidance describes the gesture; pending captures have a short dedicated instruction so computer status and capture controls fit. Gameplay docs describe the same supported input.

Measured evidence:
- `evidence/run-cez_23to`:initial18cases on old runtime,14fail and4existing Stop/computer regressions pass. Mouse/touch/capture/refusal failures reproduce missing requested behavior. Initial keyboard test lost target focus when checking a real Save button; that baseline failure alone does not prove keyboard attack behavior.
- `evidence/run-x5foxpvi`:initial production16/18passes; keyboard focus fault remains. Retain all failures and exact source/raw archives.
- `evidence/keyboard-baseline-*` plus `run-f9u_imos`:corrected explicit targetfocus and unchanged assertions fail against all four exact prechange runtime files; all four current files restore byte-exact in finally. Thus keyboard negative is actual missing exchange, not the old test-focus fault.
- `evidence/run-l9pconl_`:77/78compatibility passes, including all18direct cases. New generic instruction on a loaded computer capture makes the old1280fit assertion fail. Pending-specific concise text fixes it; the subsequent targeted two-size run passes without changing the guard.
- `evidence/controls-wxdcte_6`:6actual-source classes fail and restore exactly: direct activation, repeat context, Shift-only selection, held-key suppression, refusal feedback and capture auto-confirm. The first auto-confirm failure was an implicit missing-amount locator timeout; retained honestly.
- `evidence/controls-bww1dzpr`:after adding an immediate exact-state/history check after repeated map activations, auto-confirm now fails by a direct logical-state assertion at both sizes; exact restoration. No expected state/assertion was weakened.
- `evidence/run-i6fxc6q3`:final78/78affected pinned cases on stable recorded runtime/test bytes. Includes both sizes, exact replay state/RNG/history through real downloads, mouse/keyboard/touch repeat, explicit min/intermediate/max capture and save/reload/upload, invalid/stale/automation gates, existing battle/friendly/versioned/victory/entry/readability acceptance. No golden updates.
- `evidence/checks-f1nrgd_3`:583units, TypeScript/build and whitespace pass. A final keyboard-only run additionally exercises Shift-Space; this only strengthens the new acceptance file, with no later runtime or inherited-test change.

The six existing test files change only input recipes: Shift selection before an independently tested control, or the new direct attack instead of a second side-button click in victory's ordinary-action driver. `originals/` retains exact prechange versions; assertions, fixtures, expected states, timing bounds and every golden stay unchanged. The new direct-input file was corrected for real Save-button focus, strengthened for immediate capture-state proof and Shift-Space; original failed versions remain in source archives.

Each browser run stores source/raw archives, member hashes, commands and exits. Every affected suite now writes captures into its own fresh raw archive. Earlier loose compatibility/targeted screenshots are preserved together in `evidence/compatibility-extra-captures-*`; their individual-run attribution is intentionally not claimed. No original is deleted or overwritten. `index.py` indexes nonraw deliverables/evidence; raw directories stay local and ignored. `inheritance.py` independently audits baseline cb6b4a0, allowing only four runtime UI files and the six declared test recipes.

Reproduce:
```sh
python3 docs/prototypes/new-game/attack138/run.py
ATTACK_COMPATIBILITY=1 python3 docs/prototypes/new-game/attack138/run.py
python3 docs/prototypes/new-game/attack138/checks.py
python3 docs/prototypes/new-game/attack138/inheritance.py
```
Use the established pinned Playwright1.63 Docker image and read-only shared dependencies; never update goldens. `controls.py [case-name]` retains actual-source negative runs and restores saved bytes in finally. No new legacy capture mode, rule/RNG/save change, model run or CI dispatch occurs in these scripts. Owner has required coastline111/shared-border117 before another presentation; T33 appearance/pacing remains unapproved.

Final inspection discarded the optional idle caption “Choose your attack” and restored the existing phase-neutral “Ready for your choice”, avoiding misleading language after pending-save upload. `evidence/run-tu_poer2` passes4focused real capture/computer-pending cases after that one-string reversion. `run-5ptt6osn` passes2keyboard cases with the added Shift-Space check. The78case run predates only this copy reversion and the added Shift-Space assertion; the reviewer reruns all current cases. Main inspected mouse-repeat and pending-capture1280screens. Current final head still has no golden/core/controller/fixture changes.
