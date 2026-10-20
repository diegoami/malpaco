# Authority and reconciliation before a roadmap

This is a source crosswalk for #215, not a backlog disposition or task-state
snapshot. Read it with the [vision](README.md). The owner has amended presentation and scope in [DECISIONS.md](DECISIONS.md):
V1–V5 approved, organic maps required, flavour deferred, full-screen geography
with icon actions and contextual text. Game rules, task Done-when, model choices
and release authorization are not changed by these planning edits.

## Sources used

- [#215](https://github.com/diegoami/malpaco/issues/215): owner review gate,
  finished-game draft, late-match/result scope and order of approvals.
- [Current README](../../../README.md): documented public 0.1.1 behaviour,
  including current immediate exchange and multi-human/card limitation. This
  review did not playtest the live site; documentation is not runtime evidence.
- [Complete-game sequence](../new-game/README.md) and
  [540-unit rules inventory](../new-game/rules-inventory.md): existing approved
  design and destination contracts. Inventory assessments describe their pinned
  historical code baseline; they are not a current implementation audit.
- Canonical approved designs at archaeology revision
  [`ae298e37c2f5177039e55767607f9345b6cb0e7a`](https://github.com/diegoami/isle-wars-archaeology/tree/ae298e37c2f5177039e55767607f9345b6cb0e7a/design),
  as inventoried. Only permitted original behavioural/design conclusions and
  citations are used. No predecessor code, assets, pixels or help text are copied.
- [Selected D1–D3](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/DECISIONS.md),
  [prior sketches](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/WIREFRAMES.md)
  and [owner decision](https://github.com/diegoami/malpaco/issues/191#issuecomment-6273842655).
  The responsive planning files are pinned because that directory is not on main.
  The prior independent review predates the selected Attack change; this package
  claims no new independent review of that change or of these drawings.
- [Release 0.2.0 scope](../release-0.2.0.md): the allocated responsive delivery
  slice; it does not cover the whole finished game and is subject to #215's gate.

- [Owner response and amendments](DECISIONS.md): newer authority than the first
  sketches and older fixed-dock/sidebar composition.

## Preserve or explicitly amend

| Area | Existing authority | Consequence for this vision / later reconciliation |
| --- | --- | --- |
| Geography | New-game baseline; T24/T34–T36 and T60–T65 | Preserve 46 countries, nine island sizes 3/3/3/3/5/5/7/7/10, degree 2–5, 14–18 inter-island links, connected symmetric graph and all five fairness checks. Organic appearance informed by the named real-island/province references is required; see GEOGRAPHY-REFERENCES.md. Sketches have no topology authority; no generator technique is preselected. Respect T62's amended exposed-coast route contract. |
| Current versus selected controls | README; pinned D3; T82 | Current documented enemy activation exchanges immediately. The selected direction stages source/target then uses explicit Attack. One-army placement and existing exchange arithmetic remain; no instant-attack default is reintroduced. |
| Combat, movement and completion | T27–T30; T82/T83 | Complete capture transfer and required effects before victory at the approved point. Keep mandatory-choice gates; camera and reading do not commit or erase drafts. |
| Victory and human loss | [T30](../../tasks/T30.md) / #75 | Conquest, last-seat, enabled domination and round-limit/ties remain as contracted. Human loss versus continued computer watching is distinct. Late-game convenience cannot alter a win condition silently. |
| Setup and levels | [T44](../../tasks/T44.md) / #89; T47–T50 / #92–#95 | Two-to-four supported arbitrary human/computer mixtures, default one human/three Normal, explained approved options. Do not sell placeholder strengths. Confirm desired challenge and pacing using measurements and owner play. |
| Saves and records | T31; [T45](../../tasks/T45.md) / #90; [T46](../../tasks/T46.md) / #91 | Preserve version identity, explicit files, one local slot, end-turn autosave, saved-first/takeover rules and exactly-once records. Do not promise crash restoration of every transient draft. |
| Cards, events and privacy | T37–T43; [T53](../../tasks/T53.md) / #98 | Preserve each approved capability and information boundary. Current multi-human ordinary-rules limitation and future handover contract are distinct; no new supported combination is inferred. Reconcile explicitly before integration. |
| All devices and input | D1–D3; T51/T52; T78–T88 | Full-viewport map and icon actions replace fixed dock/header/sidebar assumptions across phones in both orientations, tablet and desktop; explicit Attack remains. Short-height scrollable Current choice/list fallback is essential. D4 stays actual playable owner acceptance. |
| Feedback, audio and help | T54–T56 / #99–#101 | Feedback/pacing, original controllable sound, and complete settings/help are already contracted. Calling sound optional for the first edition would require an explicit scope amendment, not an implementer shortcut. |
| Full-game versus UI release | [T57](../../tasks/T57.md) / #102; [T58](../../tasks/T58.md) / #103; T89/T90 | A responsive delivery slice cannot close full-rules, AI, lifecycle or complete-game acceptance contracts by implication. Exact artifact acceptance and publication are separate gates. |
| Geography and deferred flavour | #119, #170, #173, #174, #181 | Organic geography is required; reconcile existing coastline/variety work against that visual bar. Flavour naming #170 is deferred. #174 must serve requested essential information; optional terrain remains separate. Research does not approve a specific generator integration. |

## Decision boundaries

V1–V5 approval includes the product promise, capability baseline, exclusions and
acceptance principles, qualified by U1–U5 in [DECISIONS.md](DECISIONS.md).
The first sketches are superseded. S1–S5 plus the quiet-map composition remain
for review in their revised form; actual device feel and generated geography
still require playable acceptance. No numeric goal is invented.

The release map now flags the superseded chrome assumptions explicitly. Before
implementation, main must amend affected T79/T84–T88 contracts as needed, retaining
reachable actions, complete information, input/privacy and continuity obligations.
This amendment is about when information appears, not erasing those capabilities.
The owner has explicitly included usability in their review. The newer geography
brief studies real counterpart character without importing real map/border data;
carry that bar into existing geography contracts without relaxing their limits.

After revised sketch review, use one reconciliation entry per existing issue:

```text
Existing issue / contract:
Owner-approved vision decision:
Disposition: retain | revise | defer | drop | already satisfied
Reason and acceptance evidence (or explicit remaining gap):
Contract amendment required and owner decision link:
Dependency / release slice proposal:
```

“Already satisfied” requires evidence for the whole obligation. “Defer” and
“drop” do not silently close unsatisfied contracts. The resulting release slices
and dispositions require owner approval before feature dispatch; this unfilled
format is not that backlog and creates no parallel queue.
