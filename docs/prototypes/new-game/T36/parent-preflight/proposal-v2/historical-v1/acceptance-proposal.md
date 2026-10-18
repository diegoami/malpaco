# T36 acceptance and integration proposal (unexecuted)

Prepared 2026-10-18 from the main checkout while T35 is in progress. This is a dispatch proposal only. No T36 checks, mutations, model calls, browser runs, CI or GitHub writes were made. Supporting unexecuted drafts are in this proposal directory: `docs/prototypes/new-game/T36/sweep.mjs`, `tests/e2e/geographic-board.spec.ts`, `tests/ui/geographic-game.test.ts`, and `integration-contract.md`.

## Contract to carry forward

T36 remains bound to the accepted T24 geography contract: 46 countries; island sizes `3,3,3,3,5,5,7,7,10`; country degree 2–5; 14–18 inter-island crossings; the approved connectivity, subdivision, coast, route, bonus, fairness and label constraints; minimum 800×540 viewport, 40×40 CSS px hit squares, 44 px maximum-coordinate label separation, 14 px count text and 4.5:1 contrast; maximum 50 generator candidates per seed and at least 99% accepted seeds. Source: `docs/prototypes/new-game/T24/README.md`, `contract-proposal.md`, and `parameters.mjs`.

Apply that same target to seeds 0–999: at least 990 successful seeds, no seed exceeding the 50-candidate budget, and a retained result for every seed. Record every refusal and its error class, including failures beyond the allowed 10. A failed seed is visible evidence and may not be dropped, retried out of the report, relabelled as an infrastructure failure, or used to change the target. Replay every successful seed twice from a fresh RNG and require identical geography, board/deal/state and RNG hashes. Record generator, fairness, setup/deal, rendering/layout, and sweep-source hashes in the report so the measurement names the exact implementation. T35's current contract only covers 0–99; T36 extends the same contract to 0–999 and must not infer 1000-seed success from a smaller run.

T35 is running in its own worktree and was read at `/home/diego/projects/malpaco/.cache/t35-work`. Its current 0–99 sweep was reported at 75/100 progress when this proposal was drafted, so these drafts are not backed by final T35 results. The T36 sweep extends the actual T35 API/accounting and fingerprints the T35 sweep, acceptance, generator, setup, board generator, match-save/types and related core/prototype sources. Refresh those hashes from the merged dispatch tree; do not invent an adapter that changes attempt accounting.

## Current seams and hazards

