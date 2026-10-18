Closes #83

Adds an optional cards phase after income and before placement through opt-in `tradeCardsRules`. One set may add fixed 5/8/15 armies or use Surge to double country income plus island bonuses; skip is always legal. Wild substitution requires at least one genuine card. The real codec selects the frozen cards2/schema4 stage; cards1/schema3 and existing playable defaults keep their old behavior. Raid sets classify structurally but effects are atomically refused until T39.

## Scope

- `src/core/cards.ts`, `types.ts`, `state.ts`, `setup.ts`, `rules.ts`, `match-save.ts`, `index.ts`: set classification, optional phase/action handling, initial/handoff income timing, typed Raid seam and exact replay identity/grammar.
- `src/ui/gameEventLog.ts`: declared blocking one-file mechanical fix under rule 12; exhaustive phase/action labels only.
- Parent-frozen `tests/core/card-sets*.ts` and eight replay fixtures: independent table/replay acceptance, unchanged by implementer.
- `docs/prototypes/new-game/T38/**`: retained preparation, baseline/mutation proof, raw production validation, source/browser archives and hashes.

## Validation

```text
npx vitest run tests/core/card-sets.test.ts
  Test Files 1 passed (1); Tests 23 passed (23)
npx vitest run tests/core/card-sets-replay.test.ts
  Test Files 1 passed (1); Tests 9 passed (9)
npm test
  Harness 8/8; Test Files 52 passed (52); Tests 697 passed (697)
npm run build
  core/full typecheck pass; vite 58 modules transformed; built in 249ms
docker run --rm --init --ipc=host --user 1000:1000 -v "$PWD:/work" -w /work -e HOME=/tmp mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test tests/e2e/versioned-match.spec.ts tests/e2e/reference-complete-game.spec.ts tests/e2e/game-event-log.spec.ts tests/e2e/geographic-review-guards.spec.ts --workers=2
  28 passed (1.0m)
```

Fresh checks run sequentially on source 8f90366 with all 171 snapshotted source/test/data/config inputs unchanged after every command and all 11 frozen acceptance hashes exact. Parent preflight proves baseline 31 failures/one compatibility pass; wrong Anchor value causes 5 failures, stricter Wild limit 9 failures, and exact restoration. Eight production token streams match the proven candidate apart from comments/whitespace, so those executed controls are reused. All 377 regular archive members were read and hashed; original drafts, failures and loose captures remain preserved.

## Docs changed

`docs/spike.md` documents APIs, provenance and staged replay/default boundaries. T38 README and implementation receipts describe evidence; RUN-NOTES is append-only. Owner-selected native Sol Medium; independent Kimi review, CI and merge remain main-session owned.
