# T07 run notes

Implementer selected by the owner: OpenAI GPT-6 Luna subagent in Codex.

Plan: prove setup tests fail; implement shared-stream board generation and the six deal steps; verify each Done-when; commit and push each meaningful step; complete the PR.

- Dispatch preparation: isolated worktree from origin/main; initial contract smoke test added before implementation.

- Baseline: initial setup acceptance test fails with missing createGame; a temporary mock starting state passes the same test. Mock removed; production API still absent.
- Progress: shared-stream generated setup, seat shares, island repair, starting armies and centres are implemented. The compatibility note documents generated `createGame` alongside legacy `newGame` behavior.
- DW1: `npx vitest run tests/core/setup.test.ts tests/core/board-gen.test.ts` → 2 files, 152 tests passed.
- DW2: same focused command → passed; covers all first-seat rotations, 2/3/4-seat exact shares, 100 generated seeds with no complete island, forced repair, share preservation and explicit impossible-repair failure.
- DW3: same focused command → passed; all three army tops and exact totals, odd holdings, scripted centre draws after army draws with same-owner/same-island selection, and independent centre cloning.
- DW4: same focused command → passed; deterministic full states, ≥5 distinct starts, one RNG object through retry and deal, stored snapshot resumption, independent computer streams, no-state board exhaustion, unchanged legacy setup tests, and `generateBoard(seed)` compatibility via the caller-owned stream.
- DW5: each mutation failed its targeted test (exit 1), then the exact source was restored in a `finally` block: omitted remainder compensation (`rotates exact remainder shares`); reversed the positive handicap tie (`applies human shares`); disabled island repair (`repairs a forced complete island`); changed the midpoint (`distributes integer armies`); duplicated a centre (`selects three distinct valid centres`); restarted RNG after board generation (`continues one game stream`).
- DW6: `npm ci && npm run build && npx vitest run && npx playwright test && git diff --exit-code origin/main -- src/ui tests/e2e data/maps/archipelago.json` → install/build passed, 15 Vitest files and 301 tests passed, 36 Playwright tests passed, excluded-scope diff exit 0. `git diff --check` passed. No golden files changed; the full Vitest run includes the core purity suite.

## END

- Final implementation and evidence commit: `94d029c` (`Complete T07 coverage and evidence`).
- PR: #28, draft; issue #27.
- Review: not started; the owner has not selected the OpenCode reviewer yet.
- Blockers: none.
- Duration: approximately 36 minutes at 2026-10-14 07:31 UTC; token total unavailable to this subagent.