- `src/main.ts` routes explicit `view=reference-game` to `mountReferenceGame`, explicit `view=generated-game` to `mountGeneratedGame`, and every other route to the reference setup. Default routing therefore changes at this seam. The explicit reference route is the compatibility boundary.
- `src/ui/generatedGame.ts` already owns a playable generated-game setup, retry UI, file control, game mount and help. `createGeneratedGame` calls `createGame`, but `projectGeneratedState` then replaces generated map coordinates with `layoutGeneratedBoard` from `src/ui/prototype/layout.ts`. The game view must instead render the complete T35/T34 geography carried on the created state. The prototype route can remain separate.
- `src/ui/generatedMapView.ts` builds geometry with `renderAtlas(map, ...)` and updates ownership, selection and army counts. Confirm `renderAtlas` paints the given polygons/labels/routes without deriving alternate coordinates. The view and the rules must use the exact same state map; selection, legal actions and highlighted/painted routes must derive adjacency from `state.map`/the core neighbour helpers, never parallel hardcoded topology.
- `src/ui/app.ts` is the existing generic gameplay controller and `GeneratedMapView` implements its renderer shape. It already routes map clicks through `attackTargets` and `apply`; a focused interaction acceptance should prove that a map edge in the painted T35 board is the same edge used by legal selection and a real action.
- `ReferenceBattleGame` in `src/ui/referenceBattleGame.ts` constructs `ReferenceMapView(map, ...)` unconditionally and creates `ReferenceMatchFiles` with reference-only save identity/history handling. It also owns the T70 surface: prominent army totals, playback Pause/Resume and speed, event log, computer-turn status, and gating while paused/automated. Moving the default to generated geography must preserve these T70 behaviors. Avoid treating this class as generic until its renderer and save/load identity are explicit inputs. Existing `App`-based generated gameplay does not itself have the T70 playback/log surface.
- `GameEventHistory` in `src/ui/gameEventLog.ts` reconstructs the initial state with `REFERENCE_MATCH_IDENTITY`. The host integration boundary therefore needs to carry the map renderer, save identity, and initial replay state together through mount, load, and event-history reconstruction. Passing only a map renderer while leaving save or event replay bound to fixed-reference would show one geography and reconstruct another. Never infer fixed-reference identity from the country IDs: generated boards use the same canonical country IDs.
- `src/core/match-save.ts` has two replay paths: legacy v1 (implicit generated/malpaco path through `deserializeMatch`/`createGame`) and v2 fixed-reference identity (`fixed-reference/1`, `victory/1`, action schema 2). `ReferenceMatchFiles` currently accepts only v2 fixed-reference saves and intentionally rejects legacy generated v1 files; generated UI currently uses legacy `deserializeMatch` and projects the resulting board. T31 explicitly prohibits silently replaying a seed under a different generator. A geographic/1 save must identify its generator and rules/actions and replay with that exact version. Old reference saves must continue to resolve to fixed-reference/1 and the old reference geometry. Preserve the currently supported legacy generated route/load behavior or route those files through the proper old renderer; never load them into a fixed renderer merely because their country IDs match.
- The present `generated-game` refusal UX uses a real known failure seed (`1506`) in `retry-validation.spec.ts` and `generated-game.spec.ts`. T35 may make that seed pass. Do not rely on a historically failing seed as the sole retry test. Use an explicit dependency seam at the UI mount/setup boundary (for example, injectable game-creation dependency defaulting to production) to inject one bounded, typed refusal and then a success. Keep the seam deterministic and test-only in use; do not add a production URL flag, environment escape, or weaken real-generation refusals. Retain an integration case for a real refusal if the post-T35 sweep has one, but do not make UI acceptance depend on one fixed seed continuing to refuse.
- Existing generated save/load does not prove geographic/1 or old-reference-save interop. Tests should verify the identity dispatch and exact state/history on both paths. An old generated v1 file is also a supported legacy case if T35 retains its versioned generator as required; it must either replay on its original generation path or be rejected atomically with a clear unsupported-version reason, according to the existing compatibility promise. It must never be reinterpreted under geographic/1.

## Proposed browser acceptance

Create a dedicated `tests/e2e/geographic-board.spec.ts` matching the task's command. It should be independent of prototype fixtures and load the default route plus explicit reference compatibility route.

1. **Default route and actual geometry.** Open `/` and assert it is the new playable generated board. Independently call the production versioned generator for the URL seed; compare all 46 country IDs, actual polygon points, labels, island silhouettes, and route endpoints against the SVG geometry and attributes. Include at least two seeds whose hashes/geometries differ, with 1994 included. Compare actual painted map geometry hashes, not only names or owner/deal values, to prove changing the seed changes what is drawn. Assert owner and army markers are painted for every country. Retain screenshots at 1280×800 and 1920×1080.
2. **Representative geography and labels.** Select the corpus deterministically from the 0–999 measurements after all results exist: always seed 1994, then the extrema/representatives for polygon vertex count or shape class, narrowest/smallest country, tightest accepted label spacing, most constrained route/entrance geometry, and the highest measured label/marker density. Keep a manifest with selection rule, seed, map hash and all source hashes. Do not filter a seed because its screenshot looks poor; generation or label failure stays in the sweep and should fail the relevant acceptance. At both viewports check country/label containment, label non-overlap, minimum rendered type size, map fit without page overflow, ownership palette and legible army count by pixels/contrast; preserve all captures for owner inspection.
3. **One actual adjacency source.** On the same actual rendered map, enumerate the clicked country’s legal neighbours from the independently generated `state.map`. Click an eligible source and target and prove exactly those neighbours become selectable/highlighted, a non-neighbour is refused, route paint corresponds to the same declared edge set, and an ordinary action updates the expected owner/armies. Include a sea crossing and a shared land border. Derive expected values from the generated state rather than duplicating T35 adjacency in the test.
4. **Recoverable refusal.** Through the legitimate injected create-game dependency, force a typed bounded-generation refusal, assert the alert retains every refusal class/message, no partially rendered board or replaced live game appears, edit the seed and retry, then assert success paints the injected successful game's geometry and the URL/settings update once. Cover invalid seed then recovery. This proves error recovery without weakening generator constraints or assuming seed 1506 stays bad.
5. **Save/load and compatibility.** Save a geographic/1 game after at least one ordinary action; assert explicit board/rules/action schema identity, upload it in a fresh page, and compare map geometry hash, complete state, action history and RNG continuation/next legal action. Load a pinned old fixed-reference v2 save (identity `fixed-reference/1`) from the default playable flow and prove it uses the reference map and state, then save/reload again without identity drift. Also retain the existing T31 bad-load atomicity and supported legacy generated v1 route/load coverage using its proper old renderer. A malformed, unsupported or generator-refused load leaves the current map, action history, controls and URL usable/unchanged.
6. **T70 continuity.** In generated default play, assert labelled army totals match sums over the rendered map and update through an ordinary action; pause freezes both battle/computer schedulers and gates map actions, Resume continues the same history, event log is available while paused and reproduces the complete ordered history with exact deltas after load. New game/load invalidates old queued work. Keep the existing reference-route T70 cases active as a compatibility check too.

