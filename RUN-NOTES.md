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

## T19 stage 2

Plan: install the proven candidate as the permanent entry router, migrate only the authored slice URL, update launch documentation, and add a verifier for all Done-when commands plus two actual-source mutations with exact restoration. No styling, gameplay, rules or golden changes.

Parent's pinned preflight: baseline had the expected two root failures and two explicit-route passes; the mock passed all four at both viewports. Source before/after SHA-256 is `7f40e792e819ebad24d5a0da3f84f6f8e1722ea6f10b22b96902583b9b3d42e9`. All replay JSON/logs and both default screenshots remain under `docs/prototypes/default-entry/evidence/`. The 1920x1080 setup screenshot is centered, readable and fits the viewport; its existing native file chooser truncates the filename label in the control.

2026-10-15: installed the candidate router; `small_sea` is parsed only for `view=authored-game`, which its New game callback preserves. Changed only the slice spec's URL string to the explicit route. README and spike launch/setup descriptions now state that `/` opens generated setup. Added `verify-final.mjs` for entry, slice, unit, build, full browser, both actual-source routing mutants and byte-for-byte `finally` restoration. Node syntax checks and `git diff --check` pass; browser/unit/build checks are reserved for the parent pinned run.

END T19 implementation prepared for parent pinned verification. No prior golden or gameplay assertion was changed, no golden was updated, and the only change in the slice spec is its route string.

2026-10-15 final-A follow-up: read the complete manifest and full 92-test browser log. Entry 4/4, slice 36/36, unit 429, build, and both actual-source mutants passed with exact restoration. Full browser had 88 passes and four failures, all from the two `reinforcement.spec.ts` cases at both viewports: their shared setup still opened `/?seed=1994` and expected the authored map's `body[data-ready]`. Parent amended T19 in `main` at `71d9f14`, adding this owned route migration and combining both authored suites in DW2. Retained final-A logs/screenshots and SHA256 list. Changed only that reinforcement URL and updated verifier DW2 to run slice plus reinforcement together; assertions and goldens stay unchanged. Awaiting parent pinned final-B verification.

Final-B read in full: `entry.spec.ts` 4/4; combined slice + reinforcement acceptance 40/40; unit 429; build passed; full pinned browser 92/92. The authored-default mutation failed all four entry cases at the missing setup heading; removing explicit authored routing failed both viewport cases at missing `#map`. Both actual-source mutations restored `src/main.ts` byte-for-byte; SHA-256 before/after is `6f82a4d0035e1ad6d563dce81819161c1ff411820ab79223d052a3a73e6ec074`. Final-B manifest, raw outputs and screenshots are retained and indexed in `docs/prototypes/default-entry/evidence/final-2026-10-15T12-48-18.398Z-1/`.

END T19: default generated setup, authored explicit routing and both authored test-route migrations are complete. Parent pinned final-B passes every Done-when command and both actual-source mutants. No gameplay assertions or goldens changed. Evidence is committed with SHA256 records; PR #55 has the final scope, commands, results and screenshot paths. Ready for the owner-selected MiniMax M3 review.

## Fix48 stage 1

Plan: add focused finished-copy acceptance using legal complete-game histories from `tests/helpers/complete-game.ts`; upload the legal pre-win and finished saves through the real file input; drive the last attack with map clicks and Continue; check Escape, finished-state presentation, layout fit, preserved winner/score/log/seed/disabled controls, screenshots and New game restart. Add one disposable `panel.ts` candidate and a replay wrapper that writes immutable evidence and restores the exact original source bytes in `finally`. No production edit in stage 1.

Acceptance tests cover both pinned Playwright viewport projects. `legalFinishedHistory()` uses only `createGame`/`apply` via the existing complete-game helper, then serializes its legal action history; it does not inject ownership, armies, dice or RNG. The browser starts from a near-victory save, uploads it, clicks the legal winning attack and Continue, presses Escape, checks map freeze, and restarts the same seeded three-human setup. A separate real upload loads an already-finished history and checks Escape. Candidate finished copy removes stale step/legend/hint content while preserving the footer controls.

Replay command for the parent pinned environment: `node docs/prototypes/finished-copy/replay.mjs baseline -- npx playwright test tests/e2e/finished-copy.spec.ts --workers=2`, followed by the same command with `mock` in place of `baseline`. Each run creates a new tracked evidence directory with stdout/stderr, exit code, command, fixture hash and source before/after hashes. Stage 1 does not run the browser locally; the parent owns pinned baseline/mock execution.

Pinned preflight A: baseline exit 1 showed the expected missing finished subtitle/guidance; mock exit 1 reached finished presentation but all four viewport cases exposed the same CSS interaction: `.legend { display:flex }` overrides its `hidden` attribute. Kept the `toBeHidden` assertion and changed only the disposable panel candidate to set `style.display = "none"` while finished and restore the stylesheet default otherwise. Both replay records confirm the original panel source hash `b7a9a5ebd07ab332d5a63014852f918b800dac04e0780813fc491cae1475fd35` matched before and after byte-for-byte. Preflight A outputs remain immutable in `docs/prototypes/finished-copy/evidence/2026-10-15T13-07-23.937Z-7/` and `.../2026-10-15T13-07-36.756Z-560/`; per-directory `SHA256SUMS` records hash each retained output.

END Fix48 stage 1 preparation: acceptance, candidate panel and exact-restoration replay are prepared for parent pinned baseline/mock. Production source remains unchanged; candidate only is installed temporarily by replay and restored in `finally`. Awaiting parent proof before any permanent panel edit.

Pinned preflight B: candidate exit 0, all four focused browser cases pass at 1280×800 and 1920×1080; the real winning attack, Continue, Escape, loaded-finished save, and seeded New game flow pass. Original panel was byte-restored to SHA-256 `b7a9a5ebd07ab332d5a63014852f918b800dac04e0780813fc491cae1475fd35`. The parent inspected the winning and loaded-game screenshots. All output and screenshot hashes are in `docs/prototypes/finished-copy/evidence/2026-10-15T13-09-31.967Z-1/`. Stage 2 is authorized.

## Fix48 stage 2

Plan: install only the proven finished-state presentation in `src/ui/panel.ts`; document the focused acceptance in `docs/spike.md`; add `verify-final.mjs` to run the focused suite, unit suite, build, full pinned browser suite, two actual-source copy-reversion mutants and final focused restoration check. The verifier saves every command output and source hash, restores panel bytes in `finally`, and fails if either mutation passes or restoration differs. Preserve all existing goldens. Parent owns the pinned full verification; no local browser/full-suite run is planned.

`node docs/prototypes/finished-copy/verify-final.mjs` is the pinned final command. It runs focused acceptance, `npm test`, `npm run build`, full `npx playwright test --workers=2`, then actual-source guidance and subtitle reversions (each focused run must fail), and focused acceptance again after exact source restoration. It retains individual command output, screenshot captures, source hashes and `SHA256SUMS` under a fresh evidence directory.

