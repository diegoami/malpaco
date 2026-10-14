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

END: code/evidence commit 79fdf99.
