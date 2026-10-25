> Owner adoption: T141 makes the combined tactical policy the sole production AI.
> Historical study sources, component profiles and measurements below stay fixed.
> Further quality work remains on #362; there is no player-facing legacy AI choice.

# Experimental allocation/capture candidate

T133/#350 evaluates `planAllocation(view)`. At T133 the application continued to use its
existing policy. Only the research arena's `allocation-v1` entry opts into this
planner; all other phases/fallbacks use its frozen v0.3.1 comparator.

## Hypotheses and candidate choices

The declared parameters are hypotheses, not optimized weights or game rules:
conditional capture-risk tolerance 500,000 millionths (50%), two-turn income
importance, 6 candidate countries, 8 adjacent enemy sources, 24 candidate states,
262,144 model cells per decision and 96 supported countries. The arena records
their exact values, source/config/policy hashes and rule context.

For each owned country, the planner considers the largest capture bound from
selected adjacent enemy sources, either directly or through one other owned
country. Each source hypothetically receives its owner's full current public
next income. These are alternatives, not simultaneous allocations of one pool.
There is no inference of hidden cards, actual opponent decisions or future events.

A country's importance is one plus twice its isolated recurring-income loss.
This prioritizes complete-island entrances and country-income thresholds. The
planner clamps conditional threat probabilities below its declared tolerance,
weights the excess by country importance and sorts the results from worst down.
That profile is a robust preference over alternatives, not total expected loss;
it does not add mutually exclusive tactics or model an opponent's whole turn.

Candidate ranking first prefers the highest conditional single-pair probability of winning
at turn end, then lexicographically minimizes the ordered threat-excess profile,
then maximizes the best one-capture offensive readiness (country gain plus weighted
own income gain/enemy income denial). Baseline choice wins ties. This short horizon
uses the existing remaining attack budget and strict-advantage continuation gate
for its own duel opportunities. A loss-limited integer model preserves the original
army advantage and encloses success probabilities with outward rounding. It excludes
pairs the script cannot start and captures needing more exchanges than remain.
This conditional pair model does not predict which pair the fallback script will
actually select or its later switches between pairs. It
can miss multi-capture wins, partial damage, attacks from several stacks and later
card/event effects. Defensive caution can reduce momentum or prolong games.

Reinforcement candidates include the baseline, concentrated placements, half-pool
splits among leading targets and an even distribution over selected front/near-front
countries. A full pool allocation is compared, but only its first positive placement
is committed; the planner reevaluates after each actual placement. Capture candidates
cover every legal amount up to 24 choices, or default/min/max and bounded quartile
samples for larger ranges. Each move retains legal garrisons and army totals.

The model cache is per decision. Unsupported, unsafe or over-budget assessment
returns explicit fallback; an unknown threat is never scored as zero. Only public
country/combat context is passed to the counterfactual risk helper. No stream is
read or drawn, and no persistent planner state is added to saves.

The result's `winningChance` is the selected full candidate's conditional interval,
not a whole-turn forecast. It is null when no supported complete assessment exists.

## Evidence before adoption

Tactical fixtures include split reinforcement, valuable island/source protection,
and counterexamples where concentration/default capture max or an immediate win
is appropriate. Engine application, private-field/immutability/permutation checks,
source/candidate/work limits and unchanged default/replay behavior remain gates.

The preregistered smoke uses seed0,46 regions,baseline-031/allocation-v1,every cyclic
policy/first-seat assignment and both tie rules: 8 primary cases plus reverse-order
verification. Retain every finish, unfinished/error/refusal, exact replay, variable
timing and candidate/fallback/model-cost observation. One deal and correlated
rotations establish no strength target, confidence interval or adoption decision.
Do not tune this version on those outcomes or evaluation seeds. Broader held-out
comparisons, coupled movement/attack planning, owner playtests and independent review
precede any default/ruleset adoption or release claim.
