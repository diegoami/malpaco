# Malpaco 0.5.2: tablet layouts and quicker turns

Web release scope: [#422](https://github.com/diegoami/malpaco/issues/422),
T156–T161, owner requests #413–#421. The previous published release is
[0.5.1](../0.5.1/PUBLICATION.md). Exact candidate, checks and review receipts live
on #422. These notes do not assert publication or owner visual acceptance.

## Changes

- **A launcher that adapts to the window.** Portrait keeps a stacked composition;
  wide landscape and desktop place Start beside compact settings in columns.
  Start/Resume remain explicit and reachable. Very short windows scroll the
  whole card; larger windows fit settings where practical and scroll when needed.
- **Three control display choices.** Text, Icons, and **Text 2 turns, then Icons**.
  The last choice is the new default: text remains for your first two personal
  turns, then buttons use icons. Resume restores the correct phase; existing
  explicit Text/Icons preferences remain unchanged. Text Attack/Move commands
  are smaller while retaining usable touch targets. Zoom In/Out always use icons.
- **Less clutter around the map.** The redundant bottom-right Move and province
  list buttons are removed. Select a region to use its Move control. New Armies
  sits at the top left immediately right of Cards, with an army symbol and count
  in icon mode.
- **Choose computer turn speed.** Slow, Normal, Fast and Very fast are available
  on the launcher and in Settings. The preference applies immediately and is
  kept in this browser. Normal has 20% shorter feedback beats and a shorter
  action gap; Slow and Fast retain their previous pacing. Speed changes waiting
  and animation, not computer decisions or difficulty.
- **Resize or hide the turn widget.** Its −/+ controls shrink or enlarge the
  content independently of map zoom. X hides it; a small Show control restores
  it. Resume remains reachable while hidden. Short windows scroll widget content
  while retaining its controls. A new game restores normal size and visibility.
- **Ambiguous taps choose automatically.** The region with the most visible
  surface under the tap is selected and the map zooms in slightly, without a
  chooser popup. Labels do not enlarge region area. A single tap acts once;
  illegal/paused selections and cancelled touches, pans and pinches preserve
  ordinary action guards.

The maintained illustrated manual and in-game Help explain these controls.
All eight guide illustrations remain real retained-game examples. Automated
screenshots do not establish physical-device, screen-reader or owner visual
acceptance.

## Compatibility and release gate

Core rules, AI policy, seeded outcomes for the same actions, saved identities and
fixtures match v0.5.1. Dependencies are unchanged. Existing games and scores keep
their data. BUILD.json gains an additive product-version field for new archives;
historical build records and published assets are unchanged.

Independent milestone review and publication remain owner-authorized steps under
[ACCEPTANCE.md](ACCEPTANCE.md). No native delivery, balance/personality work,
source-suite CI expansion (#409), environment follow-up (#410) or unrelated
quality work is included. Prefer a compatible forward fix; v0.3.1 is not a routine
rollback because #372 reproduces scoreboard/preferences loss.
