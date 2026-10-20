# Revision 6: readable decisions on a full-screen map

The owner requested changes to the concepts, with review by someone else.
This revision applies those changes in the drawings and expanded teaching
sequence. It retains the [owner decisions](DECISIONS.md): vivid organic geography,
full viewport map, icon actions and temporary contextual text, with no fixed
header, dock, sidebar or log. The quiet map has no visible text.

Both first-open/Fit orientations now show the whole archipelago. Portrait turns
the same board 90°, while count badges, centres and controls stay upright.
Focused phone interaction views can crop the world deliberately; Fit always
returns to all nine islands. Selection Focus is a separate requested action.

## Gallery

| Scene | Phone portrait | Phone landscape | Tablet | Desktop |
| --- | --- | --- | --- | --- |
| Quiet map | [![Quiet map, phone-portrait](sketches/quiet-map-phone-portrait.svg)](sketches/quiet-map-phone-portrait.svg) | [![Quiet map, phone-landscape](sketches/quiet-map-phone-landscape.svg)](sketches/quiet-map-phone-landscape.svg) | [![Quiet map, tablet](sketches/quiet-map-tablet.svg)](sketches/quiet-map-tablet.svg) | [![Quiet map, desktop](sketches/quiet-map-desktop.svg)](sketches/quiet-map-desktop.svg) |
| Setup | [![Setup, phone-portrait](sketches/setup-phone-portrait.svg)](sketches/setup-phone-portrait.svg) | [![Setup, phone-landscape](sketches/setup-phone-landscape.svg)](sketches/setup-phone-landscape.svg) | [![Setup, tablet](sketches/setup-tablet.svg)](sketches/setup-tablet.svg) | [![Setup, desktop](sketches/setup-desktop.svg)](sketches/setup-desktop.svg) |
| Source, target and Attack | [![Source, target and Attack, phone-portrait](sketches/ordinary-turn-phone-portrait.svg)](sketches/ordinary-turn-phone-portrait.svg) | [![Source, target and Attack, phone-landscape](sketches/ordinary-turn-phone-landscape.svg)](sketches/ordinary-turn-phone-landscape.svg) | [![Source, target and Attack, tablet](sketches/ordinary-turn-tablet.svg)](sketches/ordinary-turn-tablet.svg) | [![Source, target and Attack, desktop](sketches/ordinary-turn-desktop.svg)](sketches/ordinary-turn-desktop.svg) |
| Capture preview | [![Capture preview, phone-portrait](sketches/capture-phone-portrait.svg)](sketches/capture-phone-portrait.svg) | [![Capture preview, phone-landscape](sketches/capture-phone-landscape.svg)](sketches/capture-phone-landscape.svg) | [![Capture preview, tablet](sketches/capture-tablet.svg)](sketches/capture-tablet.svg) | [![Capture preview, desktop](sketches/capture-desktop.svg)](sketches/capture-desktop.svg) |
| Pending capture folded | [![Pending capture folded, phone-portrait](sketches/folded-choice-phone-portrait.svg)](sketches/folded-choice-phone-portrait.svg) | [![Pending capture folded, phone-landscape](sketches/folded-choice-phone-landscape.svg)](sketches/folded-choice-phone-landscape.svg) | [![Pending capture folded, tablet](sketches/folded-choice-tablet.svg)](sketches/folded-choice-tablet.svg) | [![Pending capture folded, desktop](sketches/folded-choice-desktop.svg)](sketches/folded-choice-desktop.svg) |
| Requested army inspection | [![Requested army inspection, phone-portrait](sketches/inspection-phone-portrait.svg)](sketches/inspection-phone-portrait.svg) | [![Requested army inspection, phone-landscape](sketches/inspection-phone-landscape.svg)](sketches/inspection-phone-landscape.svg) | [![Requested army inspection, tablet](sketches/inspection-tablet.svg)](sketches/inspection-tablet.svg) | [![Requested army inspection, desktop](sketches/inspection-desktop.svg)](sketches/inspection-desktop.svg) |
| Opponent turn | [![Opponent turn, phone-portrait](sketches/computer-turn-phone-portrait.svg)](sketches/computer-turn-phone-portrait.svg) | [![Opponent turn, phone-landscape](sketches/computer-turn-phone-landscape.svg)](sketches/computer-turn-phone-landscape.svg) | [![Opponent turn, tablet](sketches/computer-turn-tablet.svg)](sketches/computer-turn-tablet.svg) | [![Opponent turn, desktop](sketches/computer-turn-desktop.svg)](sketches/computer-turn-desktop.svg) |
| Human turn returns | [![Human turn returns, phone-portrait](sketches/return-to-turn-phone-portrait.svg)](sketches/return-to-turn-phone-portrait.svg) | [![Human turn returns, phone-landscape](sketches/return-to-turn-phone-landscape.svg)](sketches/return-to-turn-phone-landscape.svg) | [![Human turn returns, tablet](sketches/return-to-turn-tablet.svg)](sketches/return-to-turn-tablet.svg) | [![Human turn returns, desktop](sketches/return-to-turn-desktop.svg)](sketches/return-to-turn-desktop.svg) |
| Requested objective | [![Requested objective, phone-portrait](sketches/late-game-phone-portrait.svg)](sketches/late-game-phone-portrait.svg) | [![Requested objective, phone-landscape](sketches/late-game-phone-landscape.svg)](sketches/late-game-phone-landscape.svg) | [![Requested objective, tablet](sketches/late-game-tablet.svg)](sketches/late-game-tablet.svg) | [![Requested objective, desktop](sketches/late-game-desktop.svg)](sketches/late-game-desktop.svg) |
| Result | [![Result, phone-portrait](sketches/result-phone-portrait.svg)](sketches/result-phone-portrait.svg) | [![Result, phone-landscape](sketches/result-phone-landscape.svg)](sketches/result-phone-landscape.svg) | [![Result, tablet](sketches/result-tablet.svg)](sketches/result-tablet.svg) | [![Result, desktop](sketches/result-desktop.svg)](sketches/result-desktop.svg) |

