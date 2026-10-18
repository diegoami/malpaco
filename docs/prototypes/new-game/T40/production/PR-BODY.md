Closes #85

Supported versioned card games previously had no human card controls. This change exposes the viewer's hand, optional trades and Surge, named remote Raid targets, Shield feedback, forced pre-draw discard, Squall and private reward Continue. Pending choices gate unrelated input; a decisive result remains deferred until the reward is acknowledged.

Card play is staged through real versioned card files with at most one human seat (zero-human files remain load-compatible). Ordinary new games retain victory rules until T41 provides computer card policy; T53 owns shared-screen handover.

## Scope

- `src/ui/cardController.ts`: fixed-viewer projection, valid sets, Raid/discard/reward lifecycle and stale-control cancellation.
- `src/ui/cardView.ts`: hand inspector, public counts and actionable pending choices.
- `src/ui/battleController.ts`: mandatory-choice/reward input gates.
- `src/ui/referenceBattleGame.ts`: card mounting, board target routing and decisive-result deferral.
- `src/ui/referenceGame.ts`: preserve loaded versioned reference context.
- `src/ui/referenceMatchFiles.ts`: supported zero/one-human loading and multiple-human refusal.
- `src/ui/gameEventLog.ts`: public spent-card/outcome feedback without ordinary draw identities.
- `src/styles.css`: card choices and reward controls fit both desktop modes.
- Parent-authored `tests/ui/card-controller.test.ts`, `tests/e2e/cards.spec.ts` and T40 fixtures provide independent acceptance. The existing geographic deck-shuffle test alone has the parent-authorized 30s deadline after its measured 6776ms timeout; all assertions/seeds and original bytes/manifest remain retained.
- `docs/prototypes/new-game/T40/**`: preserved parent probes, raw results, screenshots, negative controls and archive parts; formal adoption metadata and reproducible byte proof. `docs/tasks/T40.md` carries the parent amendment; the implementer did not edit it.

The formal source commit adopts only the eight exact final parent-validated paths. Core, Panel, defaults, computer policy, tests and configuration were unchanged by adoption. Eight production hashes match the positive runtime; all246 integrated source/test/data/config inputs,39 frozen acceptance inputs and2125 retained originals verify without mismatch. Heavy checks below are retained parent executions reused under this exact equivalence, not newly rerun claims. Full commands and result paths are in `production/production-adoption.json`; complete raw evidence is retained in the checked-in archive parts and loose originals.

## Done-when evidence

```text
DW1: npx playwright test tests/e2e/cards.spec.ts
Retained pinned Playwright1.63.0 execution, browser-execution-03/browser.config.ts:
  24 passed
Missing-UI baseline:2 intended failures. Decisive Continue geometry and Raid-render omissions fail intended assertions; bytes restored exactly.

DW2: npx vitest run tests/ui/card-controller.test.ts
Retained unit-positive-02/stdout:
 Test Files  1 passed (1)
      Tests  19 passed (19)
Baseline:19 missing-UI failures. Privacy/replacement-generation/no-set/mandatory-reward gate omissions fail intended assertions; exact restoration retained.

DW3: npm test
Retained dw3-validation-02/npm-test.stdout (harness output in same stream):
 8 harness tests pass
 Test Files  56 passed (56)
      Tests  752 passed (752)

DW3: npm run build
Retained dw3-validation-02/npm-build.stdout:
 ✓ 62 modules transformed.
 ✓ built in 397ms

DW3 affected pinned browser suites:
Retained dw3-validation-02/affected-browser.stdout:
 138 passed (6.0m)
Compact original32-case batch:30 passed,2 original30s timeouts; NOT a green full batch.
Exact same2 candidate cases retaken in compact-comparison-01:2 passed at27–28s, unchanged baseline29s, same pinned image/2CPU/config/test bytes. All32 distinct compact cases passed across retained runs; no compact assertion/deadline change.

Formal proof: python3 docs/prototypes/new-game/T40/production/verify-adoption.py
 exactEquivalence:true
 validatedIntegratedInputs:246, frozenAcceptance:39, retainedOriginals:2125
 mismatches:[] in every comparison
```

## Docs changed

`docs/spike.md` documents the adopted API, staged entry, zero/one-human compatibility, ordinary actions versus presentation-only acknowledgement, public/private boundary and country-name lookup. Append-only `RUN-NOTES.md` records PLAN/progress/END. `production/production-adoption.json` gives per-file reasons, eight hashes, frozen manifest hash and reused commands; `production/exact-equivalence.json` and verifier retain the complete proof.

Owner appearance judgment, independent review and one final CI remain main-session work. This formal adoption launched no CI, review, merge, package or Windows preview. No new source changes or test assertion edits. Native aggregate token telemetry is unavailable.
