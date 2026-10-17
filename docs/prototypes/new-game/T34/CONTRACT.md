# Seeded partial geography

The construction uses our reviewed T64 geographical witness, not predecessor geometry. `witness-provenance.json` pins the source. `prepare-witness.mjs` strips all ownership, armies, production, sea adjacency and bonuses, normalizes common edge pieces and inserts the existing ports as vertices. The resulting data is a pure constant; generation reads no files or clock. All exported coordinates are integers in units of 1/2048 CSS px, exactly preserving the witness's dyadic port coordinates.

`generateIslandGeography(seed, {attempts})` produces either an explicitly versioned partial geography or recoverable exhaustion. It never returns a playable `GameMap`. T35 consumes the entrance reservations to construct actual sea adjacency and bonuses; T36 owns new-game/UI integration and the 1,000-seed measure. Existing rules, default reference board, historical generation, saves and RNG streams are untouched.

The seeded construction changes two eligible internal contacts through local T1 exchanges: an old pair loses a short shared edge and the opposite pair gains one. Four land-adjacency patterns result from these two choices. Land edges are independently re-derived from positive shared boundaries. Country/island IDs and sizes remain stable. This bounded constructive family does not sample arbitrary planar graphs or every possible island arrangement.

Each attempt first selects one of three retained placement plans: the reference arrangement, a swap of the top central3-country island with the bottom central10-country island, or a swap of the middle central5-country island with that10-country island. Destinations of reserved crossings follow the spatial slots; actual entrance countries and exposed ports are reconstructed jointly. The14-route variant drops one parallel island-pair reservation; other plans keep15.

A shared seeded monotone piecewise-linear warp changes both axes across the whole arrangement, followed by a whole-board reflection. Four intervals sample up to48px of expansion each, then normalize to the original global extent with integer rational arithmetic. This changes silhouette proportions and spacing while preserving island separation. All primitive shared edges are transformed canonically and split at warp knots, so opposite countries use identical boundary pieces. After placement, a bounded label search visits integer offsets within24px over three passes, preserving the existing hit and selected-label clearances. Invalid or short reserved routes search alternative entrance countries and uniquely attached ports on the intended islands over three passes. Unique country pairs, degree/bonus headroom and the existing T24 single-entry fortress/concentration limits are checked before export. Placement and port reservations pass or fail together; failed candidates are never relabelled as successes.

## Limits and provenance

| Value | Source |
| --- | --- |
| 46 countries; sizes 3,3,3,3,5,5,7,7,10; total degree 2–5 | Existing T24 approved parameters and T63 witness |
| 50 attempts; at least99% seeds | T24 approved generation objective, unchanged |
| Land degree at most4; at most2 corridor slots per country | Headroom for at least one sea edge under degree5; T24 crossing cap |
| 40px hit squares, 44px square label gap | T24 approved display budget |
| 44px horizontal / 47px vertical selected-name clearance | T64 retained native selected-label reservation |
| Unique exposed ports; 8px competing-country margin; whole12px inward landing | T62 approved attachment contract |
| No water/land contact; 10px unrelated-coast clearance; 20px span; 10px route separation | T62 approved water/traceability contract |
| Fixed-point precision2048, quarter-pixel T1 half-edge, three retained placement plans, four global warp intervals with up to48px sampled expansion then extent normalization,24px label search, three repair passes, reflections | **[designed]** Construction choices measured in this task; not inferred predecessor rules |

For those designed choices, the local search covered T24/T62/T63 and T64/T65 geometry studies. Reviewed upstream F022 leaves procedural construction unknown, as documented by T62. No predecessor asset, code or geometric table is used. The first broad-jitter draft and unrepaired77/100 sweep are retained; the algorithm was repaired without changing a constraint. Core coordinates and predicates use integer arithmetic. Warp cuts are exact BigInt rational fractions rounded once to the integer output grid; squared-distance comparisons use BigInt products. This avoids fractional intermediate coordinates and precision loss in large squared products. No game-rule probability/value is introduced.

Failure records contain every rejected candidate and constraint class. The generator uses one continuous `DeterministicRng` stream per call, including retries, and returns its snapshot. Same seed and budget reproduce geometry, failure history and RNG exactly; each call returns fresh vectors. The zero-attempt path returns exhaustion without constructing a board.

`acceptance.mjs` independently reconstructs a diagnostic scene from partial data and reservations, delegates to the unchanged T62/T24 checker and verifies partial-data boundaries, integer coordinates and headroom. Its temporary bonuses/sea lanes exist only in diagnostic data; the core API never exports them. Source omission controls and independent review rerun the actual implementation. Successful sweep data proves the measured family and seeds, not universal feasibility or owner appearance approval.

The32-seed breadth corpus requires the10-country island both inside and outside the middle vertical third and at least5% aspect-ratio variation for an island. These designed measurements factor out whole-board reflections and fixed-point jitter. The sweep also requires every exported success to pass the independent oracle: the99% objective permits explicit exhaustion, never an invalid exported success. The mirror-normalized gallery uses the unmoved island7 as its orientation anchor and shows all three actual placement plans. This remains a bounded witness family rather than arbitrary planar geography.


The designed placement offsets come from a bounded manual search, not a translation-grid search or predecessor reconstruction. The retained historical `plan-search-_40qktwo` archive contains the top/bottom swap, fourteen-route swap and middle/bottom swap probes with the exact offsets; `family-provenance.json` names the inputs searched and the later six-/100-seed validation. The14-route variant is **designed and locally validated** under the approved T24 numerical budget. The unchanged source comment “Approved14-route plan” refers to that validated budget fit; it does not establish separate owner approval of this placement or final visuals.

The witness remains a production input imported from `docs/prototypes/new-game/T34/witness.json`. Moving or pruning that path requires preserving this dependency; this bounded test/docs-only rework does not relocate it.
