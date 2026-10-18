T36 review (Claude Sonnet High)
approve after named fixes

Where I worked: the review worktree at HEAD 18f46afde1518ff0780a8a7b71b65574a0fc796e, diffed against base 7a6680c (225 files: 208 added, 17 modified). Tracked source is clean after every omission and was restored from saved bytes.
- Units, all finished with no child left running: `mlp-t36-pr162-18f46af-wide`, `-npmtest`, `-new30`, `-old222`, `-package`, `-pkgbrowser`, `-omit`.
- Retained under `docs/prototypes/new-game/T36/evidence/review-*`, `evidence/sweep-Q2lWPw` and `review-scratch/`.
- Frozen acceptance hashes for the spec, the UI test, `sweep.mjs`, `corpus-selection.json` and `corpus-supplement.json` all match the tree.

I found no blocking finding. The two non-blocking guard and layout gaps below are the ones I would fix before merge, hence "after named fixes".

DW1: ran `node docs/prototypes/new-game/T36/sweep.mjs` via `run-unit.sh` and `run-command.py` (`evidence/review-wide-pr162-18f46af-9k3ocws8`) → exit 0 in 1692.9 s, 999/1000 successes, sole refusal seed 398, no invalid seeds, `targetMet` true, sources unchanged, separate 1994 succeeds. All 1000 records and the attempt counts, refusal-class counts, corpus and diagnostic are byte-equal to the committed `measured-report.json`. The only source-hash difference is `tests/e2e/geographic-board.spec.ts` (see R4).
DW2: ran `npx playwright test tests/e2e/geographic-board.spec.ts` through the pinned 2-CPU Docker job (`run-browser.py`) → 30/30 passed at 1280x800 and 1920x1080, exit 0. The same spec also passed 30/30 against the extracted package (`npm run package:playable`, `SHA256SUMS` verified, `playwright.release.config.ts`).
DW3: ran `npm test` → 6 harness plus 645 Vitest passed, exit 0. Ran `npm run build` → exit 0. Ran the 28 old browser specs (222 cases, excluding the geographic spec) → 222/222 passed, exit 0, sources unchanged during the run.

**Omissions caught and restored** (8 of 10 caught; the two that passed are R1 and R3 below; each restored to the exact saved hash):
- Reverting the default route in `src/main.ts` failed `root and unknown view retain…`.
- Removing sea-route paint failed `painted seaLanes…`.
- Swapping the target source for a second adjacency source failed `painted borders…`.
- Ignoring Shift-inspect failed `painted borders…`.
- Defaulting all four seats to human failed `root and unknown view retain…`.
- Dropping the refusal guidance text failed `real measured refusal 398`.
- Setting the count font to 9px failed `seed 1994 paints actual` (10.19 < 14).
- Dropping `initialState` in `src/core/match-save.ts` failed the Vitest replay-origin test.
- Disabling Enter/Space activation: the whole spec (15 tests) still passed. This is R1.
- Making the load gate in `src/ui/referenceMatchFiles.ts` permissive: the replay test still passed. This is R3.

**Findings**

R1 (non-blocking, proved): `src/ui/geographicMapView.ts:26-27`. Keyboard Enter/Space activation of countries is unguarded.
- With the handler disabled, the whole geographic spec passes.
- A direct probe confirms the mutation was real: unmutated, Enter on `province_8` places an army (92→93); mutated, Enter on all 46 countries changes nothing.
- Every `keyboard.press` in the spec runs while paused (spec lines 111, 137, 173), so none of them tests activation.
- It is outside the task's explicit Done-when (click neighbours), but it is a T70-era interaction on the new default view.

R2 (non-blocking, proved by measurement): `src/styles.css:1307-1327`. `#geographic-game` does not inherit the reference shell rules.
- It lacks the `@media (min-width:1600px) and (min-height:1000px)` 440px panel, the 3/4-seat compact panel rules and the `.steps` wrap rules.
- At 1920x1080 the panel is 350px versus 440px on `?view=reference-game`.
- At 1280x800 the default 4-seat panel is 606px versus 600px.
- I saw no clipping, overflow or off-screen button in either viewport (`review-scratch/layout-out`). This is the owner's appearance call.

R3 (non-blocking, proved): `src/ui/referenceMatchFiles.ts:41`. Rejecting a geographic v2 save on the explicit reference route is untested.
- With the gate permissive, the suite still passes.
- The shared error text, "load it in the generated game view", also points at a route that cannot load geographic saves.

R4 (non-blocking): the committed `corpus-selection.json` `sourceHashes` records an earlier draft of `tests/e2e/geographic-board.spec.ts`.
- The current spec hash differs; every other source hash matches.
- `production-adoption.json` documents the draft, and the selection and refusal rows are identical to my fresh sweep.

