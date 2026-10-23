# Play Malpaco 0.2.1

Run `node serve.mjs` from this folder, then open <http://127.0.0.1:4175> in a browser.

New games grow their own geography: 7–10 irregular islands sharing 46 territories, different for every seed. Saved games keep the generator they were made with.
The seed fixes the geography, deal and dice sequence.

Opening the page starts a game at once: you against three Normal computers on a random seed, with
Domination on and no round limit. Islands and territories take real island and town names from one
region (Mediterranean, Caribbean, Scandinavian islands, Malaysia and Indonesia, or Pacific), chosen by
the seed; names never change the map or play. The game is kept in this browser after each of your
actions and each computer's turn (a refresh in the middle of a computer's turn replays that turn,
the same moves), so a refresh or a later visit continues it, with any open choice (a capture, a card choice or a Raid)
still open, at the game speed you chose, and paused if you left it paused. Nothing leaves this
browser: there is no account, server or sync between devices. **Settings** in the menu
chooses 1, 2 or 3 computer opponents for your next game (3 by default). Changing
this setting keeps your current game exactly as it is; a refresh still resumes it.
These settings take effect only when you choose **New game**. Replenishment
chooses **1 army per 1, 3, 5 or 7 regions**: owned regions divided by that number,
rounded down, with a minimum of 2 base armies. Island bonuses are added separately.
The default remains 1 per 3 regions; existing games keep their original rule. **New game** in the menu asks "Give up this game?", shows
where the seats stood, then starts a new random game; after a result it starts at once.
Hidden routes for tests and bug reports: `?seed=N` plays seed N, kept and resumed per seed by the
same address (it never replaces the kept game),
`?setup` opens the older setup screen with its seats, options and Save and Load files,
`?view=reference-game` opens the fixed Nine Isles board, and `&log` (or `?log`) on any of them
brings back the game history: the menu's history icon, **History** on the result card and, on your
turn, the notice's icon for the other seats' actions since your last turn.

You are **You**; the three computers are named by their seat colours: **Orange**, **Green** and
**Purple** (in games with two or more humans every seat is its colour). Saved games keep `Seat N`.

During your turn, place reinforcements on your territories,
and combat starts by itself once the last army is placed. Select one of your territories: on it
appears **Fight** if it can attack, or **Move** if it can only move armies. Press **Fight**, then
tap an adjacent enemy: one round is fought; press **Fight** again for another. Selecting another
territory moves the icon there. Without **Fight**, tapping an enemy only chooses the target. **Fight** rolls one exchange each time you press it; nothing
continues on its own, and **Cancel** drops the target. Clicks, Enter/Space, touch and the
Countries list all work the same way. After capturing a territory, choose the army amount with
−, + and **Confirm** on the bar beside the captured territory; until then the two countries'
counts are dashed.
On the map, your selected country has a solid gold outline, the countries it can attack a dashed
light one, and the chosen target a solid light outline with a crosshair round its count, so none of
them relies on colour alone. Counts never draw smaller than 14 px; stacks over 999 show as 1.2k or
23k, and the country's spoken name keeps the exact number.
You can make one adjacent friendly move per turn: **Move armies** (or **Move** beside a selected
territory), then a source and an own neighbour, then −, the amount, + and **Confirm** (or **Cancel**). Computer turns run automatically
and quickly: a round of three Normal computers takes about ten seconds. Each computer's turn shows
one notice, such as "Orange's turn", while its counts and colours change on the map; its moves are
not staged or outlined.

Cards are enabled in normal games with zero or one human seat. Hands start empty.
Capture a territory and finish your turn to earn a card; the reward says which card you drew,
with **Continue**. A card choice opens by itself and holds only its buttons: one per set you can
trade, plus **Skip**; one per card when a full hand must discard before drawing (the new card
stays hidden until then). A Raid folds its card to a one-line strip so the whole map is free: tap
a highlighted enemy country, or choose one from **Countries**, then **Confirm**.
Games with two or more human seats currently play without cards.
Your cards are behind the card icon next to the menu, which shows how many you hold: it opens
them, drawn as cards with a plain symbol for what each does (5, 8 or 15 armies for a set, ×2 to
double your pool, a bomb to raid, a crossed bomb to block a raid, a star for the wild card), and
closes with ×, Escape or another tap. Drag the window by its title; it stays where you put it. At the start of your turn a set can be played
from that list (or from the set card that opens by itself). After each draw, the card shows your
whole hand with the new card marked.

The speed controls share the top-right corner: the **Game speed** choice (Slow and Very slow let
you watch every move), **Pause**, and, while computers play, a gold **Fast-forward** icon that plays
the computer seats without waiting until your turn (the moves are the same). While a computer
plays they are the only controls on screen; the menu, **Fit** and **Countries** come back on your
turn, or as soon as you pause.

The map fills the screen and only corner icons rest on it: the menu top-left (**Help & icon names**, **Settings**,
**New game** and the trophy for the **Scoreboard**), the speed controls top-right, **Fit** and **Countries**
bottom-left, and bottom-right the legal phase action: **Start combat**, **Move armies** or the flag
for **End turn**, which also skips a move. While you place armies, the pool shows as an icon and a
number at the top. Only these icons frame the map: cards and notices float over it and never shrink
it. A slim notice under the top icons says whose turn it is: tap it for a hint, swipe it or tap × to
dismiss it; it fades after a few seconds, except an illegal-move reason or a computer's turn. A
choice appears as a small card in a bottom corner, and moves to the other side when it would cover
the countries in play. Its fold icon shrinks it to a chip that keeps its title (tap the chip to
open it again), and you can drag it by the grip along its top or by its edge: later cards open where
you put it, in this browser, until you double-tap the grip or start a new game. Escape folds a
choice to a one-line strip with a gold return icon. **Zoom**
and **Focus** appear once you zoom or select a country. **Countries** lists every country by island,
or only the ones you can use now: choosing one places an army, selects it or marks it as the
target, but never attacks; **Inspect** shows a country's owner, armies, island bonus and neighbours,
with **Focus** to frame it. The list opens only from its icon. A tap that touches more than one
country asks which one you meant.

**Help & icon names** in the menu gives the objective and your progress, explains how the game
plays and names every icon. The result card shows the winner and reason with **New game**;
**Standings** and **Details** (seed, options and the record) open on request, and a round-limit
result says whether countries, armies or turn order decided it.

The **Scoreboard** (the menu's trophy) keeps, in this browser, how many games you played, won, lost
and gave up, your win rate, and your last 20 games, newest first: the date, the result, the rounds,
your countries at the end and the seed. A game counts once, when it ends: a win, your elimination
(Lost at once, even if you then watch the computers), or giving up with **New game**. The result
card shows the updated totals, for example "Won 3 · Lost 2 · Gave up 1". **Reset** asks "Clear the
scoreboard?" first. `?setup`, manual and Nine Isles games never count.

The game fits phones and tablets in either orientation as well as desktops: it is tested from
320×568 to 1920×1080, at 200% and 400% browser zoom and with notch insets. Real-device and
screen-reader checks are listed in `docs/releases/0.2.0/DEVICE-REPORT.md` (carried over to 0.2.1). Online multiplayer and
cross-device save synchronization are not supported.

The larger-map prototype adds **Map size** in Settings: 46, 72 or 96 regions.
Larger sizes add more islands and currently use numbered names. The choice
applies at the next New game; existing games keep their map. Use zoom for
closer inspection on a phone. The larger presets await appearance/playtesting
before release adoption.
