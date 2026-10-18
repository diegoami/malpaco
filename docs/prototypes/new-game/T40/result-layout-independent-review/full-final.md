T40 review (Kimi K3)
approve

Worktree: 176-review-34ed22db at HEAD 5cc49c60648297aa0bfc69f28d51125d2ec753f4; diff vs origin/main matches the PR (110 files, incl. src/, tests/, docs/prototypes/new-game/T40/**). Correction audit `git diff 64bbe6..HEAD -- src tests docs/spike.md RUN-NOTES.md`: only src/styles.css (+5 lines, 3 selectors), new tests/e2e/cards-result-layout.spec.ts (+21), docs/spike.md, RUN-NOTES.md; no core/controller/DOM/policy/default/config changes.

DW1: ran `docker run --pull=never --rm --init --ipc=host --user 1000:1000 -v "$PWD:/work" -w /work -e HOME=/tmp mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test tests/e2e/cards.spec.ts tests/e2e/cards-result-layout.spec.ts --workers=2 --output=review-evidence/cards-results` → 26 passed (43.2s), both desktop projects, incl. the new human-loss layout case.
DW2: ran `npx vitest run tests/ui/card-controller.test.ts` → 19 passed.
DW3: ran `npm test` → 8 harness + 752 Vitest passed; `npm run build` → built in 186ms; compact-panels with the same Docker prefix, `--config docs/prototypes/new-game/T71/parent-acceptance/playwright.config.ts --workers=2 --grep 'reference (compact|detailed): human-loss choices'` with COMPACT_PANEL_EVIDENCE_DIR=review-evidence/loss-results → 4 passed (5.8s).

Verification of correction claims:
- sha256 src/styles.css = 257fbe1be6f70f4dda1a7750ca1fd4ba9be9950ef54e1c9b0d97bd14abf7b7d9, byte-identical to frozen candidate styles.proposed.css; `git show 64bbe6:src/styles.css | sha256sum` = 2eb627da... — the diff is exactly the three-selector append, nothing else.
- New spec is byte-diff-equal to the adopted baseline probe except the fixture path (T41 diagnostic path → docs/prototypes/new-game/T40/fixtures/T40-human-loss-450.json), as claimed.
- Frozen hashes: original manifest FROZEN-ACCEPTANCE.json = 5e5b1922… (matches RUN-NOTES), supplemental FROZEN-RESULT-LAYOUT.json hashes match current bytes of the spec (1efbe0c5…) and fixture (e9a62a51…).
- Mutation: removed the three-selector append (mutated file hashed exactly 2eb627da), re-ran cards-result-layout.spec.ts → both projects failed; compact Watch/Stop buttons sat 24–28px below the action bounds (bottom 626.1/708.5 vs action 602.2/680.0) while detailed fit — exactly the reported regression. Restored saved bytes in place; sha256 back to 257fbe1b, `.saved` deleted; `git status` shows only review scratch (review-evidence/, review-err.txt, brief).
- Probe (temporary spec, deleted after) on the corrected CSS: `#victory-standings` computes display:block, overflowY:auto, scrollH 177–178 > clientH 50–52 → optional standings scroll while both mandatory loss buttons remain visible and inside action/viewport at both sizes. Prior approval's 138 affected / 32 compact coverage covers unchanged behavior; I did not re-run the full unchanged matrix per the brief's scoped-correction instruction.

R1: none. No blocking or non-blocking findings on the new source: the CSS append is scoped to `[data-panel-detail] .action > .victory-result:not([hidden])`, so hidden results during private reward Continue and normal card layouts keep existing styling; fixed 320/380 tracks untouched (verified by the passing 24 unchanged card cases and 4 T71 loss cases). docs/spike.md now correctly distinguishes the historical 64bbe6 eight-file adoption from the corrected CSS.

Final pass done
approve
