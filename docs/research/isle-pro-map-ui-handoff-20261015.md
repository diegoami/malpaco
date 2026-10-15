# Isle Wars Pro findings for malpaco: map topology, appearance and play UI

Owner-requested handoff, 2026-10-15. Priority: malpaco's map is reported to have
wrong topology and to fall below Pro's visual quality. This document transfers
behavioral descriptions and design recommendations only. It contains no original
game images, assets, coordinates, adjacency tables, decompiled code or help text.
It does not modify production gameplay or approve the T22 prototype.

## Sources and confidence

Archaeology revision: [ae298e37](https://github.com/diegoami/isle-wars-archaeology/tree/ae298e37c2f5177039e55767607f9345b6cb0e7a).
Use these pinned findings rather than an unversioned recollection:

- [F017 board rules](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/findings/F017-pro-board-rules.md):
  merged, reviewed static analysis; table properties approximately 95% confidence,
  relevant absence claims approximately 85%. The finding's own status remains
  `proposed`; it is not a promoted spec or runtime corroboration of every rule.
- [F020 UI observations](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/findings/F020-pro-ui-observations.md):
  reviewed board/pieces observations and completed play batch, especially
  Q-UI-01/02/03/05/20 and Q-UI-08/12/13/15/16. Preserve each entry's narrowed scope.

Below, `[confirmed, static]` means a checked property in F017, not observed play.
`[observed]` means F020's bounded visual observation. `[designed]` marks a proposed
malpaco choice; Pro's numbers and appearance are context, not mandatory targets.

## Topology: what Pro actually establishes

| Property | Finding and limit |
| --- | --- |
| Scale | `[confirmed, static]` One fixed board, 46 countries, nine island groups. The sorted group sizes are 3, 3, 3, 3, 5, 5, 7, 7, 10. This is not a random-map generator specification. |
| Connectivity | `[confirmed, static]` The whole country graph and the nine-island crossing graph are connected. |
| Adjacency | `[confirmed, static]` 80 undirected links / 160 directed entries, exactly symmetric. Country degree is 2–5: eight degree-2, twelve degree-3, twenty-two degree-4 and four degree-5 countries. |
| Within/across groups | `[confirmed, static]` 64 links are within island groups and 16 between groups. Pro's rules read one adjacency relation; the analysis found no separate land/water movement rule. Malpaco's separate `borders` and `seaLanes` representation is its own design. |
| Strategic structure | `[derived]` F017 describes corridors, hubs and alternate routes. Matching only territory count, island count or total edges does not reproduce those structural properties. These observations do not establish a balanced or fun generated-map target. |
| Layout | `[confirmed, static]` Pro uses a fixed layout; new games redistribute pieces. A generative solution in malpaco requires additional design choices. |

**Source discrepancy:** F020 Q-UI-01's visual prose says "ten islands" while F017's
independently checked partition establishes nine island groups. Do not propagate
ten as topology ground truth. Visible disconnected pieces and logical bonus
membership must be counted separately; this handoff does not establish why that
visual count differs. No source finding has been silently edited here.

## Apply this to seed 1994 before another art pass

The current malpaco T22 task already reports independently checked non-planar
within-island graphs for Cliff Isle and Great Isle. That finding concerns
malpaco's seed-1994 input; it says nothing about Pro's graph's planarity.

`[derived]` A simple planar tiling of connected province cells, with adjacency
meaning a shared boundary segment and only ordinary pairwise boundary contacts,
cannot realize a non-planar land graph. Arbitrary crossings, point contacts or
sea-like links painted as land borders do not resolve that constraint. Planarity
is necessary under those assumptions; it does not by itself prove a usable map
embedding, good coastlines or valid label space.

`[designed]` Resolve the representation contract explicitly:

1. Preserve the existing gameplay graph and visibly represent edges that cannot
   be shared borders as intentional special connections; or
2. Propose an owner-approved topology change that admits coherent connected
   province geometry, with the exact added/removed edges disclosed.

Neither route is selected by this handoff. T22 currently permits a disclosed
prototype proposal, not a silent production graph rewrite. Its Godot reference
can guide geometry; the owner's requested quality bar remains Pro.

Candidate-E local inspection on 2026-10-15 found the following in
`docs/prototypes/map-1994/preflight-20261015-e/candidate-green/acceptance.json`
on the separate `task/T22-map-1994` branch:

- Current graph: 61 land edges + 16 sea edges = 77 total.
- Proposed graph: 69 land edges + 16 sea edges = 85 total; some country degrees
  rise to 6. The eight-edge net increase does not identify the individual changes;
  inspect `topology-diff.json` for additions and removals.
- `accepted` was `false`: complete label rectangles escaped province cells for
  `province_20`, `province_6`, and `province_18`.

These are a dated reading of an evolving prototype's report, not an independent
rerun, an assertion about production topology, or a diagnosis of every problem
the owner sees. A denser graph may be a valid new design, but must not be called
topology preservation. Counts alone cannot decide correctness.

`[designed]` Review topology with executable geometry and gameplay checks:

- Define land adjacency from a positive-length shared boundary, with a stated
  numerical tolerance. Corner contact alone is not a land border under this rule.
- Compare computed boundary adjacency with declared land edges in both directions:
  every advertised land edge is drawable, and every drawable border is declared.
- Check connected province cells, valid polygons, no overlapping interiors, no
  unexplained gaps, and a coherent island union. If holes are allowed, define them.
- Check the country graph, each island's land graph and the island crossing graph
  for the connectivity required by malpaco's own design. Report unreachable pairs.
- Keep sea endpoints on the intended province's exposed island coast, avoid
  unrelated land, and make each route's endpoints visually unambiguous. Short
  routes are a visual design preference, not a measured Pro constraint.
- Compare the selected-neighbour highlight, legal action targets and declared
  graph. Use one agreed adjacency source; a label or decorative route must not
  introduce a different movement rule.
- Report each edge addition/removal, degree distribution, island exit counts,
  articulation points and bridge edges before/after. These diagnostics expose
  strategic changes; no particular bridge count is established by this research.

## Visual quality: lessons that can be used now

`[observed]` F020 describes coherent-looking land groups over a blue sea, relief
texture with owner tints, pale straight sea connections, small territory identity
markers and much larger outlined army digits. Those observations describe the
visual hierarchy, not a reusable asset library or measured typography recipe.

`[designed]` For malpaco, prioritize the following over extra decoration:

1. Give islands coherent silhouettes and contiguous subdivisions; detached cells
   should not make one logical island look like an unrelated scatter of tiles.
2. Make borders, routes and their endpoints readable before adding terrain detail.
   A beautiful coast cannot compensate for a movement edge the player cannot see.
3. Keep army counts legible over ownership fills and texture; reserve clear label
   areas. Validate complete name/count/owner label rectangles at both T22 sizes.
   Label length changes need space, not only a smaller font.
4. Give the map most of the visual attention. Keep controls restrained and stable.
5. Improve on Pro's observed weakness: ownership tints become difficult to
   distinguish in greyscale. Add a redundant owner marker, pattern or outline;
   do not use hue as the sole ownership channel. Distinguish production centres
   with an explicit symbol rather than only a changed digit colour.
6. Keep the owner as the judge of visual parity. Geometry checks and screenshots
   at 1280x800 and 1920x1080 support that judgment; passing them does not certify
   beauty. Use original malpaco artwork and code, never Pro's images or assets.

## Other completed play findings worth carrying forward

| Reviewed observation | `[designed]` malpaco implication |
| --- | --- |
| Q-UI-08/12: player counters and the active-player marker remain visible through placement/combat. | Keep whose turn it is, ownership and resources visible throughout phase transitions. |
| Q-UI-08/12: allocation preview changes before the country army total is committed. | Distinguish selected allocation, remaining reinforcements and committed board state. |
| Q-UI-08/12: combat identifies source/target and updates army comparisons; some lower feedback is clipped. | Preserve battle context and immediate result feedback; test small viewport clipping. |
| Q-UI-16: capture shows separate move-in quantity controls. | Model placement, attack and post-capture movement as explicit interaction states; unrelated input must not leak across a transition. |
| Q-UI-15: an award shows a card, then Continue; the counter update is visible afterward. | Show rewards clearly and make their arrival acknowledgeable. Playing/trading/discarding was not measured. |

## Do not turn these limits into malpaco rules

- Q-UI-16's 68 verified attack clicks across 20 runs include driver overhead.
  The 0.20–2.35 s durations and 2.25 s median are not animation durations,
  input latency or a recommended combat pause.
- Q-UI-13's 21 computer turns are a proxy derived from seven passes and three
  configured computer seats, not 21 individually identified complete turns.
- Q-UI-06 event timing remains incomplete. Recent raw attempts yielded terminal
  screens as large-change candidates; neither a flood/rebellion timing nor an
  event detector has been established. Do not derive event presentation timing.
- These UI observations do not establish card mechanics, balance, game length,
  fairness, font metrics or that Pro's exact graph should be copied.

The immediate useful deliverable is an explicit topology/geometry contract and a
before/after edge review alongside the map preview. Production implementation,
topology approval and further task scheduling stay with malpaco's owner/session.
