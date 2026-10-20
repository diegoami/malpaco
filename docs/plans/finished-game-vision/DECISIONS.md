# Owner decisions: full-screen geography and less text

Owner response in the #215 cloud-session conversation, 2026-10-19, following
[PR #216](https://github.com/diegoami/malpaco/pull/216) at
`33c0f90c5f3b0db1da0a4f8a5da0f24838ea95ac`:

> V1-V5 agree to all, but for V2 because nice, organic maps are a must. Flavour
> can wait, because it would be more text. The sketches have too much text and
> I want the map to occupy the full size of the screen, instead of that use just
> icons for actions and have text appear in the map only when needed by the user
> interaction and information, and then go away. Like in the original. The furst
> iteration was just too overhelming.

The wording is retained as given. The organic-map requirement applies to the
finished game's geography and visual bar; it introduces no match-duration or
combat-rule change. No numeric session-length target is inferred from “V2”.

## Decisions carried forward

| Decision | Owner direction | Consequence |
| --- | --- | --- |
| V1–V5 | Agree to the vision with the qualifications below | Product promise, supported modes, complete-game capability baseline, exclusions and acceptance principles are accepted. Do not re-ask V1–V5. Specific unchosen numerical targets/sample sizes are not invented. |
| U1 · organic geography | Nice, organic maps are a must | Required to call the game finished. Reconcile #173/T64–T65 and #181 against this bar; a larger generator rewrite or a specific algorithm is not selected by this decision. Actual generated maps across representative seeds still require owner acceptance. |
| U2 · flavour | Flavour can wait because it adds text | Defer flavour naming #170 from the first finished edition; retain the existing issue. No permission to omit essential rules, effects, country identity on request or accessibility text. |
| U3 · composition | Map occupies the full size of the screen | The map viewport fills each device. No permanent header, action dock, sidebar, totals/history panel or reserved text region. Controls and temporary information overlay the map. This supersedes the fixed-chrome assumptions in the earlier sketches and responsive composition. |
| U4 · actions | Use icons for actions | Compact consistent icons, with accessible names and explanations on request/focus. Explicit Attack remains an intentional icon activation after source/target selection. Icon-only appearance does not authorize automatic attack on a country tap. |
| U5 · information | Text appears only when interaction/information requires it, then goes away | Reveal relevant counts, brief consequences, choice prompts or requested details in context; clear them when that interaction ends. No persistent flavour, instructions or event stream on the board. Required choices, errors and results cannot silently time out or be lost. |

D1 map-first is strengthened to full-screen geography. D2 phone portrait,
landscape, tablet and desktop remains. D3 explicit Attack and one-army placement
remain. D4 is actual playable appearance and interaction acceptance.

## Portrait follow-up

On 2026-10-20 the owner responded in the same cloud-session conversation:

> much better, but how to deal with portrait? Does he navigate by swiping? The
> map shoud be turned to fit portrait, somehow

This approves the simpler direction and asks for a portrait-fit correction, not
a different match/map. Revision 3 illustrates the recommended presentation:
turn the same board 90° for a fitted portrait overview, with upright counts and
controls. When the player zooms in, one-finger dragging pans and pinching zooms;
Fit returns to the overview. These gesture/camera details are the proposed answer
to the owner's question, not a claim of implemented behaviour. Initial fit should
choose 0°/90° according to actual board bounds and available space, rather than
rotate a naturally tall board unnecessarily. Geography is never stretched,
regenerated or rearranged. Rotation preserves world-space selection, pending
choices and focused location; camera transforms may change to fit the new view.

## Colour and beginner follow-up

On 2026-10-20 the owner asked:

> I think the colours shoule be more vivid and irregular, and also walk me
> through the ui and show me how a beginner would understand it

Revision 4 proposes brighter blue/orange/green/purple ownership, more varied
coasts, differently arranged subdivisions and more irregular shared borders.
Ownership hues remain consistent so a beginner can track who holds each region;
colours are not arbitrary decoration. Specific palette and shape execution remain
for visual review, not established production acceptance.

The [beginner walkthrough](BEGINNER-WALKTHROUGH.md) shows eight first-use moments.
Short contextual hints identify the player's colour, name phase actions and
explain consequences as needed, then clear. Skippable/replayable first-turn tips
are a teaching proposal responding to the question; no tutorial implementation
or new task is dispatched. The ordinary resting board remains text-free.

## Real-world geography and usability review

On 2026-10-20 the owner clarified:

> Ok i will review for usability, that will be part of the review, still I would
> like the islands and reigons look mormlike some ral counterparts, not cooy but
> use as a generation example. say, sicily or cuba or borneo or new zeland and
> their provinces

Usability is explicitly part of the owner's review. No usability approval is
claimed yet and no additional review model is dispatched. Actual controls,
first-use guidance, gesture safety, map picking and information recovery remain
in D4/playable review.

Geography must take reference from the named islands and regional/provincial
structure while remaining original. [Reference brief and studies](GEOGRAPHY-REFERENCES.md)
make that direction concrete: newly drawn wedge, long-axis and broad-interior
forms, with different regional structures. Review names are not flavour names.
No real coordinates, coastlines, political boundaries, maps or assets are copied.
Revision 5 integrates those forms into the map/teaching sketches. These are
static illustrations, not generation output. Exact reference replicas, real
province counts, a new generator algorithm or relaxed gameplay constraints are
not selected by the request. Reconcile the refined bar through existing geography
work before separately authorized implementation.

## Broad geographic character and variety

On 2026-10-20 the owner clarified the examples' scope:

> Well, not just those, make it a broad requirement, they must feel like real
> islands and have variety

Generated islands and their regions must feel like believable real-world
geography and show broad structural variety, within each match and across
generated maps. Sicily, Cuba, Borneo and New Zealand are illustrative references,
not an exhaustive list or four fixed generation templates. This clarification
supersedes any narrower reading of the previous reference direction.

Variety includes overall landform, proportions, asymmetry, coastal structure and
regional organization; rotation, recolouring and minor outline changes alone do
not meet that bar. Originality, readable interaction and existing gameplay,
topology, fairness, route and save constraints remain binding. Owner review of
actual generated maps must assess believability and variety; the unchanged
revision-5 studies illustrate only a few possibilities. Reconcile this broad bar
through the existing geography work; no specific generator or new task dispatch
is selected.

## Apply changes; review separately

On 2026-10-20 the owner instructed:

> Do not do review, do the changes, review will be done by someone else

Revision 6 applies the interaction and presentation changes in the static
concepts: fitted landscape, explicit source/target teaching and legal cues,
nearby army comparison and capture odds, distinct owner badges, local outcome
feedback, Fight on/Stop, editable capture preview/fold/resume, opponent/return
scenes and requested icon help. Resting maps stay text-free; full viewport,
portrait rotation, Place 1, explicit Attack and existing contracts remain.
The main-session assessment report is removed from the current package; its
historical commit is retained. No separate reviewer is dispatched and no review
approval or actual-play usability/fun result is claimed. Product implementation
and backlog reconciliation remain subject to the existing #215 gates.

## What still needs review or reconciliation

The first sketches were rejected for text density; V1–V5 approval does not approve
those drawings. [Revision 2](SKETCHES.md) redraws all five scenes and adds a quiet
map across all four devices. These are original static illustrations, not actual
map generation or a playable build. Owner review of these revised sketches
precedes final backlog reconciliation under #215; do not request another generic
V1–V5 approval.

Before dispatch, amend affected existing contracts and acceptance assumptions
explicitly on main under the normal process, preserving their behavioural
obligations. In particular reconcile T79's dock, T85/T86 surfaces, T84 totals/logs
and T87 annotations with U3–U5. Reachable information remains required; always
visible text/panels are superseded. Use existing issues and the release map.
Organic geography must receive a place in the finished-game backlog; its precise
relationship to the 0.2.0 UI slice awaits that reconciliation and owner approval.

No task Done-when, game rule, model assignment or historical review is edited by
this decision record. No implementation, research model, prototype or publication
is dispatched. Earlier sketches/receipt remain historical at the original commit.
