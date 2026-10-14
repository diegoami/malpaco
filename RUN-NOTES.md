# T08 run notes

Owner selected OpenAI GPT-6 Luna subagent in Codex, isolated worktree.

Plan: implement the malpaco preset and single-exchange combat while preserving Classic; append coverage and run all Done-when and mutation checks; commit/push each meaningful step; update the draft PR.

- Dispatch preparation: independent attack-guard/combat acceptance tests fail before implementation because malpacoRules is missing. A temporary reference mock passes the same checks; it is removed and production code is unchanged. Existing setup suite remains the compatibility check.

- 2026-10-14: added `malpacoRules()` as generated-game default, single-die tie rerolls, capture-all/no-forfeit behavior and compatibility docs. Targeted command `npx vitest run tests/core/malpaco-combat.test.ts tests/core/setup.test.ts` passed (33 tests); `git diff --check` passed.
- 2026-10-14: refined the preset to inherit setup/victory from Classic and cited each override (C-CMB-01..05, C-CMB-09, C-OWN-01); pairResults reports unresolved reroll ties explicitly. Targeted suites passed again (33 tests).
- 2026-10-14: all 12 targeted mutants were killed and exact original bytes restored. Full `npm ci && npm run build && npx vitest run && npx playwright test` passed (316 Vitest, 36 Playwright); the restricted UI/e2e/map/golden diff was empty. Added apply-level 5001-vs-1 capture purity coverage; targeted suites then passed (34 tests).


## Final evidence

- DW1: `npx vitest run tests/core/malpaco-combat.test.ts tests/core/setup.test.ts` → 34 passed. Before implementation the independent baseline's 14 acceptance checks failed because the preset was absent; a temporary reference mock passed all 14 and was removed. Generated default, explicit custom rules, Classic, and legacy `newGame` compatibility are covered.
- DW2–DW5: source ownership, source/target existence, friendly target, neighbour, and phase refusals pass in the acceptance suite; targeted guard mutants were killed.
- DW6: 2 versus 2000 is allowed, 1 army is refused, and seeded human/Easy/Normal/Hard results match.
- DW7: scripted repeated ties consume all six draws before one decisive exchange; either loss side is covered. `pairResults("reroll", [3], [3])` reports `tie` without assigning a winner.
- DW8: a losing attacker stays owner with 1 army in attack phase.
- DW9: 5001 versus 1 captures move 5000 without clipping and preserve centres; `apply` leaves the input state unchanged.
- DW10: deterministic results reproduce, RNG resumes after ties, and computer streams remain unchanged.
- DW11: 12/12 targeted mutants were killed: source ownership/existence, target ownership/existence, neighbour, both phase gates together, minimum, defender-strength gate, die count, tie reroll, forfeit, capture amount. Each mutation run restored exact original bytes.
- DW12: `npm ci && npm run build && npx vitest run && npx playwright test && git diff --exit-code origin/main -- src/ui tests/e2e data/maps/archipelago.json` → exit 0; build passed, 317 Vitest tests passed, 36 Playwright tests passed, restricted diff empty. No golden files changed.
- Docs changed: `docs/spike.md` now explains the generated-game malpaco default and retained Classic/legacy compatibility.



# T11 implementation notes

Owner dispatched OpenAI GPT-6 Luna subagent in the isolated T11 worktree.

Plan: add a ruleset-controlled turn sequence. Classic keeps its attack/endTurn shortcut; Malpaco starts each living seat in reinforcement with one T10 income grant. Reinforcement placement is immutable and draw-free; an explicit action opens attack only after the pool is exhausted. Combat handoff skips eliminated seats before granting income.

- 2026-10-14: reproduced the pre-implementation T11 acceptance baseline: 14 failed, 1 pre-existing Classic check passed. Added explicit `RuleSet.turnSequence`, `reinforcementPool`, Malpaco entry/handoff grants, owned placement, pool exhaustion gate, and updated spike descriptions. Target suite passed (15 tests); first full-suite run exposed five T08 fixtures that assumed attack entry, so the shared combat fixture now deliberately sets attack phase and zero pool.
- 2026-10-14: strengthened the wrong-phase placement check with an attack-phase fixture that has a positive pool. Mutation runs removing the ownership check, pool bound, and end-reinforcement phase check each failed the named turns test; source bytes were restored in `finally`. Restored full suite passed (332 tests); `npm run build` and `git diff --check` passed.

