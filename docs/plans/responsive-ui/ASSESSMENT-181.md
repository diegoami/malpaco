# #181: separate generation spike, linked to this plan

Existing [#181: varied island and region generation beyond pie layouts](https://github.com/diegoami/malpaco/issues/181)
is **not included** in P3 camera/selection or P8 label/readability polish.
Recommend retaining it as a **separate Medium priority / Hard difficulty spike, proposed and
unscheduled**, after 0.1.x, linked as a sibling workstream in [BACKLOG.md](BACKLOG.md).
It does not block the responsive redesign or the selected0.2.0 delivery gate.
No duplicate issue, new task dispatch, model assignment or generator experiment is
authorized by this assessment.

## Why it is separate

The owner's 2026-10-18 issue asks for broader island/continent silhouettes and
irregular connected regions, alternatives to repeated central spokes/rows, and
comparison of geometry validity, adjacency, distribution and practical cost on
matched seeds. That is algorithm/representation research. P3 navigates existing
geometry; P8 makes its labels, ownership, groups and route meaning legible. Neither
changes how islands or regions are generated.

The retained [T72 baseline `94dda2b7`](https://github.com/diegoami/malpaco/commit/94dda2b7)
remains the comparison origin. T72/T74/T75
presentation deformation preserved gameplay topology; it does not establish that
the broader generation variety requested in #181 has been achieved. A more varied
silhouette may improve the overall aesthetic goal, but camera or typography work
cannot substitute for evaluating its partitions and graph properties.

This assessment uses the supplied #181 issue/owner context, the
[main-session assessment comment](https://github.com/diegoami/malpaco/issues/181#issuecomment-6273912155)
and the plan's existing source boundaries. It contains no fresh empirical
findings, seed sweep, candidate algorithm, changed geometry or claim about
achievable success rates.

## Proposed spike exit, before a separate integration decision

| Required output | Bounded proposed criterion |
| --- | --- |
| Preserved baseline and candidates | Compare the retained baseline with **2–3 materially different candidates** for silhouette and/or connected region partitioning; describe the differences and preserve each version |
| Matched corpus | Freeze one bounded retained seed corpus before comparison, including seed 1994 and retained valid **and refusal** cases; use identical seeds and declared constraints for every candidate |
| Shape/distribution account | Define and report silhouette/partition variety and central-junction counts consistently; include repeated patterns and counterexamples rather than only attractive successes |
| Geometry and graph account | Report all acceptance/refusal counts and reasons; check connected regions, valid polygons, intended contacts and adjacency correctness against unchanged constraints; do not relax graph/fairness/region-count requirements to improve results |
| Practicality account | Measure generation/presentation cost, memory and failure/refusal cost, including responsiveness/cancellation implications; choose finite cost/responsiveness targets from feasibility evidence, not guessed millisecond or success-rate promises |
| Paired owner gallery | Present baseline/candidate pairs on the same seeds, including focused phone portrait/landscape, tablet and desktop views; judge labels, tiny regions, contacts and crossings with the responsive UI, not only a desktop silhouette gallery |
| Recommendation and integration boundary | Explain the preferred candidate or retention of the baseline, limits and failed cases; propose a bounded separate integration contract and explicit version/compatibility treatment before changing production generation |

Two to three candidates is a proposed investigation bound, not a result or an
empirical quality threshold. Probe constraint feasibility before setting any
target success rate or rewriting an algorithm to meet one. An unreachable target
requires an owner design amendment; it never permits silently weakening validity,
adjacency, fairness, region counts or accepted historical assertions.

Historical saved maps, replay, RNG streams and version identities remain protected.
Changes to generation that alter seed outcomes need an explicit version/integration
decision; graph, fairness or region-count changes require an additional owner
design decision. A favourable gallery alone authorizes none of these.

## Interface with the responsive work

The selected UI consumes the current versioned map's geometry, stable region IDs,
labels, group membership and legal routes. Camera/list selection and attack
confirmation must work without assuming pie partitions, a central hub or a fixed
visual ordering. That is the useful shared boundary; no new generator is needed
to implement the responsive plan.

If #181 later proposes integration, its validation must include the responsive
viewport/readability/selection criteria in [ACCEPTANCE.md](ACCEPTANCE.md), plus its
own generation/compatibility evidence. It must not force the responsive release
to wait for R&D or silently enlarge T77. The existing post-0.1.x timing remains;
asking for this evaluation has not started the spike or changed its issue labels.