## Decisions have the information they need

- Selecting a source marks legal neighbouring enemies and exposes nearby stacks
  together. Source emphasis is solid; legal/selected enemy boundaries are dashed.
  Cancel clears the staged pair without rolling. Attack remains a separate commit.
- Selecting an enemy shows the approved capture odds, labelled as fighting to
  capture rather than winning the next exchange. The illustrated 8-versus-3 case
  shows 91% under the approved single-die/rerolled-ties rules. Actual values must
  derive from the actual rules and stacks, not this drawing constant.
- Requested army inspection makes comparison safe during placement. Its explicit
  mode spends no armies; closing it restores existing one-army placement.
- Four consistent owner shapes carry ownership in the map, requested legend and
  larger upright count badges. Blue is square, orange diamond, lime hexagon and
  purple round. Tiny overview regions still need zoom/list access; schematic
  marks are not an accessibility or picking certification.
- Short local dice/count feedback shows both winning and losing exchanges in the
  walkthrough. Fight on appears only after the first explicit Attack on the same
  pair, with responsive Stop and its stop-at amount. Changing the pair invalidates
  that confirmation. Timing, dice, RNG and stopping rules are unchanged.
- Capture shows a pending **4 stay / 3 move** preview from seven surviving armies,
  with range 1–6. The 3 is an illustrated edited total, not a changed default.
  Tap the amount for direct entry; minus/plus and the range handle offer efficient
  adjustment. Check confirms. Fold retains the draft and replaces the choice with
  a distinct downward return icon; returning does not confirm it.
- Opponent turns identify the active owner and phase, show changes locally, keep
  Pause reachable and offer fast-forward. The return-to-human scene exposes a
  recoverable Changes action and local marks; it does not add a permanent log.
- Primary setup/result actions are named contextually. Menu contains Help & icon
  names, army inspection and the current choice. Requested icon-name help works
  by tap; hold/focus names are additional routes. No action relies on hover.

These contextual elements clear with their interaction or request. Required
choices, errors and privacy handover stay recoverable until resolved or explicitly
folded; no timer removes them. The [expanded beginner sequence](BEGINNER-WALKTHROUGH.md)
shows the individual moments rather than putting every explanation on one screen.

## Navigation and original map character

Fit always returns to the complete board, including landscape. Pinch and
requested +/− controls zoom; drag/swipe pans when zoomed. Focus/list selection
provides a non-drag route to a country. Keep world-space focus, relative zoom,
selected pair, pending draft and keyboard focus through device rotation. A drag,
hold or pinch release must never become a placement or Attack.

The whole viewport remains sea/map. Temporary landscape interaction controls
sit beside the focused decision; they do not reserve a permanent reading column.
Actual layouts must respect safe areas and enlarged text, avoid covering selected
counts and allow access to obscured locations. Native controls are drawn 48×48;
these static examples do not replace acceptance at 320×568, short landscape,
240px available height, tablet rotation or the other existing supported sizes.

Vivid seat fills, readable sea links, layered coastlines and restrained original
inland contours favour the direct island-conquest character requested from Isle
Wars Pro. No predecessor pixels, assets, text or code are reused. Broad believable
real-island and regional variety remains required within/across generated maps;
the [four studies](GEOGRAPHY-REFERENCES.md) are non-exhaustive examples. Fixed
schematic geography here is not valid generation, fairness, route or topology
evidence. No game engine, algorithm, save identity or rule contract changes.

These forty gallery compositions are original static concepts, not product
screenshots. Separate review and actual playable D4 acceptance remain necessary;
no fun, accessibility or usability result is claimed.

Regenerate with `python3 docs/plans/finished-game-vision/draw-sketches.py`.
