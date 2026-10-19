T76 review (claude-opus)
approve
DW1: ran `npx playwright test tests/e2e/hideable-panels.spec.ts --workers=2` (pinned container) → 8/8 passed (exit 0); source hashes were the same before and after the run
DW2: ran `npx playwright test tests/e2e/icon-actions.spec.ts tests/e2e/compact-panels.spec.ts tests/e2e/battle-panel-fit.spec.ts tests/e2e/cards.spec.ts tests/e2e/cards-result-layout.spec.ts tests/e2e/battle-controls.spec.ts tests/e2e/battle-accessibility.spec.ts tests/e2e/playback-controls.spec.ts tests/e2e/game-event-log.spec.ts --workers=2` (pinned container) → 116/116 passed, 0 skipped, 0 flaky (exit 0)
DW3: ran `npm test` → 818 Vitest tests in 60 files plus the node:test harness (fail 0) passed; ran `npm run build` → exit 0, 66 modules. The 6 files in dist/ are byte-identical to rework1/dist-files.json. Owner visual judgment and the one final CI run are owner/parent gates. I do not claim either has happened.

Where I worked
- Worktree: my retained review worktree. HEAD is d8d2bbcdc4b34ebcc0d8c2750addd4bc9d19382d, and the tree was clean apart from the untracked `.review-r2/` (my evidence) and `.cache/` (written by the test run).
- Diff: PR base 62e740e7ea88c99bd6a7a6b16e4c98c3fb33ca58..HEAD has 75 files, the same list as the launcher's inventory.json. Follow-up delta since eca9e271130da0f6d00618e9ab9d1014f619004a:
  - only one runtime line: `src/ui/battleChrome.ts:148` `this.rememberHistory();`
  - tests: `tests/e2e/icon-actions.spec.ts`
  - docs: README.md, docs/play.md, tools/release/PLAY.md, RUN-NOTES.md (lines appended only, 0 removed against base)
  - evidence under docs/prototypes/new-game/T76/review-r1/ and docs/prototypes/new-game/T76/rework1/
- Container: every command ran in image sha256:eff16c30…, with `--pull=never --network none --shm-size=1g --user 1000:1000`. The worktree was bind-mounted at the same path. Screenshot, JSON and HTML output went to `.review-r2/<label>/` through the COMPACT_PANEL, BATTLE and PLAYBACK evidence-dir variables. Raw logs, exit codes and before/after source hashes are retained there.
- Frozen spec: `tests/e2e/hideable-panels.spec.ts` has the same SHA as `preflight/restoration.json` testsSha256 and is unchanged since eca9e271.
- My deletion mutations (`.review-r2/mut/mutate.py`): each one saves the file, edits it and restores it in `finally`. Results are in `results.json` and `results-r1.json`. Each mutant failed all 4 host/viewport cases (exit 1, expected 0, unexpected 4), and each file was restored byte-exact (SHA checked; git status clean afterwards):
  - Removed `rememberHistory()` from `open()` → "visible sidebar keeps an older history reader" fails ("moving visible history must keep the latest reading position", got 2606).
  - Removed `captureDraft ??` → "capture retains" fails (expected "1", got default "6").
  - Removed `?? draft` from the friendly input → "non-default draft" fails (expected "4", got "5").
  - Removed the friendly focus-restore line → "non-default draft" fails (toBeFocused → inactive).
- Archives, checked by me:
  - review-r1: 10 parts, every part hash/size OK, joined SHA 0ddbe320… matches, all 685 members' SHAs match, no extra members. final.md SHA daa90319… matches receipt.json.
  - rework1 full-validation: 3 parts OK, joined hash matches, 316/316 members match.
  - negative-and-mutations.tar.gz: SHA matches, 116/116 members match.
  - The source hashes recorded in rework1 full-results.json equal the current HEAD file hashes.

Verification of the earlier blocking findings
- R1 (history position lost on Details/Settings): fixed. `open()` now records the visible log position before closing or moving the old surface (`src/ui/battleChrome.ts:147-150`). `restoreHistory()` brings it back after the nodes move.
  - New test `tests/e2e/icon-actions.spec.ts:36`: sidebar visible, topbar hidden, two older offsets (80 and 120), Details → Escape → Settings. It checks that every log row is kept, that focus returns to `#open-game-details`, and that the saved state matches exactly.
  - Red/green: removing the fix fails 4/4 (above); with the fix, 4/4 pass within DW2.
  - The <0.5 CSS px tolerance only covers scroll rounding at the 1920 size. Without the fix the log jumps by 2606 px, so the tolerance does not hide the bug.
