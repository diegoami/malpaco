# RUN-NOTES T10

Task: issue #25, branch `task/T10-reinforcement-income`. Implementer:
OpenCode `openai/gpt-6.1-sol#low` (rule 6.1 dispatch; minimax 7d at 82% —
bypassed).

Plan: add `src/core/reinforcement.ts` (`reinforcementIncome(state, seatId)`
→ `{ base, islandBonus, total, provinceCount }`, pure, C-REI-01..03, building
on T09's `islandIncome` export), one line in `src/core/index.ts`, and
`tests/core/reinforcement.test.ts` (authored map + a `generateBoard` result).

- step 1 attempt 1 (OpenCode 2.0.28, `mlp-mlp-t10-impl`): implementer caught
  DW1 contradiction (`provinceCount == 7 → base == 3` vs
  `max(floor(7/3), 2) = 2`). Stopped per rule 5; main amended DW1 on `main`
  (`6faefa3`) to `provinceCount == 9 → base == 3`; brief and RUN-NOTES
  updated.
- step 1 attempt 2 (`mlp-t10-impl-2`): implementer wrote `reinforcement.ts`
  + barrel export + 11 tests. `npm ci`; `npx vitest run tests/core/reinforcement.test.ts`
  → 11/11 pass. Commit `f04821b` on detached HEAD; pushed
  `HEAD:refs/heads/task/T10-reinforcement-income` (bare `git push origin HEAD`
  refused on detached HEAD, implementer self-corrected). PR #26 opened with
  `model:openai` label (created on the fly) and the eliminated-seat decision
  in Scope.
- review (OpenCode 2.0.28, `mlp-t10-review`, `zai-coding-plan/glm-5.3` at
  `low`): verdict approve. All four DW lines re-run by the reviewer; DW3
  mutation (clamp removed → 6 red → restored → green); `npm test` 281 pass;
  `npm run build` clean. `npm install` first (reviewer worktree was fresh).
  No findings.
- merge: `75fdd1d` (squash, branch cleaned by `--delete-branch`). CI green.
  Process §9 comment posted on #25; rule-21 comment on #3.

END