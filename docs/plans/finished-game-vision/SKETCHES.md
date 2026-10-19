# Original finished-game concepts

These twenty **[designed] static SVG drawings** were authored for #215. No game
assets, original-game screenshots, production map or product code were imported.
The geometry, colours, letters, counts, seed labels and outcomes are illustrative.
The pictures are not a working prototype, implementation screenshots, a legal
46-country graph, measured AI play or accessibility evidence.

Click any image to inspect the native-sized drawing. Phone landscape shows a
scrollable action body with fixed navigation; controls below the viewport remain
in that body. The drawings use zero safe-area insets. Native targets are drawn
44px high; sketches do not prove target fit in real browsers. All headings and
labels are illustrative original text, not copied help.

| Scene | Phone portrait · 390×844 | Phone landscape · 844×390 | Tablet · 768×1024 | Desktop · 1280×800 |
| --- | --- | --- | --- | --- |
| S1 Setup | [![Setup portrait](sketches/setup-phone-portrait.svg)](sketches/setup-phone-portrait.svg) | [![Setup landscape](sketches/setup-phone-landscape.svg)](sketches/setup-phone-landscape.svg) | [![Setup tablet](sketches/setup-tablet.svg)](sketches/setup-tablet.svg) | [![Setup desktop](sketches/setup-desktop.svg)](sketches/setup-desktop.svg) |
| S2 Ordinary turn | [![Turn portrait](sketches/ordinary-turn-phone-portrait.svg)](sketches/ordinary-turn-phone-portrait.svg) | [![Turn landscape](sketches/ordinary-turn-phone-landscape.svg)](sketches/ordinary-turn-phone-landscape.svg) | [![Turn tablet](sketches/ordinary-turn-tablet.svg)](sketches/ordinary-turn-tablet.svg) | [![Turn desktop](sketches/ordinary-turn-desktop.svg)](sketches/ordinary-turn-desktop.svg) |
| S3 Capture choice | [![Capture portrait](sketches/capture-phone-portrait.svg)](sketches/capture-phone-portrait.svg) | [![Capture landscape](sketches/capture-phone-landscape.svg)](sketches/capture-phone-landscape.svg) | [![Capture tablet](sketches/capture-tablet.svg)](sketches/capture-tablet.svg) | [![Capture desktop](sketches/capture-desktop.svg)](sketches/capture-desktop.svg) |
| S4 Late game | [![Late game portrait](sketches/late-game-phone-portrait.svg)](sketches/late-game-phone-portrait.svg) | [![Late game landscape](sketches/late-game-phone-landscape.svg)](sketches/late-game-phone-landscape.svg) | [![Late game tablet](sketches/late-game-tablet.svg)](sketches/late-game-tablet.svg) | [![Late game desktop](sketches/late-game-desktop.svg)](sketches/late-game-desktop.svg) |
| S5 Result | [![Result portrait](sketches/result-phone-portrait.svg)](sketches/result-phone-portrait.svg) | [![Result landscape](sketches/result-phone-landscape.svg)](sketches/result-phone-landscape.svg) | [![Result tablet](sketches/result-tablet.svg)](sketches/result-tablet.svg) | [![Result desktop](sketches/result-desktop.svg)](sketches/result-desktop.svg) |

## What the images show and leave to later validation

- Setup keeps the useful default and Start game prominent. The advanced option
  inventory is governed by T44 and the existing responsive proposal; these
  drawings do not replace that inventory or authorize new options.
- The ordinary-turn map is an overview on wide screens and a focused subset on
  narrow screens. Text labels stay in screen space; ownership uses symbols and
  colour, sea routes are dashed, a small warm square denotes a production centre.
  Geography needs much more detail than these schematic islands before visual
  acceptance. No contrast, spacing, hitbox or map-validity result is claimed.
- The battle pair is staged, with an explicit Attack. Fight on and Stop are
  inactive in the illustrated pre-attack state. Real controls must revalidate
  phase/legality/pause; the drawing does not implement that protection.
- Capture replaces the current action area. Confirmation is explicit; Fold and
  inspection preserve the amount. Legal bounds and count previews must come
  from the controller, not the illustrative number 3. Long text, invalid numeric
  input, keyboard, reward/discard/Raid and short-height alternatives still need
  the full existing responsive acceptance flows.
- Late game shows public remaining opposition/objective, with four-seat totals
  available. It does not invent finish assistance or prove pacing. The wide
  summary and focused phone are views of an illustrative situation, not replay
  snapshots of the same valid engine state.
- The result example is a conquest win. Actual loss/elimination, watch/stop,
  resignation, round-limit/tie and takeover paths are specified by the existing
  contracts and the vision; this sample does not substitute for those outcomes.

## Layout constraints retained

These are four representative compositions, not the whole supported size matrix.
The selected direction also covers 320×568 portrait, 568×320 landscape, narrow
640/667-wide landscape, short available-height fallback, safe areas, browser
zoom/reflow, larger text and tablet/desktop seams. Use the pinned
[responsive sketches](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/WIREFRAMES.md)
and [acceptance](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/ACCEPTANCE.md)
and existing T78–T89 contracts for their full obligations.

On a minimum phone or with enlarged text, the Current choice reading view and
country list are essential alternatives to a dense map. Wider devices give
totals/current choice/history more space rather than changing the rules. On
rotation, camera, source/target and required drafts persist without dispatching
an action. Private handover, keyboard reachability and reduced-motion/audio
controls remain obligations even where a sketch does not draw every surface.

Regenerate the original drawings with `python3 draw-sketches.py` in this directory.
The generator is documentation tooling only and imports no application code.
