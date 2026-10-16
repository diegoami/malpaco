The reference development route now lets a player fight on with Stop available after each exchange, roll one exchange, and choose an explicit capture quantity. A fixed remembered threshold and a watch pause keep long battles controllable; source, target, stacks, tied dice and results remain visible. `battle=legacy` preserves the previous reference UI and all its assertions/goldens.

Closes #73.

Scope:

- `src/ui/battleController.ts`: pure scheduler/state controller, ordinary apply actions, independent seeded tie trace, revision/generation refusal and lifecycle cancellation.
- `src/ui/battleView.ts`, `referenceBattleGame.ts`: accessible battle/capture controls, fixed context, retained keyboard focus, public header totals and accurate capture phase.
- `src/ui/referenceGame.ts`, `src/styles.css`: select capture-choice rules on the default development route; append scoped layout while keeping explicit legacy compatibility. Core, existing App/Panel and other routes remain unchanged.
- Parent battle fixtures/acceptance were committed before dispatch. Added lifecycle/watch unit checks and viewport/keyboard browser checks. Existing reference test changes only its navigation URL to `battle=legacy`; every original assertion and golden remains. The protected-input audit proves 82 prior core/test/golden files byte-exact against acceptance commit `c3d2645`.
- `docs/spike.md`, T28 evidence scripts/README/index and append-only `RUN-NOTES.md`: explain current flow, boundaries, retained failures, exact restoration and reproducible checks.

Validation (browser commands run in pinned `mcr.microsoft.com/playwright:v1.63.0-noble`; exact commands/raw outputs/source fingerprints retained under `docs/prototypes/new-game/T28/evidence/`):

```text
npx playwright test tests/e2e/battle-controls.spec.ts
10 passed (9.3s) — 1280x800 and 1920x1080, no page errors

npx vitest run tests/ui/battle-controller.test.ts
Test Files 1 passed (1); Tests 9 passed (9)

npm test
Test Files 30 passed (30); Tests 471 passed (471)

npm run build
core/full TypeScript pass; 43 modules transformed; built in 94ms

npx playwright test tests/e2e/battle-controls.spec.ts tests/e2e/battle-accessibility.spec.ts tests/e2e/reference-game.spec.ts tests/e2e/generated-game.spec.ts tests/e2e/game-setup.spec.ts tests/e2e/match-save.spec.ts tests/e2e/computer.spec.ts tests/e2e/complete-game.spec.ts tests/e2e/slice.spec.ts tests/e2e/reinforcement.spec.ts
98 passed (2.2m); legacy conquest 541 actions at each desktop

python3 docs/prototypes/new-game/T28/mutate-implementation.py
14/14 actual-source mutants caught; green before/after baselines; four saved source files restored byte-exact in finally

python3 docs/prototypes/new-game/T28/audit-protected.py
82 files exact; existing CSS exact prefix

git diff --check origin/main
pass
```

Negative-before: parent acceptance rejects missing controller/battle UI; all mock/preflight attempts remain archived. Actual-source deletion of Stop and combined pending-selection gating fails acceptance. Twelve further mutants cover stale callbacks/controls, threshold/tie/speed/watch/disposal and visible phase/focus/viewport behavior. Every measured output remains unmodified and hashed; no source changed during browser runs.

Docs changed: `docs/spike.md`, `docs/prototypes/new-game/T28/README.md`, reproducibility/evidence scripts, `RUN-NOTES.md`. Current portable source/archive index: `artifacts.parent.v2.sha256.json`; earlier indexes are preserved at their pinned revisions. Final verification receipt is committed separately.

Owner-selected native GPT-6.1 Sol High implemented this task. MiniMax M3 independently approved reviewed commit e7133a0; it reran471 units/build and98 pinned browsers. Owner accepted the battle captures. Three nonblocking coverage follow-ups are retained in #129. Parent reran14 focused browsers/15 controllers and verified412 files/1357 archived members; exact review/session/archive retained. Final CI commit0d15ae0 includes all evidence; production code is unchanged since approval. Latest integrated captures are listed in the T28 README; the owner judges readability/pacing from them. This remains an explicitly manual development setup. Reference saves (T31), one-human/three-computer setup/policy (T32), and Instant/settings persistence (T56) are outside this change.

CI-blocking mechanical scope (rule 12): `tests/e2e/generated-board.spec.ts` now waits for all font-dependent route-mask label exclusions before taking its reload baseline. The full `innerHTML` equality, every existing seed/failure assertion, all goldens and all production/T28 parent sources remain unchanged. CI run 38945668172 had passed source122/extracted121 cases; its one failure was this unfinished-baseline readiness race.

Bounded rework validation, retained under `docs/prototypes/new-game/T28/evidence/`:

```text
python3 docs/prototypes/new-game/T28/prove-mask-readiness.py
Pinned deterministic delayed-font proof at both sizes:
old spec: mask rectangles1 ->56; full HTML differs;2 cases fail
fixed spec: mask rectangles56 ->56; full HTML equal;2 cases pass
Temporary instrumentation restored to saved fixed bytes in finally; production inputs stable

python3 docs/prototypes/new-game/T28/run-browser.py ci-readiness-source --suites tests/e2e/generated-board.spec.ts,tests/e2e/battle-controls.spec.ts,tests/e2e/battle-accessibility.spec.ts
22 passed (13.8s)

python3 docs/prototypes/new-game/T28/check-release-readiness.py
Fresh official npm run package:playable in pinned image: build/typechecks pass
Fresh extracted archive: SHA256SUMS verified
npx playwright test --config playwright.release.config.ts tests/e2e/generated-board.spec.ts --workers=2
8 passed (4.5s), including unchanged goldens

npx vitest run tests/ui/battle-controller.test.ts
9 passed
```

Details: `docs/prototypes/new-game/T28/CI-READINESS.md`; new current index `artifacts.ci.v3.sha256.json` includes the changed spec and unchanged causal `src/ui/prototype/preview.ts`. Historical v1/v2 indices/READMEs and original CI failure remain intact. No additional review, CI or merge invoked by implementer.
