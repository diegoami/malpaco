# Proposed, unscheduled implementation sequence

Every item below is **proposed / unscheduled**. These are planning units, not new
issues, dispatched tasks, commitments or authorization. Owner selection of a
proposal and later implementation scope precede any task contract, failing test,
prototype, source change, release or deployment. Priorities describe player
impact; difficulty describes likely engineering/review complexity, not an estimate.

| ID / state | Proposed work and purpose | Priority / difficulty | Dependencies | Measurable proposed acceptance |
| --- | --- | --- | --- | --- |
| P1 · Proposed / unscheduled | Specify viewport-driven shell and state ownership; separate game/controller state, camera, drafts and optional surfaces | High / Hard | Owner D1/D2 and scoped host decision | Documented state keys and transition table cover every invariant in ACCEPTANCE; no rule/save/generator change in scope; follow-up #195 interfaces reconciled |
| P2 · Proposed / unscheduled | Phone portrait shell, safe areas and short-landscape/keyboard fallback; reflow current setup, files and help | High / Hard | P1 | Matrix minimums and A1/A9 pass; labelled Pause and required-choice return remain visible; no unreachable action or horizontal document overflow |
| P3 · Proposed / unscheduled | Presentation camera, touch inspection, world-space resize continuity and accessible country/candidate list | High / Hard | P1; owner D3 confirms retained action semantics | A2/A8/A9 pass; every region reachable by list, pan/zoom never dispatch, named source-first/direct-exchange flow preserved; Fit recovers the full map without clearing selection |
| P4 · Proposed / unscheduled | Host all current human action/required-choice paths in the adaptive dock/panel: battle, capture, move, sets, Raid, discard, reward, loss/result | High / Hard | P2/P3 | A2–A6/A10 pass with legal non-default drafts and exact core/RNG oracles; map-target action remains hittable; no missing mandatory confirmation, invented skip or duplicated dispatch |
| P5 · Proposed / unscheduled | Totals, full history, playback/settings/files continuity and keyboard/screen-reader navigation | High / Hard | P2/P4 | A7/A10/A11 pass; all four seat totals plus both complete logs available; old reading position/latest flag retained; Pause accessible during automation and gates human choices; all five existing preferences retained and proposed label preference accounted for |
| P6 · Proposed / unscheduled | Decide and validate bounded portrait release | High / Hard | P2–P5, owner D2 including explicit tablet behaviour; independent review/model decisions under repository process | Portrait and functional landscape matrix, current desktop regressions, all A1–A11 applicable to scoped hosts pass; tablet phone-shell checks pass if chosen, or existing-sidebar support limit is recorded; device/appearance acceptance recorded; required checks and release version separately authorized |
| P7 · Proposed / unscheduled | Broader tablet/desktop panel composition and original visual hierarchy | Medium / Hard | P1–P5; owner D4; P6 only if choosing sequential releases | 768×1024 through 1920×1080 and layout seams pass; four totals/current action/history balance accepted by owner; panel hiding reclaims space with no toolbar/region overlap |
| P8 · Proposed / unscheduled | Map-label hierarchy and readability polish: overview/focus labels, group/centre explanation and system reduced motion | Medium / Medium | P3; owner D4; P7 for final wide appearance | Focused identity/count and group/route information readable via map/context/list; no geometry/graph edits; proposed contrast/text targets checked and owner appearance acceptance recorded |

P2 and P3 can become separate implementation tasks after the ownership interface
is agreed. That is a possible dependency sequence, not authorization to parallelize
agents or dispatch work. P4/P5 must not be dropped from a phone-playable release.
P7/P8 are broader redesign work; essential focused readability/list accessibility
belongs to P3 already, so “polish later” cannot excuse unreadable phone actions.

## Bounded 0.1.2 option versus broader redesign

If the owner chooses a narrow portrait release, P1–P6 can leave today's desktop
appearance intact while adapting the shared current controls on phones. Functional
landscape/rotation, low-height fallback, current settings/setup/files/help, all
four totals and complete histories remain inside that bounded scope. Camera/list
access and mandatory choices are release necessities, not optional follow-ups.
Tablets are an explicit open D2 decision: either reuse the functional phone shell
below 1100px and include 768×1024/1024×768 flow/rotation checks in P6, or retain the
0.1.1 350px sidebar with no improved responsive-tablet claim. P7's richer tablet
composition is separate; it does not decide bounded-release behaviour by default.
The number 0.1.2 is a candidate, not a scheduled tag or promise.

If the owner chooses one cross-device redesign, include P7 and the agreed parts
of P8 before its release decision. That increases the appearance-review surface
and desktop regression work. No dependency runs through regional flavour naming,
new map generation, Pro's unresolved #259/#278 research or new gameplay rules.

## Decisions to turn this into tasks

- D1: choose the recommended workspace or separate map/decision pages.
- D2: choose the bounded portrait scope or one broader redesign, supported hosts,
  tablet phone-shell coverage versus an explicit existing-sidebar support limit,
  actual release version, priority and implementation authorization.
- D3: retain current immediate one-army placement/source-first enemy-tap exchange
  as recommended, or separately specify an altered commitment interaction.
- D4: accept sketch-level map/dock balance and set the later visual review bar.

Then write task contracts with owned files, red-before/green-after behaviour
checks and independent review. The acceptance scenarios here are input to those
contracts; they do not replace them or close #191/#194. Existing triage issues
remain in their current owner-managed queue; T77 creates none.
