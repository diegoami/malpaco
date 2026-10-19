# Sources and limits

This plan uses own-word research and source inspection only. No original game
pixels, help prose, code or artwork were copied or rendered. All sketches are
invented interface diagrams. No game, browser, research script or build was run
for T77; no result below is a playtest or a measured phone layout.

## Pinned Pro manual

The inspected revision is `084c1087119fcf45f0d0d2774eea7121487f1cb4` in
`diegoami/isle-wars-archaeology`. On 2026-10-19, the read-only command
`gh api repos/diegoami/isle-wars-archaeology/commits/main --jq '.sha'` returned that
same revision, matching local `git rev-parse HEAD`. Thus no later correction was
present on live main at that check. Recheck manual corrections when authorizing
implementation; the citation remains pinned even if main later changes.

| Source read | What it informs here | Boundary preserved |
| --- | --- | --- |
| [Manual README](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/README.md) | Edition, provenance, distinction between evidence tiers | Structural/manual rendering checks are not semantic truth or consumer playtesting |
| [Guide and worked turn](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/guide.md#a-sampled-placement-to-pass-turn) | Separate draft/commit, selected-country context, battle comparison and active-seat handoff | Seven same-record placement-to-pass samples; one defender decrement, no full game/capture/computer turn; context screens are another record |
| [Atlas: reading the board](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/atlas.md#reading-the-board) | Distinct country identity/count, ownership, route cues, totals and phase panels | Observed appearance is neither reusable art nor a specification of the renderer |
| [Atlas: evidence boundaries](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/atlas.md#evidence-boundaries) | Avoid treating annotation rectangles as input areas | No measured hitboxes, comprehensive legal-target overlays, keyboard study, timing or mobile convention |
| [Reference: interface](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/reference.md#interface), [turns](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/reference.md#turns) | State-specific cancellation and end-turn clarity | Static/documented rules are not observed procedures; Malpaco's current controllers remain the implementation authority |
| [Reference: trades](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/reference.md#trades), [capture](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/reference.md#capture), [persistence](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/reference.md#persistence) | Distinct commitments, card roles and preference/position distinction | Trade wording/static skip discrepancy, human zero-transfer reachability unknown, no demonstrated Pro position save/load |
| [Coverage register](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/coverage.md#major-screens-and-feedback) | Explicitly mark unseen screens and partial procedures | Cards, movement, capture, event presentation, registered layouts and complete terminal flows are not visually established |
| [Planning checklist](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/checklist.md#country-readability) | Eleven comparison qualities: identity, topology, active phase, allocation, combat, move boundary, cards, centres/events, persistence, navigation and limits | Research handoff is not a design decision or implementation authorization |

Pro evidence concerns the unregistered Windows release and preserved Wine/Xvfb
records, not registered behaviour, DOS controls or native phone/accessibility
testing. Pro attacks are target-first in the static guide; Malpaco's current host
is source-first. The selected plan retains that order and the combat rules, while
changing UI commitment to explicit Attack after target selection. The immediate
enemy-tap exchange below is a **0.1.1 source fact**, not the selected redesign.

Two unresolved research questions remain unresolved here:

- [Archaeology #259](https://github.com/diegoami/isle-wars-archaeology/issues/259):
  nine logical groups do not settle the count of apparent physical land clusters.
  The plan exposes actual group membership; it does not reconstruct Pro geography.
- [Archaeology #278](https://github.com/diegoami/isle-wars-archaeology/issues/278):
  the manual's crosscheck of two centre images conflicts with F020's first-image
  colour list. Centre mechanics/identity must not be inferred from cyan alone.
  Malpaco retains its original centre marker and explicit explanation.

## Current-game assessment

The plan branch begins at `38600df142619b0e0bfaf6a18d82307310109813` and includes
the released 0.1.1 tree from tag commit
`897a7a0b953d213a65628aa2f3617172a417791c`. Paths below link to that immutable
release commit. Inspected tests show intended coverage, **not tests executed by
this planning task**. Legacy authored/generated routes exist, but the default
geographic route and shared reference-battle host are the design baseline.

| Inspected source/design | Present capability / actual gap | Planning consequence |
| --- | --- | --- |
| [main.ts](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/main.ts), [geographicGame.ts](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/geographicGame.ts) | Default geographic setup/game, shared host; seed, seats/controllers, strengths and round-limit choices already exist | Reflow current setup; no generator or rule work needed |
| [styles.css](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/styles.css#L1185), [T76 contract](../../tasks/T76.md) | Desktop 350/440px battle sidebar, viewport-height shells; T76 explicitly excludes tablet expansion/broad redesign | Portrait requires a new composition; do not call rail collapse a responsive design |
| [BattleChrome](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/battleChrome.ts), [rail styles](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/styles.css#L1436) | Independent panel hiding, original-control relocation, nonmodal drawer, required-choice opener; 52px rail and 34/38px buttons | Preserve continuity and restoration; new phone targets/navigation need larger labelled affordances |
| [ReferenceBattleGame](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/referenceBattleGame.ts#L135) | In 0.1.1 placement tap dispatches 1; source then enemy tap selects and immediately exchanges unless inspecting; Raid chooses a target separately | Preserve source-first order/Place 1; selected D3 instead stages the target and requires Attack for one exchange; list verb becomes Select target |
| [GeographicMapView](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/geographicMapView.ts), [ReferenceMapView](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/referenceMapView.ts) | SVG viewBox, ownership shapes, counts/names/centre mark, ARIA descriptions, Enter/Space and ordered arrow navigation; no camera gesture/buttons/list | Extend presentation access without changing graph, rules or geometry |
| [BattleView](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/battleView.ts), [FriendlyMoveView](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/friendlyMoveView.ts) | Battle outcomes, single exchange/Fight on/Stop, amount drafts/min/max and distinct capture/friendly confirmations already exist | Host them accessibly; do not invent replacement rule bounds or auto-confirm on resize |
| [CardView](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/cardView.ts), [CardController](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/cardController.ts) | Own-hand projection, valid sets/Skip, Raid preview/confirmation, discard-before-draw, reward acknowledgment and public counts | Five tiny horizontal cards should become readable rows on phone; preserve privacy and every blocking choice |
| [Panel](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/panel.ts), [event log](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/src/ui/gameEventLog.ts) | Four army totals, territories/cards, battle log and separate complete event log | Totals/History destinations preserve information even when panels are hidden |
| [Icon-action tests](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/tests/e2e/icon-actions.spec.ts), [hideable-panel tests](https://github.com/diegoami/malpaco/blob/897a7a0b953d213a65628aa2f3617172a417791c/tests/e2e/hideable-panels.spec.ts), [spike design](../../spike.md) | Current desktop flows protect draft/focus/history and exact core state; supported desktop sizes are 1280×800/1920×1080 | Future mobile checks must preserve those contracts and add portrait/landscape, zoom, safe-area and keyboard cases |

The open [T76 follow-up #195](https://github.com/diegoami/malpaco/issues/195)
concerns toolbar overlap coverage, keyboard navigation and load focus. It is
coordination context, not evidence that those defects have been fixed by T77.
No outside-scope fix is included.

## Later planning inputs

The owner's [PR decision record](https://github.com/diegoami/malpaco/pull/196#issuecomment-6273841926)
selects map-first, all-device scope and explicit Attack; [DECISIONS.md](DECISIONS.md)
records these as design authority, not observed source behaviour. Existing
[#181](https://github.com/diegoami/malpaco/issues/181) and the supplied owner/main
assessment inform [ASSESSMENT-181.md](ASSESSMENT-181.md); no new generation research
or experiments were performed. Camera/label work does not establish generation
variety. The historical [review](review/FINAL.md) predates the new D3 selection and
is retained unchanged; no additional review is claimed for this alignment.

## Evidence labels

**Inspected** means read in source or the pinned manual. **Pro observed/static/**
**documented/derived** retains that source's limits. **[designed]** means an
original proposal searched against the manual above and current UI/CSS/test
contracts, with no browser measurement or usability validation. All dimensions,
breakpoints, target sizes, camera bounds and proposed acceptance thresholds in
this directory use that last category. They are not Pro constants or claims of
WCAG conformance. Accessibility intent needs future verification with real users
and assistive technology, not a screenshot-only pass.
