# RUN-NOTES T09

Task: issue #23, branch `task/T09-island-income`. Implementer: an OpenCode
session (`model:deepseek`), the owner's dispatch call recorded on #23.

Plan: add `src/core/bonuses.ts` (`islandIncome(state, seatId)` ->
`{ islands, total, count }`, pure, C-BON-01), export it from
`src/core/index.ts` (one line), and `tests/core/bonuses.test.ts` (authored map
plus a `generateBoard` result). No constant added; no change to the bonus
values, `data/` or `src/ui/`.

- step 1: `src/core/bonuses.ts` + the one-line export + `tests/core/bonuses.test.ts`.
  `npx vitest run tests/core/bonuses.test.ts` -> 8 passed. `npm test` -> 270 passed.
  `npm run build` -> green (tsc core, tsc, vite build).
- step 2: DW3 deletion mutation: removed lines 39-41 of `src/core/bonuses.ts`
  (`const complete = ...` and `if (!complete) continue;`), ran the bonus suite
  -> 6 failed / 2 passed; restored the saved file -> 8 passed.

END: DW1-DW4 met.
