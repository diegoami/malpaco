# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*, built in
TypeScript: a pure rules core, an SVG map, and a DOM and CSS UI. Its design comes from the reviewed
findings of [isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology). It restarts
from the TypeScript spike of [malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc),
the archived Godot proof of concept.

How work is done here: [CLAUDE.md](CLAUDE.md) and [docs/process.md](docs/process.md). Tasks:
[docs/tasks/](docs/tasks/README.md).

## Play

Run `npm ci` and `npm run dev`; the root page opens generated-game setup. Choose a seed, seat
count and human or computer opponents, then start a match. `?seed=N`, `?seats=C` and
`?opponents=computer` preserve setup choices on the root route. Direct routes remain available at
`?view=game-setup`, `?view=generated-game`, `?view=generated-prototype` and
`?view=authored-game` (the authored `small_sea` spike). Unrecognized `view` values open setup.

Choose **How to play** during setup or **Help** during a generated match for an
in-game guide to setup choices, map labels, reinforcement and combat, turns,
computer turns, and saved matches. Opening help pauses computer automation until
the dialog closes; Close and Escape return focus to the control that opened it.
