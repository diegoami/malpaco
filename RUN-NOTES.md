# T07 run notes

Implementer selected by the owner: OpenAI GPT-6 Luna subagent in Codex.

Plan: prove setup tests fail; implement shared-stream board generation and the six deal steps; verify each Done-when; commit and push each meaningful step; complete the PR.

- Dispatch preparation: isolated worktree from origin/main; initial contract smoke test added before implementation.

- Baseline: initial setup acceptance test fails with missing createGame; a temporary mock starting state passes the same test. Mock removed; production API still absent.
- Progress: implemented shared-stream generated setup, seat shares, island repair, starting armies and centres; focused setup and board-generator suites pass (146 tests). Full contract coverage and mutation evidence remain in progress.
