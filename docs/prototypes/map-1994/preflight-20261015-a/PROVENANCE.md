# T22 preflight evidence

The three JSON inputs are byte-for-byte copies of the parent-provided study
artifacts from `/tmp/malpaco-map-study` on 2026-10-15. Their SHA-256 hashes are
recorded alongside the files. They describe the seed-1994 generated map, the
two-human opening state, and an initial rotation-system probe.

The visual reference is the prior Malpaco implementation at
`malpaco-godot-poc@5fdd25c`, read-only: `game/board_view.gd` and
`data/maps/small_sea.json`. Its repository guidance was read from `CLAUDE.md`
and `PRINCIPLES.md`. This is our prior implementation, not source material
from the original game. The reference demonstrates connected country shapes,
quiet map framing, and coast-to-coast lane presentation.

The production state remains only evidence for identities, island membership
and bonuses, opening owners/armies, production-centre markers, and the current
land/sea graph. It is not the geometry source for the new visual geography.

`feasibility.mjs` independently enumerates cyclic neighbour orders for every
degree-three vertex of each island's land graph, computes face cycles, and
checks Euler's formula for a connected spherical embedding. It also checks
the known planar K4 and non-planar K3,3 graphs as controls. These are graph
feasibility results, not a promise that every current edge can be drawn as a
noncrossing route in the new geography.

Ambiguity probe confirmed from the copied state: Iron point (`province_41`)
has land borders to South rest (`province_2`) and High shore (`province_16`),
and sea lanes to Lower field (`province_10`) and Blue peak (`province_9`).
Silver shore has no sea lane. Thus Iron point/Silver shore is a visual
perception ambiguity, not a current gameplay edge. Lower field is a real
coastal sea-lane endpoint.
