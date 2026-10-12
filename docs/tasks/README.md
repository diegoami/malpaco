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
