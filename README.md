# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*, built in
TypeScript: a pure rules core, an SVG map, and a DOM and CSS UI. Its design comes from the reviewed
findings of [isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology). It restarts
from the TypeScript spike of [malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc),
the archived Godot proof of concept.

How work is done here: [CLAUDE.md](CLAUDE.md) and [docs/process.md](docs/process.md). Tasks:
[docs/tasks/](docs/tasks/README.md).
Task status lives in GitHub issue labels.

## Play Malpaco (web)

[Play in your browser](https://malpaco.netlify.app), or download the
[latest published playable archive](https://github.com/diegoami/malpaco/releases/latest).
The [illustrated player manual](docs/play.md) explains every phase, cards, events,
controls and settings. Open **Full player manual with screenshots** in Help during
play, or run `npm run manual:refresh` for a portable copy. The
[maintenance guide](docs/manual-maintenance.md) keeps it and inline Help current;
[0.5.1 release notes](docs/releases/0.5.1/RELEASE-NOTES.md),
[publication receipt](docs/releases/0.5.1/PUBLICATION.md) and
[provenance](docs/releases/0.5.1/PROVENANCE.md) describe the published web release.

A fresh page offers Settings and Start. Saved games offer Resume first. Choose
Text or Icons for command buttons on the launcher or in Settings; the preference
applies immediately and survives turns, new games, reloads and resizes. Labels
scale with the screen while controls keep usable touch targets. Choose
1–3 Normal opponents, starting-army range, event frequency and 46/72/96-region maps
for the next game; changing Settings leaves the current match unchanged. Older
kept games retain their original options, rules and replay identity.

Place armies, then use ATTACK beside a selected country. Capture and friendly-move
panels have Min/Max, +/− and manual entry; only Confirm moves troops. The colour
tracker shows turn order and phase guidance while executed computer actions play
at a readable pace. Cards use army amounts/effects; draw notices close after three
unpaused seconds, while input choices still require an explicit decision.

New game asks before giving up; Settings holds the scoreboard, and ? opens Help.
Games and scores stay in this browser. The archive runs offline with Node 22+.
This release publishes the web game; Android production persistence and delivery
remain separate work. There is no account or cross-device synchronization.

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