## T11 evidence

- DW1: `npx vitest run tests/core/turns.test.ts` → 15 passed. Before implementation, 14 failed and the Classic sequence check passed. Invalid amounts, unknown/enemy province, overspending, wrong phase, immutable input, unchanged RNG, and action history are covered.
- DW2: same command → 15 passed. Authored and generated Malpaco maps, Classic entry/handoff, pool exhaustion, explicit combat entry, skipped eliminated seats, turn wrap, and finished-game refusal are exercised.
- DW3: removing ownership validation at `src/core/rules.ts:58` made `refuses unknown/enemy provinces and overspending` fail; removing the pool bound at `src/core/rules.ts:61` made that test fail; removing the `endReinforcement` phase guard at `src/core/rules.ts:70` made `blocks combat and turn ending until placement and explicit advance` fail. Each mutation was restored from the saved in-memory contents in `finally`, then green tests were rerun.
- DW4: `npm test` → 332 passed; `npm run build` → exit 0; `git diff --check` → exit 0.
- Docs changed: `docs/spike.md` describes the T11 Malpaco sequence and preserved Classic flow.

END: T11 code and evidence committed; commit SHA is recorded in Git history.


# T12 implementation notes

Owner dispatched OpenAI GPT-6 Luna subagent in the isolated T12 worktree.

Plan: switch the authored-map hot-seat UI to Malpaco rules; drive one-army reinforcement placements and the phase transition through `apply`; expose phase/income/pool and keyboard-accessible action hints; clear selection at phase and seat changes; update compatibility flows and affected goldens; save reinforcement, combat and handoff screenshots at both configured viewports; run the task's full verification and mutation check; push each commit and update PR #36.

- 2026-10-14: reproduced the prepared acceptance baseline in the pinned Playwright image: all 4 viewport/test combinations fail because `#turn-phase` is absent. Existing test remains unchanged.

- 2026-10-14: switched the authored hot-seat UI to Malpaco, routed one-army placements and the combat transition through `apply`, exposed phase/income/pool and contextual controls, added reinforcement-aware panel sizing, updated existing attack flows for reinforcement and single-die combat, refreshed four affected panel/result goldens in the pinned image, and updated `docs/spike.md`. The screenshot helper now waits for fonts and finite animations.
- 2026-10-14: `npx playwright test tests/e2e/reinforcement.spec.ts --workers=2` → 4 passed at 1280x800 and 1920x1080. The full pinned `npx playwright test --workers=2` → 40 passed; painted/readability checks stayed green and panel layout passed at 1366x768, 1600x900, 1920x1080. `npm test` → 332 passed; `npm run build` → exit 0.
- 2026-10-14: removed the owned-province `apply({kind:"reinforce"...})` call as a mutation and ran the acceptance suite: all 4 viewport/test combinations failed because the pool stayed at 2 instead of dropping to 1. Restored `src/ui/app.ts` from its saved bytes and removed the saved copy.
- Screenshots: `screenshots/1280x800/reinforcement-{opening,combat,handoff}.png` and `screenshots/1920x1080/reinforcement-{opening,combat,handoff}.png`; combat captures wait for the dice and dialog animation to finish.
- Docs changed: `docs/spike.md` now describes the playable Malpaco reinforcement/combat UI on the authored map and records generated-board integration as later work.

END: T12 implementation and evidence are committed; the commit SHA is recorded in Git history.


# T13 acceptance preflight notes

Plan: prepare full-contract layout/UI acceptance and a disposable feasibility reference, reproduce baseline failures and mock successes in the pinned image, restore source exactly, commit/push evidence, then await parent validation and stage-two authorization.

- 2026-10-14: added immutable semantic/layout and pixel/graph/selection/seed acceptance, temporary reference fixtures and replay. Fixed the permitted one-line UI-test discovery blocker. Diagnostic runs B–E retained; corrected SVG stroke visibility to accept horizontal/vertical paths. Final G: 7 layout, 6 prototype non-golden E2E, 339 full unit, build, and 40 legacy E2E pass. Both deletion mutants fail at both viewports, then restored UI is green.

END: Stage-one preparation complete. Original main source hash restored; mock production files removed. Geographic appearance and permanent prototype goldens remain stage-two work. Await parent independent replay and explicit implementation authorization.
