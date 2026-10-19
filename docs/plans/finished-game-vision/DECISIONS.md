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
