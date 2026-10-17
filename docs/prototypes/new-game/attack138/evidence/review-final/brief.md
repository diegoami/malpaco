Attack interaction review (MiniMax M3)
Review PR #146 at 2e41aae90a5be07060cd9f8939e2412fec0152ae, independently from main/OpenAI. Owner selected main implements and MiniMax reviews. Full task contract below.

0. Prove exact HEAD/worktree and diff vs origin/main; read CLAUDE.md and process. Findings name changed files. Readability145 has merged; no readability/task-contract diff remains here.
1. Rerun every Done-when. DW1: python3 docs/prototypes/new-game/attack138/run.py (18 real input cases). DW2: ATTACK_COMPATIBILITY=1 python3 docs/prototypes/new-game/attack138/run.py (78 affected cases incl DW1). Never update goldens. DW3: python3 docs/prototypes/new-game/attack138/checks.py and python3 docs/prototypes/new-game/attack138/inheritance.py.
2. Core/rule values/RNG/controllers/saves, T63 geometry and all goldens must stay unchanged. New optional activation metadata is reference-only; other MapHandlers consumers ignore it. Inspect actual old-route input semantics.
3. Sweep all changes and the exact six recipe amendments vs originals. Shift selection before separate-control tests and direct activation in victory driver are declared; assertions/expected states/fixtures/timing remain unchanged. New test-focus correction and stronger capture proof are disclosed, not a removed assertion.
4. Independently delete a newly protected behavior in actual source, clean rebuild and show behavioral failure, then restore exact saved bytes in finally. Audit all six author controls and corrected explicit capture negative. Preserve your own script/sources/results under task evidence; do not lose measured results on cleanup.
5. Account for every browser result, not only the new UI. Compare state/history/RNG using real downloads; inspect capture's explicit min/intermediate/max/save/upload and computer gate/refusal/Stop. No test-only compatibility URL. The only late source change after78authorpass restored original phase-neutral idle copy; focused4cases passed afterward. Additional ShiftSpace is covered in final keyboard2cases. Rerun current full78.
6. Check source/run hashes and ownership; output artifacts under docs/prototypes/new-game/attack138/evidence. Local hook retains this scoped directory before cleanup. Use saved bytes or scratch files under this owned path; never git checkout/restore/reset uncommitted work. No GitHub writes, other review/provider/CI dispatch or unrelated work.

The Docker runner binds main node_modules read-only and uses tmpfs Vite caches. For npm checks create a local node_modules symlink to /home/diego/projects/malpaco/node_modules if needed; do not install dependencies. The agent grants /tmp and /home/diego/projects/malpaco/* for the required shared mount. All author failures/sources/captures are retained; no paid rerun is needed for transcript grammar. Appearance is the owner's; coastline111/borders117 remain required before presentation. Issue66's approved G visual direction is background for that later map work, not scope for this review.

## Blocking means
Any failed Done-when or unaccounted command; direct enemy activation fails to produce exactly one ordinary exchange; repeat requires reselection; Shift issues an attack; held-key repeat adds attacks; incorrect exact logical state/history/RNG; invalid/friendly/one-army/computer/pending/stale gating bypass; capture auto-confirms or loses amount/range on save/load; nonresponsive Stop; unreachable/clipped required controls; any core/controller/rule/save/geometry/golden change or weakened assertion outside declared input recipes; scope/evidence defect. Prove findings or label them unverified. Wording/style/unchanged-code hypotheticals are follow-ups, not blockers.

## Report every blocking finding in this one review

This review is your only pass before the author fixes. Do not stop at the first blocking
finding: finish reading the whole diff and the task file, check every Done-when line and
every item under "Blocking means", and report all blocking findings together.

- Before you write the verdict, make one last pass over the full diff for anything you have
  not yet rated, and say "Final pass done" as the last line before the verdict.
- Number the findings R1, R2, … in order of severity. A finding you held back because an
  earlier one was already blocking is a review defect: if two problems share a cause, list
  both and say so.
- Do not rely on a later round. The author fixes everything you list, and the next review
  checks those fixes and new code only, not anything you saw but did not report.
- If you ran out of time or context before covering the whole diff, say which files or
  sections you did not cover. Do not approve in that case.

Final is the complete review: first line exactly `Attack interaction review (MiniMax M3)`; second line verdict alone; DW1, DW2, DW3 with commands/results; all findings R1..Rn with changed-file/line, severity and evidence. Final pass done; repeat verdict alone last. Print it; script posts. Never put closing keywords before issue numbers.

Full task contract:
# Direct and repeat attack interaction (#138)

Owner requires this before another presentation. Main implements in an isolated worktree, MiniMax independently reviews. Readability137 precedes it; coastline111/shared-border117 follow; T33 remains unapproved.

Scope: ReferenceMapView input intent, MapHandlers optional activation metadata, ReferenceBattleGame and battle guidance; docs/play.md, release PLAY and the current reference-controls section in docs/spike.md. Preserve core, controllers, topology, RNG, saves, legacy route input semantics and all golden images. Lock the actual-input tests before production.

Interaction: selecting an owned source then activating a legal enemy performs exactly one ordinary exchange. Activate that enemy again to repeat without reselection. Mouse click, Enter/Space and touch agree. A held key's repeat events do not issue additional attacks. Shift-click/Shift-Enter/Shift-Space selects a target without attacking, retaining side-panel Single exchange and Fight on. Show concise guidance and engine refusal reasons. Fight on/Stop retain existing behavior. Capture always interrupts for explicit human amount/confirm; arbitrary map/keyboard/repeated inputs cannot confirm it. Computer turns, invalid targets, insufficient armies, friendly moves and stale controls keep their gates.

The main-session contract amendment is limited to input recipes in existing battle-controls/accessibility, friendly-move/feedback, victory-options and versioned-match browser tests: where the test intends only to select before testing a separate control, use the explicit Shift selection gesture; victory's complete real action driver uses the new direct attack. Assertions, fixtures, expected states, timing bounds and goldens remain unchanged. New direct-input tests cover the default gesture independently; no compatibility URL/test mode is introduced.

Done when:
1. `python3 docs/prototypes/new-game/attack138/run.py` passes actual mouse/keyboard/touch first/repeat exchanges, held-key suppression, Shift selection, invalid/friendly/one-army/computer gating, responsive Stop and explicit capture min/intermediate/max with pending save/reload/upload. Compare exact logical state/history/RNG and retain screenshots/action saves at both desktop sizes. Direct/Shift/held-key tests fail before the change; existing gate regressions may already pass.
2. `ATTACK_COMPATIBILITY=1 python3 docs/prototypes/new-game/attack138/run.py` passes affected battle/accessibility/friendly/victory/versioned/computer suites plus readability/entry; no assertions or goldens weakened. Retain actual-source deletion controls with exact restoration.
3. `npm test`, `npm run build`, `git diff --check` pass; audit inherited source/test/golden identity except the explicitly declared input-recipe amendment. Retain commands, source/raw archives and all failures; independent approval then one CI before merge.

No coastline/border work in this change, no full legacy-capture migration139 or OpenCode143 dispatch. Owner appearance/pacing judgment is separate.

