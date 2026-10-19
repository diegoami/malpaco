# Original low-fidelity screens

All diagrams and dimensions are **[designed]**, drawn for this proposal. They are
not Pro screenshots, product assets, executable prototypes or measured layouts.
Lettered regions stand for arbitrary current map regions; their arrangement is
not a new map. `[...]` denotes a control. Drawings omit decorative styling.

The map stage is flexible. Budgets below subtract header/dock/panel and safe
areas; an 8px canvas inset then reduces each map dimension by 16px. **Canvas
allocations below are before map-tool rows**: reserve another 44px height for one
tool row, or 88px for two, outside region hit areas. These illustrations describe
default text size. Enlarged text grows the chrome and uses the scrollable/
low-height arrangement rather than clipped controls.

## Phone portrait: 390×844 CSS px

**Placement view below.** Example safe areas: 24px top, 34px bottom. Available
area: 390×786. Header 56px,
dock 144px (88px context/actions, 56px navigation), leaving a **390×586 map stage**
and about **374×570 canvas**. This is available canvas, not land coverage or a
claim that the fitted board's labels are readable. At 320×568 with zero insets,
the same budget leaves a 320×368 stage; focus/list access is essential. After map
tools, uncovered map space is about 374×526 in the illustrated phone, or 304×264
at the minimum with two tool rows.

```text
┌──────────────────────────────────────┐
│ top safe area                        │
├──────────────────────────────────────┤
│ Seat 1 · Place 7             [Pause] │ ← active phase always visible
├──────────────────────────────────────┤
│ [+] [−] [Fit] [Focus]    [Countries] │ ← map tools, 44px targets
│                                      │
│   A▱ 8 ─── B◇ 3                      │
│      \       ╲                       │
│       C○ 2    water crossing          │
│                    D⬡ 12             │
│                                      │
│   fitted overview OR zoomed region    │
│   canvas pans here, not the page      │
│                                      │
├──────────────────────────────────────┤
│ A · Seat 1 · 8 armies · Group West    │
│ Tap owned region: place 1   [Inspect] │ ← action/context, 88px total
├─────────┬────────┬─────────┬──────────┤
│ [Cards] │[Totals]│[History]│  [Menu]  │ ← labelled, no hidden swipe
├─────────┴────────┴─────────┴──────────┤
│ bottom safe area                     │
└──────────────────────────────────────┘
```

The map toolbar may use two compact rows at 320px; it occupies reserved canvas
edge space and must not steal a region hit. It does not float over confirmations.
Dock text wraps; no essential label is ellipsized. At pool zero the context area
shows “All placed” and Start combat. **Attack uses a taller dock**, including
Move armies and End turn alongside the four battle/inspection commands:

```text
390px attack dock — replaces the 88px placement context:
│ A 8 → B 3 · Tap enemy: one exchange  │ ← counts/prompt: 48px
│ [Once]      [Fight on]      [Stop]   │ ← three 44px-high buttons
│ [Inspect]   [Move armies] [End turn] │ ← three 44px-high buttons
│ Cards       Totals       History Menu│ ← navigation: 56px

320px attack dock — wider labels get two columns:
│ A 8 → B 3 · one-exchange tap prompt  │ ← counts/prompt: 48px
│ [Once]                 [Fight on]   │
│ [Stop]                 [Inspect]    │ ← three 44px-high rows
│ [Move armies]           [End turn]  │
│ Cards       Totals       History Menu│ ← navigation: 56px
```

At 390px the attack context is **160px**: 48px text + two 44px rows + 8px
between rows + 16px combined outer padding. With navigation the dock is 216px,
leaving a **390×514 stage**, **374×498 canvas**, about **374×454 uncovered map**
after one tool row and the same safe areas. The 586px stage above is placement
only. At 320px the attack context is **212px**: 48 + three × 44 + two × 8 + 16.
Dock 268px plus header 56px leaves a **320×244 stage** at 320×568 with zero
insets, **304×228 canvas**, about **304×140 uncovered map** with two tool rows.
This is a constrained focused view, not full-board readability. Longer text or
larger type opens the scrollable Current choice view; never shrink touch targets
or omit Move armies/End turn to recover map area. Owner D4 must judge this tradeoff.

## Phone landscape: 844×390 CSS px

Example horizontal cutout insets: 44px on both sides; bottom inset 21px. Available
space 756×369. A 48px header and 256px side action area with an 8px divider/gap
leave a **492×321 map stage**, about **476×305 canvas**. Touch targets retain their
size. One tool row leaves about 476×261 uncovered map space. Context/action
content scrolls vertically; Pause and navigation do not.