Do not replace the original `reference-game` snapshot fixtures or pinned assertions with generated expectations. Keep `?view=reference-game` opening, battle, save/load and playback checks against the same fixed map and save identity.

## Existing pinned tests with reference assumptions

The repository has many reference tests that already use `?view=reference-game` or `battle=legacy`; those are naturally preserved by leaving that explicit route intact. The direct default assumptions to account for are:

- `tests/e2e/entry.spec.ts:30–68`: test title, root/unrecognized-route expectations, `#reference-setup`, 4 seats / 1 human + 3 computer, `#reference-game`, fixed-reference save identity, and absence of `#generated-game`. This is the deliberate default contract change. Preserve its explicit reference compatibility coverage as a separate assertion path and make the root expectations state the new default; do not remove the old reference assertions without moving them intact to an explicit route case.
- `tests/e2e/reference-complete-game.spec.ts:26–36`: starts from bare `/` and expects reference setup/computer controls before loading a pinned fixed-reference T33 conquest. Give this test explicit `?view=reference-game` navigation so its pinned state/action/save assertions remain unchanged.
- `tests/e2e/direct-attack.spec.ts:52–53`: bare `/` expects reference automatic-computer attack behavior. Give this case explicit `?view=reference-game`; keep its existing manual tests on the compatibility route.
- `tests/e2e/map-readability.spec.ts:10–11`: `?control=manual` currently falls through to reference view and the tests assert reference army-only labels/ownership shapes at both viewports. Prefer explicit `?view=reference-game&control=manual` in its helper, preserving all existing visual assertions and golden expectations.
- `tests/e2e/region-border-postprocess.spec.ts:58–64` and `tests/e2e/coast-postprocess.spec.ts` use `?control=manual` or bare preview to inspect the reference map. Make route intent explicit if the helper currently depends on default fallback; keep the exact pinned map/geometry assertions.
- `tests/e2e/entry.spec.ts` currently checks `/`, `/?seed=42`, and `/?view=unknown&seed=42` as the same reference setup. Unknown route behavior needs an owner decision: preserve unknown-view fallback to explicit reference compatibility or treat it as the new generated default. Keep `/` as the sole promised default and make the unknown-route expectation explicit rather than letting an incidental fallback determine product behavior.

These are test-navigation updates around the deliberate route change, not numerical/assertion relaxations. Keep `tests/e2e/reference-game.spec.ts` snapshots and its `battle=legacy` flow byte-for-byte unchanged. Keep `tests/e2e/playback-controls.spec.ts`, `game-event-log.spec.ts`, `playback-edge-cases.spec.ts`, `versioned-match.spec.ts`, `match-save.spec.ts`, `retry-validation.spec.ts`, and generated golden tests running; update helpers only where their intended route changes, retaining behavior assertions. The new geographic spec should own the new default assertions rather than overloading old reference goldens.

## Pre-dispatch proof and evidence layout proposal

Before implementation, the main session should make the new Done-when fail on current `main` and pass against a disposable mock that supplies a complete geographic board, known adjacency, one refusal, and compatible save identities. The mock should prove the browser assertions are sensitive to: rendering the prototype layout instead of the state map; using stale/parallel adjacency; missing owner/army paint; dropping a refusal; accepting an unsupported save; and losing pause/log behavior. Keep all existing pinned tests in this preflight and do not edit their assertion strength to get green.

Retain outputs append-only under `docs/prototypes/new-game/T36/`: 1000 per-seed measurements or a lossless indexed report; summary with success rate/attempts/refusal classes; geometry/deal/RNG deterministic replay hashes; the selected shape/label corpus and selection metrics; Playwright screenshots at both viewport sizes; commands/runtime versions; source hash manifest; mutation negative-before/positive-after output with exact restoration hashes. This preparation run created no such evidence.

