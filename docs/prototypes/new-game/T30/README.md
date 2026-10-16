# T30 round origin and victory acceptance

Pinned design: archaeology commit ae298e37c2f5177039e55767607f9345b6cb0e7a, core-rules.md Seats, The turn and Victory, plus ui.md end-game flow. Round origin follows the seeded first seat and eliminated-seat skips. Victory checks run after a completed move/turn before next income, ordered conquest, last seat, optional domination, completed-round limit and human loss. Domination is35 of46; limit ties use countries, armies, then later seat in rotated turn order. No original assets/code enter this repository.

Parent acceptance preflight precedes production implementation. Main session owns the acceptance checks; native Sol High implements Hard T30 after actual negatives/disposable mock positives/restoration are retained. MiniMax M3 reviews independently. Existing presets/goldens remain protected; save integration belongs to T31 and computer scheduling/default setup to T32.


## Acceptance protocol

The new opt-in factory is `victoryRules(Pick<GameOptions,"dominationWin"|"roundLimit">)`.
Its state retains optional `roundOrigin`, `watchingComputers`, and `result` with reason
and standings; `winner` stays authoritative. Human loss is a `human-loss` phase;
ordinary `watchComputers` and `stopGame` actions resume once or freeze. Earlier presets
stay unchanged. Valid one-owner boards report conquest before the equivalent last-seat
fallback. Final standings sort countries, armies, then later rotated turn order.
The initial explicit all-human reference setup remains untilT32; per-seat controllers
allow the real human-loss example. The new browser contract explicitly requests
`control=manual`, an existing reference-development behavior; T32 will honor that
explicit mode while automatic default computers remain gated. Automatic play is not
claimed by this preflight. No original code/assets/evidence are imported.

40 core cases cover all2/3/4-seat origins, eliminated-middle/origin skips,35/34,
disabled/opponent domination, priority/timing, capture confirmation, final movement,
20/30/40-round limits, country/army/later-order ties, and human loss Watch/Stop,
all-computer/surviving-human exemptions, phase refusal, income/RNG/history safety.
Six browsers drive real1994 games: domination190 actions, human loss239 actions
per run (Watch resumes3 manually driven computer handoffs, plus a separate Stop),
and a complete20-round legal game, atbothdesktop sizes. Final country/army totals,
standings order, reason, controls, stale handlers, restart and fit are asserted.
No browser engine-state injection, snapshots updated or old assertions weakened.

Baseline `negative-unit-nth1_flf`:40 new fail/512 old pass; actual restored focused
negative is `restored-negative-core-_76qs3fh`. Original browser negatives after legal
play are `negative-browser-final-g99sf368` (6fail); seed1994 also visibly counts
Round2 before the initial rotated round finishes. The final manual-URL negative is
`restored-negative-browser-sacp9a1r` (6fail). Baseline/final restored builds pass. One initial test-only
Action cast compile error is retained in `baseline-build-pk0vri9m`, then corrected.

Disposable mock:40 core/552 full units and build pass; all6 browsers pass in
`preflight/mock-browser-labels-fixed-cp14tef5` and final manual-URL run
`preflight/mock-manual-final-horvavew`. `mock-compatibility-hcao9h31` passes36
new/battle/movement/legacy-reference cases, including unchanged541-action legacy
conquest and original goldens atbothsizes. The initial mock's nested select labels
were not selectable by their exact names; all failures/sources are retained and
only mock markup was fixed. Acceptance assertions stayed unchanged.

`preflight/mock-controls-kgt4_err` honestly retains the first surviving army-tie
mutation; original parent test bytes are pinned to909e71d. Main strengthened the
example so an earlier seat wins with more armies. Current final audit
`mock-controls-6wl2jagx` catches15/15 mutations from green40-case baselines before
and after: origin metadata/wrap,dead-seat skip,threshold/on-off/own-turn,full-round
boundary,country/army/rotated tie scoring,human loss,Watch prompt/handoff,Stop andRNG.
Every mutant input and raw output is archived; saved mock bytes restore in finally.

`preflight/mock-2d07o16g` keeps original/initial/final mock sources and creation tools.
Restoration proves all9 runtime paths byte-exact, including absence of
`src/core/__t30_mock.ts`. `protected-8ujew7o3` proves117 inherited source/test/data/
golden files unchanged against merged63cda03. This mock is feasibility evidence,
never production. The parent immutable index is `artifacts.preflight.v1.json`;
verify historical source indices at their acceptance checkpoint. Later evidence
needs a new immutable index. All raw whitespace/HTML/logs are losslessly archived.


## Production implementation and source controls

