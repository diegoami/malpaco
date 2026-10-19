# Proposed acceptance and owner decisions

Everything here is **[designed] future acceptance**, not an executed test report.
The numbers follow inspection of the pinned manual and 0.1.1 CSS/UI/test contracts
in [SOURCES.md](SOURCES.md). No code, game build, browser test, gesture trial or
implementation preflight was run for T77. This plan does not claim phone support
exists or that any layout/accessibility target has passed.
The owner selected D1 map-first, D2 all devices together and D3 explicit Attack;
[DECISIONS.md](DECISIONS.md) records the authority and separates later D4 judgment.

Target release: **0.2.0**, allocated through [BACKLOG.md](BACKLOG.md) and T78–T90.
The named checks still require main-session acceptance preflight before dispatch.

## Viewports and minimums

CSS pixels describe the actual content viewport, not a handset's physical screen.
Test the default geographic and supported reference-battle hosts. Legacy routes
need an explicit later scope decision; do not silently alter their rules or claim
responsive coverage from sharing a stylesheet. Every supported live setup, file,
help, game and result surface must be considered, not only an idle board.

| Proposed viewport | Role / required layout | Required checks |
| --- | --- | --- |
| 320×568 | Minimum ordinary portrait | All actions and four navigation destinations fit/reflow; map focus/list enables each legal choice |
| 360×640, 390×844, 430×932 | Representative portrait | Full human turn, Raid, required amounts, logs/totals, setup/files/help |
| 568×320 | Minimum ordinary landscape | Compact full-width map + explicit choice view; no forced rotation |
| 640×360, 667×375 | Narrow short landscape | 48px header + 64px strip, focused map and scrollable Current choice with all six attack commands |
| 844×390, 932×430 | Wider phone landscape | Side-action layout, safe cutouts, canvas input and visible confirmation |
| 768×1024, 1024×768 | Tablet orientations, included in the selected scope | Side panel, focused map, full flows, intact drafts and history through rotation |
| 800×540 | Retained earlier landscape contract (#96/T51) | Current-game flows, focus/list and essential actions remain usable; no full-rules completion claim |
| 1280×800, 1920×1080 | Existing desktop regression sizes | Current protected flows, panel hiding/reclaim, source state and graph unchanged |
| 680px and 1100px width boundaries ±1px; 320/500/600px height boundaries ±1px | Layout seams | No duplicated controls, stale handlers, focus loss or unexpected action at a transition |
| Available height 240px (e.g. keyboard/browser UI) | Reduced-height fallback, not ordinary simultaneous-map minimum | Scrollable Current choice + Map return; confirm, Pause/Resume and errors reachable |

Below 320px content width, require readable reflowing control/help/file views and
a pannable map/list escape path; do not promise simultaneous-map play. Below the
ordinary height minimums use the explicit Map / Current choice arrangement. A
device is not rejected merely because browser chrome or the keyboard shrinks the
visual viewport. Any hard lower bound discovered later requires an owner decision,
not a clipped-button release.

## Interaction, accessibility and space

- **Targets:** propose at least 44×44 CSS px for standalone touch controls and list
  actions, with 8px separation where adjacent actions can cause a different
  commitment. Map polygons are the explicit exception: zoom, Inspect and named
  candidates/list supply equivalent reachability without overlapping fabricated
  hitboxes. No claim that 46 regions fit as 44px targets in an overview.
- **Text:** target 16px primary control/body text at default scale; focused map
  identity/count information at least 14px apparent size or equivalently exposed
  in the context/list. Owner judges map density separately. Full names, counts,
  phase and confirmation labels wrap rather than vanish behind ellipses.
- **Contrast:** proposed minimum 4.5:1 for ordinary text and 3:1 for large text and
  essential nontext boundaries/focus indications. Verify computed colours and
  representative screenshots later. Distinguish owners by shapes/text as well as
  colour; distinguish source, candidate, chosen target and disabled state without
  animation or hue alone. This is a design target, not a WCAG certification.
- **Keyboard:** reach all nav/actions, map controls, country list and visible
  country activation by Tab/Enter/Space; retain ordered arrow country navigation.
  A horizontal toolbar uses Left/Right, a vertical one Up/Down, with Home/End.
  Focus follows the same logical control/region after layout change, scrolling it
  into view without activating it. During attack, map Enter/Space only selects a
  source/target; Enter/Space on Attack performs one exchange. Placement retains
  Place 1. Auto-repeat cannot cause repeated game actions. No essential
  hover/long-press gesture.
- **Attack commitment:** selecting a target by map, candidate list or keyboard
  changes only the staged UI pair. Attack freshly checks legality, pause and
  required-phase gates before one existing exchange. Fight on is disabled until
  the first explicit Attack on that pair; a changed pair or loaded match clears
  its confirmation. Stale/illegal pairs cannot act. No pan, resize, modal close,
  focus restoration or pause/resume commits combat or starts Fight on.
- **Escape:** closes the top reading surface and restores a visible opener; only
  a subsequent explicit Escape may invoke the current controller's cancellation.
  Required choices remain pending. A closed/removed opener uses a visible phase
  prompt fallback, including after load. Coordinate this with existing #195 work.
- **Touch and camera:** drag/pinch never dispatch a region action on release;
  Zoom/Fit/Focus work by button/keyboard without multi-touch. For non-drag spatial
  navigation, Countries → Inspect → Focus selection, or keyboard country focus
  followed by Focus, reveals the intended region; this does not promise free pan
  buttons. Fit/focus preserve engine selection. Reject accidental click-through
  when closing a surface.
  The accessible list can choose every region even at a small/ambiguous polygon.
- **Zoom:** browser zoom stays enabled; game-camera zoom is separate. At 200%
  browser zoom retain all functions and visible focus; at 400% verify reflowing
  text/control views at an effective 320px width. The spatial map can pan in two
  dimensions, while its equivalent list/controls need only vertical scrolling.
- **Insets and keyboard:** use actual safe areas on all edges, including landscape
  cutouts; propose synthetic 24px top/34px bottom and 44px left/right cases, then
  real-device checks. Dynamic browser bars/virtual keyboard must resize the
  available area, not cover the last action. Focused amount input, error, confirm
  and Resume remain scrollable into view. Do not rely solely on fixed `100vh`.
- **Overflow:** no unintended horizontal document scroll at matrix sizes; map pan
  is confined to its canvas. Each reading/choice view has one clear vertical
  scroll owner and a reachable header/return. Long history, five cards, max-length
  current names, three-digit counts and validation errors must not push required
  confirmation outside an inaccessible clipped ancestor.
- **Motion and announcements:** honour reduced motion for flashing/marching/zoom
  transitions. Announce active seat, required choices and meaningful results
  without narrating every pan/hover or repeatedly stealing focus during AI play.
  Verify actual screen-reader order/names later, not only ARIA presence.

## State invariants across resize, surfaces and orientation

Before/after a UI-only transition, future checks compare an exact engine snapshot
or versioned export: map/topology/geometry, owners, armies, centres, phase/current
seat, pool, card state, pending capture/discard, result, full action history/logs
and all RNG streams are identical. Layout does not cause redeal, replay, resave
migration, turn advance, random draw or action dispatch.

Separately compare UI state: staged source/target, same-pair Attack confirmation,
Raid selection, move mode, amount
drafts (including temporarily invalid text), selected set/viewer projection,
reward acknowledgment status, running/paused battle state, playback pause/speed,
threshold, optional surface, keyboard focus identity and both history reading
positions/follow-latest flags. Camera retains world-space centre and scale,
clamping only if needed to keep the map recoverable. A newly fitted viewport is
not permission to clear selection or silently reset a numeric draft.

An active AI or battle is an exception only to **elapsed game time**, not to UI
continuity. Freeze the clock or pause for exact resize comparisons. In a separate
running case, compare with the same schedule without resize: no duplicate timer,
extra exchange or skipped acknowledgment. Pause must be reachable while AI plays;
while paused all game-changing choices wait, including required confirmation.
Read-only navigation/files remain available according to current controller
semantics. Loading a different match is an explicit state replacement: close stale
surfaces, invalidate old actions, focus a visible entry point and use the loaded
map's camera bounds. Do not require a prior match's source/draft to survive load.

## Future click-driven browser scenarios

These are proposed tests to write under separately authorized implementation.
Use legal deterministic fixtures, real clicks and the engine as an independent
action oracle; do not bypass a required choice with DOM removal or direct state
edits. Every new behavioural check must fail when its protected behaviour is
removed. Preserve unchanged rules/state assertions, layout guards and relevant
goldens. Under the D3 implementation contract, replace obsolete immediate-enemy-
tap expectations with unchanged pre-Attack snapshots and explicit commitment checks.

| ID | Click-driven scenario | Observable pass condition |
| --- | --- | --- |
| A1 | Open current setup on portrait, change current seed/seat options, Start; open files/help then return | Correct game identity; every field/action reachable; no lost state or hidden confirmation |
| A2 | Skip/Trade a legal set, Place 1 through canvas/list until pool zero, Start combat, select source/target by map/list/keyboard, then press Attack; Stop/continue | Exact core/history/RNG snapshot unchanged by target selection; Attack adds exactly one existing exchange; fresh gates reject stale/illegal/paused choices; Fight on waits for that first explicit Attack and pair changes reset it; inspect/pan/resize/closure do not commit |
| A3 | Reach a real capture, type a legal non-default amount, rotate, open Totals/History, pause/resume, return and Confirm | Exact draft, source/target and limits survive; no confirmation while paused; exactly one capture-move action afterward |
| A4 | Enter friendly move, select a legal source with maximum at least 2 and adjacent owned destination, choose non-default amount, resize/cancel/re-enter/commit | Draft/focus continuity until explicit cancel; Cancel changes no core state; Move and end turn performs one legal move/handoff |
| A5 | Trade Raid, close/fold cards, pick enemy by map and list, inspect preview, reopen card surface, Confirm | Actual map target is hittable; target persists; no modal intercept; exactly one raid action; Shield/result notice correct |
| A6 | Reach full-hand discard then reward; try Map/Escape/resize and advance clock | No new card revealed before chosen discard, no hidden hand leak, no skipped reward Continue or duplicate draw |
| A7 | End turn to AI, Pause from each layout, open History/scroll old entries, change speed, rotate, Resume | Paused exact state stable; running schedule matches control; complete history/totals remain available and reading position preserved |
| A8 | Zoom/focus a tiny region, pan across a crossing, use candidate picker/list and keyboard alternatives | Intended region/action reached with correct graph legality; no guessed nearest action; no rule action from camera or repeat key |
| A9 | At keyboard/zoom/safe-area sizes edit invalid then valid capture quantity, reach confirm and return to map | Error and pending draft persist; no clipping; focus visible; keyboard dismissal/rotation never commits |
| A10 | Load a different legal match while a surface is open; try a retained stale control; reach human-loss/result and files/new game | Old action cannot affect loaded match; visible focus; required Watch/Stop/result paths and full logs/totals preserved |
| A11 | Hide/restore desktop panels and click regions near each toolbar/button/SVG child; cross all layout seams | Region hit belongs to region where expected; toolbar stays in allocated chrome; reclaim measured; no duplicate IDs/handlers |

Screenshots should cover idle overview, focused source/target, capture, full-hand
cards, Raid targeting, long History, setup/files/help, loss/result and keyboard
fallback at representative sizes. Browser automation can check layout bounds,
actual element hits, state equivalence and click flows. Native pinch ergonomics,
mobile keyboard/browser chrome, assistive technology and comfort require device
checks; synthetic viewport resizing alone cannot establish them.

## Owner appearance decisions and planning self-audit

Owner D1–D3 are settled in DECISIONS. D4 remains later owner judgment of whether
a focused map explains geography, counts and crossings;
whether the dock leaves enough map with the **attack** dock's 160px/212px context
budgets as well as placement; whether required choices feel unavoidable without
blocking inspection; whether staged selection and explicit Attack are clear;
and whether tablet/desktop density and original visual character are acceptable.
Low-fidelity approval cannot approve final typography, colours or gesture feel.

T77 semantic self-audit: **DW1** is addressed by the source-qualified assessment,
retain/change/omit table, selected D1–D3 direction, meaningful alternative, pinned
manual, preserved gaps and separate #181 classification. **DW2** is addressed by
all four form-factor sketches plus staged Attack, capture, cards, target/list and
keyboard views with explicit space/overflow. **DW3** is addressed by this
viewport/interaction/state/scenario contract, the full-scope dependency sequence
and bounded unscheduled sibling spike. File-presence and whitespace commands
are recorded in the author handoff; they do not prove design quality or runtime
acceptance. D1–D3 are recorded; implementation and D4 actual appearance acceptance
remain separate. The historical independent review predates the selected D3
change; this update claims no new review or runtime validation.
