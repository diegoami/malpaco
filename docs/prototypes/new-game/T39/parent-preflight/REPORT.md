# T39 independent acceptance proposal and integrated mock

Preflight only: no production source, existing test, task contract, GitHub object,
commit, CI or review was changed. Main owns independent acceptance and formal
implementation dispatch. The isolated worktree is `.cache/t39-work`, branch
`task/T39-raid-targeting-and-automatic-shield-defence`, base
`8f90366e8a030e5516ec6ea3b5da9f32b0026925` (T38 source checkpoint).

Main amended the contract on main4ab9fc1 and d49aa99 after reading the API/scope
proposals. `TASK-AMENDED.md` retains the exact latest task read. The worktree
has not merged those task-only commits or interfered with T38 validation.

## Source evidence and explicit engineering protocol

Approved local T23 `rules-inventory-variety-01.json` rows029..035 define an
optional three-card set before placement; one genuine tradeable kind and at
most two Wilds; spent cards discarded. Rows036/037 define any enemy country,
replacement in1..max(1,floor(stack/2)), no owner/pool change, and automatic
Shield consumption/cancellation with other hand cards unchanged. Source:
https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/variety.md#the-raid-and-the-shield
These are approved **designed** malpaco rules, not predecessor-confirmed facts.

The task now explicitly approves these **designed protocol** choices: one bounded
rules-RNG draw for every unshielded effect, including1..1; zero RNG for Shield
cancellation; first Shield in hand order. No arbitrary cap or adjacency rule
is introduced. Existing DeterministicRng.nextInt semantics are reused, like
current setup/combat. Cards3/schema5 identifies the new timing permanently;
old deck-v1/cards1/schema3 and trade-v1/cards2/schema4 stay exact.

No unresolved gameplay design conflict was found. Current T36 UI defaults
remain victoryRules. T40 supplies card controls; T41 owns computer policy.

## Concrete frozen API proposal

`src/core/state.ts`:

```ts
export function raidCardsRules(
 options?:Pick<GameOptions,'dominationWin'|'roundLimit'>
):RuleSet;
```

It derives from tradeCardsRules and returns id `malpaco-card-raids`, cards
`raid-v1`. Existing factories are retained without reinterpretation.

`src/core/cards.ts` extends the existing CardState with:

```ts
pendingRaid?: PendingRaid;
// Existing T38 reserved public type, now used:
export interface PendingRaid { readonly player:string }
```

The ordinary Action union gains `{readonly kind:'raidTarget'; readonly
province:string}`. `tradeCards` keeps its existing handIndices parameter;
trade-v1 still refuses Raid atomically. In raid-v1 a classified Raid set
(including one/two Wild substitutions) spends exactly its three chosen cards,
sets pendingRaid, leaves the phase as `cards`, and changes neither pool nor
RNG. The initial trade is recorded once in ordinary history.

`apply(state,action)` remains the only engine entry. While pendingRaid exists,
all actions except raidTarget are refused, including skip/trade/reinforce,
combat, end turn and discard. Unknown/friendly targets return failure with
state/history/RNG unchanged. A valid target resolves Shield or one seeded
bounded effect, clears pendingRaid and enters `reinforce`. It cannot trade a
second set or target again. Ownership, reinforcement pool, capture flag and
computer RNG streams are preserved. cloneState deep-copies pending metadata.

`src/core/raid.ts`:

```ts
export function raidStackAfter(
 armies:number, rng:Pick<DeterministicRng,'nextInt'>
):number;
```

This pure inclusive-bound helper supports scripted lower/upper samples in
independent tests. Actual apply calls it through the live rules RNG snapshot;
its return is used directly rather than clipping or subtracting from the stack.

Public LogEntry gains exactly:

```ts
{readonly event:'raid'; readonly player:string; readonly province:string;
 readonly defender:string; readonly before:number; readonly after:number;
 readonly shielded:boolean; readonly turn:number}
```

No hidden hand/index/list is included. Full local state and saved ordinary
history remain omniscient trusted data; seat-facing cardView remains unchanged.
The public event records the known Shield cancellation and army effect only.

