# A responsive turn workspace

Recommend one map-led workspace: a persistent active-seat/phase prompt and Pause,
a zoomable map, and controls that move between a bottom dock on phones and a side
panel on larger screens. A required choice takes the action position; it never
competes with an optional panel for attention. Keep the map's identity, ownership
shapes, army counts and route cues. Reduce persistent explanatory prose and put
explanations beside the action they explain.

This is the combined planning response to [#191](https://github.com/diegoami/malpaco/issues/191)
and [#194](https://github.com/diegoami/malpaco/issues/194), authorized together by
the owner on 2026-10-19. It supersedes their earlier planning separation, not the
need for a separate implementation decision. All mobile conventions, layout
budgets and acceptance numbers below are **[designed] proposals**. None has been
implemented, playtested or certified. [SOURCES.md](SOURCES.md) identifies the
inspected 0.1.1 source and pinned Pro evidence. Original sketches are in
[WIREFRAMES.md](WIREFRAMES.md); proposed checks and sequencing are in
[ACCEPTANCE.md](ACCEPTANCE.md) and [BACKLOG.md](BACKLOG.md).

## What the evidence changes

Pro's useful lesson is the separation of country identity, army strength, active
seat and phase-dependent decisions. Its recorded placement sequence distinguishes
an allocation draft from a committed change; the sampled battle distinguishes a
casualty from capture. Its three lower panels are a desktop arrangement, not a
phone template. [Pro guide](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/guide.md#a-sampled-placement-to-pass-turn),
[atlas](https://github.com/diegoami/isle-wars-archaeology/blob/084c1087119fcf45f0d0d2774eea7121487f1cb4/manual/pro/atlas.md#interaction-states).

The current game already exceeds that reference in some capabilities: versioned
match files, generated geography, non-colour ownership shapes, keyboard country
activation, playback pause/speed, cards, capture choices and complete event history.
Preserve them. Source inspection shows a desktop stage with a 350/440px battle
sidebar; T76 optionally exchanges it for a 52px rail with 34/38px icon buttons and
a floating drawer. It improves desktop space, but supplies no phone layout,
map-camera controls or touch selection alternative. A narrow viewport can devote
most of its width to the sidebar or make the full map very small. These are
structural risks identified in source, not observed phone failures. See the
[source assessment](SOURCES.md#current-game-assessment).

| Retain | Change [designed] | Omit from this redesign |
| --- | --- | --- |
| Original map geometry, graph legality, ownership colours **and shapes**, army counts, centre marker | Scale labels by view purpose; add camera controls and a country/candidate list | Pro relief art, branding, exact panel arrangement and copied screen text |
| Source-first attacks, one-army placement taps, battle controls and amount bounds | Make current tap consequences explicit in the prompt; offer touch inspection without Shift | Pro target-first input order and human-forfeit rules as new product behaviour |
| Required card, capture, loss/result decisions and existing card privacy | Give each a stable action surface and visible return path | A conjectural recreation of Pro's unseen card/capture screens |
| Four totals, full battle history, complete event history, Pause/speed, files/help/seed | Label navigation on phone; move secondary information into explicit surfaces | History truncation, icon-only essential navigation and hover-only explanations |
| Existing setup/rules and session preferences | Reflow setup and settings; choose layout automatically | Map-generation changes, new game rules, naming/flavour dependencies, sound system, themes or a general customization editor |

## Original visual direction [designed]

Keep the game's calm dark nautical character, with flat surfaces and clear type.
Retain bundled Inter with system fallbacks: 16px primary text, 14px supporting
text, tabular army/pool numbers, and a stronger selected-country name. Use an 8px
spacing rhythm, 16px panel padding where space permits, and thin separators
instead of a box around every sentence. These are starting targets, not a new
asset/style implementation.

Use a quiet deep-blue sea, restrained coast contrast and muted owner land fills;
ownership badges/shapes carry the redundant seat identity. Give counts light
text on a dark badge, separate from the smaller region name. Use a solid white
source outline, dashed amber legal-target outline and labelled chosen-target
emphasis; hue alone must not distinguish these from an amber owner's land. Keep
the centre star with a text explanation rather than borrowing Pro's cyan digits.
Avoid embossed land, beveled chrome, strong texture, large glows and permanent
animated routes. Show a concise outcome beside both stacks; one restrained pulse
may mark a changed region, suppressed by reduced motion. The primary action has
the strongest surface contrast; destructive/new-game actions stay in Menu with
their existing flow. Owner D4 covers the resulting hierarchy and visual character.

## The recommended workspace

The header always identifies the active seat and phase, remaining placement pool
when applicable, and an explicitly labelled Pause/Resume button. A paused state
replaces the action prompt with “Paused · Resume to continue”; it does not hide
the pending choice. Pause means the existing playback gate: game-changing human
actions also wait for Resume. It is not a way to satisfy a required choice.

The phone dock has an action/context area and four labelled destinations: Cards,
Totals, History, Menu. Totals opens all four seats' army, territory and public card
counts with the active seat marked; no opponent hand is exposed. History offers
the complete chronological event log and the complete battle log, with an explicit
“Latest” control when reading older entries. Both remain reachable in one tap.
Menu contains speed, battle preferences, files, help, new game, seed and map legend.
Card counts and a “Choice needed” label keep card obligations discoverable.

Optional surfaces replace the lower action area or use a larger reading view;
they do not stack. Closing them restores the exact previous choice and map view.
A “Return to capture”, “Return to cards”, etc. control remains visible when a
required choice is being read elsewhere. Required choices may be visually folded
for inspection, but cannot be skipped, dismissed as completed, or replaced by End
turn. In the wider workspace these surfaces occupy the side panel and leave the
map uncovered. T76's independent desktop panel hiding remains available.

For Raid and any map-target step, the expanded card surface folds into an explicit
target strip: what to select, selected target/preview, “Choose from list” and the
existing confirmation. The canvas stays interactive. Reopening the cards does
not clear the target. No modal backdrop may intercept map selection. A required
amount choice instead shows both source and destination, their resulting counts,
quantity limits and its confirmation; the map may be panned for inspection but
cannot select a different action while the engine choice is pending.

### Adaptation rules [designed]

Use available CSS viewport width/height after safe-area insets, not device names.
Budget examples in WIREFRAMES are for default text size; text enlargement expands
controls and falls back to the low-height reading arrangement before clipping.

| Available space | Arrangement | Map policy |
| --- | --- | --- |
| Width below 680px, ordinary portrait height | Header + flexible canvas + bottom action dock/navigation | Fit overview initially; region/group focus for decisions |
| Width at least 680px and height at most 500px | 48px header + canvas + 256px side action area | No bottom sheet across the canvas; panel body scrolls |
| Width at least 680px, height above 500px | 56px header + canvas + 320px tablet side panel | Four totals and current action visible; history below |
| Width at least 1100px, height at least 600px | 56px header + canvas + 360px desktop side panel | Spacious map, current action and history; hide panel on request |
| Available height below 320px, or ordinary controls cannot fit | Header + explicit Map / Current choice views with independent scrolling | One focused map or choice at a time; Pause and return control persist |

Width 568px landscape uses the narrow arrangement with a compact action strip,
not an impossibly narrow side panel. Browsers with toolbars/keyboard shown can
reach the last row by scrolling the choice view. Orientation never restarts a
match, commits an action, changes playback state or discards a draft.

### Map readability and selection [designed]

Fit overview is for board structure, owner distribution and broad fronts. It is
not a promise that 46 irregular regions, full names and three-digit counts are
readable or individually touchable on a phone. Focus view shows the selected
region, relevant neighbours and crossing endpoints; the info strip gives the full
name, owner/shape, army count, group/bonus and centre meaning. The logical graph
remains the authority for adjacency. A group outline/legend explains bonus
membership without equating a visible land cluster with a logical island.

Provide visible Zoom in, Zoom out, Fit board and Focus selection controls; allow
pinch and drag in the canvas, with button/keyboard equivalents. Camera bounds
derive from the actual presentation, not regenerated geography. Start with a
bounded 1–4× fit-scale range [designed]; the list remains a complete fallback if
4× is insufficient. Fit is explicit and does not clear selection. Zoom around the
gesture centre; retain a normalized world-space centre and scale on resize,
clamping only to recover visible content. Do not auto-follow every AI action while
the player is reading or inspecting another area; an explicit “Show action” can
reveal the current event.

Every region is reachable through “Countries” in the map controls. The list can
show all regions or legal candidates for the current step; each row names owner,
army count, group and legality/reason. Rows have separate explicit Inspect and
phase-action buttons. Tiny or ambiguous taps open a nearby-candidate picker
instead of assigning the nearest overlapping enlarged hitbox. The player then
chooses the named region/action. This avoids promising 44px disjoint targets on
all polygons. Invalid taps give a reason and leave state unchanged.

Current interaction semantics are deliberate constraints: during placement, a
direct owned-region tap places **one** army; during combat, selecting an owned
source then tapping a legal enemy performs **one exchange immediately**. The
prompt must say that before the tap. “Inspect” mode is a visible touch equivalent
of today's Shift-assisted attack inspection and performs no exchange. The list
uses “Place 1” / “Attack once” labels for the same actions. Drag/pinch completion,
camera buttons, hover and keyboard auto-repeat must never become accidental
placement or combat. A multi-army placement chooser or universal pre-attack
confirmation is a separate future design decision, not required here.

### Complete representative flows

These are proposed presentations of current game actions, not a new rules spec.
Numbers and legal candidates must come from the live controller, never UI guesses.

1. **Ordinary turn:** after income, open the existing valid-set list; Trade the
   named set with its displayed effect or Skip. Place remaining armies through
   owned-region taps/list “Place 1”; show map count and pool after every action.
   Start combat becomes available at zero pool. Select an owned source, read
   highlighted legal enemies and the immediate-exchange prompt, then attack once.
   Use the existing single-exchange/Fight on/Stop controls; show both counts and
   outcome without conflating a loss with capture. A pending capture replaces
   those controls with its legal amount, resulting stacks and Confirm move-in.
   After commitment, continue attacking or choose Move armies, select an owned
   adjacent pair, edit the amount and explicitly “Move and end turn”. Cancel before
   that commitment returns to combat. End turn is the other existing completion.
2. **Raid/card handoff:** Trade a Raid set using current semantics; show “Choose
   an enemy” over the usable map. Select by canvas or candidate list, read the
   preview, then Confirm raid. Show its actual result, including Shield handling,
   through the existing notice/history. A full hand requires choosing the discard
   **before** revealing the draw. Show the subsequent reward notice and Continue;
   do not advance automation through that acknowledgment. Privacy remains that of
   the current fixed-viewer projection, not an invented multiplayer hand view.
3. **Computer and terminal turn:** End turn/capture reward hands control to the
   next live seat. Active seat/status updates while Pause remains visible. Speed
   is reachable from Menu without resetting camera or history reading position.
   If a human-loss choice occurs, expose Watch computers / Stop game in the same
   action area; finished play exposes the result/standings and files/history/new
   game. No visible turn-changing action is offered while blocked. A terminal
   result does not erase the map, logs, seed or exported-match capability.

## Defaults and bounded settings

Keep normal playback speed, stop threshold 2, current game/setup defaults, and
compact explanations. Layout follows space automatically; no “phone mode” switch.
Keep existing desktop expanded defaults for a bounded portrait release. There are
six in-match preference controls below; navigation/actions are not settings.

| Preference | Default / scope [designed unless current] | Location |
| --- | --- | --- |
| Game speed | Current Very slow / Slow / Normal / Fast; Normal | Menu, promoted beside Pause when wide |
| Battle stop threshold | Current value/bounds, initially 2 | Battle details, beside explanation of its effect |
| Explanation density | Current Compact / Detailed; Compact; never removes actions or logs | Menu |
| Desktop top panel visibility | Current visible initially; session only | Wide layout panel control/Menu |
| Desktop side panel visibility | Current visible initially; session only | Wide layout panel control/Menu |
| Map label detail | New Auto / Always show names; Auto; counts and ownership remain available | Map legend/Menu |

Use system reduced-motion preference rather than adding a motion toggle. Do not
add settings for every overlay: ownership shape, selected/target outlines, route
meaning and focused count contrast are essential information. Zoom/Fit/Inspect
are direct transient map actions. Save/load, Help and New game remain actions
with their existing consequences. Reflow the current setup's seed, seat/controller
choices, strengths and round limit under a collapsed “Game options”; do not invent
new difficulty, event or original-registration settings. Session UI preferences
must not be advertised as part of a saved position without separate work.

## Meaningful alternative: map and decision pages

An alternative gives the full viewport to a map page and opens a separate decision
page for each placement, battle, card and amount choice, with a persistent summary
and Return to map. It offers simpler scrolling and larger text, and avoids all
sheet overlap. It costs repeated navigation between context and action; source,
target and result must be remembered across pages, especially on landscape/tablet.

| Decision | Recommended workspace | Separate pages |
| --- | --- | --- |
| Compare source, target and result | Map and action stay together in normal space | Requires summary plus repeated returns |
| Long cards/history/help | Explicit reading surface | Naturally roomy |
| Short landscape | Side action area; low-height escape view | Large map or large choice, seldom both |
| Desktop use | Uses existing side-panel idiom | Gives up useful simultaneous information |
| Main risk | Dock/panel sizing and state continuity | Navigation burden and hidden map context |

Recommend the workspace, with the alternative's explicit reading view only as the
low-height/accessibility fallback. Do not ship both as a new global setting.
Owner should judge map/context balance from the sketches before choosing.

## Release boundary and decisions

A bounded **possible 0.1.2** comprises usable phone portrait, functional narrow
landscape/reorientation, reachable current setup/files/help, map zoom/list access,
and every existing required-choice/playback/history path. It can reuse the current
desktop appearance and T76 panel behaviour. It cannot honestly claim phone play
if zoom/list selection or mandatory cards/capture are deferred. The broader work
adds the recommended tablet/desktop panel composition, map-label polish and wider
visual hierarchy. No rule, generated-map or flavour-name work is a dependency.

The owner decides: **D1** workspace versus separate pages; **D2** bounded portrait
release versus one cross-device redesign, and its version; **D3** whether to retain
current direct attack/one-army taps as recommended or separately design staged
confirmation/amount placement; **D4** acceptable map density, colour/shape contrast,
dock size and amount of persistent desktop history. Static sketches can settle
direction, not final appearance or touch quality. Later click-driven browser
checks, real-device gesture/keyboard checks and owner visual judgment are required.
Approving this proposal does not authorize implementation or schedule the backlog.
