# T60: construct the crossing before drawing the coast

Open [the matched comparison](comparison.html), then compare
[baseline](evidence/capture-B8t5Cx/baseline-800x540.png),
[A: coast-first](evidence/capture-B8t5Cx/coast-first-800x540.png),
[B: contact dual](evidence/capture-B8t5Cx/contact-dual-800x540.png), and
[D: ports-only control](evidence/capture-B8t5Cx/ports-only-800x540.png).
[C: paired gates](evidence/browser-A2kxYI/gates-800x540.png) tests explicit route identity.
All use the same 46 identities, opening values, 61 land borders and 15 sea links.
The input is pinned to T59 commit `8d6ad216b4685055501c5e4613399d1cf8fe0859`;
[provenance](input/provenance.json) records its hashes. A's original malpaco
[T25 contact template](input/template-provenance.json) is separately preserved.
No predecessor geometry,
artwork, code or screenshots were used.

**Recommendation:** use a port-first construction workflow, with broad entrance
coasts and explicit usable water gaps. A is the practical construction direction;
D proves why changing the old routing order matters. Keep B as an exact-adjacency
replacement option, but reject this particular dual layout because of label
packing. C can clarify paired gates, but cannot fix cramped geography.
None of these pictures is a visual acceptance or an integration-ready fixture.
The owner chooses the appearance and any contract change before implementation.

## What causes the present problem

T59 clips countries from generic two-row island silhouettes, selects the midpoint
of a facing exposed chain, then finds a shortest water path around fixed island
bounding boxes. A facing direction towards the destination island centre does not
ensure that the chosen country pair faces each other. For example, South rest is
top-right on West Isle while Stone watch is bottom-left on Central Isle. Their
midpoints lead away from the direct gap; the router then takes a detour. Some
routes also share a port or water bend, so the visible stroke looks like a network
junction rather than two independently traceable links.

The exact island graph is a 3×3 grid: Cliff–North–East; West–Central–Harbor;
Palm–Great–South. It has 12 distinct neighbouring island pairs and 15 country
links. A compact embedding therefore exists already; arbitrary global force
relaxation is not needed to explain this reference's failure.
The unchanged T24 checker permits route-to-route crossings and does not certify
lane separation or visual recognition. Its midpoint prescription is a designed
choice, not evidence of the predecessor's algorithm.

## Three different construction/presentation approaches

| Approach | Construction and benefit | Cost and decision |
| --- | --- | --- |
| **A. Port-first contact templates** | Reserve facing entrance countries and water corridors in the island graph embedding; fit broad, independently shaped island envelopes around a known valid local contact template; select separate visible coast ports before accepting any detour. | Practical near-term choice. Preserves current local graph families and label space. Silhouettes remain schematic and need owner art direction. Does not yet prove automatic generation. |
| **B. Exact graph contact dual** | Derive each island's bounded graph faces; place countries in their outer-face cyclic order, assigning entrance countries coast arcs towards their neighbours; turn face centres into internal region junctions. This replaces row clipping completely. | Exact actual adjacency is achieved, including Great Isle's quadrilateral faces without inventing diagonals. Current equal-radius geometry creates narrow cells. A label-aware constrained solve is required; this candidate is rejected for usability. |
| **C. Explicit paired shore gates** | Give both ends of each link the same small lettered gate. Users can match a pair even when a coast contact is visually weak; selection also highlights incident routes and legal countries. | Deliberately schematic communication alternative. Thirty extra markers add clutter, especially for short gaps; it inherits B's packing failures here. It is a presentation variant of B, not a third independent geometry or a shortening result. |

The additional **D ablation** leaves *every land polygon and label* unchanged and
replaces only coast ports/routes. It isolates the effect of port choice from
repositioning islands or drawing new regions. It is not counted as one of the two
independent construction candidates A/B.

