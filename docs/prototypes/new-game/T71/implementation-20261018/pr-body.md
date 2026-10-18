Computer turns previously changed the height and order of adjacent sidebar content. Reference and geographic hosts now share a Compact/Detailed selector, Compact by default, with stable turn/action/log areas and optional Detailed dice. Presentation preferences survive match replacement without changing actions, RNG or timer scheduling.

Closes #163

Scope:
- `src/ui/referenceBattleGame.ts` integrates the session preference and persistent accessible control; `panelDetail.ts` owns the real native select used by independent unit acceptance.
- `src/ui/battleView.ts` exposes pending-capture presentation state; `src/styles.css` stabilizes areas and keeps required human capture/move/loss controls inside their action card.
- Parent-frozen unit/browser acceptance and seeded fixtures cover actual bounds, replay equivalence, next callbacks, pause/speed/log/load continuity and mandatory choices. The existing battle suite selects Detailed for optional dice and hides disabled inactive capture controls under the amended task; original assertions are archived unchanged. No rules/controller/AI/save changes.
- `docs/prototypes/new-game/T71/**` retains original inputs, baseline failures, disposable positives, omission controls, hashes and fresh implementation evidence; RUN-NOTES records the run.

Validation on source `a67d09a1e38242b66c1d5e56e39ddbcb8928468e` (pinned Playwright 1.63.0, two workers, owned config/output; full actual argv and raw streams in the implementation receipt):

```text
npx playwright test tests/e2e/compact-panels.spec.ts
  28 passed (1.2m)
npx vitest run tests/ui/compact-panels.test.ts
  Tests 3 passed (3)
npm test
  harness: tests 8, pass 8, fail 0
  Test Files 49 passed (49); Tests 648 passed (648)
npm run build
  TypeScript checks pass; built in 202ms
npx playwright test tests/e2e/{battle-controls,friendly-move,versioned-match,playback-controls,playback-edge-cases,game-event-log,computer-turn-flow,reference-complete-game,geographic-review-guards,geographic-board}.spec.ts
  98 passed (3.0m)
```

All 18 frozen hashes and every src/tests/data input remained unchanged across all five commands. Parent negative and compact-hiding/stability omission proofs apply through exact candidate lineage (only the CSS provenance comment changed); no tests were weakened by the producer.

Docs changed: T71 README, source/adoption/validation evidence and append-only RUN-NOTES. Complete fresh evidence is retained losslessly under T71 archives, with member hashes; loose originals are preserved.

Owner still needs to judge reserved action space and information density. Independent Kimi review and one final green CI remain required before merge. This run performed no package/Windows delivery, paid review or CI.