Final pinned verifier: focused 4/4, unit 429/429, build pass, full browser 96/96, focused after mutations 4/4. Guidance reversion failed all four viewport cases at the New game guidance assertion; subtitle reversion failed all four at the game-over subtitle assertion. Both mutants restored the panel exactly. Source SHA-256 before and after is `4fbf7f5fc3403c9b8e7dcdc1fd56eb81285bf8655282551243e4e459ace9fde2`. Evidence, command outputs, mutation causes and screenshots are retained and hashed in `docs/prototypes/finished-copy/evidence/final-2026-10-15T13-13-03.102Z-1/`. Existing golden assertions passed unchanged.

END Fix48 implementation complete: the finished panel has coherent game-over copy, actionable New game guidance, no stale steps, attack legend, hint or blocked-action title; winner, scores, battle log, seed, disabled controls, file actions, map freeze and seeded restart pass. Normal phases retain prior behavior and appearance. Focused mock proves the original fails and candidate passes; actual-source guidance and subtitle reversions fail then restore byte-for-byte. Unit/build/full browser are green. Ready for owner-selected MiniMax M3 thinking review.

## Fix45 stage 1

Plan: add the focused retry-validation acceptance and a disposable `generatedGame.ts` candidate with a byte-restoring baseline/mock replay runner under `docs/prototypes/retry-validation`. Cover the real seed1506 refusal, four invalid edits, genuine refusal retry, exact seed1994 opening recovery for human/computer settings, keyboard submit, viewport fit, screenshots and browser errors. Parent owns pinned browser baseline/mock. Hold permanent source edits until those results authorize stage2.

2026-10-15: added `tests/e2e/retry-validation.spec.ts`, `generatedGame.candidate.ts`, `replay.mjs` and prototype instructions. Syntax preflight: `node --check docs/prototypes/retry-validation/replay.mjs` exited0; `node_modules/.bin/playwright test tests/e2e/retry-validation.spec.ts --list` exited0 with the two configured viewport projects. No browser was launched. Original production source SHA-256 is `60b746e54082d8e668ab511752627f7171ac94a7a8e07a2181087973f5adeba8`; candidate SHA-256 is `5475681c5a9ec98c1181f50f7d3a66131c84d8674182bb6783fd39ffef8b71f3`. The temporary dependency symlink was removed.

END Fix45 stage 1 preparation: acceptance and replay are pushed for parent pinned baseline/mock. `src/ui/generatedGame.ts` is unchanged. Do not install the candidate permanently or run browsers locally; wait for the parent's pinned evidence and explicit stage2 authorization.

## Fix45 stage 2

Plan: install the preflighted candidate in `src/ui/generatedGame.ts`, document invalid Retry feedback and recovery in `docs/spike.md`, retain and hash the pinned stage1 evidence including screenshots, and add `verify-final.mjs`. The verifier runs focused acceptance, unit tests, build and the full pinned browser suite, then removes only Retry's invalid-feedback assignment as an actual-source mutation, requires focused acceptance to fail at its feedback assertion, restores the exact source bytes and reruns focused acceptance. Parent owns the pinned verifier run; no local browser or golden update.

2026-10-15: parent pinned preflight A passed the contract: baseline exit1 at the missing retry-feedback acceptance, candidate exit0 with both viewports passing, source SHA-256 `60b746e54082d8e668ab511752627f7171ac94a7a8e07a2181087973f5adeba8` restored exactly. Parent inspected retained empty-input human and computer captures. Added SHA256SUMS for both original replay directories; source and candidate hashes were preserved. Stage2 authorized by parent.

END Fix45 stage 2 preparation: candidate behavior is installed and the final verifier is prepared. Await parent pinned focused/unit/build/full-browser/mutation run before reporting completion; no existing goldens changed.

Stage 2 pinned implementation-A result: focused 2/2, unit 429/429 and build passed; full browser ran 98 cases with 96 passing and exactly two failures in the existing `tests/e2e/generated-game.spec.ts` refusal check. Both failed because the new empty `role=alert` paragraph made `getByRole("alert")` strict lookup match the generation error and empty feedback. Final-A evidence, full manifest/output and all captures are retained at `docs/prototypes/retry-validation/evidence/final-2026-10-15T13-39-17.170Z-1/`; `src/ui/generatedGame.ts` was restored byte-for-byte to candidate SHA-256 `5475681c5a9ec98c1181f50f7d3a66131c84d8674182bb6783fd39ffef8b71f3`.

## Fix45 stage 2 rework B

Plan: keep the new feedback node hidden while empty so the existing single-alert refusal contract remains intact; reveal it when Retry receives an invalid seed and hide/clear it after valid settings. Leave existing tests unchanged. Update the disposable candidate identically, assert the initial feedback is hidden in the focused acceptance, preserve/hash final-A evidence, then push for the parent pinned stage-B verifier.

2026-10-15: implemented hidden-until-invalid feedback in source and candidate, added an initial-hidden assertion to the new focused suite, and updated spike wording. The final verifier's mutation anchor remains the invalid feedback assignment. No previous evidence or goldens were changed.

END Fix45 stage 2 rework B preparation: ready for parent pinned `node docs/prototypes/retry-validation/verify-final.mjs`; final-A evidence retained unchanged and will be committed with SHA256SUMS.

Stage-B pinned results: focused acceptance 2/2, unit 429/429, build, and full browser 98/98 all passed; no goldens changed. The final-B verifier stopped before the mutation command because its anchor expected a single-line invalid branch after source changed to reveal feedback with a multiline block. Source SHA-256 was restored exactly to `5cbfa91d4d12489d9de1e09d3e03310e361cd57aebb74ce47b2da2abf33e61e8`. Full command output, screenshots, manifest and SHA256SUMS are retained at `docs/prototypes/retry-validation/evidence/final-2026-10-15T13-45-08.966Z-1/`.

## Fix45 stage 2 rework C

Plan: repair only `verify-final.mjs`'s mutation anchor to target the unique feedback assignment, and add `--mutations-only` so the parent can rerun focused acceptance before/after the mutation without repeating the already-green unit/build/full-browser checks. The default command retains all Done-when checks. Expected mutation failure is `toContainText`; the mutation empties the text while retaining the `hidden=false` reveal, then `finally` restores the source exactly.

2026-10-15: added the focused-mutation mode and documented its command. Final-B full green evidence and captures are retained for commit, with manifest showing 2/2 focused, 429/429 unit, build and 98/98 browser; verifier stopped before mutation due to the stale anchor. No production/test/golden edits.

END Fix45 stage 2 rework C preparation: parent can run `node docs/prototypes/retry-validation/verify-final.mjs --mutations-only`; default full verifier remains available for independent review.

