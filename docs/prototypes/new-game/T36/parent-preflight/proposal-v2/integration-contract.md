# T36 integration contract — unexecuted draft v2

Preparation only. No production exports, DOM structures, measured corpus or successful checks are claimed. `historical-v1/` preserves the previous proposal. Resolve these explicit API seams in a disposable positive implementation before freeze; then run the task's negative-before/positive-after preflight.

## Routes and setup

Missing/unknown `view` opens the new geographic setup, then Start game mounts play. `/?seed=N&control=manual` opens manual setup; use existing `Seats` and `Seat N control` inputs to choose two humans. Ordinary setup remains four seats, one human plus three Normal computers. Keep `?view=reference-game` pinned, and `?view=generated-game` on its existing legacy generated path with existing supported saves. Do not repurpose that route for geographic/1 or invent Players/Total seats controls for the new shell.

The new setup reuses the existing reference setup controls/validation semantics, including numeric seed min/max and native invalid-input reporting. No new appearance decision is required by these drafts. The owner judges actual screenshots after a real build.

## Existing APIs and proposed host boundary

T35's `createGeographicGame(options, undefined, {attempts:50})` returns `{ok,state,geography,attempts,failures,rng}` or `{ok:false,errors,attempts,failures,rng}`. Its default rules are already `victoryRules(options)`. No rule API named `reinforcementRemaining` exists: placement uses `state.reinforcementPool` and explicit `endReinforcement`. Core `neighbours` takes a province; acceptance uses `attackTargets(state,id)` directly. Direct enemy activation performs one exchange; Shift activation only selects. Existing battle IDs are `battle-source-name`, `battle-target-name`, `single-exchange-button`, `start-combat-button`.

Introduce an identity-aware host context containing renderer factory, initial replay state/factory, options, identity and accepted state. Use it together for map mounting, files and event history, including successful loads. Do not infer identity from canonical province IDs. Geographic renders the accepted `state.map` using `geography.unitsPerPixel`; reference keeps its fixed drawing; supported generated v1 stays on its original generator/layout. Bad loads fail atomically, leaving URL, state, queued work and controls usable. Preserve the existing reference route's deliberate rejection of legacy generated files where pinned tests require it. Default-shell fixed-reference v2 loads select the reference renderer and retain reference identity on resave.

Proposed file `src/ui/geographicGame.ts` exports `createGeographicSetupController({create,report,mount})`; `start(options)` calls create once, reports the entire refused typed result without mounting, or calls mount(options,acceptedResult) once. The production DOM form must use that controller for submit/retry. No URL/environment flag, global test state or generator relaxation. This export does not currently exist. UI-unit injection alone cannot prove DOM wiring; the disposable positive preflight must inspect/verify mounted submit and error rendering use this same path. Do not freeze an unused helper that merely passes the unit test.

## Geography renderer contract to prove

New renderer root `#geographic-map`. Reuse reference-style `.country[data-country][data-id][data-province]`, `.cell` path, `.count` army text, `.badge` ownership shape, `.name` accessible hover/focus name, `.coast` island path, `.lane[data-edge]` polyline. Country attrs `data-owner`, `data-armies`, `data-target`, `data-selected`, `aria-pressed` come from active state. These are proposed observable UI semantics, not existing geographic renderer claims.

`.cell` path lists the original polygon vertices divided by unitsPerPixel, without alternate layout. `.coast` preserves the sidecar island order and vertices. `.count` x/y anchors equal province.labelAt divided by unitsPerPixel; if actual renderer uses a baseline offset, reconcile this convention in both renderer and acceptance before freeze while still checking the actual anchor against the source. `.lane` points equal entranceReservations points / unitsPerPixel; one per unique sea edge, `data-edge` endpoints sorted. Selection highlights match attackTargets from state.map; no route is required for a land border.

Army text is at least 14 rendered CSS px and contrast 4.5:1 against its actual painted badge. Actual ownership fill equals the seat palette; badge path equals seatLook().badge; count bounding box lies within badge and country; no count collisions. Names must remain available via aria-label, hover and focus. Do not demand large always-visible country names. The browser draft checks rendered boxes/colors and SVG point containment, never trusts test-only geometry data attrs. The core sweep checks 40px hit squares/44px coordinate separation with the approved acceptance graph. The browser draft checks 40px input squares with elementFromPoint around the real label anchor, plus route/coast paint and viewport bounds. Prove these on the actual renderer before freeze.

## Persistence, playback and existing suites

Preserve all T70 controls, totals, event log and scheduling behavior in geographic play. The new browser suite checks exact saved states after reinforcement/exchange, replay and continuation, total sums, pause gating, log placement deltas, fixed-reference identity dispatch and unsupported-version atomicity. Existing explicit reference suites remain active. Geographic draft cases also cover automatic-computer pause/resume, scheduled work cancellation on successful load/new game, and all ordered action deltas after reload; their actual fixtures require disposable-positive proof.

Pinned reference tests using bare root/manual fallback need explicit `view=reference-game` navigation, retaining all values/goldens. `entry.spec.ts` needs new root/unknown expectations plus its old reference expectations preserved on explicit reference route. Keep old generated-game/golden/retry suites on `view=generated-game`. Relevant current tests do import `tests/core/versioned-match-fixture.ts`; that file exists in the current checkout. Recheck at the merged T35 baseline.

## Measured corpus and ordinary CI

Sweep writes immutable `evidence/sweep-*/corpus-selection.json` plus report and per-seed files. After a passing authorized measurement, copy that exact manifest to tracked `docs/prototypes/new-game/T36/corpus-selection.json`, retaining measured report/source provenance. The browser statically imports it. The optional GEOGRAPHIC_CORPUS_FILE is preflight-only; bare command and extracted-artifact CI require no env. Extracted artifact is served by the browser; Node expectations run from the source checkout as existing suites do.

The draft fixture deliberately has measured:false and no invented rows. Consequently this proposal cannot be frozen or claimed passing yet. No generation run is authorized in this preparation task. Corpus: 1994 plus four distinct measured extrema, including minimum label gap, smallest country, most polygon vertices and most route bends. All failures stay in evidence. No `test.skip`: real refusal case is registered from an actual refused seed if present; a passing all-success report explicitly has zero. Mandatory typed refusal/retry coverage always runs in the UI unit test. Report inconsistencies or an unmeasured/empty fixture fail acceptance.

## Remaining freeze gates

1. Install only in a disposable tree containing final T35. Measure rate >=990/1000, attempts <=50, all successful games replay identically, separate 1994. Freeze exact measured manifest; do not lower targets.
2. Implement and prove the proposed mount/controller/context/renderer seams; static transpilation proves syntax only. Pick an actual measured corpus seed for each land/sea interaction if 1994 lacks either legal edge; do not conditionally omit either case.
3. Validate count baseline/containment/contrast, path canonicalization, marker fit, 40px actual input square and route/coast paint/viewport checks at both viewports. Occlusion and visually poor placement still require actual screenshot inspection; DOM paint/style checks alone do not prove visual quality.
4. Obtain disposable positives for geographic automatic-computer pause/resume, stale work across new/load and complete ordered log deltas. In particular verify the chosen Fight on fixture leaves queued work after its first exchange; fail and choose another measured fixture if not.
5. Run negative main / disposable positive and a bounded set of sensitivity deletions for geometry, adjacency, markers, refusal reporting and identity/playback wiring; save restoration hashes. No exhaustive mutation matrix is proposed.
