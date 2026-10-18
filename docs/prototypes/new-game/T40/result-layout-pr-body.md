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
- `src/styles.css`: card choices/reward controls plus three scoped result selectors; optional standings scroll while mandatory loss buttons and hand inspector remain inside unchanged320/380tracks.
- Parent-authored `tests/ui/card-controller.test.ts`, `tests/e2e/cards.spec.ts` and T40 fixtures provide independent acceptance. The existing geographic deck-shuffle test alone has the parent-authorized 30s deadline after its measured 6776ms timeout; all assertions/seeds and original bytes/manifest remain retained.
- `docs/prototypes/new-game/T40/**`: preserved parent probes, raw results, screenshots, negative controls and archive parts; formal adoption metadata and reproducible byte proof. `docs/tasks/T40.md` carries the parent amendment; the implementer did not edit it.

The original64bbe6 adoption copied eight exact parent-validated paths. That historical receipt/verifier remains preserved. A subsequent CSS correction appends only three visible-result selectors: optional standings scroll inside the unchanged action track while mandatory loss choices and the following hand inspector fit. Current CSS therefore differs from the historical verifier; the other seven UI files remain exact. result-layout-production.json proves all183 candidate source/test/data/config inputs with the exact CSS substitution,41 frozen inputs and92 candidate evidence members. No core/controller/DOM/Panel/default/policy/test/configuration change accompanied the correction. Retained checks below are explicitly distinguished from fresh runs. Full commands and result paths are in `production/production-adoption.json`; complete raw evidence is retained in the checked-in archive parts and loose originals.

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

Historical64bbe6 proof (preserved; expected CSS hash predates the correction):
python3 docs/prototypes/new-game/T40/production/verify-adoption.py
 exactEquivalence:true
 validatedIntegratedInputs:246, frozenAcceptance:39, retainedOriginals:2125
 mismatches:[] in every comparison
```

## CSS result correction acceptance

```text
Retained candidate pinned Playwright1.63.0 /2CPU /2workers, exact commands in result-layout-candidate/commands.txt:
playwright test --config result-layout-candidate/loss.config.ts --workers=2
 2 passed (original unchanged-T40 baseline2 failed Compact containment)
playwright test --config result-layout-candidate/cards.config.ts --workers=2
 24 passed
playwright test --config result-layout-candidate/t71.config.ts --workers=2 --grep 'reference (compact|detailed): human-loss choices fit and remain usable'
 4 passed
No retries/skips/flaky cases or assertion changes; one Vite candidate build.
```

The correction reuses these measured results only after full byte proof: stylesheet SHA256257fbe1be6f70f4dda1a7750ca1fd4ba9be9950ef54e1c9b0d97bd14abf7b7d9 equals the frozen candidate; old CSS plus precisely proposal.css equals the new CSS; all183 integrated candidate inputs,7 other UI files,41 frozen acceptance files and92 candidate evidence members match. Full Docker commands, raw geometry,48PNGs and finally restoration receipts remain in result-layout-candidate and its archive. No full npm/138affected/32compact matrix was rerun for this CSS append; the previous outputs describe their measured historical runtime. Focused independent review and final CI will validate the corrected integrated head.

## Docs changed

`docs/spike.md` documents the adopted API, staged entry, zero/one-human compatibility, ordinary actions versus presentation-only acknowledgement, public/private boundary and country-name lookup. The result section documents bounded standings scrolling and always-visible mandatory loss choices. Append-only `RUN-NOTES.md` records PLAN/progress/END. `result-layout-production.json` records the current CSS correction proof; the original production verifier describes64bbe6 only. `production/production-adoption.json` gives per-file reasons, eight hashes, frozen manifest hash and reused commands; `production/exact-equivalence.json` and verifier retain the complete proof.

Owner appearance judgment, independent review and one final CI remain main-session work. This formal adoption launched no CI, review, merge, package or Windows preview. The only subsequent source change is the exact three-selector CSS correction; no test assertion edits. Native aggregate token telemetry is unavailable.