Final-C pinned mutation result: the initial focused run passed 2/2; the feedback omission failed both viewport cases at the `.retry-validation` `toBeVisible` assertion (the empty paragraph has no visible height); exact source restoration returned SHA-256 `5cbfa91d4d12489d9de1e09d3e03310e361cd57aebb74ce47b2da2abf33e61e8`; the restored focused run passed 2/2. Updated the verifier to require that observed failure text. C manifest, full logs, captures and SHA256SUMS are retained at `docs/prototypes/retry-validation/evidence/final-2026-10-15T13-48-13.057Z-1/`. B had already passed unit429, build and all 98 browser tests; C reran only focused/mutation/restoration as authorized.

END Fix45 implementation complete: clicking Retry on a genuine seed1506 refusal now shows the existing actionable seed validation for invalid edits, keeps the field editable and stays on the refusal route. Valid retries preserve human/computer settings and exact seed1994 opening; genuine refusal and recovery, form keyboard submission, fit checks, screenshots and browser-error checks pass. Stage1 baseline failed and disposable candidate passed; actual-source feedback omission failed and restored byte-for-byte. `npm test` passed 429/429, build passed, full pinned browser passed 98/98, all prior assertions and goldens remain unchanged. Scope: `src/ui/generatedGame.ts` adds refusal-only feedback; `tests/e2e/retry-validation.spec.ts` proves invalid feedback, refusal, settings-preserving recovery and UI fit; `docs/prototypes/retry-validation/**` retains candidate/replay/verifier and hashed evidence; `docs/spike.md` records route behavior; `RUN-NOTES.md` records commands and outcomes. Ready for MiniMax M3 thinking review.

## T20 stage 1

Plan: add focused setup/generated-game help acceptance at both pinned viewports, prepare disposable source overlays and a replay that proves baseline red, candidate build/browser green, content/pause mutants red, and exact source restoration. Stop for parent pinned proof before permanent implementation.

- 2026-10-15: added setup choice/focus/scroll acceptance, actual match download and legal selection preservation, ordinary battle continuation, and computer pause/resume/load replacement/New game coverage. The candidate patches only temporary source files through `docs/prototypes/help/replay.mjs`; production sources are restored byte-for-byte after preparation. Parent will run the replay in the pinned image.

d6487fe: stage-one acceptance and disposable candidate scaffold committed. Parent replay: `node docs/prototypes/help/replay.mjs docs/prototypes/help/preflight-<unique-id>` in the pinned image.

END T20 stage 1 preparation: acceptance and disposable source candidate are ready for parent pinned baseline/mock proof. No permanent product source changes are authorized yet.

Preflight A pinned result: baseline setup acceptance 2 red; candidate build green; full candidate and restored suites 6 green each; content and computer-pause mutations 2 red each; all four production-source hashes restored exactly. Visual inspection found inherited dialog rise animation made the captured modal nearly transparent, and desktop `dialog { zoom: 1.3 }` clipped Close below the 1920x1080 viewport. All A logs, screenshots and restoration manifest are retained unchanged under `docs/prototypes/help/preflight-20261015-a/`.

T20 stage 1 B plan: keep the fix in the disposable candidate with scoped help-dialog `zoom: 1` and `animation: none`; extend focused geometry assertions for dialog and Close bounds and opacity at both scroll ends; retain top and bottom screenshots. Parent will run B in the pinned image. No permanent implementation yet.

Preflight A's retained logs, screenshots and manifest are now indexed by `docs/prototypes/help/preflight-20261015-a/SHA256SUMS`. B changes only the candidate, focused acceptance and prototype notes; the A evidence files themselves remain unedited.

d9ad5f9: retained and hashed A; added scoped help zoom/animation resets and top/end modal geometry assertions for B. Parent command: `node docs/prototypes/help/replay.mjs docs/prototypes/help/preflight-20261015-b`.

Preflight B passed pinned baseline, candidate build, candidate/restored focused suites, and both actual-source mutation proofs; source hashes restored exactly. Parent inspected top/end captures at 1280x800 and gameplay at 1920x1080 and confirmed the dialog is legible, fits the viewport, and keeps Close visible. B logs, manifest, screenshots, and SHA256SUMS are retained unchanged under `docs/prototypes/help/preflight-20261015-b/`.

## T20 stage 2

Plan: install the preflighted implementation only on generated setup and gameplay, document its shipped behavior, retain/hash the B evidence, and prepare a final-source verifier for focused, unit, build, full-browser, source-mutation, and exact-restoration proof. Parent owns the pinned run and any first-time generated Help golden refresh; no local browser or golden updates.

2026-10-15: installed accessible setup/gameplay Help, scoped modal fit/animation styles, and computer-turn pause/resume; updated README and generated-game documentation. `docs/prototypes/help/verify-final.mjs` runs the authorized checks, requires content and pause actual-source mutations to fail at their intended assertions, and records restoration hashes. B preflight evidence is hashed and retained unchanged.

END T20 stage 2 preparation: actual implementation and documentation are ready for the parent-pinned final verifier. The first pinned run may use `--update-goldens` for affected generated controls only; subsequent review uses the default no-update command.

71afef8: installed the generated-game Help implementation and retained/hash B preflight evidence. Parent final command: `node docs/prototypes/help/verify-final.mjs docs/prototypes/help/final-20261015 --update-goldens`; use a fresh output directory for reruns.

Final-A pinned run passed focused acceptance 6/6, unit 429/429 and build, then exposed one existing setup-fit failure: in the 1280x800 invalid-seed state, the added Help button increased document scroll height to 824px. The targeted generated-golden run otherwise passed 19/20. Exact logs, captures and source restoration hashes are retained and indexed at `docs/prototypes/help/implementation-20261015-a/`; the six allowed generated snapshots produced by that run remain uncommitted and untouched. Fix: place setup Help in the setup root as a positioned control outside the form flow; keep the opener inside the gameplay panel, and mount both dialogs at their generated view root. This prevents the setup form's error-state height from growing while keeping the control visible.

aa6985c: isolated the dialog from legacy layout measurements and restricted the authorized golden refresh to generated setup/gameplay suites. Final-A fit fix is ready for a fresh pinned B verifier run; no local browser tests or snapshot writes were performed.

Final-B pinned proof passed focused Help acceptance 6/6 at both viewports, `npm test` 429/429, build, generated-golden tests 20/20, and the full browser suite 104/104. Removing actual help copy failed the two setup cases at the expected missing-copy assertion; disabling the complete actual `pauseForHelp` behavior failed both computer cases when automation changed the downloaded replay while help was open. Restored focused acceptance passed 6/6. The final manifest records exact byte restoration: `src/ui/help.ts` SHA-256 `d90bc88385eb345e0ff5fdcf7ad2cfa6d86f08f5dfdad1b3737d5bb1fdc3dfca`, `src/ui/app.ts` SHA-256 `e6c1835e5340d1d444f992e87fe46446eb2cd24f08136e4da8c1fd93e343c95b`. Parent inspected setup at 1280x800 and gameplay at 1920x1080; both dialogs are readable and fit. Logs, restoration manifest and screenshots are retained unchanged and hashed at `docs/prototypes/help/implementation-20261015-b/`.

