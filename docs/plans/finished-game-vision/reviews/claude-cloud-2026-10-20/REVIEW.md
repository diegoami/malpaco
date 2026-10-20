## Independent review of PR #216: finished-game vision, revision 6

**Verdict: changes needed (REQUEST CHANGES).** The direction is sound and most of the owner's requests are visible in the drawings. Before owner sketch approval and backlog reconciliation, two high findings need correcting. First, the resting map silently drops approved count and owner-cue contracts. Second, the icon set uses one glyph for both End turn and Fast-forward. The medium findings are mostly drawing corrections.

*This is a COMMENT review only because GitHub does not let the connected account (`diegoami`, the PR's author) request changes on its own PR. The verdict above is the intended review state.*

**Reviewed:** `cb5c19aae54334c6b121a0798155accd1fe2a953` (the live head when this review was posted; no later pushes), against base `e8e3f908`.
**Scope:** `docs/plans/finished-game-vision/**` (README, DECISIONS, OWNER-REVIEW, SKETCHES, BEGINNER-WALKTHROUGH, GEOGRAPHY-REFERENCES, AUTHORITY, VALIDATION, the three drawing scripts and the revision-6 helper). I looked at all 40 gallery renders, all 20 walkthrough frames and the geography studies. I also reviewed the `docs/plans/release-0.2.0.md` diff and the `RUN-NOTES.md` append. These are static concepts. Nothing here can show that a beginner succeeds, that pacing is enjoyable, that the AI is challenging, or that the game matches *Isle Wars Pro*.

### What the design already supports well

- **Combat is never triggered by accident.** Choosing a source, a target and then Attack are separate steps (frames 04–06). Cancel is placed apart from Attack. Selecting countries never rolls dice. Fight on appears only after the first explicit Attack (07).
- **Capture odds are labelled honestly.** "91% capture · if fought to end" is not the chance of winning the next roll. I re-derived the rounded values: 233/256, 247/256 and 15/16.
- **Battle feedback goes both ways.** Frames 07 and 08 show an enemy loss and a human loss, each with dice and the count change.
- **The capture panel is efficient.** It offers direct entry, −/+ and a slider. Fold keeps the draft and adds a separate return action, and Check is the only commit (10–12).
- **Opponent turns can be followed.** The scene shows the active seat and phase, the local change (+3), Pause and Fast-forward. When the human turn returns, a Changes action recovers what happened without a permanent log (15–16).
- **Icon names are reachable by tap** (19). New game is named on the result (20).
- **The quiet maps contain no text and keep all the requested chrome rules.** There is no header, dock, sidebar or log. Colours are vivid, and the four seat hues are well separated in colour.
- **Fit genuinely contains the archipelago** in every overview drawing (see Validation).

### Findings, in priority order

**1. High (design defect and contradicted contract). The resting map hides every army count, and its owner cue is too small to read without colour.**
- *Files:* `sketches/quiet-map-*` (all devices), `walkthrough/02-place`, `walkthrough/17-inspect`, `sketches/inspection-*`; the policy text is `README.md:67` and `DECISIONS.md:27` (U5).
- *Player's goal:* read the fronts and decide where to place reinforcements (Place 1), then pick a battle.
- *Evidence, counts:* at rest, no country shows its army count. Counts appear only on the selected or focused island, or after Menu → Inspect armies.
  - Frame 02 asks the beginner to place their last army with exactly one count visible ("7"). They cannot see the enemy stacks that decide where it should go.
  - Frame 17 says "Compare fronts", but counts appear only on one island. The other visible islands still show no numbers.
- *Evidence, owner cue:* the only owner cue at rest is a glyph about 5–8 px across. In a greyscale crop of `quiet-map-desktop`, blue and purple fills come out almost the same grey, and the circle and hexagon glyphs cannot be told apart.
- *Evidence, pool:* the placement pool appears only inside a first-use hint, which is meant to clear. Frame 16 ("Your turn · place armies") shows no pool.
- *Contradicted contracts:* this contradicts approved canonical-design requirements in `docs/plans/new-game/rules-inventory-ui-*.json`:
  - ui-061: every country shows its stack, readable at a glance, at ≥14 px (tasks T25/T26/T36/T43/T51/T52).
  - ui-057: owner shown by colour **and** the badge shape that holds the count; readable in greyscale.
  - ui-082: the pool left is always shown during placement.
  - ui-084: when choosing a battle, other countries are dimmed.

  `AUTHORITY.md:61` lists only T79/T84–T88 for amendment, so these are being overridden silently.
- *Owner direction:* U5 concerns text and prose. The owner never decided whether army **numbers** count as that text, so the drawings settled an open design question by themselves (rule 13).
- *Consequence:*
  - Every placement or attack decision needs a Menu → Inspect → Close round trip, or blind selection. With Place 1, that repeats for every army placed.
  - Fronts cannot be read at a glance, which undercuts the package's own *Isle Wars Pro* bias toward "readable fronts" (README §7).
  - Colour-independent ownership is not met at rest.
- *Smallest correction:*
  - Put this to the owner explicitly. My recommendation: keep compact owner-shaped count badges on every country at rest. They are numbers, not prose, and the resting map stays free of words. The overview size should meet the existing count minimum, or a declared zoom threshold. Show the placement pool as an icon plus number while placement lasts.
  - If the owner instead chooses hidden counts, record amendments to ui-057/061/082/084 in `AUTHORITY.md`. Then show how a placement decision gets the counts it needs without the menu round trip, for example counts visible throughout the placement and combat phases.

**2. High (design defect). One icon glyph means both End turn and Fast-forward, and several other glyphs collide.**
- *Files:* `draw-sketches.py:21`, `:249` and `:296`; `draw-beginner-walkthrough.py:107` and `:120`. Seen in `walkthrough/13-end`, `15-computer`, `sketches/computer-turn-*`, and the bottom-right icon of the quiet maps.
- *Player's goal:* skip waiting, or end the turn deliberately.
- *Evidence:*
  - **End turn and Fast-forward are the same `'end'` glyph (→|).** A player learns →| as "skip ahead" during opponent turns. Later they may tap the same glyph during their own turn's feedback and end the turn, which cannot be undone. The UI is icon-only, and the name appears only in hints or help.
  - **Fit and Focus look reversed.** Fit (`:20`) is a corner frame with "+", and Focus (`:34`) is a corner frame with "−". Both sit beside separate −/+ zoom buttons (frame 18), so Fit reads as zoom-in and Focus as zoom-out.
  - **▷ means several things.** It is used for Start game, Start combat and New game, directly below a ‖ Pause icon, where it reads as play/resume.
  - **Stop's square looks like an owner badge.** Stop is a filled square (`:31`), which is the blue seat's owner shape.
- *Smallest correction:* give each action its own glyph.
  - End turn gets a turn-specific symbol (for example a flag or hourglass) that nothing else uses.
  - Fast-forward gets a double chevron.
  - Fit gets an "expand to frame" mark with outward arrows, and Focus a target or crosshair.
  - Start combat uses a combat-family glyph rather than ▷.
  - Stop uses a shape distinct from the four owner badges.

**3. Medium (visible defect). The chosen source is not visibly different while the player picks a target.**
- *Files:* `walkthrough/04-source` → `05-target` → `06-attack`; `sketches/ordinary-turn-desktop`.
- *Player's goal:* confirm which army attacks and which neighbours are legal before choosing.
- *Evidence:*
  - A pixel diff of frames 04 and 05 changes only the hint text area (4,612 px).
  - The eligible-source outline (04), the selected source (05, `data-selection="source"`) and the legal targets (05, dashed) all use the same 2.1 px gold stroke. The dash pattern cannot be distinguished at native size.
  - The source badge gains emphasis only once the pair is complete (06), and source and target badges are then styled identically.
  - No non-legal country is dimmed.
- *Consequence:* a beginner cannot verify the staged pair before Attack, which is the step the explicit-Attack design exists to protect.
- *Smallest correction:*
  - Selected source: a raised or filled badge treatment plus a thick solid outline, shown as soon as it is selected.
  - Legal targets: dashed outline, with the rest dimmed (ui-084).
  - Selected target: its own distinct mark, or an arrow drawn from source to target.

**4. Medium (visible defect). The late-game and result drawings contradict themselves and the stated default goal.**
- *Files:* `sketches/late-game-*`, `sketches/result-*`, `walkthrough/20-result`; source in `draw-sketches.py:158–160` and `:305`.
- *Player's goal:* understand how close victory is and why the game ended.
- *Evidence:*
  - **Wrong remaining count.** Every late-game drawing says "Conquest · 5 remaining" but draws **6** orange countries. The `(i==4, j==1)` override at `:160` makes one extra country orange, and `:305` does not count it.
  - **Win drawn with an enemy left.** Every result says "You won · Conquest", yet one orange country remains. It is visible on `result-desktop`; on phones it is hidden under the card.
  - **Label outside its panel.** In `late-game-phone-landscape`, the text "Conquest · 5 remaining" is drawn outside its panel: the text spans about x 339–505 while the panel sits empty at x 503–758. The renderer checks only overflow past the viewport edge, so it passes.
  - **Unreachable under default rules.** Setup and frame 01 state the default goal "hold 35 of 46". Domination is on by default (core-rules-100, ui-037). The illustrated conquest cleanup (blue on about 40 countries, still playing) and the "Conquest" result cannot happen under defaults: the game ends at 35 at the end of that turn. The existing anti-cleanup mechanism, the domination win, is never illustrated.
- *Smallest correction:*
  - Fix the count and the ownership override.
  - Illustrate the default case: progress such as "34 / 35", and a result reading "Domination · 35 of 46" (ui-052). Alternatively, label these scenes explicitly as "domination off".
  - Anchor the landscape label inside its card.

**5. Medium (visible defect). Contextual cards cover islands during play on desktop and tablet, where open sea is available.**
- *Files:* `sketches/ordinary-turn-desktop`, `capture-desktop`, `computer-turn-desktop`, `inspection-desktop`, `return-to-turn-desktop`, `late-game-desktop`, `capture-tablet`.
- *Player's goal:* keep the whole board in view while deciding, or while watching an opponent.
- *Evidence:* in Chromium, I sampled land points inside each `[data-coast]` against the `[data-layer="context"]` boxes.

  | Drawing | Land under the contextual card |
  | --- | --- |
  | Attack card (`ordinary-turn-desktop`) and `capture-desktop` | ~85% of the bottom-middle island |
  | Opponent turn (`computer-turn-desktop`) | ~67% of the top-middle island and ~51% of the bottom-middle island, while the opponent is acting |
  | `inspection-desktop` | 67% and 76% |
  | `late-game-desktop` | 56% |
  | `capture-tablet` | 65% |

  `SKETCHES.md` itself requires layouts to "avoid covering selected counts and allow access to obscured locations". The renderer's overlap check compares badges with panels, not panels with land.
- *Smallest correction:*
  - Anchor cards in open sea next to the focused pair, or at an edge with the camera offset.
  - Add a panel-versus-land check to the helper for active-play scenes. Setup and result overlays are reasonably exempt.

**6. Medium (missing design evidence for existing contracted flows).**
- *Files:* `BEGINNER-WALKTHROUGH.md`, `SKETCHES.md`.
- *Evidence:* README §3 and #215 step 3 include friendly movement and movement amounts, but no drawing shows them.
  - It is undefined what happens when, after choosing a source, the player taps an **own** neighbour instead of an enemy. A beginner will do this.
  - The only result drawn is a human win. A human loss or elimination with the contracted Watch computers / Stop game (README §7, T30) is not drawn, though it is a likely beginner outcome.
- *Smallest correction:*
  - Add one friendly-move frame showing source → own neighbour, the amount and the commit.
  - Add one elimination result frame, in portrait plus one landscape size.
  - Card trading and events can remain text-only for now, but say so.

**7. Low. The capture preview reads as already committed on the map.**
- *Files:* `walkthrough/10-capture`, `12-resume`, `sketches/capture-*`.
- *Evidence:* the board draws the provisional "4" and "3" as normal badges, and only the card says "Preview".
- *Correction:* draw preview counts as ghosted or dashed badges until Check commits them.

**8. Low. The gallery board repeats forms that the variety requirement rejects, and it contains sliver regions.**
- *Files:* `draw-sketches.py:82`, `sketches/quiet-map-*`.
- *Evidence, repeated forms:* the nine-island board reuses four families. Borneo appears three times, as three similar rounded blobs (top-right, centre, bottom-right). Sicily, Cuba and New Zealand appear twice each. `DECISIONS.md` itself says minor variation of repeated forms does not meet the bar.
- *Evidence, slivers:* elongated islands produce slivers that cannot hold a badge or a ≥40 px hit area (ui-070). Examples are the bottom-middle island at about (650,625) on desktop, and the left-middle island at about 10 px wide in portrait.
- *Correction:* vary the nine forms, or caption the board as not illustrating variety. Name minimum region thickness and badge fit as co-constraints in the GEOGRAPHY-REFERENCES generation brief.

**9. Low. Production-centre marks are covered by other marks.**
- *Files:* `sketches/ordinary-turn-desktop`, `sketches/quiet-map-phone-portrait`.
- *Evidence:* the "4" count badge hides the production-centre mark (ui-067/071), and at overview the centre mark overlaps the owner glyph.
- *Correction:* offset the centre mark from the badge anchor.

### Owner direction check

- **Full viewport:** honoured.
- **Vivid colours:** honoured.
- **Icon actions, with text that appears and clears:** honoured. See findings 1 and 2.
- **No permanent chrome:** honoured.
- **Portrait rotation and Fit:** honoured. Rotation is a consistent clockwise quarter turn in phone portrait and tablet, and Fit returns to all nine islands.
- **Flavour deferred:** honoured.
- **Place 1 and explicit Attack:** preserved. In no drawing does selection or navigation commit combat.
- **Believable, varied geography:** the requirement is stated well in the documents, but the board does not demonstrate it (finding 8).
- **Silently contradicted requirements:** ui-057/061/082/084 (finding 1).

### Isle Wars Pro character, and the limits of this comparison

The package's stated bias toward direct map decisions, large vivid regions, readable fronts and quick local consequences is right. The drawings deliver direct interaction, vividness and quick local feedback. Readable fronts are weakened by finding 1.

I can substantiate predecessor behaviour only through the repository's inventoried, permitted design citations. ui-061 itself states that it is malpaco's design, "not confirmation of predecessor behaviour". I could not verify how the original displayed counts at rest, so I make no parity claim.

No predecessor assets, wording or code appear in the package, as far as I can tell.

### Validation performed

- **Isolated checkout.** I used a sparse worktree at `cb5c19a` (a full checkout exceeded this container's disk allowance) and re-checked the live head before posting.
- **Regeneration.** Running the three drawing scripts produces **byte-identical** output: no working-tree change.
- **Hashes.** `sha256sum -c validation/revision-6/sketch-sha256.txt` passes 65/65.
- **Renderer.** The revision-6 helper, run with Playwright's Chromium 1194, reproduces `validation/revision-6/render-report.json` exactly. That means 65 screens, no overflow, 40 rotated views, no clipped overview coast and no badge overlaps.
- **Fitted overviews contain the islands.** I checked that each SVG has 9 `[data-coast]` islands, that the coast check runs on every `data-camera="overview"` scene, and visually that the quiet, setup, late-game and result overviews at all four sizes show all nine islands inside the viewport. This is real island content, not just a full-canvas background.
- **My own checks.** I measured panel-versus-land overlap (finding 5) and ran pixel diffs and greyscale and zoomed crops (findings 1 and 3). I read the code behind findings 2, 4 and 8.
- **Scope.** Historical receipts (root and `revision-2`–`revision-5`) were each added once and never modified. `RUN-NOTES.md` is append-only. Outside the package, only `release-0.2.0.md` changed. There are no product, rule, task or dependency changes.
- A green renderer is supporting evidence only, and I treated it that way.

### Limitations

- **Missing views.** There is no tablet-landscape drawing (tablet appears only in portrait, 768×1024), and no before/after pair showing a rotation in the middle of a choice.
- **Not tested.** I did not run a playable build. I did not access isle-wars-archaeology beyond the inventoried citations. I did not test with real users.

### Hands-on tests still required (playable build, D4 and full match)

1. **Uncoached first match on a phone in portrait.** Time to the first deliberate Attack, mis-taps on End turn and Fast-forward, and whether the player ever opens Inspect or Help unprompted.
2. **Placement with 6–12 reinforcements under Place 1.** Count the taps and inspection round trips, with counts hidden versus shown.
3. **Gestures never commit actions.** A drag, pinch or hold released over a country must never place an army or attack. Test rotation in the middle of the target step, the capture draft and the fold.
4. **Short landscape at 240 px of available height, and 320×568.** Can the card and the focused pair both be seen? Is the list or focus fallback reachable?
5. **Greyscale or colour-blind simulation, plus enlarged text, at overview and at focus.**
6. **Full matches at each difficulty.** Late-game length with domination on and with it off. Waiting time during opponent turns, with and without Fast-forward. Whether Changes explains what was lost.
7. **Human elimination, then Watch computers or Stop, then a deliberate New game** with the seed and options kept or changed.
8. **Generated retained seeds, not these fixed drawings,** judged for believable and varied geography, sliver regions and hit areas.

**Recommendation:** fix findings 1–5 in the concepts. For finding 1, get an explicit owner decision recorded in DECISIONS.md and AUTHORITY.md. Add the two frames from finding 6. Then this package is ready for owner sketch approval and backlog reconciliation. Findings 7–9 can ride the same revision.


---
_Generated by [Claude Code](https://claude.ai/code)_