```text
┌───────┬───────────────────────────────────────────────────────┬───────┐
│ safe  │ Seat 1 · Attack                              [Pause] │ safe  │
│ inset ├──────────────────────────────┬────────────────────────┤ inset │
│       │ [+] [−] [Fit]    [Countries] │ A▱ 8 → B◇ 3            │       │
│       │                              │ Tap enemy: 1 exchange │       │
│       │ A▱ 8 ───── B◇ 3              │ [Once] [Fight on]      │       │
│       │     \                        │ [Stop]   [Inspect]     │       │
│       │      C○ 2      D⬡ 12         │ [Move armies]          │       │
│       │                              │ [End turn]             │       │
│       │                              │ action body scrolls ↕  │       │
│       │                              ├────────────────────────┤       │
│       │ map can pan/zoom             │ [Cards] [Totals]       │       │
│       │                              │ [History] [Menu]       │       │
│       ├──────────────────────────────┴────────────────────────┤       │
│       │ bottom safe area                                     │       │
└───────┴───────────────────────────────────────────────────────┴───────┘
```

All six attack commands are in the side action body; Move armies and End turn
use full-width rows. The map stage stays 492×321 because this panel scrolls
instead of growing across the map. Reserve about 104px for two navigation rows;
the remaining 217px action viewport scrolls the roughly 264px counts/command
content (48px text + four 44px rows + three 8px gaps + 16px padding).

At every landscape width below 680px and height 320–500px there is insufficient
width for this panel: retain a full-width map,
48px header and 64px compact context/More strip, leaving a **568×208 stage** before
insets. More exposes the four named destinations; “Current choice” exposes full
controls, including Once/Fight on/Stop/Inspect and Move armies/End turn in one
scrollable view. The same 48+64 rule leaves stages of 640×248 at 640×360 and
667×263 at 667×375, with about 624×188 / 651×203 uncovered after padding and one
tool row. In target-selection mode keep the named selection and Confirm in the
strip; long copy belongs in the choice view. The map is a focused view, not a
tiny fitted board promised to be readable. With zero insets, an 8px canvas inset
and one tool row leave about 552×148 uncovered map space in this short layout.

## Tablet portrait and landscape

At 768×1024 with no example insets: header 56px, side panel 320px + gap 8px leaves
a **440×968 stage**, about **424×952 canvas**. A wide-aspect board will letterbox
in that tall area; focus mode is the useful playing view. At 1024×768 the same
composition gives a **696×712 stage**, about **680×696 canvas**. One map-tool row
leaves about 424×908 / 680×652 uncovered map space respectively. This is one
layout responding to space, with camera state preserved when rotating.

```text
┌────────────────────────────────────────────────────────┐
│ Seat 1 · Attack                                [Pause] │
├─────────────────────────────┬──────────────────────────┤
│ [+] [−] [Fit] [Countries]   │ ALL FOUR SEATS           │
│                             │ 1▱ armies / land / cards │
│        A▱ 8                 │ 2◇ armies / land / cards │
│       /    \                │ 3○ armies / land / cards │
│    C○ 2    B◇ 3             │ 4⬡ armies / land / cards │
│             \               ├──────────────────────────┤
│              D⬡ 12          │ Current action           │
│                             │ A → B / counts / outcome │
│  focused group with          │ [Once] [Fight on] [Stop] │
│  relevant route endpoints    │ [Move armies] [End turn]│
│                             ├──────────────────────────┤
│  selected-country full       │ History / event reading │
│  identity in context panel   │ independent scroll ↕    │
│                             ├──────────────────────────┤
│                             │ Cards Totals History Menu│
└─────────────────────────────┴──────────────────────────┘
```

The side panel may scroll its current action, never the whole fixed header out
of reach. Optional Cards/History/Menu replace side-panel content; Return to current
choice stays at its top. Totals expand to full names rather than hiding columns.

## Desktop: 1280×800 and 1920×1080

