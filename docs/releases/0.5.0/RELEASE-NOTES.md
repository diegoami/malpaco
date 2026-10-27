# Malpaco 0.5.0 — usability polish

These notes describe the agreed [0.5.0 scope](https://github.com/diegoami/malpaco/issues/381).
The release candidate is pinned only after every required implementation PR has
landed and the integrated checks pass. This document does not assert publication.

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
new physical-device or screen-reader coverage. Owner visual acceptance and the
independent release review remain separate gates before publication.

The reviewed v0.4.0 tag and published archives remain immutable. Publication uses
the verified CI bytes for the exact accepted 0.5.0 candidate, without rebuilding.
