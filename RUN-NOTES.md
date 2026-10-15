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


# T13 geographic implementation notes

Plan: implement only the opt-in geographic atlas, preserve exact generated semantics and the playable route, pass existing acceptance, create prototype-only goldens in the pinned image, repeat actual-source deletion mutants with exact restore, and complete all Done-when commands.

- 2026-10-14: added immutable atlas projection and coherent irregular coast geometry, native SVG/DOM preview, scoped CSS and opt-in routing. Exact names/IDs, membership/bonuses and graph edges remain unchanged. Explicit land/sea lines avoid inferring graph neighbours from layout. First functional pinned-image run passed all 6 cases.
- 2026-10-14: raised East Isle to clear Great Isle's title/coast; route masks measure loaded Inter labels. Prototype-only goldens generated and compared in pinned image: 8 passed. Actual-source opacity-zero country and omitted sea-edge mutants each failed 4 of 8 cases at both viewports, including independent non-golden checks. Saved source restored exactly; layout7, full unit339, build and full UI48 all passed. Updated spike description and tracked scripts/logs/screenshots/hashes.

END: T13 implementation and required evidence complete. Acceptance tests unchanged during stage two; core and legacy goldens unchanged. PR ready for the authorized MiniMax-M3 review and owner screenshot judgment.


T14 stage 1 plan: add acceptance tests; preserve production source; retain disposable mock fixtures and replay evidence under docs/prototypes/generated-play; prove baseline red, mock green and four independent mutations red in pinned Playwright image. Stop before stage 2 authorization.

122c411: scaffold pushed; parent opened draft PR #42.
bfef32f: added seven semantic acceptance tests, browser visual/topology/play/refusal tests, one disposable candidate and replay fixture. Parent running pinned Docker preflight a.

0ae7596: retained baseline-red/mock-unit-green batch A; browser overlap correctly rejected count baseline. Tightened independent palette/count glyph pixel checks and corrected candidate layout.

ed8f30b: evidence B retained and pushed. Batch C normal generated 10/10, complete browser58/58, unit346/346, build green; count opacity mutation survived contrast, strengthened to glyph ink. Parent judged 1280 fit readable; stage2 needs concise seat/army and connection legend. Stage1 remains source-restored between replays.

2c9752c: retained batch C and strengthened glyph and route endpoint gates, pushed.
END stage1: batch D completes all mock task commands and four mutations. Production byte hashes equal initial bytes. No core or pre-existing golden edits. Parent runs independent replay before stage2. PR42; test fixture replay: node docs/prototypes/generated-play/replay.mjs <fresh-output-directory> in pinned image.

Stage2 authorized by parent after batch D independent replay; parent decision PR42 comment6186120284. Plan: permanent formatted candidate, shared T13 renderer, visible seat/count and land/sea legend, actual-source verifier, docs and pinned full checks.

5699c4a: permanent generated-game route, shared atlas renderer, normal controller initial-state/view injection, scoped readable overlays/legend, refusal recovery, docs and actual-source verifier. Pushed.
END T14 implementation: parent pinned-image final-a ran new-only golden generation, seven semantic and ten generated browser tests, all346 unit, build, full58 browser green. Four actual-source removal runs each red for expected reason; restored10 browser green; source SHA256 before/after match. Acceptance assertions unchanged since stage1; core/existinggoldens unchanged. Newgoldens inspected at1280; owner judges appearance. No known task blockers.

Rework1 authorized same Sol medium; full Kimi review PR42 comment6186270130: R1blocking generated288px width overrides desktop440px while panel remains1.3zoom, clipping seat score metadata; R2nonblocking documentoverflow check misses clippedcard content. Plan add text-range/card/panel regression, prove red on2652e75, restore440px generateddesktop panel throughmediaquery, repinonlynewgoldens/fullchecks/mutations. Parentdecision comment6186282646.

fb04dc3: added targeted panel text-range regression and pushed. Baseline A red title wraps; baseline B red names both clipped score strings at1920,1280green. Preserve both logs. Reworkfix restores original440px column only at existing1600wide/1000high breakpoint, keeps288small/mapreadability unchanged. ParentauthorizedafterB.

e2ed278: restored generateddesktop440px column at existinglarge breakpoint, retainedbaselineA/B evidence and scoreclippingregression, updatedspikedocs, pushed.
END rework1: pinned rework1-implementation-20261015-a green7unit/12generatedbrowser/346allunit/build/60fullbrowser; allfourmutants expectedred; restored12green/hashesequal. 1280golden unchanged,1920repinned; parentandimplementer visually inspectedBOTH and1920fullscore/titlefit. R1fixed/R2regressioncovered. Core/existinggoldensunchanged; noassertionweakened. Readyfornamedfixreview.


T15 plan: stage 1 acceptance and one disposable candidate; parent replay before implementation.
998dec1: acceptance tests plus one disposable candidate pushed; draft PR #44 opened for decision record before implementation.
Local smoke: baseline unit exit 1, candidate unit/build exit 0; source hashes restored exactly. Unit output is empty, so no test-count claim; pinned replay is authoritative.
END stage 1: parent replay command node docs/prototypes/game-setup/replay.mjs docs/prototypes/game-setup/preflight-20261015-a . Permanent source untouched; no stage 2 authorization yet.

d91670e: retained local preflight evidence and restoration hashes; pushed.

Preflight A: baseline red; candidate unit green; browser exposed invalid fit-helper assumption (empty alert paragraph has zero height). Restrict alert measurement to nonempty messages; all fields/buttons/content retain positive-size/text-containment assertions. No production candidate changes. Evidence preserved.
