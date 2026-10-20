## Recheck of PR #216: revision 7

**Verdict: APPROVE, with follow-ups.** The package is ready for owner sketch review and backlog reconciliation. Revision 7 resolves all nine findings from my [revision-6 review](https://github.com/diegoami/malpaco/pull/216#pullrequestreview-5583483259), and the fixes are consistent with the owner's direction and the existing rules. Four lower-severity issues remain. Under rule 22 none of them blocks, because each is either a drawing correction or something the playable D4 build will expose loudly. Finding A should go into the reconciled acceptance checks.

*This is a COMMENT review only because GitHub does not let the connected account (`diegoami`, the PR's author) approve its own PR. The verdict above is the intended review state.*

**Reviewed:** `82ae510b4bc843f255faea61d0ba230cea7ab1cd` (the live head when this review was posted), as a delta from `cb5c19a`, plus the full package as it now stands.
**Scope:** all of `docs/plans/finished-game-vision/**`; the 93 drawings were rendered and the new or redrawn ones inspected. I also reviewed the `release-0.2.0.md` diff and the `RUN-NOTES.md` append.

Static concepts still prove nothing about beginner success, pacing, AI challenge or parity with *Isle Wars Pro*.

### Resolution of the revision-6 findings

| # | Finding | Status at `82ae510` |
| --- | --- | --- |
| 1 | Counts hidden at rest; owner cue unreadable without colour | **Resolved.** The owner's explicit decision ("Keep army counts visible on every territory, including at rest") is recorded in DECISIONS.md, and AUTHORITY.md now carries ui-057/061/082 (pool)/084. Every overview has 46 owner-shaped badges with text of 14 px or more. The placement pool is a separate icon plus number (`02-place`). Countries outside the current choice are dimmed (`05-target`, `ordinary-turn-*`). Place 1 is unchanged. |
| 2 | Icon collisions | **Resolved.** End turn is a flag and Fast-forward a double chevron. Fit uses outward arrows and Focus a crosshair. Start game, Start combat and New game have three different glyphs. Fight-on Stop is a hand. |
| 3 | Selected source not visible | **Resolved.** The source badge turns gold as soon as it is selected. Other countries dim. An arrow runs from source to target for the staged pair (05, 06). |
| 4 | Late-game and result contradictions | **Resolved.** The late game shows "Domination · 34 / 35" with 34 blue and 12 orange countries. The result reads "Domination · 35 of 46". The landscape label sits inside its card. The new semantic checks in the helper pass. |
| 5 | Cards covering islands | **Resolved for wide layouts.** My independent land-sampling check finds **0%** of land covered in every active desktop and tablet scene, down from up to 85% (the view is reframed to make room). Phone landscape still covers the peripheral right island, which is a declared exemption; see E. |
| 6 | Friendly move and elimination missing | **Resolved.** New drawings cover own-neighbour Move or Cancel, a move preview of 8/4 → 5/7, and Move & end turn. This matches core-rules-082 (one move, which ends the turn) and ui-089 (the confirm control says it ends the turn). Elimination offers Watch / Stop. Both appear at five sizes and in the walkthrough. |
| 7 | Capture preview looked committed | **Resolved.** Pending counts use dashed badges. |
| 8 | Repeated forms and sliver regions | **Resolved as a caption and brief change**, as I suggested. The fixed board is labelled as not demonstrating variety. The generation brief now names minimum region thickness, badge space and hit areas as co-constraints. |
| 9 | Centre marks covered | **Resolved.** Centre marks are offset, with leader lines, and the helper checks the separation. |

Tablet landscape (1024×768) has been added, and the capture draft is shown in both tablet orientations as a rotation reference.

### Remaining findings, in priority order (non-blocking)

**A. Medium (design defect, phone Fit only). Badges float off their countries; some sit on a different country.**
- *Files:* `sketches/quiet-map-phone-portrait`, `quiet-map-phone-landscape`, `late-game-phone-*`, `walkthrough/18-fit`, `walkthrough/23-elimination`.
- *Player's goal:* read the whole archipelago's strengths from Fit on a phone.
- *Evidence:* I tested in Chromium whether each badge's centre falls inside its own country's land. "On another country" means the badge centre sits on a different country's land.

  | Drawing | On own country | In the sea (with leader line) | On another country |
  | --- | --- | --- | --- |
  | Both phone quiet maps | 17 of 46 | 23 (leader lines up to ~100 px) | **6** |
  | Desktop and tablet quiet maps | 37–38 | 7–8 | 1 |

  - The six phone cases are countries `0-1, 1-0, 1-1, 6-1, 7-1, 8-3`; the late-game phone views have the same six.
  - The desktop and tablet case is country `6-1`: a lime hexagon "1" drawn over purple land on the bottom-left island.
  - On the portrait overview the badges also cover much of the geography; the top-left island is almost hidden.
  - The helper checks badge-to-badge overlap, but not whether a badge sits on the wrong country.
- *Consequence:* in the phone overview, a player can attribute a count to the wrong territory, which is a tactical misread. The organic geography the owner prioritised is also obscured where it is smallest.
- *Smallest correction (keeps counts on every territory):*
  1. **Placement rule, enforced by the helper and later by Playwright:** a badge centre lies on its own country, or on open sea with a leader; never on another country's land; leaders never cross other badges or leaders.
  2. On phone Fit, use a smaller count chip, for example 14 px text in a 20–22 px owner shape. Place it inside each country wherever it fits, and draw leaders only for the rest.
  3. Add "attribute each count on phone Fit" to the D4 tests.

  Real generated geometry with minimum region thickness (finding 8's brief) is the root fix.

**B. Low–Medium (missing evidence). Every count in all 93 drawings is a single digit.**
- *File:* `draw-sketches.py:267` assigns counts as `1+(i*3+j)%8`, so every value is 1–8.
- *Evidence:* there are no 2- or 3-digit values and no compact value. That includes the late game, where blue holds 34 countries. ui-062 requires values up to 999 in full and a compact form beyond that.
- *Consequence:* badge width, overlap and Fit density are validated only in the easiest case. Realistic mid- and late-game stacks widen badges and make A worse. The repeating 1, 2, 3… sequence on each island also reads like country numbering.
- *Correction:* give at least the quiet map and the late game a realistic spread of values, including 2- and 3-digit stacks and one compact value, then re-run the badge checks.

**C. Low (crosswalk omission). Two existing UI contracts are superseded in practice but not named.**
- *Contracts:* ui-077 ("always visible: active seat, six phases, remaining action in words") and the ui-054 result-screen contents.
- *Evidence:* both are superseded by U3/U5, since the status bar and result details are now on request. `AUTHORITY.md` names ui-057/061/082/084 by id, but not these two.
- *Correction:* add both to the crosswalk as amended by U3/U5, naming what replaces them: the pool icon, the phase-action icon, active-seat notices, and requested standings and details.

**D. Low (icon meaning). The hand glyph means two different stops.**
- *Files:* `walkthrough/09-fight-on`, `23-elimination`.
- *Evidence:* the same hand stands for "Stop" (end a Fight-on run, harmless) and "Stop game" (end the match).
- *Correction:* use an exit or door glyph for Stop game, or keep that card's label permanently attached.

**E. Low (visual clutter, phone landscape).**
- *Files:* `capture-phone-landscape`, `friendly-move-phone-landscape`.
- *Evidence:* the card covers the peripheral right island (an accepted exemption), but that island's leadered badges still float around the card's edges, detached from any visible land.
- *Correction:* hide badges whose countries are fully under the card, or reframe as the wide layouts already do.

### Owner direction check

- **Full viewport, vivid colours, no permanent chrome:** preserved.
- **Prose temporary, numbers permanent:** consistent with the owner's explicit count decision.
- **Portrait rotation and Fit returning to all nine islands:** preserved. In every overview, all 9 coasts sit inside the viewport.
- **Flavour deferred:** preserved.
- **Place 1 and explicit Attack:** preserved, and Move is now explicit as well.
- **Geography:** the variety requirement is stated, but the drawings do not demonstrate it.
- **Copied predecessor material:** none found.

### Validation performed

- **Isolated checkout.** I used a sparse worktree at `82ae510` and re-confirmed the live head before posting.
- **Regeneration.** All three drawing scripts produce **byte-identical** output, with no working-tree change.
- **Hashes.** `validation/revision-7/sketch-sha256.txt` passes 93/93.
- **Renderer.** The revision-7 helper (Chromium 1194) reproduces `render-report.json` exactly. That covers 93 screens and 49 rotated views, with every check empty: overflow, coast clipping, badge overlap, panel-land overlap, centre overlap, count failures and semantic failures.
- **My own checks.** I ran the land-coverage and badge-placement measurements above, and visually inspected the redrawn scenes at all five sizes (gallery and walkthrough 02–23).
- **Archived review.** The copy of my earlier review in `reviews/claude-cloud-2026-10-20/REVIEW.md` (sha256 `76de38fb…`) matches what I posted, apart from a trailing newline. `RESPONSE.md` accurately maps each finding to its change.
- **Scope.** The revision-2 to revision-6 and root receipts are unchanged. `RUN-NOTES.md` is append-only. Outside the package, only `release-0.2.0.md` and `RUN-NOTES.md` change. There are no product, rule, Done-when or dependency changes.

### Limitations

- I could not verify the owner's quoted count decision independently; I rely on its record in DECISIONS.md.
- I ran no playable build or user test, and accessed no isle-wars-archaeology material beyond the inventoried citations.

### Hands-on tests still required (D4 and full matches)

1. **Phone Fit, portrait and landscape, on a real generated seed with realistic stack sizes.** Can a player name the count for 10 random countries without error?
2. **Uncoached first match on a phone.** Time to the first deliberate Attack. Mis-taps on the flag (End turn), on Fast-forward, and on Move & end turn.
3. **Gestures never commit actions.** A drag or pinch released over a country must never place, attack or move. Rotate in the middle of target selection, the capture draft and the move draft.
4. **Short landscape at 240 px of available height, and 320×568.**
5. **Greyscale or colour-blind simulation, plus enlarged text, at Fit and at focus,** including dimmed states: dimmed lime and orange become dark olive and brown.
6. **Full matches at each difficulty, with domination on and off.** Late-game effort, waiting during opponent turns, and whether Changes explains losses.
7. **Elimination, then Watch or Stop, then a deliberate New game.**
8. **Retained generated seeds judged for believable, varied geography,** region thickness, badge fit and hit areas.


---
_Generated by [Claude Code](https://claude.ai/code)_
