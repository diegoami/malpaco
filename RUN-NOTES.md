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

0529f9b: CSS alert selector quoting corrected before B candidate run. B baseline confirms missing setup heading, not syntax failure. Candidate B 7/8 browser passes; two-seat1280 attack selection text exceeds row by12px. Candidate C gives generated selection rows narrower fixed columns plus wrapping (opening has no selection rows), and fixes setup centering selector to root id game-setup. All B evidence retained; no assertions weakened.

9aaea89: preflight C setup centered and selection text fits, but two-seat1280 Attack footer bottom802.53 exceeds800. Candidate D only lowers scrollable log floor96to50 for two-seat generated attack phase (reinforcement opening unchanged); enough for both unselected/selected wrapped values. All C outputs retained; existing tests probe both attack selections and handoff for allseatcounts/bothsizes.

Stage2 authorized after independent D by parent decision PR44comment6187704782: focused40/all386/setup8/full68/build pass; seed/count mutants expectedred; exactsource restoration. Plan install same D behavior, format production code, update stale setup docs, actual-source verifier, fresh pinned final batch. All acceptance assertions frozen.

c81aa00: permanent setup/validated createGame choices/scoped panel/cues/docs/verifier installed and pushed. Parent ran pinned actual-source implementation-20261015-a:40focusedunit/8setupbrowser/386allunit/68allbrowser/buildgreen. Seedforcing1994 red onownerexpectedseat1receivedseat2; seatsforcing2 red onexpected3/4received2. Restored8green; allfour sourcebefore/afterhashesmatch. ALLFOUR setup/fourseat images atbothsizes visually inspected by implementer and parent. No further source or acceptance changes.
END T15: retained actual-source evidence+SHA256, PR DWoutputs/filewhy updated; dependency symlink removed; core/existinggoldens/oldacceptance diff empty. Ready for authorized Kimi K3 1M low review. No known task blocker.

T16 stage 1 plan: acceptance-only legal-action fixture, nine full core matches, normal-click three-human browser match at both sizes, four actual-source mutations, pinned full verification. Existing core behavior is intentionally tested unchanged; no production candidate is needed unless a play blocker is demonstrated.

Initial smoke: nine seeds/seats fixtures pass on existing source in <0.5s; 349–1333 actions, 12–101 handoffs, 7–27 rounds. All three/four-seat fixtures visit an eliminated-seat skip before victory. Browser uses seed1994/three seats:588 actions/29 handoffs/11 rounds. All state derives exclusively from createGame/apply, no ownership/dice/RNG injection.

569ed0b: acceptance preparation committed/pushed; draft PR47 opened. Standalone browser screenshots create their ignored output root; pinned replay uses a fresh tracked evidence directory. Parent pinned run requested.

9278752: standalone screenshot setup pushed. Added complete-game proof README documenting unchanged-behavior premise, legal passive policy, measured fixture totals, designed bound and four actual-source mutation classes. Waiting for parent-owned pinned Docker execution.

Local mutation batch A: all four mutants red; restored9green and SHA256 equal. Victory omission originally failed in fixture's empty-frontier guard after full ownership; added direct immediate-completion assertion so its protection fails at the conquest transition itself. Other failures are missing eliminated flag, incorrect next seat, and wrong finished-action refusal. No production edit retained.

Parent audit: initial finished-guard deletion only changed refusal wording; downstream phase guards still rejected all actions. Retain batch A honestly as reason-only for that mutant. Fourth replay mutation now explicitly accepts an action from finished state and returns a cloned attack-phase state, proving an actual frozen-play bypass. Acceptance assertions unchanged.

812a3d5: corrected finished-action acceptance mutant red9; victory red at direct completion assertion; restored9green/exact hashes. Added a boolean rejection assertion before the retained exact-error assertion to keep future mutation failure logs concise (initial accepted-state deep diff retained as measured evidence). Ready for pinned replay.


ca0fb96: pinned B completed two complete-game browser cases in38s; all395unit/build/full70browser green. Four actual-source mutants red, restored9green; rules SHA256 a3fc3f9c5bcf8916a20974c5b63389180506b0af321341870a647fbcceab37a3 unchanged. Parent independently read four failure causes and viewed winner screenshots at BOTH sizes; no production blocker.

