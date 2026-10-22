# Malpaco 0.2.0 playable build

Create a self-contained release archive from the source checkout with:

```sh
npm run package:playable
```

The command rebuilds the game and writes `release/malpaco-playable.tar.gz` and
the ready-to-run `release/malpaco-playable/` directory. The archive contains no
source checkout or npm dependencies. Recipients need Node.js 22, but do not need
to install packages or connect to the network.

Extract the archive, change into `malpaco-playable`, and run:

```sh
node serve.mjs
```

Open <http://127.0.0.1:4175> in a browser. The launcher binds to the
loopback interface and serves the included files.

New games grow their own geography: 7–10 irregular islands sharing 46 territories, different for every seed. Saved games keep the generator they were made with.
The seed fixes the geography, deal and dice sequence.

Opening the page starts a game at once: you against three Normal computers on a random seed, with
Domination on and no round limit. Islands and territories take real island and town names from one
region (Mediterranean, Caribbean, Scandinavian islands, Malaysia and Indonesia, or Pacific), chosen by
the seed; names never change the map or play. The game is kept in this browser after every action,
so a refresh or a later visit continues it. **New game** in the menu asks "Give up this game?", shows
where the seats stood, then starts a new random game; after a result it starts at once.
Hidden routes for tests and bug reports: `?seed=N` plays seed N (and never replaces the kept game),
`?setup` opens the older setup screen with its seats, options and Save and Load files, and
`?view=reference-game` opens the fixed Nine Isles board.

During your turn, place reinforcements on your territories,
then choose **Start combat**. Select one of your territories, then an adjacent enemy:
that only chooses the target, and the card shows the chance of capturing it if you fight
to the end. **Attack** fights one exchange; after it, **Fight on** continues automatically
and **Stop** pauses it. Clicks, Enter/Space, touch and the Countries list all work the same way.
After capturing a territory, choose the army amount and **Confirm move-in**; until then
the two countries' counts are dashed.
On the map, your selected country has a solid gold outline, the countries it can attack a dashed
light one, and the chosen target a solid light outline with a crosshair round its count, so none of
them relies on colour alone. Counts never draw smaller than 14 px; stacks over 999 show as 1.2k or
23k, and the country's spoken name keeps the exact number.
You can make one adjacent friendly move per turn. Computer turns run automatically.

Cards are enabled in normal games with zero or one human seat. Hands start empty.
Capture a territory and finish your turn to earn a card; use **View your hand**
to see available choices. Resolve any required card choice before continuing.
A Raid folds its card to a one-line strip so the whole map is free: tap a highlighted enemy
country, or choose one from **Countries**, and the card returns with the preview and **Confirm raid**.
With a full hand you discard before drawing, and the new card stays hidden until then.
Games with two or more human seats currently play without cards.

Player totals show armies on the board. **Pause** stops play, and **Game speed**
slows computer turns. While computers play, their notice stays under **Pause** with a gold
**Fast-forward** icon, which plays the computer seats without waiting until your turn (the moves are
the same). On your turn, the notice's history icon, or **Changes since your turn** in the menu, opens
the full event log at the other seats' actions since your last turn, marked. **Panel detail** switches Compact/Detailed information.
The smaller battle log scrolls while retaining its history; **Game event log**
opens the full action history, including army gains, losses and unplaced armies.

The map fills the screen and only corner icons rest on it: the menu top-left (your cards, totals, history, the event log, speed and New game), **Pause** top-right, **Fit** bottom-left, and bottom-right the information icon (objective and progress) with the legal phase action: **Start combat**, **Move armies** or the flag for **End turn**, which also skips a move. While you place armies, the pool shows as an icon and a number at the top. A slim notice under the top icons says whose turn it is, or what the last exchange did: tap it for a hint, swipe it or tap × to dismiss it; it fades after a few seconds, except an illegal-move reason or a folded choice, which stays until you dismiss it or act. Choices appear as small cards beside the map: selecting a target shows Attack, Fight on and Cancel (the settings icon sets where Fight on stops), and a capture or move shows a preview with −, the amount, + and confirm. Folding a choice leaves a one-line card with a gold return icon. **Zoom** and **Focus** appear once you zoom or select a country. Beside **Fit**, **Countries** lists every country by island, or only the ones you can use now: choosing one places an army, selects it or marks it as the target, but never attacks; **Inspect** shows a country's owner, armies, island bonus and neighbours, with **Focus** to frame it. A tap that touches more than one country asks which one you meant. Press Escape to close a card; the result card closes from the top-right corner.

**Help & icon names** in the menu explains how the game plays and names every icon. The result card
shows the winner and reason with **New game**; **Standings** and **Details** (seed, options and the
record) open on request, and a round-limit result says whether countries, armies or turn order decided it.

The game fits phones and tablets in either orientation as well as desktops: it is tested from
320×568 to 1920×1080, at 200% and 400% browser zoom and with notch insets. Real-device and
screen-reader checks are listed in `docs/releases/0.2.0/DEVICE-REPORT.md`. Online multiplayer and
cross-device save synchronization are not supported.
