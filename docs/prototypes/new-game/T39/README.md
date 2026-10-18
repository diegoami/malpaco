# Raid targeting and automatic Shield defence

`raidCardsRules()` enables the separate `raid-v1` protocol. A Raid set spends
three cards and opens an explicit pending target choice. `raidTarget` accepts
any living enemy country, without adjacency. An unshielded target becomes an
inclusive uniform integer from 1 to `max(1,floor(stack/2))`; a held Shield cancels
the effect and discards the first Shield in hand order. Ownership and the
reinforcement pool stay intact. Unshielded effects use one bounded rules-RNG
draw, including 1..1; Shield cancellation uses none. These protocol choices and
their approved designed evidence are documented in `docs/spike.md`.

The strict real codec enables the effect only for cards/3 and action schema 5.
Historical deck-v1 and trade-v1 identities retain their behavior, including
trade-v1 Raid refusal. Public raid events expose the army effect and Shield
cancellation without revealing the remaining hand. Current defaults, card UI
and computer policy remain with their existing stages.

## Source responsibilities

| File | Purpose |
| --- | --- |
| `src/core/raid.ts` | Pure inclusive-bound effect helper and designed RNG protocol. |
| `src/core/rules.ts` | Pending-action gate, spent Raid set, target validation, Shield/effect resolution and public event. |
| `src/core/cards.ts` | Pending target metadata and stage-aware deck initialization. |
| `src/core/types.ts` | Stage capability, ordinary target action and public event types. |
| `src/core/state.ts` | Opt-in factory, deep cloning and cards-phase entry. |
| `src/core/setup.ts` | Cards-phase setup for the new stage. |
| `src/core/match-save.ts` | Exact cards3/schema5 identity and strict options/actions reconstruction. |
| `src/core/index.ts` | Public factory/helper/identity exports. |
| `src/ui/gameEventLog.ts` | Mechanical exhaustive target-action label. |
| `src/ui/panel.ts` | Mechanical public Raid formatter case only; integrated T71 history/scroller retained. |

`implementation-20261018/adoption.json` records exact mirror/source hashes,
baseline copies, both frozen acceptance sets and the inverse Panel comparison.
The historical complete Panel mirror is deliberately not installed: removing
the inserted Raid case from the adopted Panel recovers the validated T71 bytes.
Other T71 UI modules and CSS remain byte-identical.

## Acceptance and provenance

`parent-acceptance/FROZEN-ACCEPTANCE.json` pins nine files; the integrated T71
manifest separately pins nineteen. Neither is editable by the producer.
`parent-acceptance/PRE-DISPATCH.md` records 30 baseline failures, 30 actual-core
positive cases and meaningful pending/friendly/Shield/cap omission failures with
exact restoration. The inherited T38 future-refusal tuple was advanced by main
to cards/4 and schema 6 before freezing; all original test and manifest bytes remain
preserved. Parent preflight archives retain earlier failed drafts as well.

Four legal fixtures contain only versioned options/actions: the 273-action
pre-trade position, 274-action pending target and two 275-action resolutions.
Structural hand/army fixtures separately prove local edges; they are not offered
as legal replay histories. The legal codec paths and strict public event shape
are exercised by the independently authored replay acceptance.

Task commands:

```sh
npx vitest run tests/core/raid-shield.test.ts
npx vitest run tests/core/raid-shield-replay.test.ts
npm test
npm run build
```

The owned sequential runner additionally uses pinned Playwright 1.63.0 with two
workers for the 28 affected browser cases and all 32 T71 compact cases. It snapshots
every source/test/data input, checks both frozen sets and binds hardcoded browser
screenshots to owned evidence. Raw streams, inputs, generated captures and source
hashes remain in `implementation-20261018/`, with lossless member-verified archive
parts. The parent core omission evidence applies through byte-exact mirror
lineage; the formatter is the only additional change to the integrated Panel.

Independent review, approved/green dependency merge order and final CI/delivery
remain the main session's responsibility.

Fresh formal validation on source checkpoint `1a55a7a1` passes 20 Raid cases,
10 replay cases, 733 Vitest cases plus 8 harness cases, build, 28 affected browser
cases and all 32 T71 compact cases. Both frozen sets and all runtime/test/data
inputs remain exact throughout the six commands. The implementation receipt
records complete commands, durations, source lineage and preservation checks.
