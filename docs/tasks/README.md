# Tasks

One file per task, `T<nn>.md`, from [`TEMPLATE.md`](TEMPLATE.md). This index carries no status:
the issue's `status:*` label is the status (`gh issue list --label task --label status:ready`).

| Task | Title | Issue | Merge after |
| --- | --- | --- | --- |
| T01 | The walking skeleton, imported from the spike | #1 | — |
| T02 | UI gate hardening: review 006-02's seven findings | #2 | T01 |
| T03 | The board: malpaco's 46-country map as data | #10 | — |
| T04 | Core rules foundation: GameOptions, seats, multi-stream RNG, save format | #15 | — |
| T05a | Board generator skeleton (46 countries, 9 islands, degree 2–5, 16 sea lanes, connected) | #17 | — |
| T05b | Board fairness: the 5 checks, the retry loop, and the "attempts run out" behaviour | #19 | T05a |
| T06 | Bundled UI font (Inter), so goldens do not depend on the host | #21 | — |
| T07 | Initial deal: generated board to starting state | #27 | T04, T05b |
| T08 | Shared combat rules: single exchanges, fair ties, no forfeit | #30 | T07 |
| T09 | Island income: the complete-island bonus as pure functions | #23 | — |
| T10 | Reinforcement income: province base + island bonus per turn | #25 | — |
| T11 | Reinforcement phase: a pool players can spend before attacking | #32 | T08, T10 |
| T12 | Playable reinforcement controls and Malpaco combat | #33 | T11 |
| T13 | Generated-board presentation prototype | #38 | T12 |
| T14 | Play on the generated board | #41 | T13 |
| T15 | Minimal generated-game setup | #43 | T14 |
| T16 | Complete-game acceptance | #46 | T15 |
| T17 | Save and resume actual generated matches | #49 | T16 |
| T18 | Basic computer opponent | #52 | T17 |
| T19 | Generated setup as the default entry | #54 | T18 |
| T20 | In-game instructions | #59 | fix45 |
| T21 | First shareable playable build | #62 | T20 |
| T22 | Seed 1994 geographic map prototype | #66 | T21 |
