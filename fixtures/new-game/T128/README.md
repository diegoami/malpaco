# T128 legal idle-reserve reproductions

Captured before the AI correction from the released v0.3.0 core/policy (414bea0).
The policy SHA-256 was eef8b04021357937208ef28003464bd088a70913187f5ef7ac64affbae55164f.
Each file is a canonical action-only save, not an edited state. Default seed 0,
one human / three Normal computers, island rules, starting range 1–3, events Normal.
The human's recorded moves were selected by the same public policy for this bounded
reproduction; every action was accepted by apply. No policy is invoked by save loading.

| Regions | Recorded actions | Turn / actor | Idle reserve | Distance to an owned frontier | Expected first hop |
| --- | --- | --- | --- | --- | --- |
| 46 | 280 | 6 / seat2 | province_26: 5 armies | 2 | province_26 → province_28 |
| 72 | 554 | 8 / seat2 | province_26: 7 armies | 3 | province_26 → province_29 |
| 96 | 361 | 4 / seat4 | province_32: 6 armies | 5 | province_32 → province_26 |

The released policy selects `{kind:"endTurn"}` in all three cases. The expected hop
reduces distance by exactly one and uses an existing legal friendly-move pair. The
96-region case has two equally short exits; stable destination IDs select province_26.
These are bug reproductions, not win-rate/termination evidence or a replacement for
the frozen balance pilots. Metadata/search logs are retained in artifacts/T128.
