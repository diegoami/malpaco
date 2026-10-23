# Malpaco 0.2.1

Opening Malpaco now drops you straight into a game, and the screen holds only what you need to play.

## New

- **A game at once.** The page opens on a game: you against three computers, a random seed,
  Domination on. A refresh, or a later visit in the same browser, continues it.
- **New game** asks "Give up this game?", shows where everyone stood, then starts a fresh game.
- **Scoreboard** behind the trophy in the menu: played, won, lost, given up, the win rate, and
  your last 20 games. Each game counts once.
- **Fight and Move on your country.** Select one of your countries: **Fight** appears on it if it
  can attack, **Move** if it can only move armies. Press Fight, tap an enemy, and one round is
  fought; press again for another. Placing your last army starts combat by itself.
- **Your cards.** The card icon by the menu shows how many you hold and opens them, drawn as cards
  with a plain symbol: 5, 8 or 15 armies, ×2 for doubling your pool, a bomb to raid, a crossed bomb
  to block a raid, a star for the wild card. Play a set from there at the start of your turn. After
  each draw, your whole hand is shown with the new card marked.
- **Cards float over the map.** Every choice folds to a one-line chip and drags where you want it;
  the amount bar for a capture or a move opens beside that country, clear of both counts.
- **Quick, quiet computer turns.** One notice per computer turn, and only Pause, Fast-forward and
  the speed choice on screen. A round of three Normal computers takes about 8 seconds.
- **Seats by colour.** The computers are Orange, Green and Purple; you are You.

## Removed

- The setup screen, and Save and Load in the player's game (the game is kept in your browser).
- Fight on, the stop point and the odds line: Fight is one round per press.
- The Information icon (its objective is in Help) and the game history (add `?log` to the address
  to bring it back).
- Loading version-1 saves from the player's screen.

## Known limits

- Real-device checks are listed in `ACCEPTANCE.md`; the 0.2.0 phone read carries over.
- One computer can still run away with island bonuses; balanced starts come in 0.3.

## Play

<https://malpaco.netlify.app>, or download `malpaco-playable.tar.gz` from this release, extract it,
and run `node serve.mjs` (Node.js 22).
