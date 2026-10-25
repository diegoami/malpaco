> Owner adoption: T141 makes the combined tactical policy the sole production AI.
> Historical study sources, component profiles and measurements below stay fixed.
> Further quality work remains on #362; there is no player-facing legacy AI choice.

# Bounded attack and stopping candidate

T137/#358 registers `tactical-v1` in the research arena. It adds repeated-pair
attack objectives to allocation-v1/movement-v1. No application policy, rule, save,
RNG or exchange cap changes. Each actual exchange/capture prompts a new decision;
this is a conditional campaign comparison, not a commitment to finish that plan.

Compare stopping, including a legal adjacent transfer, with six attack pairs.
Retain the frozen weakest-target/strongest-source choice first; fill the shortlist
by elimination opportunity, defender count within remaining exchanges, public
income swing, weakest defender, strongest source and raw IDs. All pairs retain
the strict army-advantage gate. This shortlist can miss a better attack.

For each pair, T136's outward joint terminal intervals retain successes, failures
and partial damage. Reconstruct each terminal board. On capture, predict the same
allocation-v1 choice/default with the actual projected remaining exchange budget;
never substitute conditional mean armies. Score that board's public defensive
exposure, including two-hop future fronts, with the shared evaluator. Stop/move
has its own actual projected board. A transfer ends this turn, even when attacks
remain. The explicit `afterStopping` movement option is used only by this planner;
movement-v1 keeps its measured behavior. Defense-only evaluation skips unused own
readiness work; allocation-v1 and movement-v1 defaults remain unchanged.

[Designed] utility is one unit per owned country, two turns of own income, one per
enemy casualty, minus one per own casualty, two for the first capture's enabled
card reward when public draw/discard supply is nonempty, and four for eliminating a seat. Subtract the largest weighted
conditional exposure above50%; never sum alternative opponent tactics. This is a
proxy for retained position, not a calibrated expectation of surviving territory,
card value or game victory. It ignores combined attacks, hidden cards, handoff
events, opponent responses and follow-up objectives. Income swing only guides the
shortlist; the terminal utility rewards own retained income.

The joint intervals bound expected utility of this declared proxy. Signed terms
round outward; successes and failures both contribute. Immediate domination or
conquest probability is the first priority; otherwise conservative lower utility
must exceed stopping. Stop wins exact ties; the frozen attack wins ties among
attacks. A tiny true winning chance may round down to zero.

Limits are96 countries,six pairs,256 projected assessments and1048576 total model
cells. Constituent limits apply. Reserve each campaign/allocation call's maximum
work/assessment count before admission, then charge actual work; this conservative
admission can stop early. Movement,allocation and terminal assessments all count.
Any unknown/unsafe/unsupported/over-budget evaluation returns explicit fallback.
In particular the large T134 cutoff board exceeds the threat model's per-path
limit; fallback retains the frozen executable weak-target attack. No odds-based
ranking claim is made there, and no extra actions replace the unfinished result.

The fixed development smoke uses seeds7/8,46 regions,movement-v1/tactical-v1,both
ties,all cyclic/first offsets:16 primary plus separate reverse verification.
Report every result,fallback,choice,replay,source/parameter hash and cost. These
two deals do not establish strength. Held-out multi-opponent/larger-map/ruleset
studies,manual policy review and owner playtesting precede adoption.
