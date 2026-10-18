T70 review (Claude Sonnet Medium)
approve

Where I worked: my review worktree at HEAD `88013091a73848f9f99be9da565a550b8f026968`, confirmed with `git rev-parse`. PR base is `c858fd404497a6fc051e19a7073932b9105ed007`. I read the follow-up delta `ed37976..HEAD` in full. Code in that delta: `src/ui/gameEventLog.ts`, `src/ui/referenceBattleGame.ts`, `tests/e2e/playback-edge-cases.spec.ts`, `tests/ui/game-event-log.test.ts`, `docs/prototypes/new-game/T70/production-checks.py`, `RUN-NOTES.md`. The rest of the delta is generated evidence. I did not re-read the first-pass code, which had no findings besides R1 and the two notes.
- The PR diff touches nothing under `src/core`, `tests/core` or `data`. Core, RNG and save schemas are unchanged.
- No new constants were added in the follow-up.
- Every mutation I made was restored. `git status` is clean.

DW1: ran `env -u PLAYBACK_EVIDENCE_DIR npx playwright test tests/e2e/playback-controls.spec.ts … --workers=2` in one combined invocation with the other specs → the 8 `playback-controls` cases passed at both sizes. The whole invocation ran 56 cases and all passed.
DW2: ran `npm test && npm run build` → 623 Vitest tests passed and the build exited 0. I did not see the 6 harness tests in the tail I kept, but the Vitest summary showed 44 files passed.
DW3: ran `computer-turn-flow.spec.ts` and `battle-controls.spec.ts` in the same invocation → all cases passed.
DW4: ran `game-event-log.spec.ts` in the same invocation → all 6 cases passed.

The same invocation also covered `playback-edge-cases` (now 4 cases per project, including the new queued-close regression), `versioned-match` and `finished-copy`.

**Follow-up checks**
- **R1 fixed.** All three `PLAYBACK_EVIDENCE_DIR` lookups in `playback-edge-cases.spec.ts` now fall back to `"screenshots"`. Run with the variable genuinely unset, all four edge cases pass in both projects, and the `production-*` PNGs land in `screenshots/`.
- **Focus race fixed.**
  - `gameEventLog.ts` no longer has the `close` handler that focused the opener, so native dialog focus restoration applies.
  - The new test sends a delayed `close` after focus has moved to a country and then presses Enter.
  - I re-added the handler and ran that test: it failed in both projects. I then restored the file.
- **Non-blocking notes addressed.**
  - `aria-pressed` is removed, and the edge spec asserts it is absent.
  - The capture line now reads "Net after combat and capture". The new unit test checks that label and that the casualty and transfer notes stay separate.
- **`production-checks.py`.** It compiles. The `ci-like` and `edge-baseline` modes pop `PLAYBACK_EVIDENCE_DIR`, snapshot the default `screenshots/` folder before the run, and copy any new or changed PNGs into the run directory. Static read only; I did not run the script, because it creates new evidence runs.
- **Evidence kept.** `rework-round1-evidence.json` and the Claude round-1 archive directory are present. `RUN-NOTES.md` records the first intermittent 53/54 failure and the final receipts. I did not audit the archive contents.

No blocking findings. No new non-blocking findings.

SCOPE: complete
FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T70/production-checks.py
FILE: src/ui/gameEventLog.ts
FILE: src/ui/referenceBattleGame.ts
FILE: tests/e2e/playback-edge-cases.spec.ts
FILE: tests/ui/game-event-log.test.ts
EVIDENCE: docs/prototypes/new-game/T70/
Limitation: generated archives were not audited by me; the parent already audited them. The first-pass files are covered by the first review, not re-read here.

Final pass done
approve