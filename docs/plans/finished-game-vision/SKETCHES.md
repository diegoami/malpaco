# Revision 3: portrait fit and focused navigation

The owner approved V1–V5, required nice organic maps, deferred flavour names and
rejected the first sketches' text density. After preferring the simpler drawings,
the owner requested that the map turn to fit portrait. [Exact response](DECISIONS.md).

**The map fills every viewport.** There is no permanent header, sidebar, dock,
legend, instruction block or history stream. Actions use original icons. Open
any image at native size; the quiet-map row shows the default after contextual
information clears. The remaining rows show information only for the interaction
or request depicted.

All twenty-four drawings are original static **[designed] concepts**, not
implementation screenshots or game assets. The hand-authored coasts and schematic
territories explore the organic direction; they do not prove a valid graph,
route/label constraints, fairness or production generation across seeds. Cameras
are different views of the same illustrative geography, not different device maps.
No predecessor pixels, artwork, code or help text were reused.

| Scene | Phone portrait · 390×844 | Phone landscape · 844×390 | Tablet · 768×1024 | Desktop · 1280×800 |
| --- | --- | --- | --- | --- |
| Quiet map | [![Quiet map, phone-portrait](sketches/quiet-map-phone-portrait.svg)](sketches/quiet-map-phone-portrait.svg) | [![Quiet map, phone-landscape](sketches/quiet-map-phone-landscape.svg)](sketches/quiet-map-phone-landscape.svg) | [![Quiet map, tablet](sketches/quiet-map-tablet.svg)](sketches/quiet-map-tablet.svg) | [![Quiet map, desktop](sketches/quiet-map-desktop.svg)](sketches/quiet-map-desktop.svg) |
| S1 Setup | [![S1 Setup, phone-portrait](sketches/setup-phone-portrait.svg)](sketches/setup-phone-portrait.svg) | [![S1 Setup, phone-landscape](sketches/setup-phone-landscape.svg)](sketches/setup-phone-landscape.svg) | [![S1 Setup, tablet](sketches/setup-tablet.svg)](sketches/setup-tablet.svg) | [![S1 Setup, desktop](sketches/setup-desktop.svg)](sketches/setup-desktop.svg) |
| S2 Ordinary turn | [![S2 Ordinary turn, phone-portrait](sketches/ordinary-turn-phone-portrait.svg)](sketches/ordinary-turn-phone-portrait.svg) | [![S2 Ordinary turn, phone-landscape](sketches/ordinary-turn-phone-landscape.svg)](sketches/ordinary-turn-phone-landscape.svg) | [![S2 Ordinary turn, tablet](sketches/ordinary-turn-tablet.svg)](sketches/ordinary-turn-tablet.svg) | [![S2 Ordinary turn, desktop](sketches/ordinary-turn-desktop.svg)](sketches/ordinary-turn-desktop.svg) |
| S3 Capture | [![S3 Capture, phone-portrait](sketches/capture-phone-portrait.svg)](sketches/capture-phone-portrait.svg) | [![S3 Capture, phone-landscape](sketches/capture-phone-landscape.svg)](sketches/capture-phone-landscape.svg) | [![S3 Capture, tablet](sketches/capture-tablet.svg)](sketches/capture-tablet.svg) | [![S3 Capture, desktop](sketches/capture-desktop.svg)](sketches/capture-desktop.svg) |
| S4 Late game | [![S4 Late game, phone-portrait](sketches/late-game-phone-portrait.svg)](sketches/late-game-phone-portrait.svg) | [![S4 Late game, phone-landscape](sketches/late-game-phone-landscape.svg)](sketches/late-game-phone-landscape.svg) | [![S4 Late game, tablet](sketches/late-game-tablet.svg)](sketches/late-game-tablet.svg) | [![S4 Late game, desktop](sketches/late-game-desktop.svg)](sketches/late-game-desktop.svg) |
| S5 Result | [![S5 Result, phone-portrait](sketches/result-phone-portrait.svg)](sketches/result-phone-portrait.svg) | [![S5 Result, phone-landscape](sketches/result-phone-landscape.svg)](sketches/result-phone-landscape.svg) | [![S5 Result, tablet](sketches/result-tablet.svg)](sketches/result-tablet.svg) | [![S5 Result, desktop](sketches/result-desktop.svg)](sketches/result-desktop.svg) |

## Portrait starts with the whole archipelago