A fourth alternative is graph embedding plus Voronoi/GMap subdivision. It offers
geographic-looking regions and label support, but ordinary Voronoi relaxation
does not preserve an exact prescribed adjacency. GMap explicitly permits an
approximate representation of the graph. For this game, its appearance ideas
would need an exact contact layer underneath; plain GMap is not a safe generator
replacement.

## Measurements and what they mean

The independently supplied [route measurements](evidence/verify-GJlsg9/report.json)
and [extended diagnosis](evidence/diagnose-PqnTcb/report.json) use board coordinates
in the same 800×460 frame. At the compact viewport, these equal CSS pixels.
The same renderer, palette, typography and 80px header are used for every map.

| Measurement | Baseline | A | B | D |
| --- | ---: | ---: | ---: | ---: |
| Total water-route length | 1332.1 | 670.6 | 897.7 | 584.1 |
| Shortest / longest route | 5.8 / 224.5 | 24.0 / 122.2 | 27.3 / 138.1 | 5.0 / 134.1 |
| Maximum actual/direct-endpoint ratio | 1.355 | 1.000 | 1.000 | 1.000 |
| Bends | 5 | 0 | 0 | 0 |
| Nonincident route intersections | 0 | 0 | 0 | 0 |
| Shared-country route-pair contacts | 6 | 0 | 0 | 0 |
| Minimum unrelated-coast clearance | 1.5 | 64.1 | 66.8 | 54.2 |
| Minimum separation of nonincident routes | 29.3 | 22.0 | 21.8 | 19.8 |
| Minimum competing-country distance at a port | 27.0 | 9.9 | 9.7 | 9.5 |
| 12px inward route continuations missing intended region | 2 / 30 | 0 / 30 | 0 / 30 | 0 / 30 |
| Rendered label boxes escaping country, compact | 0 | 0 | 23 | 0 |

A halves total route length while keeping visible water gaps. D shortens it by
56%, showing that port choice dominates this reference's route problem. Its
5px High shore–Lower field crossing also demonstrates why minimizing length
alone is a poor objective. Seven D routes are shorter than 25px, compared with
three A routes at approximately 24px. These are observed values, not a new
approved minimum water-gap rule.

The baseline's direct-endpoint lengths already total 1208.5px: merely removing
bends would save only 123.6px. Changing endpoint choice has the larger effect.
Conversely, A/B/D move some ports closer to competing countries and reduce the
minimum separation of unrelated routes. Their length/clearance improvement is
not a universal readability improvement. The 10px endpoint margin and 10px
same-country port separation are original search preferences, not game rules;
the optimizer can trade them against length, so they are not hard guarantees.

The six baseline contacts count *route pairs*, not six distinct junctions.
Some pairs intentionally share a country, but shared water bends/ports can make
their destination pairing harder to trace. The 12px inward continuation proxy
misses River keep and Fort town in the baseline; every new route continues into
its intended region. This does not measure a player's recognition rate. Neither
the screenshots nor these proxies certify beauty, plausibility or comprehension.

## Constraints and browser evidence

No T24 parameters or checker code changed. Every candidate preserves all graph,
country-degree, island-degree, bonus and fairness diagnostics. Independent
positive-length shared-boundary measurement matches every declared land pair.
Every new route stays in water and is a direct segment; no detour was needed.

The complete unchanged T24 errors are in the diagnosis and verify reports:

| T24 diagnostic | Baseline | A | B | D |
| --- | ---: | ---: | ---: | ---: |
| Label/hit errors | 0 | 0 | 28 | 0 |
| Facing-chain midpoint errors | 0 | 30 | 30 | 29 |
| Cell-boundary diagnostics | 0 | 8 | 24 | 0 |
| Every other diagnostic | 0 | 0 | 0 | 0 |

B's 28 label errors comprise 21 country hit squares outside their country and
seven label-spacing pairs below 44px. Its 23 actual rendered label-box escapes
also appear at 1280×800. The independent browser result does not hide those
violations behind a successful screenshot command. A/D have no actual label-box
escapes at either size; all count text computes to 14px in SVG coordinates.

