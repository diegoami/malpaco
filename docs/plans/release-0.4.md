# 0.4: strategic competence and ruleset evaluation

Owner direction and decisions live on [#334](https://github.com/diegoami/malpaco/issues/334)
and [Questions for 0.4, #342](https://github.com/diegoami/malpaco/issues/342).
The [decision-space research, #339](https://github.com/diegoami/malpaco/issues/339)
grounds the tactical work; labels and PR checks hold status.

## Sequence

1. Public position facts and information boundary: [T129](../tasks/T129.md), #343.
2. [T130](../tasks/T130.md), #345: bounded integer single-source capture-risk intervals
   for specified one/two-country paths; later response evaluation uses this public model.
   The [helper semantics](computer-evaluation.md) distinguish public facts, conditional
   probability intervals and explicit unknown outcomes from strategy claims.
3. [T133](../tasks/T133.md), #350: experimental reinforcement/capture allocation;
   [T135](../tasks/T135.md), #354 adds partial/lateral movement and future-front protection;
   [T136](../tasks/T136.md), #356 supplies finite-budget campaign outcomes before [T137](../tasks/T137.md), #358 attack/stop ranking under #341. Freeze each bounded contract before code;
   arena evaluation precedes adoption.
   [Candidate semantics](allocation-candidate.md) define its conditional model and limits.
4. [T132](../tasks/T132.md), #348: reproducible public-policy arena and frozen v0.3.1 comparator;
   paired initial states, rotated
   seats/first players, separate development/evaluation seeds, exact policy/rules/source IDs,
   explicit budgets, deterministic histories and all scheduled outcomes. Tactical wins alone
   do not establish strength. Coordinate #92/#93/#95; their old contracts require new preflight.
5. [T138](../tasks/T138.md), #360 crosses all map/seat settings at one development seed with the frozen tactical candidate before held-out evaluation. Compare current combat with symmetric defender-wins-ties: #340. Change one mechanic first;
   investigate justified economy/card/movement interactions afterwards. Coordinate #299 and
   preserve #295's original unfinished cases. Initial model results do not establish fun or
   inevitable stalemates.
6. [T139](../tasks/T139.md), #361 and [T140](../tasks/T140.md), #363 provide isolated current-rule and defender-tie playtests with preserved old-save history/rules. [Coverage/opening follow-up #362](https://github.com/diegoami/malpaco/issues/362) informs the next bounded development contract before a frozen held-out evaluation. Owner playtesting and adoption decisions, then independent milestone review before release.

## Adopted product behavior

[T141](../tasks/T141.md), #364 adopts the sole improved computer policy for future
moves, including resumed games. [T142](../tasks/T142.md), #365 gives defender-winning
ties a distinct immutable product identity and strict save compatibility.
[T143](../tasks/T143.md), #366 adds the combat-only setting: **Defender wins ties**
(default for new games) or **Legacy (reroll ties)**. Both use the improved AI.

The setting applies to new games. Kept matches retain their original combat rules
and exact recorded actions; Help reports the running game's rule. New results
carry rules metadata and can be filtered by variant. Existing score totals, rows
and deduplication IDs survive, with unclassified history shown as Earlier games.
This owner adoption does not establish universal strength or settle #362's remaining
coverage/opening concerns. The [adoption acceptance](https://github.com/diegoami/malpaco/issues/334#issuecomment-6411741351)
holds exact PR heads, CI and proof receipts; live GitHub checks remain authoritative.

## Boundaries

The owner chose tactical AI and ruleset research for 0.4, with personalities deferred
([decision](https://github.com/diegoami/malpaco/issues/342#issuecomment-6394642088)).
Adopted improved AI makes future choices in existing saves; recorded actions always replay
exactly. Rules variants require immutable identities and explicit compatibility work.

The owner adopted the improved AI as the sole computer policy and requested only a combat-rules setting (defender-winning ties versus Legacy rerolled ties). [T141](../tasks/T141.md) owns AI adoption;old recorded history and combat rules remain immutable. This owner decision supersedes the earlier research-only default boundary. All seats obey the same visible
rules. Hidden enemy hands, draw order, RNG snapshots and controller identities never become
policy inputs. Planning uses deterministic operation limits and integer arithmetic, with no
new dependencies planned. Mark proposed scoring constants and approximations [designed].

Preserve reviewed v0.3.1 source/tag and published bytes. Native distribution/storage and held
balance prototypes remain separate. Generated evidence goes to ignored `artifacts/`, then
Drive or release storage under the existing process. No production publication before the
milestone review and required owner judgments.
