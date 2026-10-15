# Fix #48 Finished-game messages

- **Kind**: fix; follow-up to T16 and PR47.
- **Issue**: #48 · **Branch**: `fix/48-finished-copy` · **Merge after**: T19.
- **Implementer**: native GPT-6 Luna high; owner selected for this sequence.
- **Reviewer**: MiniMax M3 (`minimax/MiniMax-M3`), thinking; owner selected.
- **Evidence**: issue48 and panel.ts: the finished subtitle joins two strings,
  attack steps remain visible, and model hints can still instruct selection.
  Finished copy is [designed] after inspecting panel/app and complete-game tests.
- **Owns**: src/ui/panel.ts, tests/e2e/finished-copy.spec.ts,
  docs/prototypes/finished-copy/**, affected docs/spike.md.
- **Scope**: Present a coherent game-over subtitle and restart guidance after
  victory; suppress stale province-selection, reinforcement and attack instructions
  in the finished panel. Preserve the winner, scores, battle log, seed, disabled
  gameplay controls, Save/Load and New game. Handle winning attacks after closing
  their result dialog, already-finished loaded games and subsequent Escape input.
  Keep normal phases byte-equivalent in behavior and appearance. No rule changes.
- **Done when**:
  1. `npx playwright test tests/e2e/finished-copy.spec.ts --workers=2` passes
     at both pinned viewports. Reproduce from legal near-victory history through
     real file upload, map/attack clicks and Continue; also load a finished save.
     Assert separated game-over copy and actionable restart guidance, absence of
     visible stale instructions, correct winner and frozen actions after Escape.
  2. The same focused suite proves New game still returns to setup and starts a
     fresh seeded match. Winner, guidance and controls fit text/panel/viewport,
     no browser errors; retain screenshots for owner judgment.
  3. Focused acceptance fails on original panel and passes on a disposable fix;
     actual-source reversion of finished guidance and subtitle correction fails
     acceptance. Restore exact bytes and retain commands/exits/source hashes.
  4. `npm test`, `npm run build`, full pinned `npx playwright test --workers=2`
     pass with all prior assertions and existing goldens unchanged. Save/replay
     state and legal outcomes remain identical.
- **Hazards**: Fix the finished presentation boundary so stale controller hints
  cannot leak back after dialog dismissal or Escape. Do not hide New game or
  change opening/combat visuals, rules, automation or deferred unrelated fixes.