The six authorized generated screenshots change for the new top-right setup Help control and the gameplay-panel Help control: setup 1280x800 and 1920x1080, four-seat setup 1280x800 and 1920x1080, and generated gameplay 1280x800 and 1920x1080. Authored and generated-prototype goldens are unchanged. Retry-validation captures emitted during verification were preserved under ignored `screenshots/retry-validation-captures/`.

END T20 implementation complete: generated setup and gameplay have concise accessible instructions; native dialog close/Escape returns focus, preserves setup/match state and pauses/resumes only the active computer controller. Focused, unit, build, targeted-golden and full-browser checks pass; content and pause source mutations fail as required and restore exactly. README, `docs/spike.md`, `tests/e2e/help.spec.ts`, and `docs/prototypes/help/` document and retain the implementation and proof. Ready for MiniMax M3 thinking review.

## T21 stage 1

Plan: preserve the missing-package-command baseline, prepare the canonical acceptance harness and exact future release/config source as disposable `.mockfixtures`, then give the parent one replay command for the pinned Docker lane. The replay proves acceptance is red without the package command, candidate packaging and artifact-only browser tests are green, deleting the extracted JavaScript entry is red on HTTP 404, and every temporary checkout file is restored byte for byte.

2026-10-15: the initial `npm run package:playable` baseline exited 1 (`Missing script: "package:playable"`) and is retained with its output. Added the acceptance, package, launcher, PLAY and release Playwright config candidate under `docs/prototypes/playable/stage1-20261015/.mockfixtures/`; `replay.mjs` installs those exact bytes temporarily and retains command output, captures, and hashes in a unique evidence directory. Node syntax checks passed for the four `.mjs` scripts. This worktree has no local `node_modules` or `dist`; the parent runs the functional replay in the pinned image.

END T21 stage 1 preparation: candidate replay command is `node docs/prototypes/playable/stage1-20261015/replay.mjs`; run from the checkout in `mcr.microsoft.com/playwright:v1.63.0-noble` with Node 22 and shared `node_modules`. Permanent release/config/packager files remain pending the parent's pinned baseline and candidate proof.

Parent pinned replay A built the package candidate but could not read Git metadata because the Docker mount omitted `.git`; source files were restored exactly and A was retained unchanged. Replay B mounted `.git` read-only and reached acceptance, which exposed a JavaScript-reference scanner false positive: a minified object property named `from` was treated as an import. The fixture scanner now recognizes only static import/export declarations and dynamic imports; the A/B evidence remains unchanged. Parent will run a fresh C replay.

## T21 stage 2

Plan: install the pinned C candidate byte for byte, add the package command and recipient documentation, test the extracted artifact in CI before uploading that exact archive, and provide a final-source verifier that records all Done-when commands, captures, mutations, restorations, and hashes in a fresh tracked directory. No local build or browser checks.

2026-10-15: parent C passed acceptance and the 104-test extracted-artifact browser suite; removing the extracted JavaScript entry produced the intended HTTP 404 and the entry and temporary source files were restored exactly. A/B/C replay evidence is retained unchanged. Installed the candidate acceptance, packager, launcher, release config, and PLAY instructions; added `npm run package:playable`, anchored generated output ignores, the shareable-build docs, CI artifact acceptance and extracted-browser steps, and `verify-final.mjs`. No local build, npm suite, or browser suite was run.

The owner corrected the setup documentation to match current choices: 2–4 seats with either all-human play or one human against computer opponents. The launch guide now explains initial reinforcements, spending on owned territories, and choosing Start combat before an attack; `docs/play.md` and bundled `PLAY.md` carry the same play sequence.

END T21 stage 2 preparation: parent final command is `TMPDIR=/artifact-evidence node docs/prototypes/playable/verify-final.mjs docs/prototypes/playable/final-<unique-run>` from the checkout in the pinned Playwright image with Node 22, shared `node_modules`, and the read-only Git metadata mount. The verifier writes logs/captures/hashes under the fresh checkout evidence path and leaves the extracted artifact under the persistent `TMPDIR` mount.

Final-A pinned verification passed with `TMPDIR=/artifact-evidence node docs/prototypes/playable/verify-final.mjs docs/prototypes/playable/implementation-20261015-a`. Packaging acceptance verified 9 files, 8 SHA-256 entries, and 4 HTTP paths on loopback port 4175; archive SHA-256 was `a4f0089d268ccb1b8b47b97ccbfc6ecf7712503f72a1c1b87d678d69c2587312`. The extracted-artifact Playwright suite passed 104/104. Removing `assets/index-Zf6fQR5q.js` made acceptance fail as intended with HTTP 404 and exit 1; restoring it returned SHA-256 `ca1e2455cc17b14fcbc81a1939645b3b894cf35fc60301a8d54d8b42c095bcee` exactly, after which artifact acceptance passed again. `npm test` passed 429/429, `npm run build` passed, and the unchanged source Playwright suite passed 104/104. Full logs, captures, command manifest, archive inventory and hashes are retained unchanged under `docs/prototypes/playable/implementation-20261015-a/` and indexed by its `SHA256SUMS`.

END T21 implementation complete: `npm run package:playable` builds a fresh static bundle and creates `release/malpaco-playable/` plus `release/malpaco-playable.tar.gz`; recipients can extract it and run its dependency-free Node 22 loopback launcher without the checkout, npm install, Vite, or network assets. CI tests the extracted artifact before uploading that archive. Recipient and project documentation explain setup, human/computer play, help, save/load, New game, supported desktop sizes, and current limitations. Final pinned acceptance, artifact-only and source browser suites, unit tests, build, entry-asset mutation and exact restoration all pass. No existing browser assertions or goldens changed. Ready for MiniMax M3 thinking review.

## T21 CI rework

2026-10-15: MiniMax approved the local Done-when evidence with no blocking findings, but CI run 38761364410 failed packaging because Git rejected the root-owned `/work` checkout as dubious ownership. The package step's temporary HOME did not contain checkout's temporary safe-directory setting. Updated `tools/release/package-playable.mjs` to invoke `git -c safe.directory=<computed checkout> rev-parse HEAD` and include captured stderr if Git still fails; applied the identical fix to the disposable package fixture. New red/green Git probe and CI failure excerpt are retained and SHA-indexed under `docs/prototypes/playable/implementation-20261015-b/`. No local tests were run; parent will run pinned root-container package acceptance and the targeted review/browser proof. All prior A evidence and its SHA256SUMS remain unchanged.

Parent root-container package acceptance passed at `d92e2231440a777c56e64049480bb58d1bb86e5c`: 9 package files, 8 SHA-256 entries, 4 loopback HTTP paths, launcher ready at `127.0.0.1:4175`; archive SHA-256 `516e086ab1178efc406273e9b203595968643abc409072cc6faa5ca7a01e4ed3`. The exact parent log is retained as `docs/prototypes/playable/implementation-20261015-b/root-container-package-acceptance.txt` and added to that directory's SHA256SUMS. Existing B evidence files and their bytes were not changed. CI rerun and parent artifact-browser/review checks remain pending.


## T23 — main session implementation, Kimi independent review