Proposed focused commands remain the task's contract:

- `node docs/prototypes/new-game/T36/sweep.mjs` (0–999, T24 numerical targets unchanged, every result retained)
- `npx playwright test tests/e2e/geographic-board.spec.ts` (both pinned desktop projects)
- `npm test && npm run build` (all retained pinned tests/goldens and new acceptance)

## Integration decisions and remaining evidence to refresh

1. The host must present fixed-reference v2 saves with the renderer selected by explicit identity under the shared shell, preserving identity and history. Carry this as a dispatch requirement.
2. Missing and unknown `view` select the geographic default; `?view=reference-game` remains explicit and pinned.
3. Preserve one human plus three Normal computers as the default setup.
4. Keep T70 controls, totals, pause and log available for generated play.
5. After T35 merges, inventory supported legacy generated v1 fixtures and route/load them through their original generator/renderer path; unsupported IDs/versions remain atomic and explicit.
6. Refresh the measured corpus after the complete T35 geography and merged T34 variation. Include seed 1994 outside the 0–999 success denominator. Actual extrema are intentionally unknown until the sweep runs.

## Owner decisions received

The parent has settled the routine choices above: preserve one human plus three Normal computers; use the geographic game for missing and unknown `view`; keep `?view=reference-game` explicit and pinned; load fixed-reference v2 saves into their identity-appropriate renderer under the same shell; preserve supported legacy generated-route/load behavior; retain T70 controls, totals, pause and log. These are treated as requirements in the drafts and do not require another confirmation. Novel layout choices are out of scope. T35's final sweep is still pending, so its actual corpus selection, refusal presence and source hashes remain to be refreshed after T35 completes.

The source-hashed sweep proposal at `docs/prototypes/new-game/T36/sweep.mjs` evaluates 0–999 and seed 1994 separately, persists each full result including refusal attempts/candidates, hashes replay output and sources, records measured geometry metrics, chooses a five-seed corpus from 1994 plus measured extrema, and exports all refusal seeds/classes for optional real-refusal browser coverage. It preserves the exact 99% target and 50-candidate budget. The unexecuted UI-unit test injects one typed refusal and a subsequent success through the setup controller; it adds no DOM dependency or production URL hook. The browser test uses static Node-side imports to derive expected boards, making no `/src` browser import assumption for extracted-artifact CI.

## Current source fingerprint

SHA-256 fingerprints below describe the files read in this checkout on 2026-10-18. T35 is not merged, and current production source is not the future T36 baseline. These hashes are an audit anchor for this proposal only; regenerate them against the post-T35 dispatch tree.

