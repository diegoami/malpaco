# Authority and reconciliation before a roadmap

This is a source crosswalk for #215, not a backlog disposition or task-state
snapshot. Read it with the [vision](README.md). No file here changes an approved
rule, task Done-when, owner model choice or release authorization.

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

## Preserve or explicitly amend

| Area | Existing authority | Consequence for this vision / later reconciliation |
| --- | --- | --- |
| Geography | New-game baseline; T24/T34–T36 and T60–T65 | Preserve 46 countries, nine island sizes 3/3/3/3/5/5/7/7/10, degree 2–5, 14–18 inter-island links, connected symmetric graph and all five fairness checks. Sketches have no topology authority. Respect T62's amended exposed-coast route contract. |
| Current versus selected controls | README; pinned D3; T82 | Current documented enemy activation exchanges immediately. The selected direction stages source/target then uses explicit Attack. One-army placement and existing exchange arithmetic remain; no instant-attack default is reintroduced. |
| Combat, movement and completion | T27–T30; T82/T83 | Complete capture transfer and required effects before victory at the approved point. Keep mandatory-choice gates; camera and reading do not commit or erase drafts. |
| Victory and human loss | [T30](../../tasks/T30.md) / #75 | Conquest, last-seat, enabled domination and round-limit/ties remain as contracted. Human loss versus continued computer watching is distinct. Late-game convenience cannot alter a win condition silently. |
| Setup and levels | [T44](../../tasks/T44.md) / #89; T47–T50 / #92–#95 | Two-to-four supported arbitrary human/computer mixtures, default one human/three Normal, explained approved options. Do not sell placeholder strengths. Confirm desired challenge and pacing using measurements and owner play. |
| Saves and records | T31; [T45](../../tasks/T45.md) / #90; [T46](../../tasks/T46.md) / #91 | Preserve version identity, explicit files, one local slot, end-turn autosave, saved-first/takeover rules and exactly-once records. Do not promise crash restoration of every transient draft. |
| Cards, events and privacy | T37–T43; [T53](../../tasks/T53.md) / #98 | Preserve each approved capability and information boundary. Current multi-human ordinary-rules limitation and future handover contract are distinct; no new supported combination is inferred. Reconcile explicitly before integration. |
| All devices and input | D1–D3; T51/T52; T78–T88 | Same map-first direction and explicit Attack across phones in both orientations, tablet and desktop. Short-height scrollable Current choice/list fallback is essential. D4 stays actual playable owner acceptance. |
| Feedback, audio and help | T54–T56 / #99–#101 | Feedback/pacing, original controllable sound, and complete settings/help are already contracted. Calling sound optional for the first edition would require an explicit scope amendment, not an implementer shortcut. |
| Full-game versus UI release | [T57](../../tasks/T57.md) / #102; [T58](../../tasks/T58.md) / #103; T89/T90 | A responsive delivery slice cannot close full-rules, AI, lifecycle or complete-game acceptance contracts by implication. Exact artifact acceptance and publication are separate gates. |
| Candidate polish/research | #119, #170, #173, #174, #181 | Separate existing natural-coastline/shared-border requirements from stronger geographic variety, names, label work and optional terrain. Owner chooses scope; research does not approve generator integration. |

## Decision boundaries

The following are new recommendations for review: the product promise, the calm
nautical treatment shown in the original concepts, the proposed first-edition
capability emphasis and exclusions, and the proposed owner acceptance journey.
They do not override the sources above.

Named decisions V1–V5 and S1–S5 are in [OWNER-REVIEW.md](OWNER-REVIEW.md).
The owner owns each product/scope decision. The main session records the exact
answer and identifies affected existing issue/contracts; any change follows the
repository's amendment process. AI strength/length, late-game pacing, geography
variety and device feel need the named measurements or actual builds described
there. No numeric goal is guessed to replace that evidence.

After vision approval, use one reconciliation entry per existing issue:

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
