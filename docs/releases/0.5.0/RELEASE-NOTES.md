# Malpaco 0.5.0 — usability polish

Published 2026-10-28 from reviewed source `2f993c7d56e09e197942d091b4f81e44f4d29cd1`.
See [PUBLICATION.md](PUBLICATION.md) for the live game, downloads and verification,
and [PROVENANCE.md](PROVENANCE.md) for exact CI bytes and owner authorization.

## Changes

- **Attack and Move stay available.** Switching away from a transfer draft no
  longer traps the selection in Move. Countries that can do both offer separate
  action icons, including an unconfirmed transfer destination. Choosing Attack
  cancels only the draft; no armies move until a transfer is confirmed.
- **Production centers are easier to see.** Larger, brighter stars have a dark
  outline and scale with the army labels on both map renderers.
- **Mobile commands use compact icons.** Portrait, landscape and tablet layouts
  leave more room for the board, while desktop keeps text commands. Accessible
  names, tooltips and the Cards counter remain available; settings labels,
  country names and card values remain readable text.
- **Start and Resume are at the top.** The launcher fits its initial viewport.
  Settings scroll inside the card on short screens and use two columns where
  there is room. Keyboard access and saved-game restoration are retained.
- **Results have more space.** Victory and elimination cards have larger headings,
  text and controls. Expanded results grow while folded result chips stay compact.

## Compatibility and scope

Combat rules, reinforcement income, the computer policy and saved formats retain
their 0.4.0 behavior. Defender wins ties remains the default for new games; Legacy
rerolls remain selectable. Kept games retain their combat identity and recorded
actions. Existing scores and next-game preferences are preserved.

Sound, native delivery, personalities, balance changes and the other outstanding
0.4.0 review follow-ups are separate work. Automated browser checks do not claim
new physical-device or screen-reader coverage. Independent review returned AGREE. The owner explicitly authorized publication
before later visual inspection; owner visual acceptance is deferred. Non-blocking
short-landscape launcher follow-up #394 remains open.

The reviewed v0.4.0 tag and published archives remain immutable. Publication uses
the verified CI bytes for the exact accepted 0.5.0 candidate, without rebuilding.
