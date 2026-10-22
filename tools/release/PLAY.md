# Play Malpaco 0.2.1

Run `node serve.mjs` from this folder, then open <http://127.0.0.1:4175> in a browser.

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

You are **You**; the three computers are named by their seat colours: **Orange**, **Green** and
**Purple** (in games with two or more humans every seat is its colour). Saved games keep `Seat N`.

During your turn, place reinforcements on your territories,
then choose **Start combat**. Select one of your territories, then an adjacent enemy:
that only chooses the target. **Fight** rolls one exchange each time you press it; nothing
continues on its own, and **Cancel** drops the target. Clicks, Enter/Space, touch and the
Countries list all work the same way. After capturing a territory, choose the army amount with
−, + and **Confirm**; until then the two countries' counts are dashed.
On the map, your selected country has a solid gold outline, the countries it can attack a dashed
light one, and the chosen target a solid light outline with a crosshair round its count, so none of
them relies on colour alone. Counts never draw smaller than 14 px; stacks over 999 show as 1.2k or
23k, and the country's spoken name keeps the exact number.
You can make one adjacent friendly move per turn: **Move armies**, then a source and an own
neighbour, then −, the amount, + and **Confirm** (or **Cancel**). Computer turns run automatically,
and while a computer plays no choice or action is on screen.

Cards are enabled in normal games with zero or one human seat. Hands start empty.
Capture a territory and finish your turn to earn a card; the reward says which card you drew,
with **Continue**. A card choice opens by itself and holds only its buttons: one per set you can
trade, plus **Skip**; one per card when a full hand must discard before drawing (the new card
stays hidden until then). A Raid folds its card to a one-line strip so the whole map is free: tap
a highlighted enemy country, or choose one from **Countries**, then **Confirm**.
Games with two or more human seats currently play without cards.

**Pause** stops play, and **Game speed** in the menu slows computer turns. While computers play,
their notice stays under **Pause** with a gold **Fast-forward** icon, which plays the computer seats
without waiting until your turn (the moves are the same). On your turn, the notice's history icon
opens the full event log at the other seats' actions since your last turn, marked. The menu's
smaller history icon opens the whole **Game event log**; close it with ×, Escape or a swipe.

The map fills the screen and only corner icons rest on it: the menu top-left (game speed, **Help &
icon names**, **New game** and the history icon), **Pause** top-right, **Fit** and **Countries**
bottom-left, and bottom-right the legal phase action: **Start combat**, **Move armies** or the flag
for **End turn**, which also skips a move. While you place armies, the pool shows as an icon and a
number at the top. Only these icons frame the map: cards and notices float over it and never shrink
it. A slim notice under the top icons says whose turn it is: tap it for a hint, swipe it or tap × to
dismiss it; it fades after a few seconds, except an illegal-move reason or a computer's turn. A
choice appears as a small card in a bottom corner, and moves to the other side when it would cover
the countries in play. Escape folds a choice to a one-line strip with a gold return icon. **Zoom**
and **Focus** appear once you zoom or select a country. **Countries** lists every country by island,
or only the ones you can use now: choosing one places an army, selects it or marks it as the
target, but never attacks; **Inspect** shows a country's owner, armies, island bonus and neighbours,
with **Focus** to frame it. The list opens only from its icon. A tap that touches more than one
country asks which one you meant.

**Help & icon names** in the menu gives the objective and your progress, explains how the game
plays and names every icon. The result card shows the winner and reason with **New game**;
**Standings** and **Details** (seed, options and the record) open on request, and a round-limit
result says whether countries, armies or turn order decided it.

The game fits phones and tablets in either orientation as well as desktops: it is tested from
320×568 to 1920×1080, at 200% and 400% browser zoom and with notch insets. Real-device and
screen-reader checks are listed in `docs/releases/0.2.0/DEVICE-REPORT.md` (carried over to 0.2.1). Online multiplayer and
cross-device save synchronization are not supported.
