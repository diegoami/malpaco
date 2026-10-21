# 0.2.0 device report

T88 (#207) records what browser automation has checked for the 0.2.0 interface, what it measured,
what it found and fixed, and every check it cannot make. The owner makes those checks on real
devices at the milestone playtest (#222 Q5), where the A12 ten-country read is also recorded. No
part of this report is an accessibility certification.

## What automation ran

| | |
| --- | --- |
| Browser | Chromium from Playwright 1.63, in the pinned CI image `mcr.microsoft.com/playwright:v1.63.0-noble` |
| Devices | None. Viewports are CSS sizes set by Playwright; touch is synthetic mouse and pointer input |
| Assistive technology | None. Accessible names and roles are checked as DOM facts; ARIA presence is not a screen-reader pass |
| Browser zoom | Simulated by the CSS viewport it produces: 200% of 1280×800 is 640×400, 400% is 320×200 |
| Safe areas | Synthetic `--safe-*` insets of 24 px top, 34 px bottom and 44 px left and right; real `env(safe-area-inset-*)` values are untested |
| Virtual keyboard | Simulated as half the viewport height; no real keyboard has been opened |

The suites:

- `tests/e2e/workspace-accessibility.spec.ts` checks:
  - Tab order and a visible focus ring on every corner control and on the countries;
  - arrow keys with Home/End in every icon group, which never act;
  - Escape back to a visible opener, with a pending choice kept;
  - map keys that place one army or only select;
  - no action from key auto-repeat or from a drag;
  - keyboard and single-pointer zoom paths;
  - 44×44 controls at 320×568, 390×844 and 844×390.
- `tests/e2e/workspace-reflow.spec.ts` covers:
  - the acceptance matrix: 320×568 up to 1920×1080, plus 800×540;
  - the width seams 680 and 1100 ±1, and the height seams 320, 500 and 600 ±1;
  - browser zoom at 200% and 400%;
  - synthetic safe cutouts.
  - At every size it checks:
    - no sideways scroll;
    - every control inside the safe area and clear of the others;
    - no duplicate ids;
    - a reachable Confirm on a pending capture;
    - a capture draft that survives every resize;
    - no game action.
- Earlier 0.2.0 suites:
  - `responsive-shell`: the viewport matrix, the 240 px fallback and safe insets;
  - `responsive-cards`: card choices at phone, tablet and desktop sizes;
  - `responsive-history-playback`: rotation during computer play, and Pause;
  - `responsive-utilities`: setup above a half-height keyboard, files, help and results;
  - `capture-move-responsive`: short-landscape capture and friendly move (E);
  - `attack-confirmation`: Attack commitment (R5);
  - `map-readability`: counts, badges and selection states (A, B);
  - `country-picker`: the list and ambiguous taps;
  - `map-camera`: Fit, Focus, pan and pinch;
  - `contrast.test.ts`: computed contrast.

## Measured results

| Check | Target [designed] | Result |
| --- | --- | --- |
| Standalone touch controls | 44×44 CSS px | All visible overlay and camera controls are 44×44 or larger at 320×568, 390×844 and 844×390 (after the T88 fix below) |
| Count text at Fit | 14 px | At least 14 px on all 46 countries at 390×844, 844×390, 820×1180 and 1280×800 (T87); before T87, 10 px and 7 px on phones |
| Count on its own country (rule A) | Badge centre on own land | All 46 at the same four sizes; no leaders are used, so none can cross |
| Text contrast | 4.5:1 | Counts on badges 12.9:1, selected count 10.2:1, names on their halo 12.9:1 |
| Essential boundaries | 3:1 | Coast on water 11.2:1, coast on shelf 7.1:1, badge outlines 4.4–7.4:1, selection band on each owner colour 4.4–7.4:1, selection lines on the band 10.2–12.9:1 |
| Borders between countries | Owner's look (T93) | 1.4–2.4:1 on the owner colours. Not treated as an essential boundary, because every country also carries its own badge; the owner judges |
| Reduced motion | No transitions | Map transitions drop to a near-zero duration under `prefers-reduced-motion` |

## Defects found and fixed in T88

| Defect | Reproduction before the fix | Fix |
| --- | --- | --- |
| Arrow keys did nothing inside a card's icon row or the map view controls | Focus stayed on the first Attack-card button after ArrowRight | One handler moves focus by arrow, Home and End in the action rail, the map view controls and every card's icon row; number fields keep their own arrows |
| Camera and Countries icons shrank to 40 px wide at 320 px | 40×48 at 320×568 | Icon groups never shrink a control |
| 400% browser zoom on a 1280×800 screen (320×200): the menu and Countries icons overlapped, and the capture card's Confirm could not be reached | Overlap of the two icons; Confirm outside its 40 px card | Below 240 px of height the camera icons run along the bottom edge, and an open card takes the lower band, including the notice slot's space, and scrolls to its Confirm. The approved 240 px layout is unchanged |

#195 cases:

- **R4, focus after a load:** reproduced and fixed in T85, where focus now lands on the menu icon.
- **R5, the restored sidebar keeping `.battle-actions` hidden:** cannot be reproduced. The sidebar was retired in T79, and the attack card's actions render fresh on each open.
- **Headings:** the cards are titled by their labelled regions.

## For the owner's device pass

The automation above cannot certify any of this:

1. **Real phones, both orientations:**
   - iOS Safari and Android Chrome at the phone's own size;
   - the real safe-area cutouts (notch and home bar);
   - browser bars that hide and show;
   - the real virtual keyboard on the capture amount and the seed field;
   - in each case, the last action must stay visible.
2. **Real touch:** tap, drag, pinch and swipe on the map; none acts on release; a two-finger pinch zooms; a tap on a border asks which country.
3. **Screen reader:** VoiceOver or TalkBack on a phone, NVDA or VoiceOver on desktop. Check that:
   - the active seat, required choices and results are announced;
   - computer play does not steal focus;
   - the country list reads names and counts.
4. **Browser zoom at 200% and 400%** on a desktop browser, with the game camera at Fit and zoomed.
5. **Stop game (D):** the label stays visible on the whole unresolved elimination card. This is automated at 390×844 and 844×390; confirm it on a phone.
6. **Capture and friendly move at short landscape heights (E):** automated at 640×360 and 844×390; confirm on a phone held sideways.
7. **Comfort:** whether 44 px targets, 14 px counts and the landscape badge spacing feel right. At 844×390 Fit, five badge pairs touch at their edges.

### A12: identify ten counts at phone Fit

On retained seeds 7 and 1994, with realistic stacks (2-digit, 3-digit and a compact count over
999), read the count of ten countries chosen at random, in portrait and in landscape. Record each
error and any help needed. T89 reports the results.

| Seed | Orientation | Device and browser | Countries read | Errors | Help needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 7 | Portrait | | /10 | | | |
| 7 | Landscape | | /10 | | | |
| 1994 | Portrait | | /10 | | | |
| 1994 | Landscape | | /10 | | | |

## Untested limits

- **Under 320 px wide:** below the acceptance matrix; nothing is promised beyond reflowing menus and an escape path.
- **Under 240 px tall:** at 320×200 the capture card is cramped. Confirm is reachable by scrolling, and Pause stays visible. A firmer lower bound is the owner's decision.
- **Other browsers and settings:** Firefox, Safari and Edge have not been run. Neither has Windows high-contrast or forced colours, nor a larger default font size.
- **Long play sessions on a real device:** heat and battery are not measured.
