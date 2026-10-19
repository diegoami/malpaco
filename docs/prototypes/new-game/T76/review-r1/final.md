T76 review (claude-opus)
rework
DW1: ran `node_modules/.bin/playwright test tests/e2e/hideable-panels.spec.ts --workers=2` (the binary `npx` resolves to) in the pinned container → exit 0, 8/8 passed, 12.7 s. Evidence: `.review-t76/dw1-a1/`.
DW2: ran `node_modules/.bin/playwright test` on all nine named suites with `--workers=2` in the pinned container → exit 0, 112/112 passed, 226.6 s. Evidence: `.review-t76/dw2-a1/`. The suites pass, but two of the new checks still pass with their behaviour deleted (R2, R3), so the line "New checks fail without their behavior" is not met.
DW3: ran `npm test` → exit 0 (9/9 harness tests, 818/818 Vitest tests in 60 files). Ran `npm run build` → exit 0 (66 modules, version 0.1.1). Both in the pinned container; evidence in `.review-t76/dw3test-a1/` and `.review-t76/dw3build-a1/`. Owner judgement of space, icons and density, and the one green final CI, are owner/main gates and were not checked here.

Worktree: the retained review worktree. HEAD is eca9e271130da0f6d00618e9ab9d1014f619004a. The diff is 97b0a524c22aef9bdc5c678e0d8fa9f5e8a53f98..HEAD: 42 files, matching `inventory.json`.
Container: image sha256:eff16c30…, `--pull=never --network none --shm-size=1g --user 1000:1000`, worktree bound at its own absolute path. Every run, with argv, exit code and time, is under `.review-t76/`.
Frozen test: `tests/e2e/hideable-panels.spec.ts` has SHA a5f2b4c9…. That equals preflight `testsSha256`, and the file has no diff from 27413ce3 to HEAD.
Archives (`.review-t76/audit.py`, `.review-t76/audit2.py`):
- `attempts-02`: 7 parts; each part hash matches and the joined archive matches `archiveSha256` (189429091 bytes). All 685 members match the manifest (hash, size, mode), with none missing or extra.
- `attempts-01`: 220 members verified. `preflight.tar.gz`: SHA matches. I read the mock injection and `restoration.json`.
- The receipts show 24 baseline icon failures and 2 failures before the focus-edge fix. The source was restored exactly.
- Only `corrected-focused` (32 tests) and `release-build` ran on the exact HEAD sources. The implementer's `layout-final` and `regression-final` runs used an earlier `battleChrome.ts`, from before the TS2322 fix. My DW1 and DW2 reruns are the runs on HEAD.

Mutations: each was applied in place, restored byte-exact in a `finally`, and checked by SHA. All restored: true. `git status` shows only untracked `.review-t76/` and `.cache/` (the `.cache/` folder is written by `npm test`).
- Pause gating changed back to the old `.action`-only query: 12/24 icon-actions tests fail. Caught.
- Drawer Escape branch removed: 14 tests fail across icon-actions and hideable-panels. Caught.
- History restore disabled: 4 tests fail (the details/history test at both sizes and both hosts). Caught.
- Capture draft removed (`src/ui/battleView.ts:75`): 24/24 still pass. Not caught (R2).
- Friendly draft removed (`src/ui/friendlyMoveView.ts:22`): 24/24 still pass. Not caught (R3).

Probes are in `.review-t76/probe/`. They ran as temporary untracked specs that were removed afterwards; copies are kept.

R1 (blocking): History reading position is lost when Details opens from the visible sidebar (`src/ui/battleChrome.ts:147-159`). `open()` calls `close(false)`, which returns early when no surface is open, so `rememberHistory()` never runs. `restoreHistory()` then applies the position saved at the last `layout()`.
- Proof (probe A, both sizes, 450-action fixture): hide only the top panel, scroll the sidebar Battle log to 100, click Details. The drawer shows the log at 5415, the bottom. After closing, the sidebar is at 6567 or 6809, also the bottom.
- This breaks the scope line "preserve … complete scrollable history across … surfaces". It also makes the PR's own `docs/spike.md:1108` ("surface changes preserve … history position") wrong.
- The DW2 history test only covers moving from one drawer to another, so it misses this.
- Likely fix: call `this.rememberHistory()` at the start of `open()`, and add a test that starts from the visible sidebar.

