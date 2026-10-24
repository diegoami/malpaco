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

## Complete-game acceptance witnesses

`live-conquest-031.json` is a new legal seed7 human/computer witness generated with
the unchanged0.3.1 policy (source0db8f8b). Human placements are split into one-army
actions for the actual UI; capture/transfer amounts are explicit. All530 actions
are engine-accepted, the human wins by conquest, and human friendly move, capture,
real AI turns and elimination remain exercised. The browser compares each AI
choice to this pinned current-policy witness and still checks all saved states.

The original809-action T33 witness is **not** replaced or edited.
`historical-conquest-compat.json` pins its accepted0.3.0 canonical wire and complete
key-sorted state hashes, obtained from the retained0.3.0 codec. The compatibility
test replays it with current AI exports set to throw, protecting recorded history
independently of future AI decisions.