Plan: enumerate the four pinned canonical designs independently; map every requirement to existing code/tests and destination tasks; retain gaps and owner questions; implement a strict coverage verifier. No production changes. Owner selected the main session to implement and Kimi 1M to review (2026-10-15).

Preflight: 24 parent-authored tests exercise coverage, citations, mappings and provenance. A fixture mock passes 24/24; a completeness-only fake passes the positive control but fails all 23 negative controls. Both temporary verifiers were removed. Tracked transcripts: docs/plans/new-game/inventory-evidence/preflight-*.txt. Missing future files on main are not counted as behavioural red evidence.

T23 implementation: independently enumerated 540 canonical source units (109 core, 84 variety, 136 computer, 211 UI); compared against clean commit 12fed5a. Added sealed coverage verifier, 16 small matrix files, reuse overview and source/mutation audits. All 24 tests pass; four real matrix mutations fail, then byte-identical restoration passes. No production files changed. Found per-country handicap transfer mismatch for T44; preserved G degree-six conflict for T24/T25.

END T23 implementation
- Deliverable: approved-rule matrix, independent manifest, verifier/tests and retained audits.
- Checks: 540/540 coverage, zero unexplained omissions; 24/24 node tests; four rejected actual-matrix mutations with exact restoration; git diff --check clean.
- Remaining gate: independent owner-selected Kimi 1M review and green CI before merge.
- Handoff: production unchanged; T24 needs owner decisions after constraint feasibility evidence; T44 owns the observed transfer discrepancy.


## T24 parent preflight — main session, Kimi 1M review selected

Owner continued the sequential main-session implementation / direct Kimi 1M review workflow. Isolated branch task/T24-geography-contract-and-constraint-feasibility-probe. Plan: preflight one bypass per named constraint before implementation; establish a numerical contract with the owner; probe without production algorithm changes; retain genuine failures and witness/source hashes.

Parent smoke: existing generator body returned 100/100 seeds 0..99 at one observed attempt each. Current UI layout minimum separation at assumed 800x460 board: 29.588 CSS px Euclidean / 28.884 maximum-coordinate distance. Pinned island-neighbour maximum is four, while implementation guards permit five; none of this sample violates four. Full-contract feasibility is not established by this smoke. Numerical proposals and measured evidence retained under T24. Acceptance preflight remains incomplete until the unspecified label/geometry budget is agreed.

T24 parent graph preflight: 42 tests over counts/symmetry/connectivity/degree/crossings/bonus/fortress/concentration/remoteness/crowding. A fixture-matching mock passes all 42; an accept-everything mock fails all 32 negative controls, leaving the 10 positive controls green. Temporary contract.mjs mocks were removed. The graph control has no geographic geometry and must never be claimed as a joint feasibility witness. Geometry, coast and label acceptance preflight is pending the owner's numerical contract decision; no implementer guard or production algorithm was dispatched and no Kimi review or CI run started.

T24 owner decision: accepted the numerical proposal for the first iteration (40px hit squares, 44px spacing, 800x460 board, tolerances, >=99% within 50 candidate attempts as a target). Parent geometry controls added before checker implementation: 82 tests total across all 15 constraint groups. Fixture mock passes 82/82; permissive checker fails all 67 negative controls and passes 15 positive controls. Temporary contract.mjs mocks removed. The hand-arranged witness and independent rectangle/visibility construction are test controls, not a production generation algorithm or 100-seed success claim.

T24 checker batch: implemented independent graph and polygon/route/label checks under the task-owned prototype path. All 82 parent controls pass; the hand-arranged 46-country witness passes every one of the 15 constraints jointly. This proves one schematic arrangement, not a generated-board rate. No production code changed. Next: existing implementation sweep, retained candidate hashes/failures, exact guard-deletion mutations and independent Kimi review.

T24 measurements: authoritative sweep evidence/runs/run-bbMp5F records 100 seeds / 5,000 attempts / zero fully geographic successes. One fixed witness passes all 15 groups. Cells/borders/coasts/intersections/labels fail every candidate; remoteness fails 157. Prototype + production source hashes are checked unchanged over the run. Preliminary run-NKe9GQ retained separately. Two extra red-before/green-after regressions cover an explicit tiny slit below the area-sum tolerance and infinite text size; source-centre route rejection is also tested. 85/85 tests pass; all 15 guard-deletion mutants fail through assertions and restore exact source bytes. Every task pattern command passes. No production changes.

END T24 implementation
- Delivered: first-iteration approved parameters; independent guard tests/checker; fixed geometric witness/SVG; bounded existing-generator sweep; per-seed attempts/failures/hashes/timings; mutation/restoration evidence.
- Acceptance: full diagnostic probe exit 0 with targetMet=false and witness valid; all 15 pattern commands pass; all 85 tests pass; 15/15 guard-deletion mutants killed; git diff --check clean.
- Remaining gates: independent Kimi 1M review and green required CI before merge. Owner review of the resulting feasibility evidence is required before downstream generation algorithms; 99% target is not demonstrated by this existing layout.

T24 rework R1 (Kimi 1M round 1, 11m40s, rework): reproduced all original 85 tests passing after deleting only spacing's scale multiplication. Added an isolated 0.8-scale control where 40px hit squares still fit and the 44px gap is the sole refusal; the same mutant now fails. Mutation runner now kills 16/16 variants (15 groups + scale-only), restores exact source bytes, then passes 86/86 tests. All named acceptance patterns pass and every authoritative probe source hash remains unchanged. R2 historical 82-test count is preserved accurately; R3 unknown contrast remains documented for T52. No production/checker/probe behaviour changed. Evidence: T24/evidence/rework-r1 and mutations/run-Po8FYb. Return to the same owner-selected Kimi 1M for fix verification.

## T22 stage 1

Plan: retain the supplied seed/state/probe bytes with provenance and hashes, independently recheck island land-graph embedding feasibility, and prepare the strict acceptance verifier plus a disposable self-contained candidate HTML fixture. Parent runs baseline absence, candidate replay, selected-neighbor mutation and byte restoration in the pinned Playwright image. No local browser, npm suite or build; no push until parent clears CI cost controls.

2026-10-15: copied evidence from `/tmp/malpaco-map-study` into `docs/prototypes/map-1994/preflight-20261015-a/input/`. Their SHA-256 hashes are in the neighboring provenance record. The independent exhaustive cyclic-rotation/Euler check passed its K4 planar and K3,3 non-planar controls; seven seed-1994 island graphs are planar, while Cliff Isle and Great Isle are not. The output and checker are retained with hashes. Confirmed the edge case: Iron point has land edges to South rest and High shore, sea lanes to Lower field and Blue peak; Silver shore has no sea lane, so the perceived Iron point/Silver shore connection is a display ambiguity.

