# T37 preflight proposal

This is disposable feasibility work. No production adoption, task completion, production tests, CI, browser results or production codec correctness are claimed. Main owns frozen independent acceptance and implementation dispatch.

## Evidence and rule decisions

Approved local T23 `docs/plans/new-game/rules-inventory-variety-01.json` rows variety-009..028 and040 give all constants: Anchor11, Compass7, Lantern4, Surge4, Raid4, Wild5, Shield4, Squall1; forty cards; hand maximum five; empty opening hands; single capturing-turn reward before victory; chosen discard before drawing; same game RNG after deal/centres and on reshuffle; Squall discards current hand and itself; elimination discards to pile rather than transfer. These are owner-approved **designed**, not predecessor-confirmed. Pinned design ae298e37c2f5177039e55767607f9345b6cb0e7a. No new game rule constant is proposed.

Canonical ordering of unshuffled copies, top at array index0, discarded cards appended in existing hand order, stage identities, schema versions and hand index as action parameter are implementation protocol choices [designed]. Searched actual setup/rng/state/rules/match-save/save/computer and controller/log code. They must become stable once saves use them. No random computer policy is invented.

## Exact proposed production API

`src/core/cards.ts`:

```ts
export type CardKind = 'Anchor'|'Compass'|'Lantern'|'Surge'|'Raid'|'Wild'|'Shield'|'Squall';
export const CARD_COMPOSITION: Readonly<Record<CardKind,number>>;
export const HAND_LIMIT = 5;
export interface CardState {
 drawPile: CardKind[];
 discardPile: CardKind[];
 hands: Record<string,CardKind[]>;
 pendingDiscard?: { readonly player:string };
}
export interface CardView {
 readonly drawCount:number;
 readonly discardCount:number;
 readonly handCounts:Readonly<Record<string,number>>;
 readonly hand:readonly CardKind[];
}
export function cardView(state:GameState,viewer:string):CardView;
```

`src/core/types.ts`: optional `GameState.cards?:CardState`; `RuleSet.cards?:'deck-v1'|'trade-v1'|'raid-v1'`; extend Action with `{readonly kind:'discardCard';readonly handIndex:number}`. Pending-discard gating can retain existing phase; no new phase literal is necessary. Reject all other actions while pending, even friendly move and ordinary endTurn. Reject invalid index/integer, discard without pending, cards on legacy rules. Public logs should contain counts and player only; never ordinary drawn kind or chosen hidden index. Full state/save history is trusted local omniscient data; cardView is the seat-facing boundary.

`src/core/state.ts`:

```ts
export function cardsRules(options?:Pick<GameOptions,'dominationWin'|'roundLimit'>):RuleSet;
```

This is the permanently deck-only factory, based on victoryRules, id `malpaco-cards`, cards `deck-v1`. Later factories explicitly choose trade-v1/raid-v1; never redefine deck-v1 behavior. `apply(state:GameState,action:Action):ApplyResult` and existing `createGame`, `createReferenceGame`, `createGeographicGame`, `createGameWithRng` signatures remain unchanged. Export card types/functions from `src/core/index.ts`.

`src/core/match-save.ts`:

```ts
export const REFERENCE_CARD_MATCH_IDENTITY: MatchIdentity;
export const GEOGRAPHIC_CARD_MATCH_IDENTITY: MatchIdentity;
export function serializeVersionedMatch(options:GameOptions,actions:readonly Action[],identity:MatchIdentity):string;
export function deserializeVersionedMatch(text:string):LoadedVersionedMatch;
```

Keep the existing two entry signatures, v2 container shape, LoadedVersionedMatch and every old tuple exactly. The new constants use existing fixed-reference/geographic generator1, rules cards/version1, actionSchemaVersion3. Add strict identity-aware parser: discardCard has exactly kind and safe nonnegative integer handIndex; reject it under older schemas; reject extra keys, negatives, fractions and unsupported tuples. No serialized card snapshot is accepted as authority. Reconstruct through original options and ordinary actions, including pending discard and RNG.

Bounded future mapping (must be frozen by main): T37 rules cards1/schema3 => deck-v1; T38 cards2/schema4 => trade-v1; T39 cards3/schema5 => raid-v1. T38/T39 new actions rejected by older schemas; decoder dispatches a stage factory from exact tuple, never the newest default. Mandatory trade phases, raid RNG or new income timing cannot reinterpret T37 saves. Existing victory1/schema2 and malpaco1/schema1 remain unchanged. T40 selects the latest supported card stage only when UI controls exist.

## Actual engine seams

`setup.ts:createGameValidated`: initialize after productionCentres selection on the same RNG, before state rng snapshot. No card draws/RNG/state field for old rules. Both reference and geographic constructors already funnel here. `state.ts:newGameWithPlayers` is the older spike constructor: if cardsRules is supported there, initialize after its deal (its centres are empty); document and test that seam rather than pretend it is modern setup. `cloneState` must deep copy all piles, hands and pending metadata.

