# Proposed, unscheduled implementation sequence

Every item below is **proposed / unscheduled**. These are planning units, not new
issues, dispatched tasks, commitments or authorization. The owner has selected
map-first, all-device scope and explicit Attack in [DECISIONS.md](DECISIONS.md).
Separate implementation authorization still precedes any task contract, failing
test, prototype, source change, release or deployment. Priorities describe player
impact; difficulty describes likely engineering/review complexity, not an estimate.

| ID / state | Proposed work and purpose | Priority / difficulty | Dependencies | Measurable proposed acceptance |
| --- | --- | --- | --- | --- |
| P1 · Proposed / unscheduled | Specify viewport-driven shell and state ownership; separate game/controller state, camera, drafts and optional surfaces | High / Hard | Recorded D1–D3; separate implementation authorization and host contract | Documented state keys and transition table cover every invariant in ACCEPTANCE, including staged pair/confirmation; no rule/save/generator change in scope; follow-up #195 interfaces reconciled |
| P2 · Proposed / unscheduled | Phone portrait shell, safe areas and short-landscape/keyboard fallback; reflow current setup, files and help | High / Hard | P1 | Matrix minimums and A1/A9 pass; labelled Pause and required-choice return remain visible; no unreachable action or horizontal document overflow |
| P3 · Proposed / unscheduled | Presentation camera, touch inspection, world-space resize continuity and accessible country/candidate list | High / Hard | P1; settled D3 commitment contract | A2/A8/A9 pass; every region reachable by list; source-first map/list/keyboard selection only stages combat; pan/zoom never dispatch; Fit recovers the map without clearing the pair |
| P4 · Proposed / unscheduled | Host explicit Attack and all human action/required-choice paths in the adaptive dock/panel: battle, capture, move, sets, Raid, discard, reward, loss/result | High / Hard | P2/P3 | A2–A6/A10 pass with non-default drafts and exact core/RNG oracles; Attack performs one fresh legal exchange, Fight on waits for confirmed pair; map-target/confirm remains hittable; no missing choice, invented skip or duplicate dispatch |
| P5 · Proposed / unscheduled | Totals, full history, playback/settings/files continuity and keyboard/screen-reader navigation | High / Hard | P2/P4 | A7/A10/A11 pass; all four seat totals plus both complete logs available; old reading position/latest flag retained; Pause accessible during automation and gates human choices; all five existing preferences retained and proposed label preference accounted for |
| P6 · Proposed / unscheduled | Validate the selected all-device scope and decide release | High / Hard | P2–P5 **and P7/P8**; separate implementation/release authorization and later review under repository process | Full phone portrait/landscape, tablet and desktop matrix plus A1–A11 pass; explicit Attack oracles pass; device and D4 appearance acceptance recorded; release/version separately authorized |
| P7 · Proposed / unscheduled | Tablet/desktop panel composition and original visual hierarchy | Medium / Hard | P1–P5; no dependency on P6 | 768×1024 through 1920×1080 and layout seams pass; four totals/current action/history balance accepted under D4; panel hiding reclaims space with no toolbar/region overlap |
| P8 · Proposed / unscheduled | Map-label hierarchy and readability polish: overview/focus labels, group/centre explanation and system reduced motion | Medium / Medium | P3; owner D4; P7 for final wide appearance | Focused identity/count and group/route information readable via map/context/list; no geometry/graph edits; proposed contrast/text targets checked and owner appearance acceptance recorded |
| P181 · Existing #181 / proposed / unscheduled sibling | Separate post-0.1.x generation-variety spike, not P3/P8 UI work | Medium / Hard | Separate owner spike authorization, retained T72 baseline and bounded corpus; no responsive dependency | Baseline plus 2–3 materially different candidates, matched seed 1994/retained valid/refusal cases, complete validity/cost/variety accounting, cross-device paired gallery and separate versioned integration recommendation per ASSESSMENT-181 |

P2 and P3 can become separate implementation tasks after the ownership interface
is agreed. That is a possible dependency sequence, not authorization to parallelize
agents or dispatch work. The selected dependency sequence is
**P1 → P2/P3 → P4 → P5 → P7 → P8 → P6**. P6 is the full-scope gate; it does not
come before P7/P8 and no selected device falls between release slices. Essential
focused readability/list access belongs to P3 as well; later polish cannot excuse
unreadable phone actions. P181 is a sibling, never an input to P6.

## Selected all-device scope versus the smaller alternative

The owner selected phones in portrait/landscape, tablets and desktops together.
That includes P7 composition and P8 readability before P6, plus current setup,
settings/files/help, all four totals, complete histories, required choices and
explicit Attack. Functional rotation, low-height fallback and camera/list access
are required throughout the selected scope.

The earlier smaller portrait/possible-0.1.2 slice would have retained desktop
appearance and required a tablet support limit. It is not selected. Actual version
and scheduling remain undecided; 0.1.2 is not a promised tag. No dependency runs
through regional flavour naming, new map generation, #181, Pro's unresolved
#259/#278 research or new gameplay rules. [ASSESSMENT-181.md](ASSESSMENT-181.md)
links the existing generation issue and its separate spike/integration boundary.

## Selected decisions and later authorization

- D1 is settled: map-first workspace.
- D2 is settled: all four form factors together, including both phone orientations.
- D3 is settled: select source/target, then explicit Attack; Place 1 stays unchanged.
- D4 remains later judgment of actual playable appearance and touch quality.

After separate implementation authorization, write task contracts with owned
files, red-before/green-after behaviour
checks and independent review. The acceptance scenarios here are input to those
contracts; they do not replace them or close #191/#194. Existing triage issues
remain in their current owner-managed queue; T77 creates none.
