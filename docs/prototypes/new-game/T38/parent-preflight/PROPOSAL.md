# T38 disposable preflight proposal

This packet contains proposals and a complete mirrored source candidate only. No production source, frozen acceptance, task contract, commit, network, model, CI or playable default was changed. Base source is validated T37 6516876; T37 adoption/review/merge remains parent-owned. Read commands/raw outputs are retained in read-00..09; the first mirror typecheck failed because existing JSON dependencies were absent, then passed after exact T34/T63 data copies.

## Exact public API

- `tradeCardsRules(options?)`: same options as `cardsRules`, `id: 'malpaco-card-trades'`, `cards: 'trade-v1'`.
- `Phase` gains `'cards'`. Initial state and every next-living-player handoff under trade-v1 compute ordinary income once, then enter cards, including an empty hand. Other presets keep their phases.
- `{kind:'tradeCards', handIndices:readonly [number,number,number]}` and `{kind:'skipCards'}`. Success transitions directly to reinforce, making both repeated trades and a trade after skip impossible. No additional spent-set or duplicated-income state.
- `TradeableCardKind = 'Anchor'|'Compass'|'Lantern'|'Surge'|'Raid'`; `classifyCardSet(cards:readonly CardKind[]):TradeableCardKind|null`. This is a structural classifier, not a promise that every kind resolves at this stage.
- Export `PendingRaid {readonly player:string}` as a type-only T39 seam. No active Raid action/state/phase is introduced.
- `REFERENCE_TRADE_CARD_MATCH_IDENTITY` and `GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY`: generator fixed-reference/1 or geographic/1, rules cards/2, actionSchemaVersion 4. Existing cards/1 + schema3 remains deck-v1 forever. Reject mismatched tuples and cards/3+schema5; schema3 continues refusing trade/skip actions, schema4 additionally accepts strict trade/skip and existing discardCard.

Indices must be three distinct nonnegative safe integers within the active hand; exact wire keys/length and integer shape are checked by the actual codec, and phase/hand legality by actual apply. Cards are discarded in original hand order, regardless of selection order. Refusals consume no cards, income, history or RNG. No RNG is used by trade/skip. These representational decisions are explicitly designed after searching pinned variety-029..035 and current deck/codec seams; they do not change approved gameplay.

## Rule provenance and resolved scope conflict

All cited constants are owner-approved `[designed]` malpaco rules in local T23 inventory, pinned upstream ae298e37c2f5177039e55767607f9345b6cb0e7a/design/variety.md. variety-003/029: exactly three, one optional set, cards after income/before placement. variety-009..014/030/032: same genuine kind with up to two Wilds; no three Wilds, mixed genuine kinds, Shield or Squall. Anchor +5, Compass +8, Lantern +15; Surge adds the whole turn's income again, including islands (variety-043). Values never grow (033). Skipping legal for every seat (035).

Approved variety-030 includes Raid, while T38 defers targeted Raid to T39. Parent explicitly resolved this as an internal frozen stage: classify Raid structurally but atomically refuse `tradeCards` for Raid in trade-v1. T39 must activate its separate raid-v1/cards3/schema5 tuple; do not silently make an inert Raid consume cards. No open design conflict remains in this packet.

The new action and phase union members require only mechanical label additions in exhaustive maps in `src/ui/gameEventLog.ts`, outside current T38 Owns. Parent must amend/declare that one-file scope before actual adoption. The mirrored file includes those labels for compile feasibility. No UI flow/default/computer policy is implemented; playable defaults stay victoryRules until T40/T41 readiness.

## Independent acceptance strategy for parent

Use literal expected tables, not candidate constants/functions. Enumerate all 512 ordered triples over the eight literal kinds; classify as valid only the five homogeneous genuine kinds with 0,1,2 Wild substitutions, and assert only four resolve in trade-v1. Include all permutations/indices, wrong cardinality, duplicate/fractional/negative/out-of-range index, mixed real kinds, three Wilds, Shield/Squall and Raid atomic refusal. Re-distribute the canonical literal inventory for unit fixtures to retain forty-card conservation.

Assert initial cards phase and every handoff, all action refusals before skip/trade, skip with empty/full/valid-set hands, placement immediately afterward, second set forbidden, fixed repeated-turn values, whole base+island Surge doubling, no RNG movement, immutable original state and no public hidden-hand leak. The phase alone enforces the set cap. Place some armies after trade, replay again, and verify the reduced pool is preserved rather than recalculated.

Use the real production codec, no adapter: old victory/schema2, legacy/schema1 and frozen T37 cards/schema3 must replay unchanged; exact schema4 identities on both generators; bad tuples, future cards3/schema5, extra state keys, extra action keys and malformed indices reject. Serialize/replay before and after every key action and continue the loaded state through placement/endTurn. Mutate one fixed value and the Wild limit independently, require targeted acceptance failures, and restore exact saved bytes in finally.

## Bounded legal histories and limits

All `legal-*.json` files contain only ordinary settings and legal action histories and are serialized/replayed by the real mirrored codec; they contain no trusted snapshots, forged hands or RNG. Read `legal-history-report.json` and `Surge-search-report.json` for exact counts. Inherited T37 reshuffle and decisive histories get explicit skips inserted at every cards phase. Genuine Anchor and Compass opportunities fork to before/after trade fixtures; a structural Raid opportunity is reported unsupported. The Surge search uses only ordinary actions, at most 16 seeds/3000 actions each, and stops after seed1 exhausted3000 then seed2 succeeds294. Its income is base3 + island3 =6, doubled to12 using Wild/Surge/Wild. No wide geography measurement.

The small probe is a feasibility aid, not independently authored acceptance: parent owns new frozen tests and baseline/mock-positive/mutation proof. The probe's direct effect fixtures temporarily assign hands and do not claim conservation; the emitted legal-history fixtures do prove real conservation/replay paths. Mirror compilation and original T37 compatibility checks are separate retained commands. No full suite/build/browser claim is made here.

## Execution receipts

`node_modules/.bin/tsc --noEmit -p docs/prototypes/new-game/T38/parent-preflight/mock/src/core/tsconfig.json` passed after copying the two pre-existing local JSON dependencies; first failure retained in mock-core-typecheck.*, corrected outputs mock-core-typecheck-fixed.*.

`node_modules/.bin/vitest run --config docs/prototypes/new-game/T38/parent-preflight/probe.config.ts` passed 3/3, including real Surge/base+island history (probe-with-surge.*). Earlier 2/2 proof retained separately.

`node_modules/.bin/vitest run --config docs/prototypes/new-game/T38/parent-preflight/compatibility.config.ts` passed all 20 byte-identical copied frozen T37 tests (compatibility-fixed.*). First attempt passed18/failed2 because their relative T37 fixture data had not yet been copied; failure preserved in compatibility.*, then exact fixture copies resolved it without altering tests or source.

`git diff -- src tests docs/tasks RUN-NOTES.md` produced zero bytes (production-unchanged.diff). candidate-changed-paths.json identifies seven mirrored core changes plus the mechanical label file. Every emitted packet file is covered by final-manifest.json; no inherited path removed.
