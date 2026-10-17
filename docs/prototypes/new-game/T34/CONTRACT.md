# Seeded partial geography

The construction uses our reviewed T64 geographical witness, not predecessor geometry. `witness-provenance.json` pins the source. `prepare-witness.mjs` strips all ownership, armies, production, sea adjacency and bonuses, normalizes common edge pieces and inserts the existing ports as vertices. The resulting data is a pure constant; generation reads no files or clock. All exported coordinates are integers in units of 1/2048 CSS px, exactly preserving the witness's dyadic port coordinates.

`generateIslandGeography(seed, {attempts})` produces either an explicitly versioned partial geography or recoverable exhaustion. It never returns a playable `GameMap`. T35 consumes the entrance reservations to construct actual sea adjacency and bonuses; T36 owns new-game/UI integration and the 1,000-seed measure. Existing rules, default reference board, historical generation, saves and RNG streams are untouched.

The seeded construction changes two eligible internal contacts through local T1 exchanges: an old pair loses a short shared edge and the opposite pair gains one. Four land-adjacency patterns result from these two choices. Land edges are independently re-derived from positive shared boundaries. Country/island IDs and sizes remain stable. This bounded constructive family does not sample arbitrary planar graphs or every possible island arrangement.

Each island receives a seeded monotone piecewise-linear warp in both axes, placement jitter, and a shared whole-board reflection. All primitive shared edges are transformed canonically and split at warp knots, so opposite countries use identical boundary pieces. After placement, invalid or short reserved routes search alternative uniquely attached ports on the intended countries. Placement and port reservations pass or fail together; failed candidates are never relabelled as successes.

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
| Fixed-point precision2048, quarter-pixel T1 half-edge, four warp intervals, at most0.5px expansion per interval and1px placement jitter, reflections | **[designed]** Construction choices measured in this task; not inferred predecessor rules |

For those designed choices, the local search covered T24/T62/T63 and T64/T65 geometry studies. Reviewed upstream F022 leaves procedural construction unknown, as documented by T62. No predecessor asset, code or geometric table is used. The first broad-jitter draft and unrepaired77/100 sweep are retained; the algorithm was repaired without changing a constraint. Core coordinates and predicates use integer arithmetic. Warp cuts are exact BigInt rational fractions rounded once to the integer output grid; squared-distance comparisons use BigInt products. This avoids fractional intermediate coordinates and precision loss in large squared products. No game-rule probability/value is introduced.

Failure records contain every rejected candidate and constraint class. The generator uses one continuous `DeterministicRng` stream per call, including retries, and returns its snapshot. Same seed and budget reproduce geometry, failure history and RNG exactly; each call returns fresh vectors. The zero-attempt path returns exhaustion without constructing a board.

`acceptance.mjs` independently reconstructs a diagnostic scene from partial data and reservations, delegates to the unchanged T62/T24 checker and verifies partial-data boundaries, integer coordinates and headroom. Its temporary bonuses/sea lanes exist only in diagnostic data; the core API never exports them. Source omission controls and independent review rerun the actual implementation. Successful sweep data proves the measured family and seeds, not universal feasibility or owner appearance approval.
