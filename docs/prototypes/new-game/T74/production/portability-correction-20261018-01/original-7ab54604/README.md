# T74 versioned generated-geography provider

The three runtime provider modules are exact copies of the parent-frozen production candidates, adopted after the approved T72 drawing passed the bounded feasibility probe and the exact actual-path candidate passed the full parent validation. There is no geographic host or renderer activation in T74. T75 owns sidecar consumption, host/load lifecycle, real interaction acceptance and owner appearance judgment.

`derivePresentation(acceptedGeometry)` returns deeply immutable native SVG bounds, island/country polygons, display anchors and routes with original logical ids, `drawingVersion:t72-relocated-flow-spread-v2` and `contentKey`. Gameplay/save geometry stays in its original fixed-point units. The canonical shared-edge deformation and constants match the approved T72 spread exactly. Output owns its arrays and does not mutate or freeze input. There is no gameplay RNG argument/draw or Node/prototype filesystem import in the runtime modules.

`PresentationService.request(geometry,signal?)` snapshots input, deduplicates pending identical content, and retains up to eight immutable completed drawings in an LRU cache [designed]. Identity is complete accepted geometry plus drawing version/constants, represented by collision-free canonical JSON; same seed alone is insufficient. The dedicated-worker factory is `createPresentationService()`. Worker requests carry derive{id,key,version,geometry} or cancel{id}; responses carry success{id,key,version,value} or failure{...,message}. Cancelled/stale ids cannot populate cache. Derivation failure permits retry; terminal worker error makes current/future requests fail explicitly until caller disposes/recreates the service. Subscriber cancellation cannot preempt an already executing synchronous worker calculation; disposal terminates it. Renderer mounting, old-polygon fallback and synchronous per-render derivation are absent.

## Files and frozen lineage

- src/ui/generatedGeographyPresentation.ts: exact approved typed pure derivation.
- src/ui/generatedGeographyPresentation.worker.ts: isolates expensive computation.
- src/ui/generatedGeographyPresentationService.ts: content identity, bounded cache and lifecycle.
- production/verify-adoption.py: small read-only committed/working input and in-memory archive proof, with no override flags or loose-helper requirement.
- production/adoption.json: immutable input-manifest hashes, canonical identities, original command results and explicit post-positive prerequisite exception; no recursive self hash.
- docs/spike.md: provider API, activation boundary, provenance and limits.
- RUN-NOTES.md: append-only implementation plan/progress/END and source checkpoint.
- Production reports/verification receipts/PR body: reviewable provenance and exact proof results.

The parent authored/froze the actual test files tests/ui/generated-geography-presentation.test.ts and tests/ui/generated-geography-presentation-service.test.ts, acceptance/FROZEN-ACCEPTANCE.json (99inputs), acceptance/validated-inputs.json (226post-adoption production inputs), acceptance/frozen-oracles.json and acceptance/measurements/*. Runtime adoption changes none of them. Parent freeze commit8a530688 follows the actual corrected T73 prerequisite7fc757f8. The sole declared difference after the positive full run is T73's native-download pacing helper in tests/e2e/computer-cards.spec.ts, outside npm/Vite executed tests. Its corrected targeted proof and separate T73CI belong to that prerequisite. Historical T73 whole-tree proofs remain unchanged historical evidence; the new T74 inputs do not rewrite them.

## Acceptance evidence and its limits

Actual baseline at both new test paths fails module imports before providers exist (two failed suites, zero tests collected), exit1/0.631s. This is not an assertion-level baseline. The exact provider installation then passed ONE `npm test`:806Vitest tests/59files, including15drawing cases and7service cases, plus8Node harness tests; command91.520s. ONE `npm run build` passed both TypeScript checks and Vite, command1.205s. Those are reused parent results, not fresh formal-producer tests. Exact sources/tests/runtime input reuse is checked by the standalone verifier and the declared helper exception.

The archived pure proposal passed22tests/70.44s. Its final five negative controls detect one-sided boundary, omitted route endpoint, input mutation, omitted flow and omitted RNG, with exact source/mode restoration. Twelve accepted frozen maps protect552simple connected countries and full40native-unit reservations;398's complete50-attempt refusal is retained. The approved five drawing outputs match T72 byte-for-byte. Actual production overlay measurements cover35,328primary cases plus1,472three-digit cases,52PNGs and real-worker responsiveness (288timer ticks observed before result). Counts/fonts/hits/accessibility/conditional-name policy remain intact; baseline/candidate star-boundary diagnostics and existing name polish are disclosed, not silently promoted to stronger requirements.

Derivation was observed at3.119–3.720s in that local Node24 environment. This is not a performance budget or cross-platform guarantee. The corpus is not a wide-seed success-rate claim or hostile-input geometry validator. Local-font/manual-shell overlay checks are not a normal-host browser integration or owner aesthetic approval. T75 must preserve array-ordered production names, four ownership shapes, exact typography/full-size hits, accessible ids and current army-first conditional-name policy.

All original failures are readable from committed archives: initial snapshot/module race, watcher-limit server stream, harness syntax error, import-level baseline, stopped expensive suites, nine diagnostic-only bonus-metadata adapter errors, direct exact-drawing diagnostic, and final parent-authorized complete-oracle acceptance. The final form compares the complete ordered typed geometry/logical projection and pinned hashes to independently Phase-A-validated geometry, preserving safety without repeating quadratic checks per unit run. Nothing was filtered, weakened or quietly retried into a passing seed.

## Standalone proof and archived originals

```sh
python3 docs/prototypes/new-game/T74/production/verify-adoption.py
```

This verifies committed AND working byte/mode identity for all99frozen inputs,226validated inputs, the three provider/candidate equalities, pinned manifests and its own committed source. It reads only three T74 archive parts from Git HEAD, concatenates in memory, and validates compressed hashes/bytes plus every uncompressed member hash/size/mode/inventory:330PhaseA members and19parent-validation members. It authenticates embedded inventories, original command/restoration receipts, corpus/overlay/control/worker outcomes and current frozen oracles. It requires no loose prototype outputs, extracts nothing and does not revisit T73's older giant archive.

Archive inventories are archives/phase-a-receipt.json and archives/parent-validation-receipt.json; the sibling .bin parts are gzip tar streams. Python tarfile can read them in memory; their member paths retain original report/log names. Existing committed main evidence paths also retain the human reports, phase-a manifest/SHA256SUMS, final control/test logs and parent baseline/npm/build/restoration receipts. All loose originals, saved rollback copies and worktrees remain preserved.

Draft PR186 stays draft. Main owns fresh keychecks, independent approving review, actual T73 approval/green dependency and final greenCI before merge. No formal-producer heavy tests, browser/mutation repeats, packaging, previews, Windows transfer, paid review, CI dispatch or merge occurred.
