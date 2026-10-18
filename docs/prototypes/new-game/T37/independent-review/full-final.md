All checks complete and the tree is clean. Composing the review.

T37 review (Kimi K3)
approve

Worktree: detached worktree at PR head (verified `git rev-parse --show-toplevel` / `HEAD` = 6516876af95e149874af71cc920156104b4f2811); `git diff --name-only origin/main...HEAD` non-empty and matches the PR. Commands run: `git diff origin/main...HEAD -- src tests docs/spike.md RUN-NOTES.md` (full executable diff read), DW commands below, two production mutations with saved-byte restore (hashes re-verified: rules.ts ab4bf39c…, cards.ts eada3265…), frozen-acceptance hash re-check, token-equivalence re-check (inline, no writes), pinned variety.md fetched for constant provenance.

DW1: ran `npx vitest run tests/core/card-deck.test.ts` → 13/13 passed.
DW2: ran `npx vitest run tests/core/card-deck-replay.test.ts` → 7/7 passed.
DW3: ran `npm test` → 665/665 passed (50 files); `npm run build` → built clean; ran the exact pinned browser command (`docker run … mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test tests/e2e/versioned-match.spec.ts tests/e2e/reference-complete-game.spec.ts tests/e2e/game-event-log.spec.ts tests/e2e/geographic-review-guards.spec.ts --workers=2`) → 28 passed.

Sweep results:
- Composition verified against the pinned variety.md at ae298e37: Anchor 11, Compass 7, Lantern 4, Surge 4, Raid 4, Wild 5, Shield 4, Squall 1 = 40; hand limit 5; discard-before-draw (V11); one card per capturing turn never cancelled; Squall empties hand (V4); eliminated hand discarded (V6); seeded shuffle after deal/centres. All match src/core/cards.ts and rules.ts; [designed] items (wire order, top=index 0, identity tuples) state what was searched.
- Seeded: no `Math.random`/`Date.now`/wall clock in changed rule code; all draws via DeterministicRng on the game stream (grep clean); tests prove rng snapshot equality.
- Mutations (production, restored exact bytes, hashes match): deleting the pendingDiscard gate in rules.ts → 1 deck test fails ("refuses every other action atomically"); peek-instead-of-shift duplication in cards.ts drawReward → 12/20 fail; clean re-run after restore → 20/20 pass.
- Conservation, hidden-hand projection (cardView copies, public counts only, no kinds in log), pending-choice gating (refuses endTurn/attack/reinforce/captureMove/friendlyMove/watchComputers/stopGame and malformed handIndex, atomically), reshuffle RNG continuation, backward compatibility (old victory/legacy identities reject discardCard and card tuples; malformed shapes and forged `cards` snapshots rejected) all covered by tests I re-ran.
- Frozen acceptance: all 7 FROZEN-ACCEPTANCE.json hashes match current bytes. Token-equivalence claim re-run inline: all 8 installed sources equal the parent-preflighted mock ignoring comments/whitespace only — claim holds.
- Scope: only owned files changed; gameEventLog.ts addition is the single authorized mechanical label; docs/spike.md matches the code; RUN-NOTES.md is append-only tail.

Findings:
R1 (not blocking, follow-up): src/core/cards.ts:32 — the `Card conservation violated` throw in drawReward is unreachable by the design's own argument (≤20 cards in hands vs 40) and has no test; it is a defensive invariant, not a behaviour gap. No action needed for this task.
R2 (not blocking, observation): src/core/types.ts:69 — `cards?: "deck-v1" | "trade-v1" | "raid-v1"` declares future stages now; documented as staging in docs/spike.md, harmless.

No blocking findings: every guard the task protects (40-card conservation, approved multiplicities, chosen discard before draw/RNG/victory/handoff, one reward per capturing turn, Squall/elimination disposal, private hand projection, exact schema/action-only replay) is implemented and proven by tests I re-ran and mutations I re-took.

Final pass done
approve