```text
src/main.ts                                      da7ee5d83c87cf9cee1a9af0b2aafab973636f3ae426eb28cc98283188280f50
src/ui/referenceGame.ts                          52cacb0cc5ce5c466b0f2eae0030a7020f582dba92ca4699a7ad5b22793873e9
src/ui/referenceBattleGame.ts                    f98c5608e9e784008731906b57bd0d40b54bffd9c7744980d5f0ccd3b07e3d38
src/ui/generatedGame.ts                          a470ffece8b9c2f211cbb844c0b24615128f379ccd4da24adb7c13e6779da511
src/ui/generatedMapView.ts                       56dc90f8f5686ba106956b3fe818bbdfa17d675aa90c512415cc0c7083f463cb
src/ui/referenceMatchFiles.ts                    f44c9e5f6868dae4fcb508a30af6e5a2d27a16b4515156069747a4f1c8db8870
src/ui/referenceMapView.ts                       ab50db577a60151e27ac288b6b5d7d101587273566f3f14e14170988694ef205
src/ui/mapView.ts                                e8d1f61afb90cf2bb2115c00a851b7169359183029b4e7c07eb608ef8c8e07bc
src/ui/gameEventLog.ts                            936b8076a9821dc4b40c68b99bb4589e27232b100cefdd8acded0dd42f5301b3
src/ui/battleController.ts                        6e58be9a0c5084ff1b60c68f14930ba7289b487ac5c91be95ef0cbf6891ca247
src/ui/panel.ts                                   64cd3638ffc7182e1dfe2349a540cc889572f8ac92945f0d88cb83c4100b4756
src/ui/prototype/preview.ts                       a814552e8e7a0235516a3d014b0c95faf24eb66efd8337196a146b4aefa9461e
src/ui/prototype/layout.ts                        (not fingerprinted in this preparation; include in post-T35 hash set)
src/core/match-save.ts                            47a0ad5da653c60a0ae51e587863e02674a65d1319a7facf4bbafe9e64e2aae3
src/core/board-gen.ts                             716a518678414d469ad9c3b59658001a049ae9835668dcedbf86f88203652942
src/core/island-geography.ts                      ddf63b0aaee80d85ec2422c8048d2c49ee5d164a07483c21600ff5a839f7e369
src/core/reference-map.ts                         cc920c2840843391f83bb9d1c393afc5342cfeb5625ecd2ca56f7252f85ec090
tests/e2e/entry.spec.ts                           4ccf9b89ab6c6c4417f82b0b8b74ea71fd06152186fe26757c51dc578eb24a88
tests/e2e/direct-attack.spec.ts                   cbae373859238f2ff01ceadda341d0fc3e82cad88e703e07aa06fd4d1276412f
tests/e2e/reference-complete-game.spec.ts         9642aad6635ef1dc6e9720cb48d43f151ce1fa361ff52274718b92f821ae71a3
tests/e2e/map-readability.spec.ts                 d8294893bccb900a0735892a4cca6c9bad6a0ffb0df4d9ad78c86ac68075852b
tests/e2e/region-border-postprocess.spec.ts       580182e89fd0980dea2648849ccab8968ed00482c3c72d023771f6af62329465
tests/e2e/reference-game.spec.ts                  5b7d3a3b466bae47ea52222a5670ee1dc03d9d658af8660e9eeefd368bca277d
tests/e2e/playback-controls.spec.ts               46feb0fd44d3e64c99de67a7ab40a908772ee749f5bef704c8152881a3fe5762
tests/e2e/game-event-log.spec.ts                  dc30a76c6118924ab9780e2b7b3598b51670def96f6fc5e6aaf38084e834b684
tests/e2e/playback-edge-cases.spec.ts              c97683e8a56b7990f50e6ea8f01a8eba5c21967ef0d0f5245359a01ef95241d5
tests/e2e/versioned-match.spec.ts                  6f717b4db03bb1996303ea6ecbf91e10adb7022dc5f5668623e9dd8615fa524e
tests/e2e/match-save.spec.ts                       51b310f1ab97e8b0be32995ba28c4292c00997c133e4e9d72ef9c921e13ee9db
tests/e2e/retry-validation.spec.ts                 62a0f90589351c21d350c1cd79337ab55f8fbeaceb370b6e718c1f535d5c1e27
tests/e2e/generated-game.spec.ts                   7c69effa1625baf807f94aae54a9c87eb7c3aa0ee120fe6f29bb0ac8491039f5
tests/e2e/generated-board.spec.ts                  3392319d809a16018c28c88000e284c8a0ec8dc3c1f1d8682ceae595ee36c97a
tests/ui/generated-game.test.ts                    29278623f2e5f06c3e187f100db1292ae554ca48783587a4e07484cfaf76756c
tests/ui/versioned-match-context.test.ts            3ee2473405e5127e7a0d02631541c0d71328eb00e56f16d37745acdb21158c33
```

The read-only T35 worktree currently exposes these preliminary SHA-256 values; they are an audit snapshot, not merged dispatch fingerprints. The proposed T36 sweep snapshots these files from the dispatch checkout at execution time:

```text
docs/prototypes/new-game/T35/sweep.mjs             02327e1aae7e4219ab8f13399c294b46f2ae3a69720b0d82a8606d70be50a6e4
docs/prototypes/new-game/T35/acceptance.mjs        f622ee83946858e37ed416e566e938134884a24c18c13962f6903b5a41edade7
src/core/geographic-game.ts                        45e90f96fc9717892b2c93a6dbf2d71cbb239fb0811a3531e60311d719c2abfa
src/core/island-geography.ts                       ab58ae1639288487cb8d102eee016e98b5059cf7c975c91ed6bfe1f5bc685f68
src/core/setup.ts                                  fccc270a649c303916dcb421b69986dc5f61bc9d3428d92cef7bf3b57a070ad2
src/core/board-gen.ts                              716a518678414d469ad9c3b59658001a049ae9835668dcedbf86f88203652942
src/core/match-save.ts                             7dd9a9a107a33ce667d029410db99d5bd167fcf1d1c0a7855936b06711466489
src/core/types.ts                                  c4dce555abebede88237ef08ad926cc166e2076f3a468d1124f495f99bf61183
```
