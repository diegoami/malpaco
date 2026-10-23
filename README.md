# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*, built in
TypeScript: a pure rules core, an SVG map, and a DOM and CSS UI. Its design comes from the reviewed
findings of [isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology). It restarts
from the TypeScript spike of [malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc),
the archived Godot proof of concept.

How work is done here: [CLAUDE.md](CLAUDE.md) and [docs/process.md](docs/process.md). Tasks:
[docs/tasks/](docs/tasks/README.md).
Task status lives in GitHub issue labels.

## Play Malpaco 0.2.1

[Play in your browser](https://malpaco.netlify.app), or download the
[0.2.1 playable archive](https://github.com/diegoami/malpaco/releases/tag/v0.2.1).
The [play instructions](docs/play.md) explain the controls and local launcher;
[release notes](docs/releases/0.2.1/RELEASE-NOTES.md) describe this release.

The page opens straight into a game: you against three Normal computers on a random
map. Your game, pause state and speed are kept in this browser and resume on refresh.
**New game** in the menu asks before giving up the current game. The menu's trophy
opens your scoreboard. There is no account or sync between devices.

Place your reinforcements; placing the last army starts combat. Select your country,
press **Fight**, then tap an adjacent enemy for one exchange. Press **Fight** again
for another. After a capture, choose how many armies to move and confirm. You can
make one friendly move per turn. Your cards are behind the card icon beside the menu;
capture a territory and finish the turn to earn a card.

Choices float over the map, fold to a chip and drag where you want them. **Pause**,
**Fast-forward** and the speed control set the pace; computer turns run automatically.
The main game hides history; `?log` brings it back.

For development, run `npm ci` and `npm run dev`. `?seed=1994` fixes geography, deal
and dice and keeps its own game. `?setup` opens the development setup and file controls;
`?view=reference-game` opens the fixed Nine Isles board. Legacy generated views are
available in the source development build and retired in the published archive.

## Development watching

`npm run dev` uses the committed Vite configuration to exclude this checkout’s
`.cache` directory, which can otherwise consume large numbers of filesystem
watches. The exclusion is anchored to this checkout,
so source, data, public assets and tests still update when the checkout itself
lives under another `.cache` directory. Vitest watch mode retains test reruns.

## Shareable build

Run `npm run package:playable` to rebuild and package the game as
`release/malpaco-playable.tar.gz`. The [play instructions](docs/play.md) explain
how to run the extracted build without the source checkout or npm dependencies.