Finalization authorized by parent PR47comment6188263689: retain/hash B and parent absent-coverage baseline; update spike/proof docs and PR; no production edits or additional tests required. Historical guard-deletion mutant documented as wording-only; final fourth mutant explicitly accepts/reopens finished play. Cosmetic existing finished hint deferred under rule11. Dependency symlink removed before final clean tree.
END T16: acceptance-only existing-behavior proof complete. Production core/UI, old assertions and old goldens unchanged. Pinned evidence, command exits, source restoration hashes and screenshots retained; ready for owner-selected Kimi K3 1M low review. No next task undertaken.

T17 stage 1: acceptance and one disposable replay-based candidate only. Core feasibility probe ran baseline red, candidate green and full unit green locally; native captured output is empty so pinned image supplies authoritative test counts. Source core candidate was removed exactly after probe. UI acceptance exercises actual downloads/uploads from setup and gameplay, 2/3/4-human histories, failures preserving exact save bytes, continued dice/handoff and a finished legal history. Parent independent replay required before permanent implementation.

Stage-one acceptance refinement before pinned launch: load setup and gameplay into different seed/seat settings, then assert loaded URL/input/data. Include nonempty load errors and footer controls in text-containment/viewport checks. No candidate production change.

Preflight A: baseline unit/browser red; candidate core/build green; seven of eight browser cases green. Error text increased header height, pushing two-human 1280 footer to817.53px. All evidence and exact-restoration manifest retained. Candidate B places generated load errors in a bounded alert below the header to preserve active-board height; fit assertions retain all limits and now identify the offending element and geometry.

Preflight B: core23/save-browser8/build/fullunit418/fullbrowser78 pass. Both core mutants fail; restored23unit/8browser green with matching original source hashes. B evidence/hash index retained. Parent inspected alert1280 and winner1920; right alert overlapped current-turn heading. Move bounded alert to upper-left map margin and add an explicit title nonoverlap check; keep all existing fit assertions. Parent authorizes stage2 after this positioning refinement. Plan permanent replay module/index export, controller cleanup/local file UI/scoped styling, documented golden reasons, actual-source verification and pinned full suite.

Stage2: installed the replay candidate, exported match APIs from core index, retained actual options in generated UI and cleaned replaced controllers. Alert now sits at upper-left and cannot cover the turn title; actual-source verifier restores prior right positioning to prove this additional regression. Allowed six generated/setup/four-seat goldens include new local file controls; authored/prototype goldens and prior assertions unchanged. Updated spike and evidence README. Preparing fresh parent pinned final verification.

Permanent UI acceptance also preserves nondefault saved presentation options and counts active window-keydown listeners across repeated uploads. Actual-source mutations discard loaded options or omit controller disposal to prove those checks. Counts stay23core/eightbrowser. Local production build passes; awaiting pinned verification.

Implementation A:23core pass; all8browser timed out because the new optional nonempty-alert boundingBox probe auto-waited when no alert existed. Entire failed browser log/manifest retained and hashed; source before/after hashes match. Correct the optional probe with count() before boundingBox(), preserving nonoverlap assertions whenever an error exists. No production change.

Implementation B: pinned23core/eightbrowser/build/all418unit/full78browser green. Replay-omitted mutant fails3, illegal-accepted fails4; right alert overlap, discarded presentation options and leaked controllers each fail both sizes (listener expected1received3). Restored23core/eightbrowser green; allfive source SHA256 values match. Read final logs/manifest, retained/hash-indexed B, visually inspected error and restored-winner screenshots at BOTHsizes: alerts leave title clear and winner/controls readable. Existing finished copy/hint remains deferred#48. Removed only dependency symlink, shared dependencies untouched.
END T17: implementation and required actual-source evidence complete; PR50 includes scope/filewhy, DWcommands/results, golden reason and screenshot paths. Exactly six affected generated/setup/four-seat goldens changed; authored/prototype goldens and prior assertions unchanged. Ready for owner-selected KimiK3 1Mlow review and owner screenshot judgment. No additional task started or known task blocker.


## T18 stage 1

T18 plan: stage 1 acceptance tests and disposable candidates; independent parent pinned baseline/mock proof before permanent stage 2. Stage 2 only after explicit parent authorization, then review.

Stage 1: read CLAUDE.md, process §4, models and authoritative T18 contract. Searched options/types/rules, UI controllers and docs/spike.md; no shipping opponent policy. Candidates remain under docs/prototypes/computer. Pure history-derived bounded policy, UI 350ms pacing, computer seat mode and replay support. Test acceptance uses actual browser files and clock-controlled ordinary actions; cancellation observes pending scheduled callbacks.

