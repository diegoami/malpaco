T70 review (Claude Sonnet High)
rework

**Where I worked:** my worktree at HEAD `ed379764094e835137a957f255794cf5e1541fc0`. PR base is `c858fd404497a6fc051e19a7073932b9105ed007`. `git diff c858fd4 HEAD` shows 75 files, 19629 insertions and 16 deletions.
- The diff touches nothing under `src/core`, `tests/core` or `data`.
- Every changed file is in the task's Owns list.
- I set `PLAYBACK_EVIDENCE_DIR`, `COMPUTER_FLOW_EVIDENCE_DIR`, `BATTLE_EVIDENCE_DIR` and `VERSIONED_MATCH_EVIDENCE_DIR` to folders under `/tmp/opencode/rev159` for the DW runs.
- I added an untracked `node_modules` symlink in the worktree so the commands could run.
- I ran `npx vite-node` once to dump the log text for a pinned domination save. It downloaded `vite-node@6.0.0` into the npx cache outside the worktree.
- I mutated source files in place and restored the saved bytes in a `finally`. `git status` afterwards shows only `?? node_modules`.

DW1: ran `npx playwright test tests/e2e/playback-controls.spec.ts` (batched with the other specs below, `--workers=2`) → 8 of 8 cases passed at 1280x800 and 1920x1080.
DW2: ran `npm test && npm run build` → 6 harness tests and 622 Vitest tests passed, and the build exited 0.
DW3: ran `npx playwright test tests/e2e/computer-turn-flow.spec.ts tests/e2e/battle-controls.spec.ts` (same batch) → all cases passed.
DW4: ran `npx playwright test tests/e2e/game-event-log.spec.ts` (same batch) → 6 of 6 cases passed.

The one batched invocation was DW1, DW3 and DW4 plus `playback-edge-cases`, `versioned-match` and `finished-copy`. It ran 54 cases and all passed. It ran with `PLAYBACK_EVIDENCE_DIR` set, which R1 shows hides a failure.

**R1 (blocking). `playback-edge-cases.spec.ts` fails in the normal CI run.**
- `tests/e2e/playback-edge-cases.spec.ts:25`, `:34` and `:49` use `process.env["PLAYBACK_EVIDENCE_DIR"]!` and pass it straight to `mkdirSync`.
- CI runs plain `npx playwright test --workers=2` (workflow line 35), so the variable is unset.
- I ran `env -u PLAYBACK_EVIDENCE_DIR npx playwright test tests/e2e/playback-edge-cases.spec.ts --project=1280x800`. All 3 cases failed with `TypeError: The "path" argument must be of type string or an instance of Buffer or URL. Received undefined`. The same failures occur in the 1920x1080 project.
- The commit "Allow T70 timer and modal regression cases in the normal CI test directory" moved this spec into the regular suite. The producer's `production-checks.py` always sets the variable, so the failure was never visible.
- The other new specs use `?? "screenshots"`. The edge spec should do the same.

**Checks that found no defect:**
- Pause gating works. `accepts()` gates every manual method on `playbackPaused`, `dispatchComputer` is gated, and `ComputerTurnLoop.update` cancels when paused. `clickProvince` and `renderMap` are gated and the panel buttons are disabled.
- `setPlaybackPaused` cancels the human timer through `generation` and `cancel()`. The scheduled callback has no pause check of its own, so the cancel is the only guard. Resume reschedules only when `current.running`.
- `replaceGame` resets the pause. Load and new game remount a fresh `ReferenceBattleGame`, and `dispose` cancels the old controller, loop and dialog.
- Omission controls I ran all failed as they should:
  - Removing `this.cancel()` from `setPlaybackPaused` made `global pause freezes continuous human battle` fail.
  - Removing both computer pause guards (the one in `update()` and the one in `dispatchComputer`) made `Pause freezes computer play` fail.
  - Removing the elimination note, the endTurn unplaced-income note and the friendlyMove note made two of the three `game-event-log` cases fail (`move-completed`, `domination`). I did not see which single mutation each failure came from.
- The source also holds up on these points:
  - Army totals come from `armyTotal` for every player, eliminated ones included.
  - The log is rebuilt from `state.history` on mount and append-only, so there are no duplicates.
  - A new match builds a fresh `GameEventLog`.
  - Speed defaults are unchanged (`normal`, `COMPUTER_STEP_TIME` 350, `SPEED_SCALE` slow/normal/fast).
  - The new constants (2000 ms, ×6, 16px) carry `[designed]` comments.
  - The legacy panel layout is preserved through the `prominentArmyTotals` opt-in.
- I viewed these screenshots at both sizes: `playback-paused-computer-1280x800`, `playback-paused-battle-1920x1080` and `production-modal-1280x800`. Pause/Resume, Game speed, the Game event log button and the labelled totals are visible and readable. The modal is opaque and has a visible Close button. Appearance is the owner's call.

**Non-blocking follow-ups:**
- `src/ui/referenceBattleGame.ts:149-151` puts `aria-pressed` on a button whose label already flips between "Pause game" and "Resume game". Screen readers will announce both.
- `src/ui/gameEventLog.ts`, `regionChanges`: on a capture, the captured country's line reads "Combat and capture: 1 → 1 (+0)" and nets the casualty against the transfer. The separate note line explains it correctly, but the region line alone is ambiguous.

SCOPE: complete
FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T70/.gitignore
FILE: docs/prototypes/new-game/T70/event-log-mock.ts
FILE: docs/prototypes/new-game/T70/mock-preflight.py
FILE: docs/prototypes/new-game/T70/production-checks.py
FILE: src/styles.css
FILE: src/ui/battleController.ts
FILE: src/ui/battleView.ts
FILE: src/ui/computerTurnLoop.ts
FILE: src/ui/gameEventLog.ts
FILE: src/ui/panel.ts
FILE: src/ui/referenceBattleGame.ts
FILE: tests/e2e/game-event-log.spec.ts
FILE: tests/e2e/playback-controls.spec.ts
FILE: tests/e2e/playback-edge-cases.spec.ts
FILE: tests/ui/game-event-log.test.ts
FILE: tests/ui/playback-controls.test.ts
EVIDENCE: docs/prototypes/new-game/T70/ (I read the README in full and the head of `production-evidence.json`. The run-directory archives, `report.json` files and `raw-outputs.tar.gz` were not audited, and my own runs did not depend on them.)

Final pass done
rework