A's eight cell diagnostics arise from zero-length exposed-boundary projection
residuals; B's largest residual is `2.842170943040401e-14` board units. Every
island's area residual is exactly zero. This is consistent with the already
reported T24 projected-residual issue [#109](https://github.com/diegoami/malpaco/issues/109).
The original checker errors remain in full; this investigation neither fixes nor
waives them. A/B still do **not** pass the current integration contract.

All 30 A/B ports and 29 D ports deliberately conflict with the existing midpoint
rule. Selecting any visible, separated, country-specific coast point is an
alternative design requiring owner approval of a contract amendment. Even D,
whose land/labels already pass, must not be quietly integrated under T24.

[Matched browser captures](evidence/capture-B8t5Cx/report.json) include every map
at 800×540 and 1280×800, plus South rest–Fort town and Rock bay–Upper ridge
close-ups. [Supplementary browser diagnostics](evidence/browser-A2kxYI/report.json)
measure actual SVG label boxes, capture C, and exercise South rest selection,
neighbour highlighting and incident-route highlighting at both sizes.
There were no browser/runtime failures. Those checks establish rendered facts,
not owner approval or exhaustive interaction acceptance.

## Practical algorithm and small task sequence

Construct in this order: exact graph and planar embedding → label/hit-space
reservations → entrance-country cyclic coast order → island envelopes and
separated ports → direct visibility segments → joint local movement/reshaping
when a segment is blocked → detour only after those choices fail → decorative
coast detail that cannot change contacts, label boxes or route corridors.
Island placement, orientation and ports must participate in the same objective;
running a better router after freezing arbitrary countries repeats the old issue.

Prefer a lexicographic feasibility-first objective: exact topology and usable
labels; no land intersections; unambiguous endpoint attachment and independent
route tracing; visible water gaps; then route length, bends and coastline style.
Reserve per-link lanes at countries with two sea edges instead of merging them
onto a midpoint. Test multiple island embeddings/orientations when the port
cyclic order conflicts; reject an impossible arrangement before adding long
bypasses. A source/target highlight or short inward landing mark can complement
passive coast cues, subject to the owner's visual choice.

1. **Reference decision and contract amendment — medium, roughly half a day.**
   Owner compares A/D and gate variants; choose endpoint attachment, visible-gap
   expectations and silhouette direction. Write measurable country-specific
   coast/route-separation requirements, preserve all label/hit/fairness rules,
   and resolve #109 independently. No arbitrary numeric threshold is adopted here.
2. **Direct-port reference constructor — medium, 1–2 days.** Reserve coast arcs
   and label boxes together; search visible endpoint pairs with hard chosen
   separation/attachment requirements. Add blocked-port and double-exit tests;
   prove all exact graph pairs and actual rendered labels. Obtain owner approval.
3. **Joint generated island layout — hard, 2–4 days for a bounded prototype.**
   Embed island graphs, assign country coast order, jointly optimize envelopes,
   orientations and ports, then produce a retained seed sweep. The T24 99% in
   at most 50 attempts objective remains unproven; surface failure rather than
   weakening constraints. Estimate excludes unknown topology infeasibility.
4. **Full contact-dual replacement, if needed — hard research, 3–5 additional
   days initially.** Replace equal-radius seeds with a constrained region solve
   that contains every 40px hit square and real label rectangle while preserving
   exact positive-length contacts and entrance arcs. Compare against A before
   building a production generator. Failure to fit at 800×460 is a reportable
   design conflict, not permission to shrink text or alter adjacency.

These are engineering estimates, not deadlines or authorized downstream tasks.
The reference evidence supports the workflow with high confidence; it does not
prove that arbitrary generated graphs can satisfy every constraint.

## Sources and evidentiary limits

- Reviewed archaeology [F022 at d5932c2](https://github.com/diegoami/isle-wars-archaeology/blob/d5932c2cea7741e81012bd4619e55430aba81a37/findings/F022-pro-map-presentation.md#answers)
  reports short straight visible spans in selected examples, approximately
  33–62px with ±4px manual uncertainty. It does not establish artwork construction,
  midpoint, coast clearance or a detour algorithm. These samples are not universal
  route thresholds. [F017](https://github.com/diegoami/isle-wars-archaeology/blob/d5932c2cea7741e81012bd4619e55430aba81a37/findings/F017-pro-board-rules.md#q-map-08-does-the-boards-layout-vary-between-games)
  establishes fixed graph/marker data, not country geometry or a generator.
- Dwyer, Marriott and Wybrow, [Integrating Edge Routing into Force-Directed Layout](https://bridges.monash.edu/articles/report/Integrating_Edge_Routing_into_Force-Directed_Layout/20365398),
  2006 technical report: jointly moving nodes and bends with separation constraints
  motivates including route geometry during layout. Our bounded search is original;
  it is not an implementation of their optimization or a guarantee from that paper.
- Gansner, Hu and Kobourov, [GMap: Drawing Graphs as Maps](https://arxiv.org/pdf/0907.2585),
  §1/§3: embedding, labels and map subdivision can be constructed together; its
  map representation deliberately need not reproduce the exact graph. That
  limitation is why unconstrained Voronoi/GMap is not recommended here.
- Barth et al., [Towards a Topology-Shape-Metrics Framework for Ortho-Radial Drawings](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SoCG.2017.14),
  SoCG 2017: separating combinatorial embedding/angles from coordinate assignment
  informs the staged design. Its ortho-radial results are not claimed to solve our
  coast, region-area or label-packing problem. The contact-dual construction here
  is an original bounded prototype, not an imported map or theorem of feasibility.

## Reproduce and inspect retained drafts

```sh
node docs/prototypes/new-game/T60/build.mjs
node docs/prototypes/new-game/T60/verify.mjs
node docs/prototypes/new-game/T60/diagnose.mjs
node --test docs/prototypes/new-game/T60/measure.test.mjs
node docs/prototypes/new-game/T60/capture.mjs
node docs/prototypes/new-game/T60/browser-diagnostics.mjs
git diff --check
```

Browser commands ran in `mcr.microsoft.com/playwright:v1.63.0-noble`, with the
worktree mounted at `/work`, dependencies read-only, uid 1000. Local commands
require that matching Playwright browser installation. Each build/check writes
a fresh evidence directory; `study.json` selects the retained comparison.
Source and parameters are snapshotted in each build, alongside board/HTML/SVG
hashes. [artifact index](artifacts.v5.sha256.json) covers every retained artifact
except the newest index itself; earlier outputs are never overwritten.
`build.mjs` also updates the tracked `study.json` selector to its new output
directory. That selector is mutable configuration, while each build directory
stays immutable. A local reproduction therefore makes the selector differ from
the committed hash index even when all boards reproduce byte for byte. To audit
the committed index after a reproduction, save the selector's actual bytes before
running the build and restore those saved bytes afterwards; do not discard other
uncommitted work. Otherwise retain the new selector and generate a fresh versioned
index when publishing that comparison. The independent review identified this
documentation caveat; it does not change the measured route results.
[A clean reproduction](evidence/final-validation/reproduction.json) using the
preserved T25 input produced byte-identical boards for all four entries; its
source snapshots are in [build-LrdPTV](evidence/build-LrdPTV/sha256.json).

The first [draft](evidence/build-r7gBIB/report.json) had 10 A and 24 B failed
label-box searches. [The smaller-radius dual experiment](evidence/build-U79PP6/report.json)
worsened B's packing and was rejected. [The broad-coast revision](evidence/build-SNZFL5/report.json)
eliminated A's failed searches. [The retained comparison](evidence/build-Pea8gz/report.json)
uses a less square coast profile, keeps all A labels, adds D and classifies
failures by construction. Early failure lists predate that explicit method field;
their first A failures precede B failures. All snapshots and initial screenshots
remain available, including less successful appearances.
