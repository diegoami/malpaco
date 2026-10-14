# T07 run notes

Implementer selected by the owner: OpenAI GPT-6 Luna subagent in Codex.

Plan: prove setup tests fail; implement shared-stream board generation and the six deal steps; verify each Done-when; commit and push each meaningful step; complete the PR.

- Dispatch preparation: isolated worktree from origin/main; initial contract smoke test added before implementation.

- Baseline: initial setup acceptance test fails with missing createGame; a temporary mock starting state passes the same test. Mock removed; production API still absent.
- Progress: implemented shared-stream generated setup, seat shares, island repair, starting armies and centres; focused setup and board-generator suites pass (146 tests). Full contract coverage and mutation evidence remain in progress.
- Coverage: expanded setup and board-stream suites pass (152 tests); scripted tests cover centres after army draws, repair failure, retry stream identity, saved RNG continuation, and computer substreams. `docs/spike.md` now records generated `createGame` alongside legacy `newGame` behavior.
- Rule-9 mutations: omitted remainder compensation, reversed the positive handicap tie, disabled island repair, changed the army midpoint, duplicated a centre, and restarted RNG after board generation. Each targeted setup test failed (exit 1); all mutations were restored from saved source in `finally` blocks.
