# Geography contract for the feasibility probe

Sources: [canonical board rules](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md#the-board),
[UI legibility](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/ui.md#legibility-and-size),
and the owner's coast-centred crossing requirement. This is a proposed numerical
contract for T24's probe, not permission to change a rule or a claim of generation success.

## Constraints already decided

| Check | Requirement |
| --- | --- |
| Counts | Exactly 46 distinct countries; nine distinct islands, sizes 3,3,3,3,5,5,7,7,10; each country in exactly one island, consistent with its island field |
| Symmetry | Every land/sea edge exists in both directions; no missing endpoint, self edge, duplicate edge or wrong land/sea island classification |
| Connectivity | The whole country graph, each island's land graph and the island graph are connected |
| Degree | Every country has 2–5 distinct neighbours, including crossings |
| Cells | Every country is a finite, positive-area, connected simple polygon; island silhouette is exactly its subdivision; interiors do not overlap; no unexplained gaps or overlaps between islands |
| Borders | Land edges are exactly the within-island pairs sharing a positive-length boundary; a point contact does not create an edge |
| Crossings | 14–18 undirected sea edges between islands; exactly one rendered route per edge |
| Coasts | Route endpoints belong to the intended countries and lie at the arc-length midpoint of a maximal exposed coast chain facing the destination island; ties deterministic |
| Intersections | The route interior avoids all country interiors, including re-entry into its own endpoint countries; routes may meet their intended coast only at their ends |
| Bonus | Each island pays max(2, floor(size/2) + distinct entrance countries), never above size |
| Fortress | No island of >=7 countries has one entrance; at most three islands have one entrance |
| Concentration | Single-entrance island bonuses sum to at most one quarter of all bonuses |
| Remoteness | Every island is at most four crossings from every other, and touches at most four other islands |
| Crowding | No country carries more than two crossings |
| Labels | Fit the approved minimum window with non-overlapping legible owner/count badges and hit areas; generator positions provide spacing |

The pinned design's island-neighbour maximum is four. Production currently exports
five in board-gen.ts/board-fairness.ts. This probe uses four, irrespective of that
implementation difference. The parent smoke found no violations of four on seeds 0–99;
this sample does not prove that production's looser guard cannot admit one elsewhere.

## Numerical proposals for owner decision

These are **[designed]** values: the canonical sources above and T23 inventory were
searched; they fix the window but leave spacing/tolerances and generation budget open.

| Property | Recommended value and meaning |
| --- | --- |
| Minimum viewport | 800×540 CSS px, already approved in UI13 |
| Probe's compact panel allowance | 80 CSS px total height, leaving an 800×460 board; an explicit allocation, not a measured final UI |
| Country hit area | At least 40×40 CSS px; the approved design proposes 40 |
| Label separation | At least 44 CSS px in the maximum-coordinate distance: 40 px badge/hit square plus 4 px gutter. This also guarantees at least 44 px Euclidean separation |
| Count text | At least 14 CSS px, with >=4.5:1 contrast; both are the canonical UI proposals. Geometry alone cannot prove font/contrast rendering; T52 must measure the scene |
| Reference frame | 800×460 for probe fixtures. Other frames scale to the same board area with aspect preserved; spacing is checked after scaling, never in unscaled source units |
| Coordinate tolerance | 0.000001 reference unit for collinearity/point-on-edge comparisons; never a visual gap allowance |
| Area tolerance | 0.0001 square reference units for accumulated subdivision-area arithmetic; explicit gap/overlap geometry is still checked |
| Coast-centre tolerance | At most 1 CSS px from the computed chain midpoint; endpoints must still lie on the correct exposed coast |
| Candidate generation budget | Target >=99% valid boards within at most 50 candidate attempts per seed, with explicit failure on exhaustion. This is a proposed downstream target, not a measured result or permission to retry a deterministic bad layout |

The alternative spacing is 40 CSS px with no extra gutter. Keep 44 unless measurements
show it prevents feasible subdivision; do not quietly shrink either the hit area or window.

## What the first measurement establishes

Run from this task's worktree with Node 24:

```sh
node --disable-warning=ExperimentalWarning docs/prototypes/new-game/T24/evidence/preflight/smoke.mjs
```

[baseline-v1.json](evidence/preflight/baseline-v1.json) retains every seed 0–99,
one observed existing generator-body attempt per seed, map/scene hashes and timings.
All 100 bodies returned boards. Minimum rendered label separation at the assumed
800×460 board is 29.588 CSS px (Euclidean) / 28.884 CSS px (maximum-coordinate distance),
below either spacing proposal. This is a failing baseline for label packing, not a proof
that the proposed constraint set is impossible. It has not run the full geometry contract.

T24 will distinguish a static jointly valid schematic witness, if one is found, from
the seed sweep of the existing implementation. A witness proves compatibility of the
constraints; it does not prove a generator meets its success rate, visual quality or variety.
No synthetic fixture or relabelled copy may be reported as 100 distinct generated boards.
The full probe must retain per-constraint failures and attempt counts, including failures;
reruns write fresh evidence rather than overwrite measured outputs.

Numerical contract approval is required by T24's label acceptance line and Hazards.
Downstream algorithm work additionally requires the resulting feasibility evidence and
owner approval; a failed existing baseline alone is no proof of joint infeasibility.