Stage 1 commit: acceptance tests/helpers, candidate source fixtures and exact-byte restoring replay prepared. Local smoke a: baseline red, candidate policy green, build red on test timer signature; fixed. Smoke b: unit/build green but piped unit logs empty. Smoke c switches replay logs to direct file descriptors and is authoritative. No production edits retained. Parent to run fresh pinned preflight directory; hold permanent edits pending parent authorization.

Stage 1 pinned preflight a read in full: baseline unit/browser red, candidate 11 core tests/build green, browser 2 pass/8 fail; manifest confirms exact restoration. Two test defects: expected two-seat human reinforcement history used one amount-7 action despite seven actual clicks; and empty alert was hidden from default role locator after successful loading. Corrected expected history by applying amount-1 per click, and inspected hidden alert text explicitly, retaining full-state and empty-error assertions. Immutable preflight a retained. Next parent pinned preflight b; no production changes.

Stage 1 pinned preflight b read in full: baseline unit/browser red, candidate core/build green, browser 8 pass/2 fail. Both failures are positive timer-probe expected 1 observed 0 after load; init-script timer wrapper was replaced by Playwright clock setup. Probe now wraps timers via page.evaluate after clock install/navigation, reinstalling after New game navigation. Positive pending-1, replacement pending-0 and victory pending-0 assertions preserved; no production change. Replay optional candidate mode reuses already-proven baseline while still running all candidate checks and all mutants. Preflight b remains immutable.

Stage 2 authorized after parent pinned preflight c: focused 11 core/10 browser, build, 429 total unit and 88 browser green; scheduling/input/cancellation mutants fail 6/6/2, restored browser 10 green, exact source/T17 assertion restoration hashes match. C evidence retained and SHA256-indexed. Installed the five verified candidate files permanently: core policy + public export, controller automation/gating/lifecycle, setup/mixed-save UI and panel seat labels/disabled controls. Replaced only T17's obsolete computer-file rejection fixture with an invalid action kind. docs/spike.md updates setup/save claims and policy proof. Only two setup goldens changed for Players selector. Added actual-source verify-final.mjs (all DW, three mutants, exact finally restoration; no snapshot updates). Parent pinned implementation-a next; no redundant local test expansion.


END T18 implementation
- Final permanent pinned implementation-a read: 11 focused core tests, 10 focused browser checks, 429 total unit tests, build, and 88 total browser checks pass. After mutants, restored browser checks pass all 10.
- Actual-source scheduling mutant fails 6 because the active computer never hands back; input-gating mutant fails 6 because a forced human map click changes saved action history; cancellation mutant fails 2 because a replaced timer remains pending (expected 0, observed 1).
- src/ui/app.ts exact bytes restored: before/after SHA256 88fe5aa8ed609ecd625a849d52d2fd53210ed649cfe1c02d1abe9dfdccb0b36b. Final evidence retained and SHA256-indexed under docs/prototypes/computer. Parent viewed readable setup/computer/human-return captures.
- Scope: core/computer.ts policy; core/index.ts public API; UI app/generatedGame/panel automation, setup, file resumption and labels; new computer tests/helper; only obsolete T17 rejection input replaced; two setup goldens; docs/spike and computer prototypes/evidence. No new dependency, deferred cosmetic fix, task-file edit, or authored/prototype golden change.
- PR #53 updated with Done-when commands/results and evidence. Native Sol medium implementation complete, pending independent Kimi K3 1M low review handled by parent. No further task requested. Temporary dependency symlink absent; worktree clean after final evidence commit/push.

## T19 stage 1

Plan: add focused entry-route acceptance at both configured viewports, a disposable `main.ts` fixture and a replay runner that restores exact original bytes in `finally`. Hold permanent production routing until parent baseline/mock replay.

2026-10-15: added `tests/e2e/entry.spec.ts`, the candidate source fixture, and `replay.mjs`. Direct baseline command `npx playwright test tests/e2e/entry.spec.ts` had the expected root-setup failure at both viewports while explicit routes passed. Local replay-wrapper execution could not spawn `npx` (`EPERM` in this shell sandbox); parent will run its pinned Docker replay. Browser evidence is intentionally left to that pinned run.

END T19 stage 1 preparation: tests cover plain `/`, query-only `/`, unknown views, setup/generated/prototype/authored routes, mixed computer play, New game return, authored New game routing, browser errors and viewport fit. Original `src/main.ts` remains byte-identical. Awaiting parent's pinned baseline/mock result and stage-two authorization.
