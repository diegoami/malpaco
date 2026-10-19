T76 review (claude-opus)
approve
DW1: ran `npx playwright test tests/e2e/hideable-panels.spec.ts --workers=2` in the pinned container → 8/8 passed, exit 0
DW2: ran `npx playwright test tests/e2e/icon-actions.spec.ts tests/e2e/compact-panels.spec.ts tests/e2e/battle-panel-fit.spec.ts tests/e2e/cards.spec.ts tests/e2e/cards-result-layout.spec.ts tests/e2e/battle-controls.spec.ts tests/e2e/battle-accessibility.spec.ts tests/e2e/playback-controls.spec.ts tests/e2e/game-event-log.spec.ts --workers=2` in the pinned container → 120/120 passed, 0 skipped, 0 flaky, exit 0
DW3: ran `npm test` → 60 Vitest files with 818 tests passed, plus 9/9 node:test harness tests (fail 0). Ran `npm run build` → exit 0, version 0.1.1, 66 modules. All 6 files in dist/ match `ci-correction/dist-files.json` byte for byte (CSS 839eaa9c…, JS 87313292…). Owner visual judgment, the one final CI run and publication are owner/parent gates; I do not claim any of them has happened.
Also ran: `npx playwright test tests/e2e/geographic-board.spec.ts --workers=2` (both sizes) in the pinned container → 30/30 passed, exit 0.

Where I worked
- Worktree: my retained review worktree. HEAD is 6e6193f3d6c4b7f39a3c1e37df7e1941b2aec631. Its tree is 6b938a2f…, the same tree as handoff 55f6b09e. PR base is 62e740e7. The inventory has 115 paths.
- Container: pinned image sha256:eff16c30…, run with `--pull=never --network none --shm-size=1g --user 1000:1000` and my worktree bound to its own absolute path. Evidence is in `review-r3-evidence/attempt-1/` (logs, HTML reports, routed screenshots, test-results). The SHA256 of src/styles.css and every tests/e2e spec is the same before and after all runs. The test run also created an untracked `.cache/`.
- What changed since the approved review2 head d8d2bbcd (`git diff d8d2bbcd 6e6193f3`): runtime is only `src/styles.css` (11 lines). The test change is `tests/e2e/icon-actions.spec.ts`: the load/save helpers now use the original controls directly when they are visible, and there is one new 2-host test. Docs are `docs/spike.md` and RUN-NOTES (append-only), plus evidence under ci-correction/ and review-r2/. `src/ui/**`, the package files, README/play/PLAY, `hideable-panels.spec.ts`, `geographic-board.spec.ts` and the validation/rework1/review-r1 evidence are byte-identical to d8d2bbcd.
- CSS specificity: the old hiding rule `#battle-action-rail > :where(...)` (1,0,0) lost to `#battle-action-rail > button` (1,0,1). The new `.battle-reference #battle-action-rail > :where(...)` (1,1,0) wins, so only the 2 toggles show when both panels are expanded. The summary-hiding rule (1,3,0) comes after the show rule of equal specificity, so it wins. The 34px button rule (1,3,1) beats the 38px rule (1,0,1).
- Box bounds: the 9-icon row is 9×34 + 8×3 = 330px, exactly the row width at 1280 (350 − 20). From `battleChrome.ts` `layout()`/`commands()`, 9 is the most buttons the visible-sidebar rail can hold: 2 toggles, 4 surfaces, Required, Pause and Log. Phase and battle commands move into the rail only when the sidebar is hidden.
- Screenshots: at 1280, reference capture with the topbar hidden shows the 9-icon row above "Seat 4's turn". The panel commands and Confirm move-in are uncovered, and the map is clear.
- No-gameplay trace: the CSS change dispatches nothing. Each new test case ends by checking that the save after toggling both topbar states is byte-identical to the save before.
- Evidence audit:
  - I re-hashed every split part and every joined archive against its manifest: ci-correction controls (1 part), diagnosis (1 part) and full-validation (6 parts); review-r2 (6), review-r1 (10), rework1 full-validation (3) and validation attempts-02 (7). All matched.
  - I read every member of the 3 ci-correction archives and hashed it: 88, 40 and 348 members, 0 mismatches.
  - The failed-ci tarball SHA matches its manifest (3961192b…).
  - I read every ci-correction script (diagnose.mjs, run.py, prove.py, negative.py, full.py, retain.py, finalize.py). Their restoration.json records exact restoration.
  - The historical rework1/validation scripts are unchanged since d8d2bbcd. I skimmed them only for writes and restores.
- Mutations: `review-r3-evidence/mutate.py`, evidence in `review-r3-evidence/mutations-1/`. Each one edits src/styles.css in place and restores it in a `finally`. `restoredExact` is true and the SHA is the same before and after.