`rules.ts:completeTurn`: split reward and finalization. On capturedThisTurn with five cards, record initiating endTurn/friendlyMove once, mark pending, and return without draw, reshuffle, victory, turn_ended or handoff. Chosen discard mutates hand/discard, then draws once and calls finalization exactly once. Friendly movement happens before pending and is never applied again on discard. Draw ordinary card into hand or Squall into discard with whole hand, then normal victory/handoff. Capture flag survives failed later combat. `checkElimination` discards a newly eliminated hand immediately, including a decisive capture before its captureMove resolves.

Current T36 defaults in UI and geographic creation stay victoryRules and old identities through T39, so no existing UI can get stuck with pending cards. A core caller opting into cards must supply choices. `computerAction` currently has no discard policy; which card it chooses is T53 policy. It must not silently choose for T37. This is safe for current UI because opt-in is absent; a future card-enabled computer loop requires a deliberate policy decision.

## Small adjacent scope conflict

`src/ui/gameEventLog.ts:16` has `Record<Action['kind'],string>`. Adding discardCard requires a mechanical label entry or npm build fails. This is outside T37 Owns: main should authorize/amend that single adjacent file explicitly. If a new phase is chosen, its PHASE_NAMES record at21 also needs a label. No such edit made. LogEntry consumers here are non-exhaustive `if` branches. BattleController.pending() knows capture only: no changes needed while card UI is disabled, but T40 must extend it before enabling cards. Existing computer policy likewise cannot drive pending cards.

## Independent acceptance cases proposed

For exact `tests/core/card-deck.test.ts`: count each of eight literal multiplicities independently (not from exported composition); assert opening hands and full 40-card multiset; compare base deal/centres with opted-in setup and independently shuffled stream continuation; deterministic known draw order; actual engine capture of multiple countries earns one at end, later failed attack cannot cancel; noncapturing turn draws none; full hand blocks every unrelated action before changing draw pile/RNG/victory, accepts chosen original index and rejects invalid indices without mutation; full-hand Squall discards preselected card then remaining four plus Squall, empty-hand Squall does not replace itself; actual elimination empties victim hand immediately and never transfers; friendlyMove reaches same reward seam and moves armies exactly once; view/log contains no hidden opponent cards. Deep frozen inputs remain unchanged.

For exact `tests/core/card-deck-replay.test.ts`: exercise **actual** serializeVersionedMatch/deserializeVersionedMatch with card identity, not candidate codec. Replay a legal action history ending in pending discard and resume exact chosen discard; finish decisive capture/captureMove/turn with both nonfull and full hands, asserting reward before victory; force a reachable reshuffle through engine actions and assert piles, hands, rule RNG and next attack dice after load; verify computer RNG unchanged; compare both reference/geographic card save identities; recheck all historical v1/v2 identities and rejecting unknown tuple/schema/actions. Fixtures can supplement direct replay-from-state unit checks, but cannot substitute for options/actions codec reconstruction.

Required mutations: bypass five-card pending branch must fail pending/visibility/decisive tests; duplicate ordinary card must fail literal 40-card multiset conservation and replay assertions. Main should independently freeze these and measure absent production behavior before adoption. npm test/build and affected browser suites remain formal implementation work.

## Disposable source and measurements

`candidate.ts` wraps the existing real core setup/apply, conserves cards, intercepts reward before base endTurn and explicitly preserves extension through old cloneState. It implements capture elimination and friendly movement integration as feasibility code. `candidate.test.ts` has eight bounded tests, but is **not complete acceptance**: capture-flag scenarios are constructed, elimination/friendlyMove need independent actual-action tests, and codec is deliberately nonproduction. Its decoder lacks the strict production validation described above. It is unsuitable for copying wholesale into src.

`smoke-01.txt`: normal config intentionally excludes prototype tests; no test files, Vitest exit1. Added separate owned config; no existing config change. `smoke-02.txt`: eight tests passed, one file, Vitest exit0. Command: `node_modules/.bin/vitest run --config docs/prototypes/new-game/T37/parent-preflight/vitest.config.ts`.

`candidate-bypass-discard.ts` changes only `length===5` to `length===500`; its copied tests fail2/8. `candidate-duplicate-card.ts` pushes a drawn normal card twice; tests fail5/8. `mutations-01.txt`: combined7 failed/9 passed, Vitest exit1. Command: `node_modules/.bin/vitest run --config docs/prototypes/new-game/T37/parent-preflight/vitest-mutations.config.ts`. These are retained separate variants; original candidate and all production files were never mutated and no restoration is needed. Root source inputs remain untouched. Main provided private pinned dependencies; no installation/global change occurred.

Unresolved before production: main agreement on exact protocol naming/stage mapping and one-file mechanical UI Owns extension. No new gameplay rule conflict found; computer policy remains deliberately outside scope. Formal acceptance must prove real captures, elimination, movement and real codecs in addition to this small feasibility smoke.
