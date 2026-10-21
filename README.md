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

The map fills the screen and only corner icons rest on it: the menu top-left (your cards, totals, history, the event log, speed, save and load), **Pause** top-right, **Fit** bottom-left, and bottom-right the information icon (objective and progress) with the legal phase action: **Start combat**, **Move armies** or the flag for **End turn**, which also skips a move. While you place armies, the pool shows as an icon and a number at the top. A short notice says whose turn it is, or what the last exchange did, and goes away once you act. Choices appear as small cards beside the map: selecting a target shows Attack, Fight on and Cancel (the settings icon sets where Fight on stops), and a capture or move shows a preview with −, the amount, + and confirm. Folding a choice leaves a one-line card with a gold return icon. **Zoom** and **Focus** appear once you zoom or select a country. Press Escape to close a card; the result card closes from the top-right corner.

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
