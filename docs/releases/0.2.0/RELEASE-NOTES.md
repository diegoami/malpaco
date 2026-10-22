# Malpaco 0.2.0

Malpaco now plays on phones, tablets and desktops alike, and the map fills the screen.

## New

- **The map fills the screen.** Only small corner icons sit on it:
  - menu, Pause, Fit, Countries and information;
  - the phase action: Start combat, Move armies, End turn.

  Choices appear as small cards beside the map and fold away to a one-line strip.
- **Pinch, drag, zoom, Fit and Focus.** On first Fit the map turns 90° when that uses the screen
  better, with counts always upright.
- **New islands.** New games grow irregular coastlines and varied island shapes. The 46 countries
  and their routes are unchanged.
- **Real place names.** Islands and countries can take names from one region: the Mediterranean,
  the Caribbean, the Scandinavian islands, Malaysia and Indonesia, or the Pacific. "By seed" lets
  the seed choose. Names never change the map or play.
- **Choosing never attacks.** Tapping a target only stages it and shows the chance of capturing
  it if you fight to the end. **Attack** fights one exchange; **Fight on** continues after that.
- **Countries list.** Every country, by island or only those you can use now. **Inspect** shows
  one country, and a tap that touches two countries asks which one you meant.
- **Computer turns:**
  - a notice with **Fast-forward** that skips the waiting, never changing the moves;
  - on your turn, **Changes** shows the other seats' actions since your last turn.
- **Readable at any size:**
  - counts never draw smaller than 14 px, and stacks over 999 show as 1.2k;
  - your source, its targets and the chosen target differ by line and mark, not colour alone.
- **Help & icon names** in the menu.
- **Result details:** seed, options and the record. A round-limit result names what decided it.
- **Older version-1 saves** load in the main screen and save back as version 1.

## Fixed

- After a load, keyboard focus lands on the menu icon.
- The Fight on stop point and speed survive a load that opens on a computer turn.
- The selected country's name is never hidden under a neighbour.
- The Countries list never stays stuck inside the next card.

## Known limits

- Real-device and screen-reader checks are listed in `DEVICE-REPORT.md`; automation cannot certify
  them.
- Below 240 px of height (400% browser zoom on a small laptop) the choice card is cramped, but its
  Confirm stays reachable.
- The next release, 0.2.1, trims the cards to the bare minimum and keeps them from shrinking the
  map (#240).

## Play

<https://malpaco.netlify.app>, or download `malpaco-playable.tar.gz` from this release, extract it,
and run `node serve.mjs` (Node.js 22).