Prepared `docs/prototypes/map-1994/verify.mjs` and generated self-contained candidate `fixtures/candidate-b/preview.html`; the exact candidate SHA-256 and builder/input hashes are in its manifest. The verifier covers both required viewport sizes, exact selection feedback for all 46 countries, geometry and coastal-route assertions, topology differences, captures, and SVG export. Missing `preview.html` intentionally fails. Node syntax checks passed for verifier, geometry checker, candidate builder and embedded HTML script; `git diff --check` passed. No browser, unit, build or push was run. Candidate remains in fixtures; owned-root `preview.html` is not installed pending parent's replay.

END T22 stage 1 preparation: ready for the parent's pinned red/green/mutation/restoration proof. Stage 2 remains pending those results and the parent's authorization to install identical candidate bytes.

T22 stage 1 addendum: added `docs/prototypes/map-1994/replay.mjs` so the parent can perform that proof with one command. It records baseline-missing, candidate-green and neighbor-feedback-mutation runs, screenshots/SVGs, command logs and hashes under one fresh evidence directory, restores the exact candidate bytes in `finally`, and leaves the owned-root preview absent. The parent command is `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-b` in the pinned Playwright image with shared `node_modules`. Replay itself was not run locally.

T22 candidate D: retained the rejected B and prior C captures unchanged, then added a landscape full-width map candidate with island-specific broad coast shaping, Voronoi shared-border cells, compact owner/army labels, truthful current-route rendering and a name-based proposed topology diff. The parent captured D at 1280×800; that screenshot is retained under `docs/prototypes/map-1994/render-20261015-d/`. Candidate source and standalone preview are under `docs/prototypes/map-1994/fixtures/candidate-d/`. The verifier now measures actual label boxes in SVG coordinates and checks them inside each province with a 2px screen margin, checks distinct-island overlap, current graph fidelity, sea endpoints on province and island coasts, proposed archipelago connectivity, and reports current/proposed province/island degrees. Replay now uses the D fixture and mutates the one actual neighbor-feedback site. These checks remain unrun locally; parent pinned command: `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-d` in the pinned Playwright image with shared `node_modules`. The first candidate render showed the intended clearer direction; acceptance may identify exact remaining label rectangles to fix before owner handoff.

T22 D pinned result was `baseline red / candidate red / selected-neighbor mutation red / exact restore / preview absent`; all evidence remains under `preflight-20261015-d/`. Four text collisions and 26 unsafe label boxes were reported. The overlap predicate also over-counted shared-edge endpoint roundoff because raw cross products were multiplied; inspected province_4/province_30, whose matching shared vertices differed only at ~1e-14, then changed the test to compare signed perpendicular distances and added positive-overlap/touch/separation controls. The D capture and fixture are immutable. Candidate E source (`fixtures/candidate-e/`) keeps the map design and changes only the label packing to use a narrow two-line name with its army count on the second row when a single-line label cannot fit. The parent owns the E capture and pinned replay; no local browser run. Syntax-only `node --check` passed for replay, verifier and E geometry builder.

Candidate E source generation succeeded with no unsafe-center fallback: the builder searches for estimated full-label-rectangle placements and stops if a country cell cannot fit either the compact one-line label or the two-line-name/inline-count layout. The seven-country and ten-country sites now use 2-3-2 and 3-4-3 row layouts; Palm, Central, Harbor and Great Isle have more room for those cells. Source builder, template, generated standalone preview and input JSON hashes are retained in `fixtures/candidate-e/SHA256SUMS`. Acceptance of E and its actual rendered label bounds remain pending the parent-pinned replay `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-e` and parent visual capture. No local browser tests were run.

T22 candidate F: retained the parent's E replay output unchanged after its pinned run isolated actual label-box escapes to Silver shore (province_20), Silver ford (province_6), and Fort town (province_18). F changes only those three labels to a compact two-line name with a centered army count, plus their CSS/anchor geometry; the builder requires a 40×52 fit-search placement and the strict actual-box verifier is unchanged. README now discloses current 61 land + 16 sea edges versus proposed 69 land + 16 sea edges, degree 6, and the need for owner review of exact changes without a balance or preservation claim. Candidate builder/template/HTML are under `docs/prototypes/map-1994/fixtures/candidate-f/`; replay selects that exact preview. No local browser was run. Syntax checks for builder/replay/verifier and `git diff --check` pass. Parent pinned command: `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-f`.

- Owner requested preserving all first drafts on GitHub. Recovered T22 branch into project-local .cache/t22-drafts after /tmp cleanup. A-F sources and B-E evidence already tracked; regenerated F pinned replay in preflight-recovered-f: baseline red, candidate green, mutation red, exact restoration all passed. Archived screenshots/SVG/reports with hashes and added README gallery. Original uncommitted F captures lost; regenerated captures explicitly identified. No production changes or merge.

T22 candidate G: owner approved F's overall map direction and requested sea-lane endpoints at the centres of their coast-facing regions. G copies F, pins its exact 16 country-pair sea topology, identifies each linked province's exposed boundary chain from province/island polygon overlap, and places the endpoint at that chain's arc-length midpoint on the side facing the linked island. The builder refuses a missing coast chain, changed F lane count/pairs, or an unrelated-land/lane crossing. The verifier independently recomputes facing-chain arc midpoints, compares every start/end, and asserts G's route pairs equal F; existing exact coast and unrelated-land assertions remain. Candidate generation succeeded for the fixed 16 pairs without a reported crossing. Syntax checks for builder/verifier/replay and `git diff --check` pass; no local browser was run. Parent pinned command: `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-g`.

T22 candidate G: owner approved F overall map direction and asked to centre island links on endpoint-country coasts. G retains F exact 16 province-pair sea topology, finds each endpoint province exposed boundary chain from province/island polygon overlaps, and uses the arc-length midpoint of the chain facing the linked island. The builder refuses a missing coast chain, changed route-pair set, or unrelated-land/lane crossing. The verifier independently recomputes the facing-chain midpoint for each endpoint and checks route pairs against F; existing coast and land-intersection assertions remain. Candidate generation succeeded for the fixed route set without a reported crossing. Builder, verifier and replay syntax checks and `git diff --check` passed. No local browser run; parent pinned command: `node docs/prototypes/map-1994/replay.mjs docs/prototypes/map-1994/preflight-20261015-g`.

T22 archive correction: the previously completed candidate-G pinned replay remained untracked when the session pivoted to the new-game plan. Preserved its original screenshots/SVGs, topology/geography reports, logs and replay-result.json in preflight-20261015-g, added SHA256SUMS and README gallery links. Rechecked candidate and restored hashes equal 94106c6c8797e8640934f51fcd582ec96b222aa70e4ac9302e74085394a58763; missing-preview red, candidate green, selected-neighbour mutation red (92 findings), exact byte restoration and absent final preview are all recorded. No measured output overwritten, no browser rerun, no prototype code/topology or production changes. G remains a visual draft with disclosed degree-six countries, not T24 compliance or merge approval. Owner's standing instruction to preserve valuable drafts on GitHub applied.

## T22 resumed final installation

