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

## New-game implementation

See the [sequence and dispatch checkpoints](../plans/new-game/README.md). Difficulty is an estimate; GitHub labels carry status.

The owner-selected A adoption chain is **T61 → T62 → T63 → T26**.
T66/T67 are separate CI-efficiency milestones. T64/T65 and optional terrain
[#119](https://github.com/diegoami/malpaco/issues/119) are later visual polish,
not prerequisites for the reference-game playable milestone. Every future task
requires parent preflight before `status:ready`; dependencies alone are insufficient.

| Task | Title | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- |
| [T23](T23.md) | Approved-rules inventory and reuse decisions | Medium | #68 | — |
| [T24](T24.md) | Geography contract and constraint-feasibility probe | Hard | #69 | T23 |
| [T25](T25.md) | Compliant seed-1994 reference board | Hard | #70 | T22, T24 |
| [T59](T59.md) | Reference-map visual polish | Hard | #110 | T25 |
| [T60](T60.md) | Topology-first map presentation investigation | Very hard | #113 | T25 |
| [T61](T61.md) | Correct zero-length geometry residuals | Medium | #109 | T60 |
| [T62](T62.md) | Coast-entry and route-clarity contract for A | Hard | #115 | T60, T61 |
| [T63](T63.md) | Adopt the approved coast-first reference fixture | Medium | #116 | T61, T62 |
| [T26](T26.md) | Reference-board walking skeleton | Medium | #71 | T63 |
| [T27](T27.md) | Explicit post-capture movement actions | Hard | #72 | T26 |
| [T28](T28.md) | Battle controls and capture-choice UI | Hard | #73 | T27 |
| [T29](T29.md) | One adjacent friendly move per turn | Medium | #74 | T28 |
| [T30](T30.md) | Round origin and complete victory rules | Hard | #75 | T29 |
| [T31](T31.md) | Versioned deterministic match replay | Hard | #76 | T30 |
| [T32](T32.md) | Basic computer through the complete ordinary turn | Medium | #77 | T31 |
| [T33](T33.md) | Reference-game playable milestone | Medium | #78 | T32 |
| [T34](T34.md) | Seeded island silhouettes and province subdivisions | Very hard | #79 | T33, T24, T62, T63 |
| [T35](T35.md) | Sea crossings, bonuses and fair complete boards | Very hard | #80 | T34 |
| [T36](T36.md) | Generated-map integration and wide-seed acceptance | Hard | #81 | T35 |
| [T37](T37.md) | Card deck, hands and earning a card | Medium | #82 | T36 |
| [T38](T38.md) | Card sets, Wilds and Surge income | Medium | #83 | T37 |
| [T39](T39.md) | Raid targeting and automatic Shield defence | Medium | #84 | T38 |
| [T40](T40.md) | Playable human card interactions | Hard | #85 | T39 |
| [T41](T41.md) | Baseline computer card decisions | Medium | #86 | T40 |
| [T42](T42.md) | Deterministic events and production-centre effects | Hard | #87 | T41 |
| [T43](T43.md) | Readable events and centre changes | Medium | #88 | T42 |
| [T44](T44.md) | Complete setup options and seat mixtures | Medium | #89 | T43 |
| [T45](T45.md) | Persistent settings and end-turn autosave | Hard | #90 | T44, T31 |
| [T46](T46.md) | Resignation and exactly-once game records | Hard | #91 | T45 |
| [T47](T47.md) | Computer public view and position evaluation | Hard | #92 | T46 |
| [T48](T48.md) | Strategic Normal opponent | Very hard | #93 | T47 |
| [T49](T49.md) | Easy and Hard decision policies | Hard | #94 | T48 |
| [T50](T50.md) | Opponent strength and game-length measurements | Hard | #95 | T49 |
| [T51](T51.md) | Responsive map and compact panels | Hard | #96 | T50 |
| [T52](T52.md) | Accessible ownership and complete keyboard/touch play | Hard | #97 | T51 |
| [T53](T53.md) | Private hot-seat handover | Medium | #98 | T52, T40 |
| [T54](T54.md) | Battle odds, phase feedback and pacing | Hard | #99 | T53 |
| [T55](T55.md) | Original sound feedback and audio controls | Medium | #100 | T54 |
| [T56](T56.md) | Complete help, options persistence and disabled-feature absence | Medium | #101 | T55 |
| [T57](T57.md) | Complete-rules end-to-end acceptance | Hard | #102 | T56, T36 |
| [T58](T58.md) | Complete-game release artifact and owner acceptance | Medium | #103 | T57 |

## Later polish and CI efficiency

| Task | Title | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- |
| [T64](T64.md) | Natural coastline postprocessing | Hard | #111 | T36, T63 |
| [T65](T65.md) | Natural shared region borders | Hard | #117 | T64 |
| [T66](T66.md) | Cancel superseded pull-request CI runs | Easy | #108 | — |
| [T67](T67.md) | Lightweight planning-only CI gate | Hard | #118 | T66 |
| [T68](T68.md) | Pilot agy CLI review workflow with Sonnet | Medium | #152 | — |

| [T69](T69.md) | Claude CLI review backend | Hard | #155 | — |