The quiet/setup portrait views show the same board turned **90° and fitted**;
all nine islands are visible. Landscape uses the same geometry without that
quarter turn. Text, action icons and production markers stay upright. There is
no stretching, new seed, changed adjacency or rearrangement of islands.

Phone turn/capture frames illustrate a zoomed focused view of that rotated map.
A player swipes/drags to pan, pinches to zoom, and uses Fit to return to the whole
board. Focus selection and the requested country list provide non-drag routes;
keyboard and requested zoom controls remain available. Small overview territories
need focus/zoom before precise interaction, rather than oversized invisible hits.

A tap inspects/selects according to phase (owned-country placement remains Place 1).
A drag/pinch must never become a placement or attack on release; selecting an enemy
still requires the separate Attack icon. Camera movement does not advance a turn.
Browser zoom and platform gesture/accessibility constraints remain part of T88.

On first open or Fit, choose the 0°/90° orientation that uses available space best.
Once zoomed, preserve the world-space focus, relative zoom, selected pair and draft
on device rotation; do not snap the player to an unrelated overview or commit an
action. Adapt an existing overview to fit the new orientation. Pan follows screen
directions after the transform. Portrait fit and focus are two camera views,
not different map layouts. Actual gesture feel still needs playable acceptance.

## Text follows the interaction

| Frame | What brings the text up | What clears it |
| --- | --- | --- |
| Quiet map | Nothing selected; no visible text | This is the resting state |
| Setup | New-game choice: title and one default-opponent line | Start/load, or dismissal back to the map; options explain themselves only when opened |
| Ordinary turn | Selected source/target: their army counts | Clear/change inspection or complete the interaction; selection never rolls combat |
| Capture | Required move-in: amount and resulting selected counts | Confirmation resolves it; folding keeps the draft and a return badge, with other illegal actions blocked |
| Late game | Player requests objective/progress information | Close that request; the victory condition does not become a permanent banner |
| Result | The completed match: winner and reason | Dismiss to inspect the final board; a result icon reopens it; records remain exactly-once |

Confirmation, illegal-action errors, required rewards/discards/targets and private
handover stay available until resolved or deliberately folded. No timer makes a
critical choice vanish. Brief noncritical feedback may clear after its interaction;
complete history remains available on request. Reduced motion must preserve the
same information. Flavour text/names add no background labels.

## Icons and discovery

The default board has four compact icons: menu, pause, fit/focus, and the legal
phase action (End turn in these ordinary-turn examples). An explicit crossed-swords
Attack icon appears for a selected legal enemy pair. Capture supplies −, amount,
+, confirm and fold in a temporary floating group. Fight on/Stop and friendly
movement appear in their valid contexts; they are not removed from the game.

The menu opens requested cards, complete four-seat totals, histories, country
picker, files, settings and help. Results offer New game, standings/context,
history and files. These are reachable capabilities, not permanent panels.
Accessible names identify every action. Focus, deliberate touch inspection or
requested help reveals an icon's explanation; touch cannot depend on hover.
Explanations clear after dismissal/focus departure. No tool-tip appearance commits
an action. A screen reader can identify an icon without first revealing text.

Only the current selection/request exposes relevant country identity, armies,
legal targets and consequences; complete information is accessible on request.
Colours plus distinct ownership shapes remain, with readable counts on selection.
The tiny marks here are schematic; actual ownership/contrast/input acceptance
remains required. No test of real touch targets is claimed from these drawings.

## Device and acceptance boundaries

Native action icons are drawn 48×48. Drawings use zero safe-area insets. Actual
controls must respect safe areas, enlarged text and browser zoom, avoid covering
the selected target/confirmation, and permit camera/list access to obscured map
locations. Temporary requested views may scroll at short heights, then close to
the same full-size map; a permanent reading column is superseded.

The existing full size matrix remains, including 320×568 portrait, 568×320 and
640/667-wide landscape, 240px available height, tablet rotation and desktop seams.
Camera, staged pair, pending drafts and focus persist without an action on rotation,
pause or closing information. The old fixed-dock/panel budgets are superseded by
[U3–U5](DECISIONS.md); associated contracts require explicit reconciliation before
dispatch, while complete behaviour and accessibility obligations remain.

D4 needs actual playable icon discovery, geography across seeds, touch feel and
full-match judgment. Review these revised concepts before final backlog approval.
Regenerate with `python3 docs/plans/finished-game-vision/draw-sketches.py`.
