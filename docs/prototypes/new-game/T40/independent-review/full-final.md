T40 review (Kimi K3)
approve

Where I worked: worktree 176-review-aed11650 at HEAD 64bbe6edaf121aad6e4d3cb8a132d9102e3ef695 (matches brief); diff vs origin/main non-empty; T40 delta isolated with `git diff 8c6d3d19..HEAD -- src tests docs/spike.md RUN-NOTES.md` (14 files, all inside the eight owned production paths plus owned tests/docs). Commands run: vitest, npm test, npm run build, pinned Docker Playwright runs, in-place mutation with byte-exact restore, adoption-hash re-verification.

DW1: ran `docker run … mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test tests/e2e/cards.spec.ts --workers=2 --output=review-evidence/cards-results` → 24 passed (51.9s), both desktop projects.
DW2: ran `npx vitest run tests/ui/card-controller.test.ts` → 19 passed.
DW3: ran `npm test` → 8 harness + 752 Vitest passed (56 files); `npm run build` → built OK; affected suites via pinned Docker image → 138 passed (3.5m); compact panels via T71 config with COMPACT_PANEL_EVIDENCE_DIR=review-evidence/compact-screens → 32 passed (1.4m), no timeouts (parent's two flaky cases passed in this run).

Mutation counterexample (brief-mandated): saved src/ui/battleController.ts, deleted the `this.cardRewardPending ||` gate from `dispatchComputer`, ran DW2 → intended test "holds a completed human draw until acknowledgement, including queued computer callbacks" failed (1 failed / 18 passed); restored saved bytes in the same step, sha256 7f3c44f3…84148 matches pre-mutation hash, .saved file removed. A first mutation (removing the redundant accepts-gate only) did not fail — other gates caught it; that gate is defense-in-depth, not a defect.

Findings:
R1 (not blocking): docs/prototypes/new-game/T40/production/verify-adoption.py cannot run standalone in this tree — it requires parent-acceptance evidence files (e.g. dw3-validation-02/receipt.json) not shipped in the PR. Verified the substance independently instead: all 8 adopted file SHA256 values in production-adoption.json match the working-tree bytes exactly (scripted check, 8/8 match).
R2 (not blocking): tests/core/card-deck.test.ts:17 — the geographic-only 30s deadline amendment is byte-minimal (timeout argument only; assertions/seed untouched, confirmed in the diff) and is explicitly authorized by the task and parent; the full `npm test` run including this test passed.
No secret-hand/deck leak found: CardView renders only the fixed-viewer projection from core `cardView`; `publicCardNotes` keeps drawn kinds out of public log text (unit-tested, plus e2e `noPrivateLeak` scans body text against a replayed public-knowledge oracle); draw-pile order never rendered. Mandatory gates hold: core rejects non-card actions during pendingDiscard/pendingRaid (src/core/rules.ts:36-37), controller `pending()` blocks board input, and the reward acknowledgement blocks both human dispatch and computer continuation (mutation-proven). Raid targeting refuses own/unknown provinces, previews name the country without revealing Shield possession; spectator files expose no choices; >1-human card files are refused without disturbing live play (referenceMatchFiles.ts:46). No wall clock/unseeded randomness in new code; no-set auto-pass dispatches exactly one ordinary `skipCards` (unit-tested, including paused and repeated-update cases).

Final pass done
approve
