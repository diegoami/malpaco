# Bounded movement candidate

T135/#354 adds `movement-v1` to the research arena. It uses allocation-v1 for
reinforcement/capture and the frozen v0.3.1 attacks/cards. The application still
uses its released policy. Personalities and adoption remain separate decisions.

After the retained attack script stops, compare its reserve transfer, End turn,
and adjacent legal transfers. Every move ends the current turn. A shared public
army evaluator ranks the largest conditional exposure first, including attacks
through an owned front into a future front. Threats are alternatives, never
summed. Enemy income is an all-on-one-source hypothesis; neither hidden cards
nor actual enemy intentions are predicted.

Among equally exposed positions, prefer the best attack readiness with a fresh
existing exchange budget, unchanged enemy armies and no own income added. This
is a next-turn proxy, not a current winning opportunity. Finally prefer smaller
movable-army distance to the front through owned countries. The retained baseline
wins exact ties. Distance is not a guarantee of progress when exposure/readiness
changes; static safe routes and the three T128 saved stalls are regression tests.

[Designed] limits are 96 countries, eight enemy sources, five ordered movement
pairs, 48 assessments and 524288 model cells. Risk tolerance is 500000/1000000;
income importance spans two income turns. Include the baseline pair, then rank
pairs by destination exposure, movable source size, destination distance and raw
IDs. For each pair enumerate every amount up to eight; otherwise include one,
maximum, and floor/ceiling quartiles. Include End turn even when no pair is useful.
Use canonical ordering and shared per-decision risk caches. Unsupported counts,
rules, illegal projected pairs or exhausted assessment budget return an explicit
fallback; the adapter preserves the frozen action. Individual probability-model
limits also apply. A fallback does not mean a safe position.

`computer-army-evaluation.ts` extracts allocation-v1's evaluator. Its default
configuration preserves the measured allocation policy's exact choices, bounds,
candidate counts and work accounting on 26 public decision fixtures frozen from
941d7f8. Movement enables next-turn readiness and suppresses immediate-win priority.
The descriptor records separate allocation/movement limits. No RNG, exchange cap,
rule, save identity or default policy changes.

The fixed development smoke uses seeds 5 and 6, 46 regions, both tie treatments,
both cyclic assignments and all first-seat offsets: 16 primary cases plus reverse
verification. It checks operation, determinism and costs, not strength. Held-out
seeds and larger-map/multi-opponent evaluation are later combined-policy work.
Negative results and fallbacks must remain in the report.