- R2 (capture test did not prove the amount is kept): fixed.
  - `icon-actions.spec.ts:77` picks `min` if `min≠defaultAmount`, otherwise `max`. It also asserts `max>min` and `amount≠defaultAmount`.
  - It closes surfaces, opens Cards, toggles the sidebar and pauses/resumes. The final oracle is `captureMove` with exactly that amount.
  - Removing `captureDraft` makes it fail.
- R3 (friendly-move test did not prove the draft and focus survive a redraw): fixed.
  - `icon-actions.spec.ts:80-107` builds a legal state through ordinary `reinforce`/`endReinforcement` replay, checked with `expect(before.state).toEqual(prepared)`. It then requires a source with at least 3 armies, `maximum>=2`, and `amount = maximum-1`.
  - It sets the amount, presses Escape (focus returns to the opener), opens Settings, toggles the topbar, then focuses the input and changes speed through the real control.
  - It asserts the old input element was actually disconnected, so the redraw really replaced it, and that the new input keeps the value and focus. The final check is an exact `friendlyMove` core/RNG oracle.
  - Removing either the draft or the focus restoration makes it fail.
- Toggle and surface safety in the new code: the one added line only reads `scrollTop`/`scrollHeight`. It sends no game action, touches no game state or RNG, and does not change Escape order or focus fallback.

Findings
R1 (non-blocking, docs): `README.md:16` adds "[Play in your browser](https://malpaco.netlify.app)" under the "Play Malpaco 0.1.1" heading.
- The task only allows "current release heading and brief panel-use instructions" in these files, so a link goes slightly beyond that.
- The public site serves 0.1.0 until the parent publishes 0.1.1. Until then, the heading points readers to a build without these panels.
- Suggested fix: the parent publishes before or with this README, or drops the link.

R2 (non-blocking, evidence hygiene): `docs/prototypes/new-game/T76/rework1/check.py` and `check02.py` are identical except for the positive-run label.
- `check.py` calls `mkdir()` without `exist_ok`, so it cannot be run a second time. The retained archive shows `check02.py` was the run that counted.
- It has no effect on behaviour; a one-line note in REPORT.md would explain why there are two scripts.

R3 (non-blocking, carried over): the first review's R4 (load-focus) and R5 (hidden battle-action flag) are still deferred by the parent. R6 (speed in Settings) is owner-approved. I saw nothing in this round that changes those decisions.

No blocking findings. Checked against the blocking conditions:
- Every Done-when line passes.
- None of the new code is outside the task scope.
- No mandatory action is hidden, and there are no duplicate handlers or IDs.
- The Raid map path is untouched since round 1.
- History is complete; the row-equality check passes.
- Closing UI sends no gameplay action.
- Every new or strengthened check fails when its behaviour is removed.

Limitations
- The preflight/ and validation/ evidence and scripts are unchanged since eca9e271 and were audited in round 1. Per the brief, I did not sweep them again. I checked only the frozen spec hash against preflight/restoration.json and skimmed validation/*.py.
- I did not run the full 380-test inventory, only the three Done-when lines.

SCOPE: complete
FILE: README.md
FILE: RUN-NOTES.md
FILE: docs/play.md
FILE: docs/spike.md
FILE: package-lock.json
FILE: package.json
FILE: src/styles.css
FILE: src/ui/battleChrome.ts
FILE: src/ui/battleView.ts
FILE: src/ui/friendlyMoveView.ts
FILE: src/ui/referenceBattleGame.ts
FILE: tests/e2e/hideable-panels.spec.ts
FILE: tests/e2e/icon-actions.spec.ts
FILE: tools/release/PLAY.md
FILE: docs/prototypes/new-game/T76/rework1/archive-full.py
FILE: docs/prototypes/new-game/T76/rework1/check.py
FILE: docs/prototypes/new-game/T76/rework1/check02.py
FILE: docs/prototypes/new-game/T76/rework1/full.py
FILE: docs/prototypes/new-game/T76/validation/baseline.py
FILE: docs/prototypes/new-game/T76/validation/final.py
FILE: docs/prototypes/new-game/T76/validation/finish-evidence.py
FILE: docs/prototypes/new-game/T76/validation/run.py
FILE: docs/prototypes/new-game/T76/validation/version-metadata.py
EVIDENCE: docs/prototypes/new-game/T76/

Final pass done
approve