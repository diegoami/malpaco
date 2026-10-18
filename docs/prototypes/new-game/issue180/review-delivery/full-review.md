Everything verified. Composing the review.

T73 review (Kimi K3)
approve

Worktree: /home/diego/projects/malpaco/.cache/review-worktrees/183-review-4183bcd0, HEAD 1daada6dd93c26ef49f0fe85b5e769707d7f1691, diff vs origin/main non-empty (src/styles.css, tests/e2e/battle-panel-fit.spec.ts, tests/e2e/cards.spec.ts, docs/spike.md, RUN-NOTES.md, docs/prototypes/new-game/issue180/**).
Commands run: python3 docs/prototypes/new-game/issue180/production/verify-adoption.py (exit 0: 18 frozen, 222 validated inputs, 28 archive parts, 1689 members, 0 mismatches); docker playwright suite (8 files, 110 cases); npm test; npm run build; CSS-append mutation with rebuild and focused retest, then exact restore.

DW1: ran docker … playwright test tests/e2e/battle-panel-fit.spec.ts (with DW2 files) → 110 passed (3.6m), exit 0, both 1280x800 and 1920x1080, no retries.
DW2: ran the same docker run with all seven listed files plus battle-panel-fit → 110/110 passed, zero retries, exit 0 (review-t73-browsers.log retained).
DW3: ran npm test → 57 files / 784 tests passed; npm run build → ✓ built (exit 0). verify-adoption.py re-run after mutation/restore → 0 mismatches.

Findings:
R1 (not blocking): tests/e2e/cards.spec.ts:31 — confirmed the only change vs preflight/source/cards.original.ts (byte-identical to origin/main's cards.spec.ts) is the single `anchors` line replacing the obsolete 320/380-pixel track assertion with viewport-fit plus bounded-history-scroller checks; every action, privacy, replay, mandatory-choice, continuity and relative-stability assertion is unchanged, exactly as the task permits.
R2 (not blocking): src/styles.css:1419–1434 — causality proven: removing only the 16-line T73 append and rebuilding makes battle-panel-fit.spec.ts fail at both sizes with `#fight-on-button`, `#stop-battle-button`, `#single-exchange-button` clipping/hit-target errors and `.battle-controls` shared-scrolling violations (review-t73-mutant.log); restoring the exact saved bytes (sha256 9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64, identical to production-candidate/src/styles.css), rebuilding and re-running the proof returns everything green. The new test genuinely binds the CSS.
R3 (not blocking): new tests/e2e/battle-panel-fit.spec.ts uses a fixed clock (2026-10-18T12:00:00Z), deterministic fixtures and exact core state/RNG oracles via `apply`; no wall clock, unseeded random or order-dependent iteration. It retains complete history, older-reader position, bottom-follow and oldest-entry readability checks, and measures before asserting.
R4 (not blocking): evidence honesty — the shipped proof and docs/spike.md openly report combined 108/110 with two native-save timeouts, 0/2 retake and 2/2 unchanged-selection control, with the cause unresolved; no invented green run. My independent regular suite passed 110/110, so the reuse does not hide a current failure. Constants (64px turn row, 410px action cap, 88px min history) trace to the verified preflight/production evidence (bounds summaries, candidate restorations).
R5 (not blocking): scope check — runtime change is confined to the T73 CSS append in src/styles.css; no gameplay, RNG, save, AI, map or controller diffs. RUN-NOTES.md is append-only; docs/spike.md updated consistently. The 28 committed archive parts and 1,689 evidence members were machine-audited by verify-adoption.py (0 mismatches), not eyeballed.
R6 (not blocking): pending gates — owner appearance judgment and one final-head green CI remain external main-owned merge gates per the task text; their pending state is not an implementation defect.

Coverage: full diff read; binary archive parts and huge JSON inventories audited via the shipped proof, not printed. Scratch outputs retained in the worktree as instructed.
Final pass done
approve
