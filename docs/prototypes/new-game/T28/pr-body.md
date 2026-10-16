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

Docs changed: `docs/spike.md`, `docs/prototypes/new-game/T28/README.md`, reproducibility/evidence scripts, `RUN-NOTES.md`. Current portable source/archive index: `artifacts.implementation.v1.sha256.json`; the historical parent index is preserved.

Owner-selected native GPT-6.1 Sol High implemented this task. Independent MiniMax M3 review and final CI/merge belong to the main session. Latest integrated captures are listed in the T28 README; the owner judges readability/pacing from them. This remains an explicitly manual development setup. Reference saves (T31), one-human/three-computer setup/policy (T32), and Instant/settings persistence (T56) are outside this change.