Main session resumes in the isolated T22 worktree under the owner’s standing choice, with direct Kimi 1M selected for independent review. Install preview.html byte for byte from retained G (SHA-256 94106c6c8797e8640934f51fcd582ec96b222aa70e4ac9302e74085394a58763), update opening/verification instructions, then run final pinned browser acceptance, unit tests and build in a fresh tracked evidence directory. Existing G replay already proves missing-preview red, candidate green, selected-neighbour mutation red and exact restoration. All old measurement files remain unchanged, including whitespace in raw stderr. No production changes, no claim of T24 compliance, no owner visual approval or merge yet.

T22 final verification: pinned Playwright 1.63.0-noble (Node 24.20.0, satisfying package Node >=22) accepted all 46 provinces/nine islands at 1280x800 and 1920x1080, including exact selection, geometry, topology disclosure and all 32 facing-coast midpoint checks. Final-A unit/build startup failed because dependencies were mounted read-only and Vite writes .vite-temp; retained those logs unchanged. Final-B reran only unit/build with temporary writable Vite caches: 429/429 tests and build passed. Final captures, SVGs, reports and both run logs are SHA-indexed. Parent inspected the 1280x800 capture. Preview bytes match retained G exactly. No production changes. END: implementation prepared for independent Kimi review and owner visual judgment; no later task dispatched.

T22 integration preparation: merged current main before technical review. Only RUN-NOTES.md conflicted; retained main notes byte for byte and appended all T22 notes from the branch unchanged. The early Kimi session was stopped before any final review when this CI-blocking conflict was found; no findings or approval were produced. Reviewer will run on the mergeable final head. Production and installed preview bytes unchanged.

## T25 parent preflight

Owner approved T22 visual direction and requested continuing sequentially. Main session implements (openai family), direct Kimi 1M reviews under standing choices. Plan: prepare acceptance reusing the immutable T24 contract plus seed identity/opening-state checks and exact graph/bonus/entrance/articulation/bridge diagnostics; prove G negative and a labelled schematic mock positive before dispatch. Then construct a single compact reference with shared cells and centred water routes, retain every run, review and obtain exact topology/look approval before T26. Only owned prototype files and append-only run notes may change.

T25 parent preflight passed: actual retained G graph/geometry rejected by static and browser contracts, independently labelled T24 schematic mock accepted by both, five identity/opening/diagnostic tests passed. Three separate HTML negative controls (keyboard selection deleted, neighbour styling deleted, rendered name changed) fail their intended browser assertions; original mock bytes are unchanged. Browser checks include all 46 click/Space/Enter selections, arrow focus, exact rendered paths/ownership/ports and label bounds at both desktop sizes plus the compact 800x540 frame. Prior outputs retained unchanged, hashes indexed. Parent acceptance prepared before reference implementation.

T25 construction draft v1: all T24 groups passed after binary-rational geometry/port representation avoided floating intersection slivers; exactly 16 endpoint options were needed, with midpoint errors inside the unchanged 1px tolerance. A first unconstrained search was stopped and fixed geometry was checked separately; bounded failed runs and their outputs are retained. Browser then exposed label boxes escaping bevelled/sloped cell corners at all three sizes. Draft captures, JSON/SVG/HTML, source snapshot and hashes are preserved as first drafts, not visual approval. The parent judged the rectilinear shape a regression from G and will improve coastal silhouettes and subdivision layout without relaxing geometry, label or fairness checks. CI audit is recorded separately as #108; no T25 CI runs have been triggered.

T25 rounded reference: build-4sl7nH passes all 15 T24 groups, original identities/opening state, degree 2–5 and island-neighbour cap four. Land 61→61 with 28 added/28 removed; sea 16→16 with 14 added/14 removed; extra crossings use existing nearby island pairs. Harbor/Palm/Great bonuses recompute to 5/6/9, total 42 versus 38. No global articulation points or bridges. Actual installed source passed pinned browser acceptance at both desktop sizes and 800x540. mutations-CwJOLd: baseline green, seven intended negative assertions red, restored static/browser green; preview and board hashes restore exactly. All failed drafts, route/packing attempts, captures, source snapshot and diagnostics retained; manifest and versioned SHA index added. T24 zero-length projected residual false refusals are reproduced in #109; no upstream checker or tolerance changed. Only the T25 prototype and appended run notes change. CI savings audit is #108; keep all iteration pushes skip-ci and defer the single full CI run until technical and owner approval to avoid spending Actions minutes on rejected visual drafts.

T25 archival formatting: two failed-run SVG/HTML exports contained whitespace-only lines. Kept their raw local files unchanged and stored exact originals in adjacent raw-drawings.tar.gz, verified extracted bytes/hash equality, with explicit manifest and scoped ignores. No original measured bytes were normalized/deleted, and the staged source whitespace check now passes without weakening the check. v3 indexes all tracked evidence, including that archive; older v2 paths can be reconstituted from it.

T25 full-branch whitespace audit found the same empty-route drawing whitespace in the earlier committed build-pKqzUo draft. Preserved its SVG/HTML bytes in a verified adjacent archive as well, retained the untouched local originals and prior Git history, documented extraction for older SHA indexes, and added v4 covering the tracked archive form. No source/acceptance/proposal bytes changed.

END T25 implementation: one original seed-1994 reference passes static contract, rendered click/keyboard/label/route checks and seven negative controls with exact restoration. Exact topology/bonuses and immutable drafts are published; full-branch whitespace and owned-scope checks pass. Ready for owner judgment and direct Kimi 1M technical review. Do not integrate into T26 or merge before both approvals and the final required green CI.


## T60 parent preflight

Owner explicitly requests Sol High investigation of fundamentally better topology-first drawing; T59 technical merge/CI held. Main pins the exact owner-selected 15-link graph, opening and reference images with provenance. Acceptance pipeline computes route length/directness, bends, pairwise separation, unrelated-coast clearance, competing endpoint regions and unchanged T24 diagnostics, separating visual proxies from owner judgment. Parent tests known right-angle, crossing and parallel geometries. Existing reference-only study fails comparison requirements; disposable translated mock passes verify/capture; duplicate geometry, changed opening/graph and missing candidate views fail. Mock is pipeline evidence only, not claimed research. Sol begins read-only graph analysis while main prepares this contract; no prototype edits before dispatch. All outputs preserved in owned paths and hash-indexed.


## T60 original comparative construction

Sol High (owner-selected override) implements in the isolated T60 worktree. Plan: compare the exact pinned graph in a common renderer; construct coast-first envelopes and an independent graph-contact dual; evaluate paired gate presentation as a third approach; preserve all drafts and compare route length, bends, crossings/branching, coast clearance, endpoint competitors and unchanged T24 diagnostics. No production or original-game material changes. First drafts build-r7gBIB and build-U79PP6 retain source snapshots and failed label packing; neither is an approved fixture. Both preserve every actual positive-length land border. A reduces route length substantially with direct, separated ports; B demonstrates exact contact construction but produces narrow cells. The reduced-radius dual experiment worsened label packing and was rejected. build-SNZFL5 restores the original dual radius and broadens A’s coast envelopes without relaxing label/hit targets.

