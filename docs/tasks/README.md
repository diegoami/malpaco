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

Release slices S0–S7, review tiers and the dispositions of every open issue are in the
[#215 reconciliation](../plans/finished-game-vision/RECONCILIATION.md) (owner-approved 2026-10-20,
PR #217); merge-after edges below follow it. Each task file names its **Tier** (process.md §5.1).

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
| [T73](T73.md) | Fully visible battle controls alongside cards | Medium | #180 | T41 |
| [T42](T42.md) | Deterministic events and production-centre effects | Hard | #87 | T41 |
| [T43](T43.md) | Readable events and centre changes | Medium | #88 | T42, T87, T88 |
| [T44](T44.md) | Complete setup options and seat mixtures | Medium | #89 | T85, T42 |
| [T45](T45.md) | Persistent settings and end-turn autosave | Hard | #90 | T31, T85 |
| [T46](T46.md) | Resignation and exactly-once game records | Hard | #91 | T45 |
| [T47](T47.md) | Computer public view and position evaluation | Hard | #92 | T41 |
| [T48](T48.md) | Strategic Normal opponent | Very hard | #93 | T47 |
| [T49](T49.md) | Easy and Hard decision policies | Hard | #94 | T48; UI checkpoint T44, T85, T46 |
| [T50](T50.md) | Opponent strength and game-length measurements | Hard | #95 | T49 |
| [T51](T51.md) | Responsive map and compact panels (superseded by 0.2.0 once its transfers land; not dispatched) | Hard | #96 | — |
| [T52](T52.md) | Accessible ownership and complete keyboard/touch play (residual) | Hard | #97 | T88, T43, T46, T53 |
| [T53](T53.md) | Private hot-seat handover | Medium | #98 | T40, T83 |
| [T54](T54.md) | Battle odds, phase feedback and pacing (residual) | Hard | #99 | T84 |
| [T55](T55.md) | Original sound feedback and audio controls | Medium | #100 | T45, T85 |
| [T56](T56.md) | Complete help, options persistence and disabled-feature absence | Medium | #101 | T45, T85, T55, T54 |
| [T57](T57.md) | Complete-rules end-to-end acceptance | Hard | #102 | T56, T36, S2 geography integration (#181) |
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

| [T70](T70.md) | Visible army totals, playback controls and popup event log | Medium | #158 | T32, T33 |

| [T71](T71.md) | Stable compact computer-turn panels | Medium | #163 | T36; coordinate T40 UI ownership |

| [T72](T72.md) | Natural generated islands and region borders: visual prototype | Hard | #173 | T36 |

| [T74](T74.md) | Versioned generated-map presentation and worker cache | Hard | #185 | T73 |

| [T75](T75.md) | Playable border redraw and 0.1.0 release candidate | Hard | #184 | T73, T74 |

| [T76](T76.md) | Hideable game panels and essential icon actions (0.1.1) | Hard | #192 | T75 |

| [T77](T77.md) | Combined Pro-informed responsive UI/UX plan (planning only) | Hard | #191, #194 | T76 |

## Release 0.2.0: responsive UI redesign

[Release scope and dependency map](../plans/release-0.2.0.md) and [acceptance](../plans/release-0.2.0-acceptance.md). Live status is in GitHub labels. Sequence: T80 → T79 → T92 → T93 → T94 → T95 → T81 → T82 → T83 → T84 → T85 → T87 → T88 → T89 → T90.

| Task | Title | Priority | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- | --- |
| [T78](T78.md) | Responsive workspace state and continuity | High | Hard | #197 | T76 |
| [T79](T79.md) | Full-viewport map shell and overlay icon controls | High | Hard | #198 | T80 |
| [T80](T80.md) | Map camera, zoom and resize continuity | High | Hard | #199 | T78 |
| [T81](T81.md) | Accessible country picker and safe touch inspection | High | Medium | #200 | T79, T80 |
| [T82](T82.md) | Explicit Attack and capture or movement commitments | High | Hard | #201 | T79, T81 |
| [T83](T83.md) | Responsive cards, Raid and mandatory reward choices | High | Hard | #202 | T82 |
| [T84](T84.md) | Four-player totals, complete histories and playback continuity | High | Medium | #203 | T83 |
| [T85](T85.md) | Responsive setup, settings, files, help and result views | High | Hard | #204 | T84 |
| [T86](T86.md) | Tablet and desktop workspace composition (retired into T79/T88) | High | Hard | #205 | — |
| [T87](T87.md) | Map annotation hierarchy, contrast and reduced motion | Medium | Medium | #206 | T81, T79 |
| [T88](T88.md) | Keyboard, touch, safe-area and zoom acceptance | High | Hard | #207 | T83, T84, T85, T87 |
| [T89](T89.md) | Full-device 0.2.0 release candidate and artifact acceptance | High | Hard | #208 | T88 |
| [T90](T90.md) | Publish the exact accepted 0.2.0 artifact | High | Medium | #209 | T89 |
| [T92](T92.md) | Sketch-faithful corners and concise cards (correction of T79) | High | Hard | #226 | T79 |
| [T93](T93.md) | Sketch-faithful map look (correction) | High | Medium | #228 | T92 |
| [T94](T94.md) | Regional flavour names | High | Hard | #170 | T93 |
| [T95](T95.md) | Grown islands: the v2 geography generator | High | Hard | #181 | T94 |

## 0.2.1 (#240, questions #244)

| Task | Title | Priority | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- | --- |
| [T96](T96.md) | Instant start: no setup, one human against three computers, New game, resume on refresh | High | Medium | #245 | T90 |
| [T97](T97.md) | Bare-minimum floating cards and a trimmed menu | High | Hard | #246 | T96 |
| [T98](T98.md) | 0.2.1 release candidate, acceptance and milestone review | High | Medium | #247 | T97 |
| [T100](T100.md) | Persistent sessions and a scoreboard | High | Medium | #254 | T98 |
| [T101](T101.md) | Foldable, draggable cards; hidden history; quick, quiet computer turns | High | Hard | #255 | T100 |
| [T103](T103.md) | Guided taps and a pulsing hint when you hesitate | High | Medium | #261 | #260 fix |
| [T104](T104.md) | See your cards: a hand button, and the hand after each draw | High | Medium | #263 | T103 |
| [T99](T99.md) | Publish 0.2.1 | High | Medium | #248 | T104 |

## 0.3

[Release proposal and backlog reconciliation](../plans/release-0.3.md); parent #271, owner questions #272.

| Task | Title | Priority | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- | --- |
| [T102](T102.md) | Balanced starts and reduced island income | High | Medium | #256 | T105 |
| [T105](T105.md) | Compare deal and island-income balance candidates | High | Medium | #273 | T99 |
| [T106](T106.md) | Tauri 2 Android offline prototype | High | Hard | #274 | T99 |
| [T107](T107.md) | Next-game Settings and 1–3 computer opponents | High | Medium | #278 | T99 |
| [T108](T108.md) | Android background pause and safe Back routing | High | Medium | #285 | T106 |

## Development infrastructure

| Task | Title | Priority | Difficulty | Issue | Merge after |
| --- | --- | --- | --- | --- | --- |
| [T91](T91.md) | Simplify development CI and document reusable adoption | High | Hard | #211 (consolidates #108/#118) | — |
