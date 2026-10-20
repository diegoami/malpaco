# 0.2.0 acceptance: viewports, interaction, state and scenarios

The 0.2.0 tasks T79–T89 cite this file as their acceptance authority. It replaces the
unmerged PR #196 `docs/plans/responsive-ui/ACCEPTANCE.md` (historical, at
[`06a42f8`](https://github.com/diegoami/malpaco/blob/06a42f8ab090d6fbebf32f5e809ab9f9a8f6b960/docs/plans/responsive-ui/ACCEPTANCE.md)).
Its whole matrix is carried here (R7 of the [#215 reconciliation](finished-game-vision/RECONCILIATION.md),
owner-approved by merging PR #217 on 2026-10-20), amended for the accepted
[finished-game vision](finished-game-vision/DECISIONS.md):
- a full-viewport map, with icon controls and temporary prose overlaid on it;
- army counts in owner-shaped badges on every territory, including at rest, with the
  placement pool always visible;
- Place 1 and explicit Attack (D3) unchanged;
- portrait shows the same board turned 90° to fit; Fit returns to the whole archipelago;
- recheck follow-ups [A–E](finished-game-vision/reviews/claude-cloud-2026-10-20/recheck/FOLLOWUPS.md).

Everything here is **[designed] future acceptance**, not an executed result. Owner D4
judges the actual build. Named checks still need main-session preflight before dispatch.

## Viewports and minimums

CSS pixels describe the content viewport. Test the default geographic host and the
supported reference-battle host. The legacy routes (`generated-game`, `authored-game`,
`game-setup`, `generated-prototype`) are retired from the published build (R4). Supported
version-1 saves are not: T85 makes the main file UI load them into continued play
first, and T89 retires the routes only after that (A13).

| Viewport | Role | Required checks |
| --- | --- | --- |
| 320×568 | Minimum portrait | 90° fit when it uses space better; all icon actions and requested overlays reachable; focus/list reaches every legal choice; all 46 counts at Fit (A12) |
| 360×640, 390×844, 430×932 | Representative portrait | Full human turn, Raid, required amounts, requested totals/history, setup/files/help |
| 568×320 | Minimum landscape | Full-viewport map plus a scrollable Current choice; no forced rotation |
| 640×360, 667×375 | Narrow short landscape | Focused map with overlay controls beside the focused decision; Current choice scrolls and holds all attack commands; land and badges stay associated beside cards (E) |
| 844×390, 932×430 | Wider phone landscape | Overlay controls beside the decision, safe cutouts, canvas input, visible confirmation |
| 768×1024, 1024×768 | Tablet orientations | Same composition as every device; full flows; drafts, history and focus intact through rotation |
| 800×540 | Retained earlier landscape case (#96/T51) | Current-game flows, focus/list and essential actions usable; no full-rules completion claim |
| 1280×800, 1920×1080 | Desktop regression sizes | Protected flows; overlays never cover required controls or each other; source state and graph unchanged |
| Width seams 680 and 1100 px ±1; height seams 320/500/600 px ±1 | Layout seams | No duplicated controls, stale handlers, focus loss or unexpected action at a transition |
| 240 px available height | Reduced-height fallback | Scrollable Current choice plus Map return; confirm, Pause/Resume and errors reachable |

Below 320 px width, control/help/file views reflow, and a pannable map/list escape path
remains; simultaneous-map play is not promised. A hard lower bound found later needs an
owner decision, not a clipped-button release.

## Interaction, accessibility and space

- **No fixed chrome (U3).** No permanent header, dock, sidebar, totals/history panel or
  reserved text region. The ui-077 status bar is replaced by:
  - the placement pool icon and number;
  - the legal phase-action icon with its accessible name;
  - active-seat and phase notices;
  - phase details on request.
- **Targets.** At least 44×44 CSS px for standalone touch controls and list actions, with
  8 px between actions that commit different things. Map polygons are the exception: zoom,
  Inspect and named candidates give equivalent reach without overlapping fabricated hit
  areas.
- **Counts and text.** Every territory shows its army count in an owner-shaped badge, at
  Fit and when zoomed, with text of at least 14 px and no shrinking below that.
  - Badge centres follow attribution rule A: each on its own country, or on open sea with
    an unambiguous leader that crosses no badge or leader.
  - Exact values stay available on selection and to assistive technology.
  - Primary control and body text is 16 px.
  - Names appear on request or selection only.
  - Labels wrap rather than vanish.
- **Contrast.** 4.5:1 for ordinary text; 3:1 for large text and essential boundaries.
  Owners are distinguished by shape as well as colour. Source, legal target, chosen target
  and disabled state are distinguished without hue or animation alone, and other countries
  dim.
- **Icons and names (U4).** Every icon control has an accessible name. "Help & icon names"
  is reachable by tap and keyboard, with no hover or long-press dependence. Start game,
  Start combat, New game, End turn, Fast-forward, Fit, Focus and Stop have distinct glyphs.
  Stop game keeps its visible label for the whole unresolved elimination card (D).
- **Keyboard.** Tab/Enter/Space reach every overlay control, map control, country list and
  visible country.
  - Arrow keys move within each overlay icon group, with Home/End.
  - After a layout change, focus returns to the same logical control or region without
    activating it.
  - During attack, Enter/Space on the map only selects. On Attack it performs one exchange.
  - Placement keeps Place 1.
  - Auto-repeat never repeats a game action.
- **Attack commitment.** Selecting a target changes only the staged pair.
  - Attack freshly checks legality, pause and required-phase gates before one existing
    exchange.
  - Staging shows the exact capture odds, labelled as fought to the end (R5).
  - Fight on waits for the first explicit Attack on that pair.
  - A changed pair or a loaded match clears the confirmation.
  - No pan, resize, overlay close, focus restoration or pause/resume commits combat.
- **Escape** closes the top overlay and restores a visible opener. Only a later explicit
  Escape may cancel the current controller. Required choices stay pending, including after
  a load.
- **Touch and camera.** Drag, pinch and swipe never dispatch a country action on release.
  - Zoom, Fit and Focus work by button and keyboard.
  - The first fit chooses 0° or 90° from board bounds and available space, with counts and
    text upright.
  - Rotation keeps world-space focus, selection and drafts.
  - The accessible list reaches every region.
- **Zoom.** Browser zoom stays enabled and separate from game-camera zoom. Check 200% and
  400% (an effective 320 px width).
- **Insets and keyboard.** Use the real safe areas on every edge. Test synthetic 24 px top,
  34 px bottom and 44 px left/right cases, then real devices. Browser bars and the virtual
  keyboard resize the available area and never cover the last action.
- **Overflow.** No unintended horizontal document scroll. Each overlay has one vertical
  scroll owner. Long history, five cards, long names, large counts (B: 2-digit, 3-digit and
  compact >999) and validation errors never push a required confirmation out of reach. A
  card covering land keeps that land's badges beneath it; the same counts reappear when it
  closes. Hidden by an overlay never means zero armies (E).
- **Motion and announcements.** Honour reduced motion. Announce the active seat, required
  choices and results without narrating every pan or stealing focus during AI play.

## State invariants across resize, overlays and orientation

**Engine state.** Before and after a UI-only transition, an exact engine snapshot or
versioned export is identical:
- map, topology and geometry; owners, armies and centres;
- phase, current seat and pool; card state; pending capture or discard; result;
- the full action history and logs; every RNG stream.

Layout never redeals, replays, migrates a save, advances a turn, draws or dispatches.

**UI state.** Also compared:
- the staged source and target, and the same-pair Attack confirmation;
- Raid selection, move mode, amount drafts (including temporarily invalid text) and folded
  capture drafts;
- the selected set and viewer projection, and reward acknowledgment;
- running or paused battle, playback pause and speed, threshold;
- the open overlay, keyboard focus, and both history reading positions and follow-latest
  flags;
- the camera's world-space centre, scale and rotation.

**AI and battle timing.** An active AI or battle is exempt only in elapsed game time:
- Freeze the clock for exact comparisons.
- A running case matches the same schedule without the resize: no duplicate timer, extra
  exchange or skipped acknowledgment.
- Pause stays reachable throughout AI play, through the opponent-turn notice with Pause
  and Fast-forward.
- While paused, every game-changing choice waits.

**Loading another match** is an explicit replacement:
- stale overlays close and old actions are invalidated;
- a visible entry point takes focus;
- the camera uses the loaded map's bounds.

## Click-driven browser scenarios

Use legal deterministic fixtures, real clicks and the engine as an independent action
oracle. Never bypass a required choice by removing DOM or editing state directly. Every
behavioural check fails when its behaviour is removed. Replace obsolete immediate-tap
expectations with unchanged pre-Attack snapshots and explicit commitment checks.

| ID | Scenario | Pass condition |
| --- | --- | --- |
| A1 | Open setup in portrait; change the seed and seats; Start; open files and help, then return | Correct game identity; every field and action reachable; no lost state or hidden confirmation |
| A2 | Skip or trade a legal set; Place 1 by canvas and list until the pool is 0 (pool always visible); Start combat; select source and target by map, list and keyboard (odds shown); press Attack; Stop and continue | Target selection leaves core, history and RNG unchanged; Attack adds exactly one exchange; fresh gates reject stale, illegal and paused choices; Fight on waits for the first explicit Attack and resets on a pair change |
| A3 | Reach a real capture; type a legal non-default amount; fold and return; rotate; open totals or history; pause and resume; Confirm | Draft, pair and limits survive, preview badges stay dashed until Confirm; no confirmation while paused; exactly one capture-move action; land and badges stay associated at short landscape heights (E) |
| A4 | Friendly move: choose a source with at least 2 armies and an own neighbour; choose a non-default amount; resize, cancel, re-enter; commit Move & end turn | Draft and focus continue until an explicit cancel; Cancel changes nothing; exactly one legal move and handoff |
| A5 | Trade Raid; fold the card overlay; pick an enemy by map and list; inspect the preview; reopen; Confirm | Target hittable; target persists; no overlay intercepts it; exactly one raid; Shield and result notice correct; covered badges reappear (E) |
| A6 | Reach a full-hand discard and then a reward; try Map, Escape and resize; advance the clock | No card revealed before the discard; no hand leak; no skipped reward acknowledgment or duplicate draw |
| A7 | End turn to AI; pause from each layout; open history and scroll old entries; change speed; Fast-forward; rotate; resume; open Changes on the human turn | Paused state exact; the running schedule matches the control; complete history and totals available on request; reading position preserved; newest entry emphasized (#175) |
| A8 | Zoom or focus a tiny region; pan across a crossing; use the candidate picker, list and keyboard | Intended region reached with correct legality; no guessed nearest action; no rule action from the camera or a repeated key |
| A9 | At keyboard, zoom and safe-area sizes, edit an invalid then a valid capture amount; reach confirm; return to the map | Error and draft persist; no clipping; focus visible; dismissing the keyboard or rotating never commits |
| A10 | Load a different match with an overlay open; try a stale control; reach a human loss and the result, then files and new game | Old actions cannot affect the loaded match. Watch / Stop game (label attached, D) work. The concise result (winner, reason, New game) reaches standings, seed, options and the record on request (ui-054). Logs and totals complete |
| A11 | Click regions near every overlay control and SVG child, at every layout seam | A region hit belongs to its region; overlays intercept no hits outside their own rectangles and never cover required controls or each other; no duplicate IDs or handlers |
| A12 | At phone Fit in both orientations, on retained seeds with realistic, nonsequential stacks (2-digit, 3-digit and compact >999), identify the count of ten randomly selected countries | Every badge centre follows rule A; no leader crosses another; text ≥14 px; errors and assistance recorded (T88 DEVICE-REPORT); T89 reports the actual results |
| A13 | Upload a supported version-1 save into the main file UI of the published artifact; continue play | It loads into continued play with unchanged replay, rules and RNG checks; no legacy route is needed |
| A14 | Open in portrait and landscape; Fit; Focus a country; rotate the device mid-choice | 0° or 90° chosen from bounds; Fit shows all nine islands; rotation keeps world-space focus, selection and drafts; swipe pans only when zoomed |

**Screenshots** cover:
- the resting overview with counts, and a focused source and target;
- capture and fold, full-hand cards and Raid targeting;
- long history, setup, files and help;
- loss and result, and the keyboard fallback, at representative sizes.

Automation checks bounds, real hits, state equivalence and click flows. Native pinch,
mobile keyboards, browser chrome, assistive technology and comfort need device checks.

## Owner D4

D1–D3 stand ([historical decisions](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/DECISIONS.md)),
strengthened by U3–U5 and the count decision. D4 is the owner's judgment of the actual
build:
- whether the full-viewport map explains geography, counts and crossings;
- whether overlays leave enough map during placement and attack;
- whether required choices feel unavoidable without blocking inspection;
- whether staged selection and explicit Attack are clear;
- whether the original visual character is acceptable on every device.

Low-fidelity sketches cannot approve final typography, colour or gesture feel.