`victoryRules(options)` extends friendly movement, retaining the seeded first seat
as a fixed origin. Pure `completeTurn` / victory / handoff stages check ordered
results before income, with ordinary `watchComputers` and `stopGame` actions.
A paused human-loss result has no winner and resumes exactly once after Watch.
The default reference setup exposes controller/victory options; existing presets,
legacy reference UI, authored/generated routes and save v1 retain their behavior.
Development computer seats are explicitly manual until T32.

First production evidence: `implementation-core-ouekfutn` passes40 parent cases,
`implementation-units-uxoz4qe8` passes552 units and
`implementation-build-jciwll7c` passes TypeScript/build.
`implementation-browser-2wfu66ao` passes all6 pinned browser cases, including
190-action domination, full20-round legal play,239-action human elimination per
run,3 resumed manual computer handoffs, Stop/freeze/restart and stale controls.
All four parent acceptance files and inherited tests/goldens remain unchanged.

`check-mutations.py` runs actual-source deletion controls, with optional mutation
names to select a focused follow-up. `actual-mutations-4nmd7myh` catches20 core
and4 UI controls: origin metadata/wrap/skips, domination threshold/toggle/own-turn,
completed-round boundary, country/army/rotated scoring, no-human exemptions,
Watch prompt/result/handoff, Stop, choice phase, RNG, clone metadata, premature
capture completion, visible reason/standings order, frozen phase controls and
Watch wiring. It retains one honest survivor: deleting controller revisions
passed the selected timer-safety suite, which does not test stale user revisions.
Only the audit's suite selection was corrected, without production/test changes.
`actual-mutations-4syk9f1j` runs that deletion against the existing stale-revision
suite and catches it between green baselines. All25 classes are therefore covered.
Both reports prove exact seven-file restoration in finally and retain the original,
mutated and restored source bytes plus raw command outputs and creation tools.
The four UI controls also retain complete pinned browser reports in their own
fresh evidence directories. No inherited assertion or golden was weakened.


## Final verification and reproduction

`final-source-sy_66sn_` passes the complete140-case pinned source browser suite,
including unchanged generated/reference/slice goldens and541-action legacy
reference conquest per desktop. That run precedes one bounded, three-line result
badge/color correction: a round-limit winner can differ from the last mover.
`badge-negative-kh4fzfuk` reproduces the actual amber-vs-blue mismatch with a real
24-vs22 result, using the real Panel/h/s/palette and a small unit DOM recorder.
The fixed production path passes41 focused tests in `badge-positive-_9lw9bm0`.
The new test and every parent/inherited assertion remain unchanged thereafter.

On final production bytes, `final-units-yby3aonm` passes553 tests and
`final-build-phn9ahwi` passes TypeScript/build. `final-badge-focused-k5or_8f3`
passes18 pinned cases: all6 T30 flows, reference setup/goldens, legacy board/panel/
result-dialog goldens and finished-game copy/Continue/Escape/restart. Main approved
this bounded recheck after the isolated result-only correction rather than
repeating140. Every earlier result and raw output remains retained.

`release-81et_oif` builds a fresh official package at source commit
b464b0613a10cd1409b01ff85e5c686af92e5912, verifies every extracted SHA256SUMS entry,
and passes30 extracted browser cases: T30, friendly movement/feedback, generated
board and legacy reference. Inputs remain byte-stable throughout package/browser
runs. The exact package, build, extracted files and raw reports are losslessly
archived. `implementation-protected-v7yg_91i` proves77 inherited test/data/golden
files and all4 parent acceptance files byte-exact,42 runtime files equal to that
commit, the original stylesheet an exact prefix, mock absent, and Panel the sole
runtime difference from the first green implementation. The earlier pre-badge
protection report is retained alongside it.

Reproduce with `npx vitest run tests/core/victory-options.test.ts`,
`npx vitest run tests/ui/victory-panel.test.ts`, `npm test`, `npm run build`,
`python3 docs/prototypes/new-game/T30/run-browser.py <fresh-label>`,
`python3 docs/prototypes/new-game/T30/check-mutations.py`, and
`python3 docs/prototypes/new-game/T30/check-release.py`. Browser/release helpers use
the pinned Playwright1.63.0 image and fresh owned paths; run them sequentially
because each build owns dist. `check-protected.py` checks the current committed
runtime against protected inputs. `artifacts.implementation.v2.json` is the new
immutable current evidence index; verify with
`python3 docs/prototypes/new-game/T30/verify-evidence.py artifacts.implementation.v2.json`.
The historical parent index remains untouched and belongs to checkpoint a3b0d9.
Owner assessment of readability/pacing remains separate from automated validation.