For the broader design, a 56px header and 360px panel + gap 8px leave **912×744**
and **1552×1024** stages respectively; inset canvases are **896×728** and
**1536×1008**, or about **896×684** / **1536×964** uncovered after a tool row.
Existing 0.1.1 appearance can be retained for the bounded portrait
slice. Do not rebuild the map merely to fill a differently proportioned pane.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ MALPACO    Seat 1 · Attack      [Pause] [Speed: Normal]       [Menu] │
├────────────────────────────────────────────────┬────────────────────┤
│ [+] [−] [Fit board] [Focus] [Countries]          │ Four seat totals   │
│                                                │ armies / land/cards│
│       A▱ 8 ───── B◇ 3                           ├────────────────────┤
│      /          |                              │ A → B               │
│    C○ 2         D⬡ 12                          │ counts + last result│
│                                                │ Once / Fight / Stop │
│       ORIGINAL GAME MAP / SAME GEOMETRY         │ Move / End turn     │
│                                                ├────────────────────┤
│  selection + legal borders + explicit crossings │ Full battle history│
│                                                │ ↕ reading position │
│                                                │ [All events]       │
│                                                ├────────────────────┤
│                                                │ Cards/Details/Files│
└────────────────────────────────────────────────┴────────────────────┘
```

Hiding the side panel reclaims its space but retains labelled phase controls,
Pause, required-choice return and navigation. The toolbar lives in allocated
chrome, with no interactive region hidden behind its buttons or SVG children.

## Required capture choice: expanded, folded, keyboard shown

The capture overlay below is a **replacement action area**, not a modal over the
target. It grows upward by taking map height when necessary; its body scrolls and
its confirmation remains reachable. Place both involved regions in view only
when the player explicitly chooses Focus; do not fight their camera inspection.

```text
┌──────────────────────────────────────┐
│ Seat 1 · Capture move-in     [Pause] │
├──────────────────────────────────────┤
│      usable map / inspection          │
│      A▱ 8 ───── captured B▱ 1         │
├──────────────────────────────────────┤
│ Required: move armies A → B   [Fold] │
│ [Minimum] [−] [ 3 ] [+] [Maximum]    │
│ Legal amount: controller min…max     │
│ Result: A <count> / B <count>         │
│ [Confirm move-in]                    │
├──────────────────────────────────────┤
│ Cards   Totals   History   Menu       │
└──────────────────────────────────────┘

Folded strip: [Return to capture · 3 chosen]   (no End turn)
Paused strip: [Resume to confirm · 3 chosen]   (confirm disabled)

Virtual keyboard / very short available height:
┌──────────────────────────────────────┐
│ Capture move-in             [Pause] │
│ [Map] [Current choice]              │
├──────────────────────────────────────┤
│ amount + min/max + result preview ↕ │ ← one scroll owner
│ [Confirm move-in]                    │ ← reachable above keyboard
├──────────────────────────────────────┤
│ native keyboard / browser UI         │
└──────────────────────────────────────┘
```

Invalid or unfinished numeric input remains visible with an error; changing
orientation must not silently replace it with a default or commit it. Closing a
reading surface restores the draft and focus to the amount/control. Escape folds
the surface at most; it never confirms or clears the pending engine choice.

## Cards and map-target selection

On portrait, hand entries become readable rows with the existing original card
names/effects, not five compressed illustrated cards. A valid-set action says
what it trades and its effect; current trade dispatch semantics stay intact.

```text
┌──────────────────────────────────────┐
│ Seat 1 · Cards              [Pause] │
├──────────────────────────────────────┤
│ map preview (not needed for a set)    │
├──────────────────────────────────────┤
│ Your hand 5/5           [Back to map]│
│ 1 Anchor   · effect description       │
│ 2 Wild     · effect description       │
│ 3 Anchor   · effect description       │ ← rows scroll if needed
│ 4 Shield   · automatic protection     │
│ 5 Anchor   · effect description       │
│ [Trade named valid set · effect]      │
│ [Skip cards]                         │ ← only when controller allows
├──────────────────────────────────────┤
│ Cards   Totals   History   Menu       │
└──────────────────────────────────────┘

Raid after trade — expanded cards fold away:
┌──────────────────────────────────────┐
│ Seat 1 · Choose Raid target  [Pause] │
├──────────────────────────────────────┤
│ [+] [−] [Fit] [Countries]           │
│                                      │
│     enemy B◇ 3      enemy D⬡ 12       │ ← map hit areas stay usable
│                                      │
├──────────────────────────────────────┤
│ D · Seat 4 · preview from controller  │
│ [Choose from list] [Confirm raid]    │ ← no confirmation behind sheet
├──────────────────────────────────────┤
│ Cards!  Totals   History   Menu       │
└──────────────────────────────────────┘

Nearby/candidate picker (in choice area):
  “Choose the intended region”
  B · Seat 2 · 3 armies     [Inspect] [Choose B]
  D · Seat 4 · 12 armies    [Inspect] [Choose D]
  [Return to map]
```

Discard uses five named “Discard …” actions, no Skip and no preview of the new
draw. Reward uses its existing notice and Continue. Loss uses Watch computers /
Stop game; result uses standings and explicit New game/files/history access.
All use the same action position and required-choice return convention, so these
flows do not need invented mobile-only game rules.
