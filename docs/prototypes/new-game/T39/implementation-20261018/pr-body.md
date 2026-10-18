Raid sets now open an explicit enemy-country target choice in the opt-in raid-v1 stage. A valid target anywhere on the board either consumes its first held Shield with no RNG draw, or replaces its army stack with an inclusive seeded draw from 1 through max(1, floor(stack/2)). The traded set remains spent, ownership and pool remain intact, and invalid choices leave state/history/RNG unchanged.

Closes #84

Scope:
- `src/core/cards.ts`, `types.ts`, `state.ts` and `setup.ts` add pending metadata, ordinary action/public event types, the opt-in factory, cloning and phase entry.
- `rules.ts` implements target gating, remote/friendly validation, exact card spending and Shield resolution; new `raid.ts` supplies the uncapped inclusive-bound helper. One bounded rules draw even for 1..1 and zero Shield draws are approved designed protocol choices.
- `match-save.ts` and `index.ts` add exact cards/3 + schema 5 identities/exports. Historical deck-v1/trade-v1 codecs and trade-v1 Raid refusal remain frozen.
- `gameEventLog.ts` adds the exhaustive Raid-target label. Only the public Raid formatter case is inserted into the current T71 Panel; its full-history/native scrolling remains unchanged. Other UI, CSS, defaults and computer policy are preserved.
- Independent frozen acceptance, legal options/actions fixtures, original tests/manifests and all negative/positive/omission evidence remain preserved. The parent advanced only T38's unsupported-future test tuple to cards/4 + schema 6 before freezing; no producer test edits.

Validation on source `1a55a7a145b0fd3609a85e429eaa45907a75054f` (one sequential unit; browsers in pinned Playwright 1.63.0 with two workers; actual argv/raw streams retained):

```text
npx vitest run tests/core/raid-shield.test.ts
  Tests 20 passed (20)
npx vitest run tests/core/raid-shield-replay.test.ts
  Tests 10 passed (10)
npm test
  harness: tests 8, pass 8, fail 0
  Test Files 55 passed (55); Tests 733 passed (733)
npm run build
  TypeScript checks pass; built in 226ms
npx playwright test tests/e2e/{versioned-match,reference-complete-game,game-event-log,geographic-review-guards}.spec.ts
  28 passed
npx playwright test tests/e2e/compact-panels.spec.ts
  32 passed (1.3m)
```

T39's 9 frozen files, T71's 19 frozen files, both manifest bytes and every source/test/data input remain exact. Nine full mirrors match the proven parent candidate byte-for-byte; the Panel inverse comparison recovers the validated T71 source. Parent baseline 30 failures / mock 30 passes and pending/friendly/Shield/cap omission failures therefore remain applicable. No test was weakened, skipped or retried.

Docs changed: `docs/spike.md`, T39 README, source/adoption/validation receipts and append-only RUN-NOTES. Fresh inputs, raw outputs, captures and hashes are retained in member-verified archive parts; loose originals and historical evidence remain intact.

This branch integrates approved T38 and validated T71 preparation. Main owns dependency merge order (approved and green T38, then T71, then T39), independent Kimi review and final CI/delivery. No producer CI, model review, merge or Windows operation was run.
