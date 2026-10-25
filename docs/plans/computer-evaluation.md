# Public position and capture-risk helpers

`computerView(state)` supplies copied public facts and the mover's own hand. The
strategic context adds public island/rule/turn/victory/capture information; it carries
no enemy hand contents, draw order, RNG snapshots or other controller identities.
The baseline decision function still accepts the narrower historical interface.

`evaluateComputerPosition(view)` returns integer country/army/income totals, island
progress/entrances, current frontiers, shortest owned-route distance to a frontier
(`null` for disconnected reserves), movable armies and opponent-grouped adjacent
sources. Each hostile source is counted once in a seat's aggregate adjacency.
These are facts about the current position, not independent attacks or future odds.

## A specified capture tactic

`estimateCapturePath(view, source, targets, extraArmies = 0)` models one source
fighting a specified adjacent path of one or two enemy countries until each falls
or it cannot attack. Each capture transfers the maximum, leaving one army behind.
Both battles share casualties; the second never starts with a fresh original force.
The source can belong to any seat: this conditional model can describe a possible
opponent turn without identifying human/computer controllers.

`extraArmies` is an explicit hypothetical addition. The helper does not predict
income, unseen cards, actual opponent choices, combined attacks, exchange budgets,
handoff events or overall win probability. Callers construct and justify hypotheses.

For supported comparison-free single-die combat, the result is either:

- `bounded`: integer `lower` and `upper` in units of `scale` (1,000,000), plus the
  number of evaluated attacker/defender `cells`. The interval encloses the model's
  exact probability under independent uniform dice. Rerolled ties ignore tied
  exchanges; attacker/defender ties include them in the appropriate outcome.
- `unknown`: reason `path`, `combat`, `counts` or `budget`. This is not zero risk.
  Multi-die/comparison-gated combat and constrained two-hop capture transfers are
  outside the model. Invalid counts/paths and unsafe arithmetic are rejected.

The dynamic program rounds lower bounds down and upper bounds up at each convex
recurrence. Its one-millionth precision, two-target horizon and 16,384-cell work
bound are [designed] computational limits from T130/#345, not game rules or tuned
strategy preferences. Work is checked before allocation, and no stream is consumed.

For example, under rerolled ties, three armies capture one one-army country with
75% probability, but two in sequence with only 25% probability: a casualty at
either exchange prevents the second capture. Keeping fallback armies may therefore
matter even when the fallback country is not a frontier yet.

These helpers do not change AI choices. The next policy work must compare legal
candidate allocations/transfers/plans and the no-action alternative, with bounded
evaluation effort, tactical counterexamples, frozen-baseline/held-out matches and
owner playtesting before claiming stronger or more interesting play. See #341 and
the [0.4 plan](release-0.4.md); #340 evaluates rules variants separately.

## A finite-budget repeated attack pair

T136/#356 adds `estimateAttackCampaign(view, from, to)` as an unused conditional
research helper. It retains the script's strict `source armies > target armies`
gate, the combat minimum, and the existing remaining resolved-exchange budget.
It stops at capture, failed gate/minimum or budget exhaustion. Rerolled ties do
not consume another resolved exchange; defender/attacker ties change the decisive
probabilities. Capture is a terminal event: this helper chooses no move-in amount.

For supported comparison-free single-die combat with no failure penalty, return
canonical terminal outcomes: own casualties, enemy casualties, capture flag and
an outward integer probability interval. Capture probability and unconditional
expected casualties for both sides also have intervals. Expected casualties use
one-millionth-of-an-army units; these are not armies conditional on success.
A stopped tactic with no initial advantage or remaining budget has one exact,
unchanged terminal state. Hypothetical income, cards, allocation and counterattack
responses are outside this model. Hidden fields and streams are never read.

The forward dynamic program counts wins/losses, whose sum is the consumed
exchange budget. It retains each failure and partial-damage outcome and rounds
mass outward at every branch/merge. Terminal intervals are joint bounds, not
independent probabilities; upper masses need not sum to one. Do not renormalize
away unsuccessful outcomes or treat conditional average armies as future safety.

[Designed] precision is1000000 and the rectangular work bound is16384 cells,
checked before array allocation. Its dimensions include the capture/minimum
boundaries and are capped by the remaining exchange budget. Unknown `path`,
`combat`, `counts` and `budget` results are explicit, never zero likelihood.
The model does not weaken the engine/policy attack cap. For example, a large
nominal army gap can still offer almost no chance of finishing a large defender
within96 exchanges. T134's unfinished game remains an unfinished observation;
this helper changes no past or future game decisions by itself.
