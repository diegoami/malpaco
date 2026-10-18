T36 review (Claude Sonnet Medium)
approve

Where I worked: the review worktree at HEAD 3bb600c6b283b93996c216a548978eb748d8d578. I diffed 18f46af..3bb600c, covering the 85 changed files, and read everything executable in it. Tracked source is clean after every mutation (each was restored to its saved bytes, hash-checked). The one untracked item is a `node_modules` symlink I made in the worktree. The sandbox denied a command that would have removed it, so it is still there.

Commands I ran (output in `/tmp/opencode/rv162/`):
- `npm test`
- `npm run build`
- The pinned `mcr.microsoft.com/playwright:v1.63.0-noble` image, 2 CPUs, for the 36-test run, the three mutations and the 28 existing reference tests.
- The committed package extracted to `/tmp/opencode/pkg-PcKl8c`, with `SHA256SUMS` checked, run with `playwright.release.config.ts`.

DW1: not run — wide sweep out of follow-up scope (instruction: never repeat unchanged wide/old222). `src/core`, `data`, `sweep.mjs`, `corpus-selection.json` and `corpus-supplement.json` are byte-unchanged 18f46af..3bb600c, so the earlier DW1 result is inherited, not regenerated.
DW2: ran `npx playwright test tests/e2e/geographic-board.spec.ts tests/e2e/geographic-review-guards.spec.ts` in the pinned image → 36/36 passed (30 original geographic + 6 new guard cases), exit 0. The same 36 also passed against the extracted committed package (`playwright.release.config.ts`, exit 0).
DW3: ran `npm test` → 6 harness + 645 Vitest passed, exit 0. Ran `npm run build` → exit 0. I did not rerun the 222 old browser cases. I ran 28 existing reference-route tests (`reference-complete-game`, `entry`, `direct-attack`, `map-readability`) → 28/28 passed, exit 0, chosen because the CSS change rewrote their selectors.

**Mutations** (each run against the new guards spec, each failed at its intended assertion, not at load or collection):
- Disabling Enter/Space in `src/ui/geographicMapView.ts` failed `active geographic Enter and Space each place an army` at both viewports (`data-armies` Expected "2", Received "1").
- Making the load gate in `src/ui/referenceMatchFiles.ts` permissive failed `explicit reference rejects geographic v2…` (the "This game uses a generated map" alert never appeared).
- Reverting the shared `:is(#reference-game, #geographic-game)` selectors in `src/styles.css` to `#reference-game` failed `default four-seat geographic shell shares reference responsive layout` (toEqual diff).

**Prior findings:**
- R1 (keyboard) is closed by the new active Enter/Space test.
- R2 (responsive parity) is closed. At 1920x1080 the geographic panel is 440px, identical to reference, and every computed style is equal at both viewports. The `:is()` form keeps the ID-level specificity, and the 28 reference tests passed.
- R3 (geographic-v2 rejection and guidance) is closed. The geographic save now says "load it in the main game screen", other generated saves keep the old text, and the live match stays usable and byte-identical after the rejection.
- R8 (loose screenshots) is closed: 12 PNGs are present under `delivery-preview-20261018/screenshots/`. I did not view them or verify their hashes myself.

**Findings:**
- No blocking findings.
- No new defect in the new code. The CSS change is mechanical (removing the now-redundant `#geographic-game.battle-reference` rule is covered by the shared selector), and the new guard spec is deterministic.
- I did not touch the historical or frozen items (R4, R5, R6, R7), as instructed.
- Non-blocking: `src/ui/referenceMatchFiles.ts:43-44` hard-codes the strings "main game screen" and "generated game view". That is fine today, but a new generator id would silently get the "generated game view" text.

**Limitations:**
- The owner's visual and pacing judgment, Windows copy and CI are not covered.
- I did not open the archive parts (`retained-originals`, `claude-review-round1`, `package-and-preview-evidence.tar.gz`) or the PNGs.
- I did not read `rework-final-proof.json`, `rework-source-proof.json` or the T36 README diff in full.
- I did not independently compare the 1001-record wide results. I checked only that the core, data and frozen files are unchanged.
- The package proof I ran is my own: the committed tarball's assets (`index-BKOjpSZC.js`, `index-Dr79zjCs.css`) equal my fresh build output, and its `BUILD.json` names source commit 2ebb039. I did not regenerate the package.

FILE: RUN-NOTES.md
FILE: src/styles.css
FILE: src/ui/referenceMatchFiles.ts
FILE: src/ui/geographicMapView.ts
FILE: tests/e2e/geographic-review-guards.spec.ts
FILE: tests/e2e/geographic-board.spec.ts
FILE: docs/prototypes/new-game/T36/run-browser.py
EVIDENCE: docs/prototypes/new-game/T36/evidence/
EVIDENCE: docs/prototypes/new-game/T36/claude-review-round1/
EVIDENCE: docs/prototypes/new-game/T36/parent-review-round1/
EVIDENCE: docs/prototypes/new-game/T36/delivery-preview-20261018/

SCOPE: complete for the changed executable code, tests and scripts (the CSS, load gate and guard spec, which are the only runtime and test changes). The documentation and the evidence and archive groups are covered by prefix only and were not opened file by file.
UNCOVERED: `docs/prototypes/new-game/T36/README.md`, `rework-final-proof.json` and `rework-source-proof.json` (documentation and proof metadata, not read in full); the archive members and PNG contents (inert data).

Final pass done

approve