| Mutation | New toolbar guard | 1280 geography corpus |
| --- | --- | --- |
| M1: styles.css reverted to the d8d2bbcd version | 4/4 fail | 6/6 fail |
| M2: row gap 3px → 4px | 2 fail (both 1280 cases), 2 pass | not run |
| M3: specificity fix removed | 4/4 fail | 6/6 pass (rail stays within the old box) |
| M4: turn padding-right:104px removed | 4/4 pass | not run |
| M5: topbar-hidden panel padding-top:56px removed | 4/4 pass | not run |

M4 and M5 are reported in R1. The guard really fails without the CSS correction, so it does not pass with its behavior deleted.

R1 (not blocking, proved): `src/styles.css:1449-1450`, guard at `tests/e2e/icon-actions.spec.ts:36-55`. The two padding rules that keep the toolbar off the turn heading have no test. Deleting either one leaves the guard green: M4 and M5 both passed 4/4. The M5 screenshot (`mutations-1/M5-drop-panel-padding-top/tr-guard/…reference…1280x800/reference-reinforcement-toolbar-top-false.png`) shows the toolbar covering "Seat 4's turn". No command, required choice or map target is affected, and the current CSS is correct. Follow-up: assert that the toolbar does not overlap `.panel > .turn`.

R2 (not blocking, from reading the code, not run): `src/ui/battleChrome.ts:82-88`. The visible-sidebar toolbar is now horizontal, but the toolbar's keydown handler only handles ArrowUp/ArrowDown/Home/End, and the toolbar has no `aria-orientation`. Every button stays reachable with Tab, so reachability is not affected. The JS is unchanged since the approved head. Follow-up: add ArrowLeft/ArrowRight or set the orientation per layout.

R3 (not blocking, not verified, earlier than this delta): `src/styles.css:1458`. While `#game-focus-drawer` (z-index 4, right:64px) is open, it covers most of the topbar-hidden toolbar row. The vertical rail at d8d2bbcd was covered the same way. The drawer has its own close button and Escape handling, which the existing tests exercise. Likely harmless.

R4 (not blocking, disclosed evidence limit): `docs/prototypes/new-game/T76/ci-correction/REPORT.md`. The first 12-case geography positive run wrote to the ignored default `screenshots/` without an inventory taken first. So it is not proven that ignored screenshots from before that attempt were preserved. The report says so honestly, and later runs route their output. This does not affect source or test integrity.

During the evidence audit I briefly wrote one helper script to `/tmp`. I moved it into `review-r3-evidence/` right away; nothing else was written outside my worktree.

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
FILE: docs/prototypes/new-game/T76/ci-correction/diagnose.mjs
FILE: docs/prototypes/new-game/T76/ci-correction/finalize.py
FILE: docs/prototypes/new-game/T76/ci-correction/full.py
FILE: docs/prototypes/new-game/T76/ci-correction/negative.py
FILE: docs/prototypes/new-game/T76/ci-correction/prove.py
FILE: docs/prototypes/new-game/T76/ci-correction/retain.py
FILE: docs/prototypes/new-game/T76/ci-correction/run.py
FILE: docs/prototypes/new-game/T76/rework1/archive-full.py
FILE: docs/prototypes/new-game/T76/rework1/check.py
FILE: docs/prototypes/new-game/T76/rework1/check02.py
FILE: docs/prototypes/new-game/T76/rework1/full.py
FILE: docs/prototypes/new-game/T76/validation/baseline.py
FILE: docs/prototypes/new-game/T76/validation/final.py
FILE: docs/prototypes/new-game/T76/validation/finish-evidence.py
FILE: docs/prototypes/new-game/T76/validation/run.py
FILE: docs/prototypes/new-game/T76/validation/version-metadata.py
The files in the list above that are unchanged since d8d2bbcd are covered by byte-identity to the approved review2 head. The historical scripts were skimmed, not re-reviewed in full.
EVIDENCE: docs/prototypes/new-game/T76/
FILE: docs/prototypes/new-game/T76/ci-correction/controls.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/ci-correction/diagnosis.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-001
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-002
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-003
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-004
FILE: docs/prototypes/new-game/T76/ci-correction/full-validation.tar.gz.part-005
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-001
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-002
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-003
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-004
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-005
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-006
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-007
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-008
FILE: docs/prototypes/new-game/T76/review-r1/review-r1.tar.gz.part-009
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-001
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-002
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-003
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-004
FILE: docs/prototypes/new-game/T76/review-r2/review-r2.tar.gz.part-005
FILE: docs/prototypes/new-game/T76/rework1/full-validation.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/rework1/full-validation.tar.gz.part-001
FILE: docs/prototypes/new-game/T76/rework1/full-validation.tar.gz.part-002
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-000
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-001
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-002
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-003
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-004
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-005
FILE: docs/prototypes/new-game/T76/validation/attempts-02.tar.gz.part-006
Every split part listed above was checked by its part SHA against its manifest, and every joined archive by its archive SHA. The members of the 3 ci-correction archives were each hashed individually.

Final pass done
approve