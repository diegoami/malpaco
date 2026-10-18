T70 CI-correction review (Claude Sonnet Medium)
approve

Where I worked: my review worktree at HEAD `630cb17d46f2efbc1d6c952c81b815c845f55d59`, confirmed with `git rev-parse`. PR base is `b402402b5d288c8ed1c119f1176fe3e2a154fba7`. I read the delta `8801309..HEAD` for all executable and documentation files. The rest of the delta is generated evidence. The PR diff touches nothing under `src/core`, `tests/core` or `data`. `git status` is clean after my one mutation was restored.

DW1: ran `env -u PLAYBACK_EVIDENCE_DIR npx playwright test tests/e2e/playback-controls.spec.ts tests/e2e/game-event-log.spec.ts tests/e2e/computer-turn-flow.spec.ts tests/e2e/battle-controls.spec.ts tests/e2e/playback-edge-cases.spec.ts tests/e2e/versioned-match.spec.ts tests/e2e/finished-copy.spec.ts tests/e2e/map-readability.spec.ts --workers=2` → all 60 cases passed in one invocation, including the `playback-controls` cases at both sizes.
DW2: ran `npm test && npm run build` → 6 harness tests passed, 623 Vitest tests passed across 44 files, and the build exited 0.
DW3: ran `computer-turn-flow.spec.ts` and `battle-controls.spec.ts` in the same invocation → all cases passed.
DW4: ran `game-event-log.spec.ts` in the same invocation → all cases passed, both viewports.

**Checks on this delta**
- **Panel identity fix.**
  - `src/ui/panel.ts:130` drops the child's `data-player`. The identity stays only on the score row (`panel.ts:124`).
  - Mutation: I put `"data-player": p.id` back on the total child, ran `map-readability.spec.ts` with `PLAYBACK_EVIDENCE_DIR` unset, and both army-label cases failed. They failed at 1280x800 and 1920x1080 with `Expected "Seat 5, 2 armies"`, received `"River gate, Seat 3, 2 armies, Seat 3"`. The two region-name cases still passed.
  - I restored the file from `panel.ts.saved` and deleted the copy. `git status` is clean.
- **Acceptance specs.**
  - The two changes are `totals()` locating the child through its score row in `playback-controls.spec.ts`, and `load()` waiting for the replaced input to disconnect in `playback-controls.spec.ts` and `game-event-log.spec.ts`.
  - Their SHA-256 values equal the `new` hashes in `parent-acceptance-ci-correction.json` (46feb0fd… and dc30a76c…). The diff touches no state, delta, history, pause or screenshot assertions.
- **Load-completion proof.**
  - I read `inert-proof-driver.mjs` statically and did not run it. It is not wired into the app or the test suite.
  - It delays `File.text` and checks that the input is still connected after the old 46-country wait. It then checks that the disconnect wait blocks until the load is released.
  - `report.json` records `oldCountryCountHelperReturnsBeforeRead: true` and `newDisconnectionWaitBlocksUntilRead: true`.
- **`production-checks.py`.** The diff adds `ci-targeted-pinned` and `ci-full-pinned`. They pop `PLAYBACK_EVIDENCE_DIR`, use the `mcr.microsoft.com/playwright:v1.63.0-noble` image with `--cpus=2` and `--workers=2`, and archive the default screenshot folder. That matches `.github/workflows/ci.yml:16` and `:35`. I did not run the script, because it writes new evidence runs.
- **Producer's full pinned run.** `ci-correction-evidence.json` and `20261017T212157876756Z-production-ci-full-pinned/report.json` record 222/222 passed in 374.448s with the variable unset and source inputs unchanged. The correction source is unchanged since that run, so I did not repeat the full suite. The source archive's recorded hashes and the 222-case count are the producer's own record, which I took as written and did not re-derive.
- **Task text and docs.** The `docs/tasks/T70.md` addition matches the parent clarification quoted in the brief. The README and RUN-NOTES additions describe the correction without contradicting the code.
- **Constants and seeded rules.** The delta adds no constants and touches no rule code.

No blocking findings. No non-blocking findings.

SCOPE: complete
FILE: src/ui/panel.ts
FILE: tests/e2e/playback-controls.spec.ts
FILE: tests/e2e/game-event-log.spec.ts
FILE: docs/prototypes/new-game/T70/production-checks.py
FILE: docs/prototypes/new-game/T70/parent-load-completion-proof/inert-proof-driver.mjs
FILE: docs/prototypes/new-game/T70/parent-load-completion-proof/report.json
FILE: docs/prototypes/new-game/T70/parent-load-completion-proof/assertions-preserved.json
FILE: docs/prototypes/new-game/T70/parent-acceptance-ci-correction.json
FILE: docs/prototypes/new-game/T70/parent-approval.md
FILE: docs/prototypes/new-game/T70/README.md
FILE: docs/prototypes/new-game/T70/ci-correction-evidence.json
FILE: docs/tasks/T70.md
FILE: RUN-NOTES.md
EVIDENCE: docs/prototypes/new-game/T70/
Limitation: I did not audit the generated archives, screenshots or tarballs, including the failed-CI archive, `claude-review-round2/`, the `parent-key-*` reports and the pinned-run directories beyond the producer's `report.json` and `ci-correction-evidence.json`. The first-pass and `8801309` files are covered by the earlier reviews and were not re-read here.

Final pass done
approve