`src/core/match-save.ts` and index exports add:

```ts
export const REFERENCE_RAID_CARD_MATCH_IDENTITY:MatchIdentity;
export const GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:MatchIdentity;
```

Both keep their actual generator/1 and use rules cards/3, action schema5.
Existing serializeVersionedMatch(options,actions,identity) and
 deserializeVersionedMatch(text) signatures/container shape remain unchanged.
The real identity allowlist chooses raidCardsRules only for that exact tuple.
Schema5 accepts existing schema4 actions plus exact `{kind,province}` raidTarget
with nonempty string province. Extra keys, malformed shapes and crossed stage/
schema combinations are refused. Schemas1..4 reject raidTarget; historical
trade-v1 keeps its original Raid-effect refusal. No arbitrary state snapshots
or alternative simulation codec are used.

## Actual mirror and temporary-install manifest

`integrated-mock/src/` contains ten full replacement files:

- core/raid.ts: new pure scripted-bound helper.
- core/cards.ts: pending type field and initialization capability.
- core/types.ts: ordinary action and public event union.
- core/state.ts: stage factory, cloning and cards-phase entry.
- core/setup.ts: raid-v1 cards-phase entry after income.
- core/rules.ts: stage-aware trades/rewards, pending gate and effect.
- core/index.ts: exports.
- core/match-save.ts: exact stage selection, parser and real reconstruction.
- ui/gameEventLog.ts: one mechanical raidTarget action label.
- ui/panel.ts: one mechanical public raid-event formatter case.

`install-manifest.json` lists original and candidate SHA256 for every file.
`install-manifest-01.json` preserves the earlier nine-file draft before the
panel consumer was identified. No file has been installed into production.

**T71 integration constraint:** these complete mirrors derive from8f90366,
before T71's panel work. Main may install temporarily in this baseline tree for
acceptance then restore saved bytes. Formal production must first integrate
T71 and port only the raid formatter case into its current panel.ts, preserving
all T71 history/scroller/layout behavior. Do not overwrite a newer panel file
wholesale with this historical mirror.

`runtime/` is an owned actual-source copy overlaid with these files. It also
contains existing relative JSON inputs and tsconfig; it supplies the modules
for bounded probes. Every effect and codec is the actual mirrored engine path.
`prepare.py` reproduces mirrors/runtime from this base; it is not a production
installer. Private pinned node_modules were supplied by main, with no install
or global dependency change by this agent.

## Bounded positive/negative evidence

`probe-01.txt`: five initial integrated probes passed. They cover scripted
odd/even/one/large bounds, actual pending/gating/refusals/remote effect,
first-Shield cancellation/privacy, historical refusal and real schema stage,
and legal option/action checkpoints with continuation.

The initial full typecheck exposed a second exhaustive UI consumer:
`panel.ts:40 describeLog` had no return for the new event (`tsc-ui-01.txt`). Core
compiled. Main amended the scope to allow its mechanical formatter, then both
`tsc-core-02.txt` and `tsc-ui-02.txt` passed with exit0 (empty output).

`probe-02.txt`: all eight integrated probes passed in1.89s. Added actual one-army
RNG advancement, invalid-target/extra-key refusal from a legal pending save,
old trade-stage reconstruction of the same legal prefix, and the real
geographic raid tuple. Earlier probe source is retained in source-versions.

Commands:

```text
node_modules/.bin/vitest run --config docs/prototypes/new-game/T39/parent-preflight/vitest.config.ts
node_modules/.bin/tsc --noEmit -p docs/prototypes/new-game/T39/parent-preflight/runtime/src/core
node_modules/.bin/tsc --noEmit -p docs/prototypes/new-game/T39/parent-preflight/runtime
```

Four omission probes each exit1 for the intended behavior assertion:

- pending-gate: remove the global gate; skipCards wrongly succeeds.
- friendly-target: remove own-country refusal; friendly raid wrongly succeeds.
- wrong-shield-card: discard hand index0 rather than located Shield.
- large-stack-cap: cap the upper bound20; scripted10000→5000 bound fails.