T60 comparative result: final coast-first A671px total routes versus baseline1332px, zero bends/route contacts, minimum route24px and zero rendered label escapes at800×540/1280×800. Exact graph-contact B898px preserves every actual land adjacency but has21 hit-square and7 spacing failures, plus23 rendered label escapes; rejected as usable fixture. Paired shore gates C are captured as a deliberate schematic variant. Ports-only D584px on unchanged land isolates the dominant port-selection effect but has a5px crossing, proving shortest length alone is insufficient. All new endpoints continue12px into the intended country; baseline misses2/30. Competing-country margin falls27px→about10px, a disclosed tradeoff. Midpoint conflicts remain30/30/29; A/B projected residual diagnostics remain reported, with zero area mismatch. No T24/source/production or CI changes.

END T60: two original construction candidates, three materially different approaches, ports-only ablation, matched baseline/candidate captures and close-ups, browser label/selection measurements, primary citations, preserved failed drafts, hashes and decision-oriented recommendation delivered. Parent verification and metric tests pass; pinned browser captures have no runtime failures. All five comparison views load46 countries/15 routes. A fresh build using the preserved original malpaco T25 template reproduces all four board JSON files byte for byte. Full branch whitespace/scope checks pass. PR114 is for technical review and owner appearance/contract decision only. No merge, CI run, production integration or downstream task was started.

T60 parent handoff audit: main read Sol final report, inspected original A/B/D compact images and independently reran verify plus known-geometry metric tests. Same pinned graph accepted; full-branch whitespace clean. Retained fresh verify-Ns3OJS and versioned hash index. A appears easier to trace, but this is not owner approval and current midpoint/numeric diagnostics remain explicit. Prepare independent Kimi review of the investigation conclusions and disclosures; no final CI, merge or downstream implementation dispatched.

T60 independent review: Kimi1M approved 7e8875c, all DW scripts rerun and route/constraint/provenance metrics reproduced. Nonblocking R1: builder intentionally repoints tracked study.json, so prior index becomes stale after local reproduction; main documented saving/restoring actual selector bytes or publishing a fresh index. Versioned v4 covers current README, earlier indices retained unchanged. Reviewer disclosed no full line-by-line read of builder/render/verifier; main read builder and original parent verifier in addition to reproduced outputs. Research recommendation remains bounded, no owner appearance approval, no final CI or merge. END: investigation and comparative artifacts complete; await owner choice before any implementation/contract changes.

## T61
Main session implements, MiniMax M3 reviews, per owner 2026-10-16. Plan: reproduce arithmetic residuals, retain gap/overlap bypass controls, correct projection, independently review and run final CI. Parent preflight: A fails eight interior-boundary checks; dot-product mock passes all seven regression cases. Geometry bytes restored after mock.
T61 correction: dot-product denominator avoids sqrt/square rounding. All 93 tests pass; projection, gap-bypass and overlap-bypass mutants killed and geometry bytes restored. Existing tolerance/checker/test files unchanged.
END T61 implementation: one-line projection correction; 93 checks green, three killed mutants. All files owned; old T25 machine-local draft unavailable, published T25 retained instead and disclosed. Await independent MiniMax review and green final CI.
T61 MiniMax M3 approved commit 999793b, R1 informational: synthetic controls already passed; retained A is the bug trip-wire. Parent found raw-log whitespace missed by working-tree-only git diff --check; retained four exact logs in lossless archive with member hashes, loose originals ignored. No geometry/test changes after review.

## T62 parent preflight
Owner selects native Sol High implementer and MiniMax M3 reviewer. Parent acceptance covers country attachment, water, route tracing and unaffected T24 guards. All five commands fail without implementation, pass on an explicitly fake equality mock, and four bypass groups reject an empty guard. Mock files removed; exact outputs retained in preflight raw archive. Numerical proposal and visual approval remain separate owner decisions.

## T62 proposed coast-entry contract
Owner-selected native Sol High implements in the isolated T62 worktree. Plan: replace only the dependent midpoint prescription with measured country attachment and independent route proxies; preserve all unaffected T24 guards, original A/baseline and parent tests. No generator, production, renderer or reference geometry change. Numeric limits remain designed proposals requiring owner approval before T63.
T62 first construction: proposed 8px competing-country margin, 12px whole inward continuation, 20px direct endpoint span, 10px unrelated-coast clearance and all-pair route separation. Retained probe-eSYf7Z reports A green in all four groups, baseline attachment2/water1/traceability7, preserved0; A retains30 legacy midpoint conflicts. Parent26 controls and28 added boundary/delegation controls pass. Exact per-category legacy error comparisons prevent fairness refusal masking. README records rationale, scope, tradeoffs and evidentiary limits; parameters/checker/probe/tests serve only this contract. Next: mutation proof, retained full acceptance and hashes.

T62 verification batch: added independent CSS scaling and explicit ambiguous-junction controls; probe now also exits red for any failed A criterion. audit.py/validate.py retain fresh, lossless archives and per-member hashes. Both mutation batches kill35/35; final mutations-zpbad1le demonstrates all34 added tests fail without a relevant behavior, then exact checker-byte restoration and60 T62 tests green. acceptance-it47nb_p runs every DW command,153 combined T62/T24/T61 tests, working/full-branch whitespace checks and an empty immutable-parent/legacy diff. Final probe-S8fFXb reproduces all numeric values/conflicts; reviewed F022 source/search hash saved without importing original material. pr-body.md is the reviewable PR121 description; artifact index covers the complete owned output set.
END T62 implementation: all requested checks pass, parent tests/preflight and T24/T60/T61 unchanged. Proposed8px competitor/12px inward/20px direct span/10px unrelated-coast and route-pair limits await owner approval after MiniMax review; A passes while30 old midpoint conflicts stay disclosed. No production/generator integration, comprehension claim, final CI, merge, reviewer invocation or downstream task.

T62 PR formatting correction: the first description generator lost Markdown command fences to shell substitution. Corrected only the mutable PR description with prepare-pr.py, preserving every checker/test/measurement/archive byte. Original artifact index retained historically; artifacts.v2.sha256.json covers the corrected description and renderer script. Working, staged and full-branch whitespace checks pass.
T62 parent audit: native Sol High final 881cfaf read; independently reran full acceptance (153 tests), probe and all 35 mutations. Found v2 index included ignored loose preflight logs; retained it and created portable tracked-file v3 index plus archive-member verification. No guard/test changes; MiniMax review follows.

## T63 parent preflight
Main session implements Medium task; MiniMax M3 reviews, owner-selected. Missing constructor/page fail, explicit T25 UI mock with exact A passes final strengthened guard at800/1280/1920. All46 click/keyboard countries, actual40px hit corners, visible labels/counts/neighbours/routes, export byte equality and controls checked. Eight source/DOM/input negatives reject; source restored exactly. All mock bytes archived before removal. Plan: retain A SVG, construct self-contained final wrapper, reproduce and mutate final source/DOM, review, one final CI.
