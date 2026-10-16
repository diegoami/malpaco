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