R2 (blocking): The capture-quantity check passes with the behaviour deleted (`tests/e2e/icon-actions.spec.ts:52`). The test fills `pendingCapture.max`, but the fixture's default is also the max (min 1, max 6, default 6).
- Removing `captureDraft` (`src/ui/battleView.ts:23,75`) leaves 24/24 green.
- Probe E shows the code matters: with a value of 1, pause and resume keep 1 at HEAD but reset to 6 when the draft is removed.
- Fix: use a value different from the default (for example min) and keep the exact `captureMove` oracle.

R3 (blocking): The friendly-move draft check passes with the behaviour deleted (`tests/e2e/icon-actions.spec.ts:57`). The fixture's maximum is 1, so filling '1' can't be told apart from the default.
- Also, Escape and switching surfaces never trigger a re-render, so the draft code at `src/ui/friendlyMoveView.ts:16-22` is never exercised. Removing it leaves 24/24 green. Probe F confirms max = 1.
- R2 and R3 have the same cause: the chosen draft value equals the default. Fix: use a friendly-move fixture or source with maximum ≥ 2, choose a value below the maximum, and force a re-render (pause/resume or a toggle) before checking.
- The focus restoration added at `src/ui/friendlyMoveView.ts:52` is also untested. This part is unverified.

R4 (non-blocking): After loading a game from the Settings surface in collapsed mode, focus lands on `<body>` (probe C, both sizes). It does not land on the new `#open-game-settings` or the recovery toggle. Expanded-mode loading also replaces its file widget, so this is probably existing behaviour; I did not measure it on base. Follow-up: focus the replacement host's matching opener.

R5 (non-blocking): When the sidebar is restored, `.battle-actions` keeps the `hidden` attribute it was given in the rail until the next render (`src/ui/battleChrome.ts:124,126`). Probe B shows hidden goes from false to true across an off/on toggle during a pending capture. The group was already invisible then, so I proved no visible or functional effect. Follow-up: clear `hidden` when moving the group back.

R6 (non-blocking, user decision): Speed is reachable only through the Game settings surface. The rail has direct pause and log icons but no speed control, while the scope wording says "pause/speed/log". The spike documents this choice; the owner should confirm it during the visual review.

Other checks found no issue:
- No toggle or surface path dispatches gameplay. Toggles call only `close(false)` and `layout()`; close only moves nodes and restores focus.
- Escape closes the drawer before game Escape, without stopping a running battle. Probe D: running stays true after the first Escape and becomes false on the second.
- Pause gates the relocated phase, card and battle commands (mutation proof above).
- No duplicate IDs in any surface or after a replacement (probe C). Exactly one event log dialog.
- Raid map selection works in the nonmodal flow. Required choices open through `#open-required-action`.
- No change to core, save, RNG, geometry, harness or dependencies. RUN-NOTES is append-only. Package and lock files change only the three version strings to 0.1.1.

SCOPE: complete
FILE: RUN-NOTES.md
FILE: docs/spike.md
FILE: package.json
FILE: package-lock.json
FILE: src/styles.css
FILE: src/ui/battleChrome.ts
FILE: src/ui/battleView.ts
FILE: src/ui/friendlyMoveView.ts
FILE: src/ui/referenceBattleGame.ts
FILE: tests/e2e/hideable-panels.spec.ts
FILE: tests/e2e/icon-actions.spec.ts
FILE: docs/prototypes/new-game/T76/validation/baseline.py
FILE: docs/prototypes/new-game/T76/validation/final.py
FILE: docs/prototypes/new-game/T76/validation/finish-evidence.py
FILE: docs/prototypes/new-game/T76/validation/run.py
FILE: docs/prototypes/new-game/T76/validation/version-metadata.py
FILE: docs/prototypes/new-game/T76/validation/REPORT.md
FILE: docs/prototypes/new-game/T76/validation/REPORT-01.md
FILE: docs/prototypes/new-game/T76/preflight/REPORT.md
FILE: docs/prototypes/new-game/T76/preview-94d46539/README.md
EVIDENCE: docs/prototypes/new-game/T76/ — the archives and JSON manifests, receipts and results (preflight, attempts-01/02, checkpoint, final-results, final-dist-files, version-metadata, preview-94d46539), audited by hash and member groups as described above.
Final pass done
rework