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
