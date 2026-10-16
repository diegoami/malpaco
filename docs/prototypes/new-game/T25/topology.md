# Exact reference topology proposal

The baseline is the current playable seed-1994 graph, not the G visual draft. This reference preserves all 46 identities and island memberships but changes the edges listed below. Equal counts do not mean equal topology.

| Kind | Current | Proposed | Added | Removed |
| --- | ---: | ---: | ---: | ---: |
| Land | 61 | 61 | 28 | 28 |
| Sea | 16 | 16 | 14 | 14 |

Country degrees are 2–5; islands touch at most four neighbours. The complete proposed country graph has no articulation points or bridges. All five T24 fairness checks pass.

| Island | Current bonus | Recomputed bonus | Entrance countries |
| --- | ---: | ---: | ---: |
| North Isle | 3 | 3 | 2 |
| East Isle | 3 | 3 | 2 |
| West Isle | 3 | 3 | 2 |
| South Isle | 3 | 3 | 2 |
| Central Isle | 5 | 5 | 3 |
| Harbor Isle | 4 | 5 | 3 |
| Palm Isle | 5 | 6 | 3 |
| Cliff Isle | 5 | 5 | 2 |
| Great Isle | 7 | 9 | 4 |

Total bonuses change from 38 to 42, under the unchanged formula. Harbor changes 4→5, Palm 5→6 and Great 7→9. No production income rule changes.

## Land borders added

- Low moor ↔ Silver shore
- Low moor ↔ Low peak
- Lower field ↔ Wind port
- Lower field ↔ Low peak
- Wind gate ↔ Wind port
- Wind gate ↔ Gold point
- South reach ↔ South ridge
- South reach ↔ New rock
- East ford ↔ Silver point
- East ford ↔ Gold town
- East ford ↔ North ford
- Moon point ↔ New fell
- Fort town ↔ North wood
- Fort town ↔ Wind dale
- West haven ↔ Upper ridge
- Stone watch ↔ Upper ridge
- Silver point ↔ Rock bay
- Gold town ↔ Port ridge
- Wind port ↔ Gold point
- South ridge ↔ Red field
- Rock moor ↔ Marsh rest
- Rock moor ↔ Silver ford
- South fell ↔ High ridge
- North wood ↔ Iron field
- Red field ↔ New rock
- North ford ↔ Port ridge
- North ford ↔ Rock bay
- Marsh rest ↔ Wind dale

## Land borders removed

- Low moor ↔ Wind gate
- Low moor ↔ Gold point
- Lower field ↔ Gold point
- Wind gate ↔ Silver shore
- Bay ford ↔ South fell
- South reach ↔ East ford
- South reach ↔ Port ridge
- East ford ↔ Red field
- East ford ↔ Rock bay
- Moon point ↔ South fell
- Fort town ↔ Rock moor
- Fort town ↔ Marsh rest
- Fort town ↔ Silver ford
- Stone watch ↔ West haven
- Stone watch ↔ Marsh keep
- Silver shore ↔ Wind port
- Silver point ↔ North ford
- Silver point ↔ New rock
- Gold town ↔ Red field
- Gold town ↔ North ford
- Gold town ↔ Rock bay
- South ridge ↔ New rock
- South ridge ↔ Port ridge
- Rock moor ↔ Wind dale
- Red field ↔ Port ridge
- North ford ↔ New rock
- Low peak ↔ Gold point
- Wind dale ↔ Silver ford

## Sea crossings added

- Lower field ↔ High shore
- Wind town ↔ South fell
- Wind town ↔ Port ridge
- Wind gate ↔ Red field
- Bay ford ↔ New glen
- West haven ↔ New fell
- Stone watch ↔ South rest
- Stone watch ↔ Red field
- New fell ↔ Dark ford
- South fell ↔ Marsh keep
- South rest ↔ Silver ford
- River keep ↔ North rest
- New rock ↔ Gold point
- River gate ↔ Wind dale

## Sea crossings removed

- Lower field ↔ Iron point
- Wind town ↔ Bay ford
- Wind town ↔ North town
- Bay ford ↔ Gold point
- South reach ↔ South rest
- Moon point ↔ North wood
- West haven ↔ New glen
- North town ↔ River gate
- South rest ↔ New glen
- Iron point ↔ Blue peak
- Wind dale ↔ Dark ford
- Wind dale ↔ Rock bay
- River gate ↔ Dark ford
- Gold point ↔ North rest

## Proposed sea pairs

- Lower field ↔ High shore
- Wind town ↔ South fell
- Wind town ↔ Port ridge
- Wind gate ↔ Red field
- Bay ford ↔ New glen
- West haven ↔ New fell
- West haven ↔ North rest
- Stone watch ↔ South rest
- Stone watch ↔ Red field
- New fell ↔ Dark ford
- South fell ↔ Marsh keep
- South rest ↔ Silver ford
- River keep ↔ North rest
- New rock ↔ Gold point
- Marsh keep ↔ Rock bay
- River gate ↔ Wind dale

The full machine-readable diagnostics include every edge, degree, current/proposed entrance set, and global/per-island articulation points and bridges: [topology.json](topology.json).