`mutations.py`, mutation-receipt.json and mutations/* retain before/mutant
source, exact stdout/stderr, commands, SHA and duration. All four owned runtime
files were restored byte-exact in finally blocks; production was never mutated.
These probes do not substitute for main's independently authored baseline and
mock-positive acceptance.

## Legal real-codec histories for independent acceptance

All four files below contain only the actual versioned options/actions envelope.
They are no synthetic snapshots. Full options are embedded: fixed-reference/1,
cards/3/schema5, seed1, four human seats, default options except
`dominationWin:false` and `roundLimit:null`.

- legal-before-trade.json:273 actions, round9, seat4 cards phase. Hand
  `[Raid,Wild,Shield,Anchor,Wild]`, pool4.
- legal-pending-raid.json:274 actions; tradeCards indices[0,1,4] spends exactly
  Raid/Wild/Wild, leaving `[Shield,Anchor]`; pending player seat4; pool4 and
  RNG `{seed:1,state:3361909039}` unchanged.
- legal-shielded-raid.json: action275 targets province_41, defender stack1 stays1.
  Defender `[Raid,Shield,Anchor,Wild,Surge]` becomes
  `[Raid,Anchor,Wild,Surge]`; RNG unchanged3361909039.
- legal-unshielded-raid.json: alternate action275 targets province_4, stack5
  becomes1; defender `[Compass,Lantern,Anchor,Anchor,Anchor]` unchanged;
  RNG becomes898507556. Ownership and pool remain unchanged.

Both branches reconstruct exactly through the actual strict codec and the next
ordinary action agrees with live continuation. Legal files were compared
byte-exact on the later probe run rather than overwritten. Metadata is retained
in legal-search-01.json and legal-search-02.json.

Deterministic bounded strategy (probe.test.ts next()): skip cards while seeking
set, reinforce the strongest owned geometric enemy-border country (fall back
strongest owned), attack first safe legal pair with source>defender+1 until one
capture, captureMove1, then end turn. On full hand discard first card other than
Raid/Wild/Shield (fallback index0). At a cards-phase Raid set choose first
lexicographic index triple recognized as Raid. Search checked seed1 and found
both shielded and unshielded living enemy owners by273 actions; maximum bound
was24seeds×3200actions but no wider run was needed. It never altered core rules.

Synthetic fixture cases are clearly named: hands/armies are arranged with
conserved forty-card multiplicities, then the real apply engine is called. Those
fixtures prove local edges but are not offered as legal options/actions saves.

## Proposed independent tests by exact Done-when path

`tests/core/raid-shield.test.ts`: independent literal forty-card counts before
trade/pending/effect; native Raid and genuine Raid+Wild substitutions; spent-set
once before target; reject all unrelated actions while pending and reject a
second trade/target after success; remote enemy target with **no owned adjacent
country** (not merely another island); unknown/friendly target refuses atomically;
scripted intervals9→1..4,40→1..20,1→1..1,large10000→1..5000, checking low/high
samples and one bounded draw; actual integration uses replacement value; no
ownership/pool/capture/computer-stream change; automatic first Shield only,
zero RNG, unrelated cards preserved; logs contain only public fields; deep
cloning and frozen input immutability. Scripted helper checks must be paired
with actual apply assertions so a disconnected helper cannot satisfy acceptance.

`tests/core/raid-shield-replay.test.ts`: freeze the four legal envelopes above
and independent literal action/count/RNG expectations; load before trade,
pending target and both effects; continue into reinforcement and later combat
with exact RNG; malformed/extra-key/cross-stage actions and invalid target
leave current state unchanged; geographic and fixed identities select exact
raid factory; old deck/trade histories stay byte-equivalent and Raid-refusing.
Use main's own tests, not these probe implementations as acceptance assertions.

No full npm test/build/browser/CI/review or task-complete claim is made. Remaining
work belongs to main's independent frozen acceptance, then explicit production
dispatch after T38/T71 integration. No new dependency or unapproved game rule
is needed.
