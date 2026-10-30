# Malpaco 0.5.1 — clearer commands and current instructions

Published **2026-10-30T19:51:24Z** from reviewed source
`2fec967d39d8cc0a367df47db5900708ccd12d3d`, after fresh re-review AGREE and
explicit owner publication approval. The owner deferred visual inspection until
after publication; visual acceptance is not claimed. See the
[publication receipt](PUBLICATION.md) and [provenance](PROVENANCE.md).

Web release scope: T150–T155, PRs #397, #399, #402, #403, #405 and #411.
The previous published baseline is [0.5.0](../0.5.0/PUBLICATION.md).

## Changes

- **World-event notices close automatically.** Storm, revolt, harvest and moved
  production-centre notices dismiss after three seconds of unpaused play. Manual
  close remains available. Pauses, menus and native background protect the
  deadline; resuming gives a fresh three seconds, and folded notices do not expire
  unseen. Required troop and card choices
  still need an explicit decision.
- **A maintained illustrated player manual.** Help links to the complete guide,
  which ships with the game and offline archive. Eight real browser illustrations
  cover setup, the map, attacks, capture, cards, events, results and phone controls.
  Help explains current cards, transfers, event timing and the running match's
  actual combat rule. The offline quickstart links to the same guide.
- **Choose Text or Icons and keep that choice.** Button labels are available on
  the launcher and in Settings. Text is the default; this display preference takes
  effect immediately and persists across turns, new games, reloads and screen
  sizes. Attack and Move retain the selected faces when one or both actions are
  legal. Labels and padding shrink on smaller screens while hit targets remain
  at least 44px. Phone Move and End turn glyphs are visible. Map tools, amount
  controls and Close retain their standard symbols.
- **Short launchers scroll as a whole.** Very short windows keep Start/Resume
  first and scroll the whole launcher card. Focusing a setting reveals its label
  and control together. Taller windows retain the internal settings scroller.
  Fresh, saved and configure-new flows keep explicit starts and exact resume.

## Compatibility and boundaries

The new button choice is a browser display preference, separate from match rules.
Other settings still apply to the next game. Combat, income, AI, world-event
probabilities, saved-match formats and recorded histories retain their 0.5.0
behavior. Defender wins ties remains the new-game default; Legacy rerolls remain
available. Existing games, scores and next-game preferences are preserved.

This release adds no native delivery, sound, personalities or balance policy.
Earlier review and reliability follow-ups remain separate. Browser assertions
and coordinator screenshot inspection do not establish owner visual acceptance,
physical-device testing or screen-reader coverage. Prior 0.5.0 publication
authorization does not authorize this release.

Published tags, archives and historical publication records remain unchanged.
Publication uses the accepted candidate's verified CI bytes without rebuilding.
