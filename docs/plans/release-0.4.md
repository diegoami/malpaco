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
5. Compare current combat with symmetric defender-wins-ties: #340. Change one mechanic first;
   investigate justified economy/card/movement interactions afterwards. Coordinate #299 and
   preserve #295's original unfinished cases. Initial model results do not establish fun or
   inevitable stalemates.
6. Owner playtesting and adoption decisions; independent milestone review before release.

## Boundaries

The owner chose tactical AI and ruleset research for 0.4, with personalities deferred
([decision](https://github.com/diegoami/malpaco/issues/342#issuecomment-6394642088)).
Adopted improved AI makes future choices in existing saves; recorded actions always replay
exactly. Rules variants require immutable identities and explicit compatibility work.

Keep current rules/defaults until concrete evidence and an owner adoption decision. Research
of optional variants does not authorize a default change. All seats obey the same visible
rules. Hidden enemy hands, draw order, RNG snapshots and controller identities never become
policy inputs. Planning uses deterministic operation limits and integer arithmetic, with no
new dependencies planned. Mark proposed scoring constants and approximations [designed].

Preserve reviewed v0.3.1 source/tag and published bytes. Native distribution/storage and held
balance prototypes remain separate. Generated evidence goes to ignored `artifacts/`, then
Drive or release storage under the existing process. No production publication before the
milestone review and required owner judgments.
