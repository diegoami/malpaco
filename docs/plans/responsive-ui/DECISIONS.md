# Selected planning direction

On 2026-10-19 the owner accepted the recommendations in the three design questions:
map-first workspace, one cross-device redesign, and an explicit Attack after enemy
selection. The [decision record on PR #196](https://github.com/diegoami/malpaco/pull/196#issuecomment-6273841926)
and [T77 contract](../../tasks/T77.md) govern the living plan.

| Decision | Selected | Consequence |
| --- | --- | --- |
| D1 · workspace | Map-first, with adaptive action dock/side panel | Separate map/decision pages remain a comparison alternative; the explicit reading view remains the low-height fallback |
| D2 · scope | Phones in portrait **and** landscape, tablet and desktop together | Tablet/desktop composition and map-label work precede the full-scope acceptance gate; no mobile-first release or unresolved tablet fallback |
| D3 · attack commitment | Select owned source, select enemy target, then press **Attack** | Source/target selection stages the pair without combat; Attack performs one existing exchange after fresh legality, pause and required-phase checks |

These select a planning direction. They do not dispatch implementation, authorize
a working prototype, schedule a release/version, or accept final playable
appearance. D4 remains the later owner judgment of actual typography, counts,
map/dock balance, touch feel, feedback and cross-device density. Do not ask D1–D3
again unless new evidence requires an explicit amendment.

## Attack contract [designed]

Current 0.1.1 exchanges immediately when an enemy is activated after an owned
source, except inspection. That remains a historical fact in SOURCES, not the
selected redesign. In the plan, a target tap, candidate-list **Select target**, or
Enter/Space on an enemy only stages the target and updates the ready comparison.
Core state, action history and RNG remain unchanged until an explicit action.

**Attack is the single-exchange control**, labelled prominently instead of Once;
it is not an additional seventh dock command. Fight on remains a deliberate
continuation after the first explicit Attack on that pair; it is disabled for an
unconfirmed pair. Changing either source or target, or replacing the match,
invalidates that confirmation. Stop retains its current capability. Each
game-changing command checks the current legal pair and existing
pause, automation and required-choice gates; stale/illegal pairs cannot fire.
Pan, resize, modal close, pause/resume, focus restoration and key repeat never
commit the staged attack. Enter/Space on Attack commits one exchange; Enter/Space
on a country does not. Re-selecting a target is safe before commitment.

Owned-region taps during placement still place **one** army; the list still says
Place 1. No multi-army placement chooser, combat arithmetic, automated battle
policy, RNG, save identity or replay rules are changed by the planning decision.

## Related generation work and review boundary

The owner also requested evaluation of existing [#181](https://github.com/diegoami/malpaco/issues/181).
[ASSESSMENT-181.md](ASSESSMENT-181.md) recommends a separate spike with Medium
priority and Hard difficulty after 0.1.x as a sibling workstream. It is not already covered by camera
or label polish and is not a dependency of the selected responsive redesign.
Evaluation does not start that spike or authorize a generator change.

The retained [Opus review](review/FINAL.md) and [receipt](review/RECEIPT.md)
predate this owner-selected attack change. They remain historical evidence with
their original scope and conditions; this update claims no additional independent
review. No file under `review/` is rewritten to describe the later decision.
