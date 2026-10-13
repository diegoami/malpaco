# RUN-NOTES T05b, round 3 (rework of PR #20, Sol's round-2 review R1-R9)

Plan:
1. Merge origin/main (T06 font + goldens). Task-file conflict resolved to main's text.
2. R1: public `generateBoard(seed)` takes no overrides; injection moves to an internal
   `generateBoardInternal` (not re-exported from index.ts); test that the public function
   ignores overrides.
3. R2: tests reach the real `runAllFairnessChecks` through the internal entry (injected unfair
   body, real checker): rejection, retry, exhaustion; all five checks on generated outputs.
4. R9: pair reference counts for island neighbours; entrance cap lets existing entrances be reused.
5. R3: deterministic under-minimum body scenario hitting the min-entrance guard.
6. R4: observe Phase 1's pair order directly (internal trace).
7. R5: repair the 46-province fixture; structural validator in the test.
8. R6: 200-seed sweep over caps after the generator changes; pin the smallest cap >= 99 %;
   a test that fails if the cap changes.
9. R7 and every rule-9 mutation: transcripts in the PR body. DW8 from CI.

Progress:
- merge origin/main: task file resolved to main's version.
- R5: validator listed 20 violations on the old fixture; repaired fixture passes.
- R1/R2/R3/R4/R9/R6: generateBoard(seed) only; generateBoardInternal; structuralErrors;
  BodyTrace; pair ref counts; entrance reuse at cap; cap sweep 1..200 gives 200/200 at cap 1,
  so MAX_BOARD_ATTEMPTS = 1. 256/256 vitest.
