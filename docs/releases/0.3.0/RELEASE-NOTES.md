# Malpaco 0.3.0 — web release

## Play

[Play in your browser](https://malpaco.netlify.app), or extract the release's
`malpaco-playable.tar.gz` and run `node serve.mjs` with Node 22 or newer. The archive
contains the game and its assets; playing locally needs no package installation
or network connection.

## What changed

- Fresh entry offers Settings and Start. Kept matches offer Resume first, and
  cancelling replacement returns to the original map without applying new settings.
- Choose 46/72/96-region maps and 1–3 Normal opponents for the next game. Larger maps
  add islands and numbered territories; zoom remains available on dense boards.
- New-game starting ranges1–2/1–3/1–4 use equal aggregate seat budgets apart from
  unavoidable integer differences. Recurring territory income is fixed at one army
  per three countries, rounded down with minimum 2, plus complete-island bonuses.
- Production centres and deterministic Harvest/Shift/Storm/Revolt effects have
  Off/Rare/Normal/Often next-game settings. These are designed Malpaco rules; older
  matches retain their original factories, options and event behavior.
- A public colour tracker, Your turn arrow and phase guidance accompany readable
  executed computer placements, fights, captures and friendly transfers.
- Main actions use Ubuntu Bold text and role colours, with question-mark Help and
  compact utility icons. Sea connections are solid. Ordinary attacks use ATTACK
  beside the source country instead of a redundant Fight popup.
- Capture and friendly-move panels have Min/Max draft shortcuts, +/− and manual
  entry. Only Confirm transfers armies; closing or folding never commits an amount.
- Cards show 5/8/15-army values or effects. Draw notices close after three unpaused
  seconds or X; drawing alone grants no immediate army bonus. World notices wait
  for explicit dismissal, and troop/card choices retain their explicit decisions.
- Local games, paused state, pending choices and scoreboard records continue under
  their original saved identities. New-game Settings never rewrite the active match.
- The Vite development dependency is patched to 8.3.5.

## Scope and compatibility

This is the browser/offline-web release. The separate balanced-deal/halved-island-
bonus experiment is not adopted. Android production storage, signing, device
acceptance and APK delivery remain separate work; no Android APK ships here.

There is no account, online multiplayer or cross-device sync. Existing production
browser storage stays on the same Netlify origin. Saved matches keep their original
rules and map identity; opening Settings does not silently upgrade them.

Automated Chromium checks cover the declared viewport, zoom and safe-area cases.
Historical physical-device reports do not certify this release's changed controls
or broad Android/WebView compatibility. Larger-map long-game and combined-economy
investigations remain separately tracked in #295/#299; no human-win-rate claim is made.

The candidate, checks, independent milestone verdict or explicit owner waiver,
exact CI artifact, deploy hashes and rollback are recorded in the release's
acceptance/provenance records and milestone issue before publication.
