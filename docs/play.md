# Malpaco playable build

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

Opening a fresh page shows Settings. Press **Start game** when ready: by default you play against three Normal computers on a random seed, with
Domination on and no round limit. Islands and territories take real island and town names from one
region (Mediterranean, Caribbean, Scandinavian islands, Malaysia and Indonesia, or Pacific), chosen by
the seed; names never change the map or play. The game is kept in this browser after each of your
actions and the computers' committed actions, so a refresh or later visit offers **Resume saved game**, with any open choice (a capture, a card choice or an army-reduction target)
still open, with a paused game waiting for explicit Resume. Nothing leaves this
browser: there is no account, server or sync between devices. **Settings** at top left
chooses 1, 2 or 3 computer opponents for your next game (3 by default). Changing
this setting keeps your current game exactly as it is; a refresh offers Resume for it.
These settings take effect only when you choose **New game**. **Starting armies**
chooses **1–2, 1–3 or 1–4** per country (default 1–3), with equal aggregate seat budgets
and only unavoidable integer differences. New games use fixed territory income:
owned countries divided by 3, rounded down with minimum 2, plus island bonuses.
**Disasters and production** offers Off/Rare/Normal/Often (default Normal).
Existing games retain their original rules, including older configured income rates.
**New game** asks "Give up this game?", shows
where the seats stood, then opens Settings with **Start game**.
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
appears **ATTACK** if it can attack, or **Move** if it can only move armies. Press **ATTACK**, then
tap an adjacent enemy: one round is fought; press **ATTACK** again for another. Selecting another
territory moves the button there. Without **ATTACK**, tapping an enemy only chooses the target. **ATTACK** rolls one exchange each time you press it; nothing
continues on its own. Select another country to change the pair. Clicks, Enter/Space, touch and the
Countries list all work the same way. After capturing a territory, choose the army amount with
−, + and **Confirm** on the bar beside the captured territory; until then the two countries'
counts are dashed.
On the map, your selected country has a solid gold outline, the countries it can attack a dashed
light one, and the chosen target a solid light outline with a crosshair round its count, so none of
them relies on colour alone. Counts never draw smaller than 14 px; stacks over 999 show as 1.2k or
23k, and the country's spoken name keeps the exact number.
You can make one adjacent friendly move per turn: **Move armies** (or **Move** beside a selected
territory), then a source and an own neighbour, then −, the amount, + and **Confirm** (or **Cancel**).
Confirming the friendly move ends your turn. Computer turns run automatically at a readable pace:
placements show their count progression, fights mark the two countries, and captures and friendly
moves show the executed troop transfer. The turn arrow reaches your colour after the final effect.

Cards are enabled in normal games with zero or one human seat. Hands start empty.
Capture a territory and finish your turn to earn a card; the notice says, for example,
**You drew 8 armies**. It closes after three seconds of unpaused play, or immediately with X.
Drawing does not grant an immediate army bonus: play a set to receive its effect.
A card choice opens by itself and holds only its buttons: one per set you can
trade, plus **Skip**; one per card when a full hand must discard before drawing (the new card
stays hidden until then). An army-reduction choice folds to a one-line strip so the whole map is free: tap
a highlighted enemy country, or choose one from **Countries**, then **Confirm**.
Games with two or more human seats currently play without cards.
Your cards are behind the CARDS button next to Settings, which shows how many you hold: it opens
them, drawn as cards with a plain symbol for what each does (5, 8 or 15 armies for a set, ×2 to
double your pool, a bomb to reduce an enemy stack, a crossed bomb for protection, a star for any value), and
closes with ×, Escape or another tap. Drag the window by its title; it stays where you put it. At the start of your turn a set can be played
from that list (or from the set card that opens by itself). After each draw, the card shows your
whole hand with the new card marked.
The placement badge spells out **N ARMIES** (**1 ARMY**) in the active human player's colour.

Important actions use raised uppercase Ubuntu Bold text and role colours; familiar utility controls use compact icons. New game, Settings and the question-mark Help button stay at top left,
with a readable colour turn tracker below them. Settings opens directly below its button.
Computer turns show placement, combat and movement at a fixed readable pace. The map
has no Pause, fast-forward or speed toolbar. Settings and Help pause play while open;
after an Android interruption, use RESUME in the tracker. Closing a dialog cannot
release that background pause.

FIT and COUNTRIES sit at the map edge. Required capture/move amounts and card choices
open their own cards; ordinary attacks use ATTACK beside your source country. X closes
event/card-draw information and continues without another acknowledgement; troop
amounts still require the Confirm check mark. The
map remains pannable and zoomable while you inspect it. Help explains the rules and settings.
The result card shows the winner and reason with **New game**;
**Standings** and **Details** (seed, options and the record) open on request, and a round-limit
result says whether countries, armies or turn order decided it.

The **Scoreboard** (the trophy in Settings) keeps, in this browser, how many games you played, won, lost
and gave up, your win rate, and your last 20 games, newest first: the date, the result, the rounds,
your countries at the end and the seed. A game counts once, when it ends: a win, your elimination
(Lost at once, even if you then watch the computers), or giving up with **New game**. The result
card shows the updated totals, for example "Won 3 · Lost 2 · Gave up 1". **Reset** asks "Clear the
scoreboard?" first. `?setup`, manual and Nine Isles games never count.

The game fits phones and tablets in either orientation as well as desktops: it is tested from
320×568 to 1920×1080, at 200% and 400% browser zoom and with notch insets. Real-device and
screen-reader checks are listed in `docs/releases/0.2.0/DEVICE-REPORT.md` (carried over to 0.2.1). Online multiplayer and
cross-device save synchronization are not supported.

## Developer balance experiment

From a source checkout, `node tools/balance/run.mjs --deal-seeds 500 --game-seeds 200
--out artifacts/T105-comparison` compares the frozen 0.3 experimental deal/bonus
candidates against the 0.2.1 core policy. Pass the command on one line. Each run needs
a fresh output directory and writes raw deals/games, a summary and source/bundle
hashes there. It does not change the playable game's rules or saved games. The
protocol and interpretation limits are in [the 0.3 plan](plans/release-0.3.md) and #273.

Settings contains the choices; their explanations are in Help.

Production centres are starred while events are on. **Harvest** adds up to the
current stack or 10 armies per centre, whichever is smaller. **Shift** redraws all
three centres. **Storm** reduces a connected group of 3–4 stacks, keeping at least 1
army each. **Revolt** changes one border country's owner without changing its armies
or eliminating a seat. Events are protected in the first round, near a win, after
another event and during the last three rounds of a round-limit game.

An event card lists exact before/after changes and waits for an explicit dismissal.
X, Back or Escape acknowledges it and continues in one action. Troop and card choices
still require their explicit decision; closing an amount card never commits armies.
Pending presentation survives reload. Acknowledgement never resumes a game paused
by backgrounding: use Resume explicitly. Off hides centres and consumes no event
draws. Instructions belong in Help; Settings contains the choices.

The held larger-map preview also offers Map size46/72/96 in Settings. Larger
presets add islands, use numbered names and apply only at New game.
The top-left turn tracker lists player colours, regions and public card counts.
Its arrow stays with the computer while its action finishes, then points at your
colour with **Your turn**. Guidance changes through **Place armies**, **Execute
attacks** and **Move armies**. The move hint is a conservative stack comparison;
it never prevents a legal riskier attack. New computer placement, combat and troop
transfers are shown on the regions at a readable pace. Presentation does not change the rules. Opening Settings or Help finishes the current
paint and pauses further play; Android interruptions require explicit Resume.
