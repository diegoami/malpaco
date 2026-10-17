# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*, built in
TypeScript: a pure rules core, an SVG map, and a DOM and CSS UI. Its design comes from the reviewed
findings of [isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology). It restarts
from the TypeScript spike of [malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc),
the archived Godot proof of concept.

How work is done here: [CLAUDE.md](CLAUDE.md) and [docs/process.md](docs/process.md). Tasks:
[docs/tasks/](docs/tasks/README.md).
For session continuity, read the latest decisions in [RUN-NOTES.md](RUN-NOTES.md)
and query current GitHub issue labels; historical notes are not task status.

## Play

Run `npm ci` and `npm run dev`; open the root page to set up the Nine Isles game.
It defaults to one human against three Normal computers. Choose a seed, adjust
seat controllers if desired, and select **Start game**. `?seed=1994` fixes the deal;
`?view=reference-game&seed=1994` opens the same interface explicitly. **New game**
returns to this setup. Unrecognized `view` values also open this setup.

During combat, select a source and an adjacent enemy, then use **Single exchange**
or **Fight on**. After a capture, choose how many armies to move and confirm.
**Save game** downloads a match; **Load game** restores one.

Older generated setup/game and development routes remain available explicitly at
`?view=game-setup`, `?view=generated-game`, `?view=generated-prototype` and
`?view=authored-game` (the authored `small_sea` spike). Their older controls and
rules differ from the default game. The older generated setup retains its own
seed, seat and opponent query parameters and in-game help.

## Shareable build

Run `npm run package:playable` to rebuild and package the game as
`release/malpaco-playable.tar.gz`. The [play instructions](docs/play.md) explain
how to run the extracted build without the source checkout or npm dependencies.
