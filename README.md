# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*, built in
TypeScript: a pure rules core, an SVG map, and a DOM and CSS UI. Its design comes from the reviewed
findings of [isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology). It restarts
from the TypeScript spike of [malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc),
the archived Godot proof of concept.

How work is done here: [CLAUDE.md](CLAUDE.md) and [docs/process.md](docs/process.md). Tasks:
[docs/tasks/](docs/tasks/README.md).
Task status lives in GitHub issue labels.

## Play Malpaco 0.1.1

[Play in your browser](https://malpaco.netlify.app).

Run `npm ci` and `npm run dev`; open the root page to set up generated islands.
It defaults to one human against three Normal computers. Choose a seed, adjust
seat controllers if desired, and select **Start game**. `?seed=1994` fixes geography, deal and dice;
`?view=reference-game&seed=1994` keeps the fixed Nine Isles compatibility game. **New game**
returns to this setup. The generated map prepares before play begins. Unrecognized `view` values also open this setup.

During combat, select a source, then activate an adjacent enemy for one exchange.
Shift-click selects without attacking for **Single exchange** or **Fight on**. After a capture, choose how many armies to move and confirm.
**Save game** downloads a match; **Load game** restores one. A failed load leaves the current game available.

Normal games with at most one human seat include cards. Capture a territory and
finish the turn to earn a card, then use **View your hand** to see your choices.
Games with multiple human seats use ordinary rules. **Pause**, **Game speed**,
**Panel detail** and **Game event log** control pacing and information.

The map fills the screen. Small chips in the top corner show whose turn it is, the phase (tap it for **Phase details**) and, while placing, the armies left to place. The icon rail holds the legal phase actions (**Start combat**, **End turn**, **Move armies**, battle commands), **Current choice**, **Cards**, **Totals and history**, **Game settings**, **Pause** and **Game event log**. Each opens a card over the map, which moves the map beside it; speed, save and load are in Game settings. A required choice opens Current choice by itself and keeps a highlighted icon until it is made. Press Escape or **Return to map** to close a card.

Older generated setup/game and development routes remain available explicitly at
`?view=game-setup`, `?view=generated-game`, `?view=generated-prototype` and
`?view=authored-game` (the authored `small_sea` spike). Their older controls and
rules differ from the default game. The older generated setup retains its own
seed, seat and opponent query parameters and in-game help.

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