R5 (non-blocking): the first line of `tests/e2e/geographic-board.spec.ts`, `tests/ui/geographic-game.test.ts` and `docs/prototypes/new-game/T36/sweep.mjs` still says "UNEXECUTED". All three are now executed and passing.

R6 (non-blocking): `src/ui/geographicGame.ts:45-48` has three branches no UI input reaches.
- They are "no supported replay origin", "no reconstructed geography" and "Unsupported board identity".
- v1 saves are rejected earlier by `ReferenceMatchFiles`, and `supportedIdentity` admits only two identities.

R7 (non-blocking, informational): across 999 successes the maximum route bend count is 0.
- The "most route bends" corpus pick (seed 0) is therefore a tie-break, not bent-route coverage.
- All label gaps are at least 44 and the minimum country area is about 2126 CSS px². The refusal at seed 398 and its classes are kept in the corpus report and exercised by a browser test.

R8 (non-blocking): the screenshots the task asks to retain for owner judgment exist only inside the 23-part `final-parent-evidence` archive, not as loose files. I viewed the fresh captures; the 1994, 513 and 4-seat default views look sound.

I checked all the blocking criteria and found no bypass.
- The geographic default, direct geometry/owner/army paint, one adjacency source, seed/deal/replay identity and old-save preservation all hold.
- Timers and logs, the T24 success and attempt budgets, the honest corpus and recoverable refusal also hold.
- The CSS constants trace to `docs/prototypes/new-game/T65/map.svg`; there is no unseeded or wall-clock rule code and no copied assets. The extracted package passes.

Limitations: the owner's visual and pacing judgment is not covered by this review. I did not repeat the wide sweep or the old and new browser batches. I did not run the Windows preview or CI.

FILE: README.md
FILE: RUN-NOTES.md
FILE: docs/play.md
FILE: docs/spike.md
FILE: src/core/match-save.ts
FILE: src/main.ts
FILE: src/styles.css
FILE: src/ui/gameEventLog.ts
FILE: src/ui/geographicGame.ts
FILE: src/ui/geographicMapView.ts
FILE: src/ui/matchPresentation.ts
FILE: src/ui/referenceBattleGame.ts
FILE: src/ui/referenceMatchFiles.ts
FILE: tests/e2e/coast-postprocess.spec.ts
FILE: tests/e2e/direct-attack.spec.ts
FILE: tests/e2e/entry.spec.ts
FILE: tests/e2e/geographic-board.spec.ts
FILE: tests/e2e/map-readability.spec.ts
FILE: tests/e2e/reference-complete-game.spec.ts
FILE: tests/e2e/region-border-postprocess.spec.ts
FILE: tests/ui/geographic-game.test.ts
FILE: tools/release/PLAY.md
FILE: docs/prototypes/new-game/T36/sweep.mjs
FILE: docs/prototypes/new-game/T36/fixture-probe.mjs
FILE: docs/prototypes/new-game/T36/run-browser.py
FILE: docs/prototypes/new-game/T36/run-command.py
FILE: docs/prototypes/new-game/T36/source-state.py
FILE: docs/prototypes/new-game/T36/negative-proof.py
FILE: docs/prototypes/new-game/T36/controls.py
FILE: docs/prototypes/new-game/T36/verify-evidence.py
FILE: docs/prototypes/new-game/T36/archive-evidence.py
FILE: docs/prototypes/new-game/T36/README.md
FILE: docs/prototypes/new-game/T36/PREFLIGHT.md
FILE: docs/prototypes/new-game/T36/corpus-selection.json
FILE: docs/prototypes/new-game/T36/corpus-supplement.json
FILE: docs/prototypes/new-game/T36/measured-report.json
FILE: docs/prototypes/new-game/T36/production-adoption.json
FILE: docs/prototypes/new-game/T36/preflight-summary.json
FILE: docs/prototypes/new-game/T36/artifact-index.json
FILE: docs/prototypes/new-game/T36/candidate-file-reasons.json
EVIDENCE: docs/prototypes/new-game/T36/evidence/
EVIDENCE: docs/prototypes/new-game/T36/parent-preflight/

SCOPE: complete only for executable code, tests, docs and scripts. The inert evidence and archive groups were accounted for by prefix, not file by file.
- All 130 `evidence/` files and 55 `parent-preflight/` files are covered under the two EVIDENCE prefixes only.
- I compared the parent-preflight frozen-acceptance hashes with the tree and spot-read `wide-parent-check.json`.
- I did not independently verify the member-by-member archive receipts or the 23 `originals.tar.gz` parts; the parent does that.

Final pass done

approve after named fixes