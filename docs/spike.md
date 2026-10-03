# Spike: a TypeScript web stack for malpaco

Issue #8. **This spike decides nothing.** The owner decides afterwards, from the screenshots and this
page. Everything here lives in `spike-ts/` (plus `.github/workflows/spike-ts.yml`); the Godot project
and `data/maps/small_sea.json` are untouched, and the map is read as data, unchanged.

## What was built

- **Stack:** TypeScript 7 (strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`),
  Vite 8, Vitest 5, Playwright 1.63 (Chromium). Plain DOM + SVG + CSS: no UI framework, no canvas
  engine. Runtime dependencies: none. Node 22 or later.
- **`src/core/`, a pure rules core.** No DOM, no `Math.random`, no `Date`, no I/O, held two ways: a
  word-list guard in Vitest (`Math.random` and `Math["random"]`, `Date`, `performance`, `crypto`,
  `document`, `window`), and `src/core/tsconfig.json`, which compiles core alone with no DOM lib and no
  Node types, so those globals do not even type-check (`npm run build` runs it first). Integer arithmetic,
  seeded RNG (mulberry32 over uint32). It ports: map reading and validation (subset), ownership,
  armies, adjacency (borders then sea lanes), the deal, the attack check (`why_not`) and one attack
  resolved as `combat_resolver.gd` resolves it (dice counts, pairing, ties, capture, failure penalty,
  all three `attack_rule`s, all `capture` modes), elimination and conquest. The rules are not
  redesigned.
- **`src/ui/`, the slice.** A hot-seat game for 2 on `small_sea`: SVG map from the province polygons;
  select your province, then an adjacent enemy, then Attack; a result dialog with dice; End turn passes
  play. Hover, selection, legal targets and dimming of the rest are drawn as feedback.
- **Tests.** Vitest on the core (32 tests), Playwright headless in two projects, 1280x800 and 1920x1080
  (11 tests each, 22 runs).
- **CI.** `.github/workflows/spike-ts.yml`: `npm ci`, build, Vitest, Playwright; uploads the screenshots
  as the artifact `spike-ts-screenshots`.

### Deliberate gaps (the slice does not need them)

- **Opening placement.** Godot has each player place the opening pool by hand, one army at a time. The
  slice deals as `game_setup.gd` does (shuffled round-robin, one army each) and then spreads each
  player's pool (10, +1 short-stack bonus) over their own provinces with the seeded RNG
  (`newGame`, marked "SPIKE STAND-IN"). There is no reinforcement phase, redeploy, hazards, centres,
  cards or surrender. `endTurn` collapses core's END_PHASE x2 (attack, redeploy, hazards, reinforce) into
  one action, also marked "SPIKE STAND-IN" (a search for that phrase in `src/core` finds both).
- **The consequence: a game dead-ends.** With no reinforcement, armies only ever fall, and an attack needs
  two armies, so a hot-seat game reaches a position where neither player can attack and nothing ends it.
  A throw-away probe played a first-legal-attack policy on seeds 1, 2, 3, 7 and 1994: every game ended
  up with no legal attack for either side, at round 3 to 5, with no winner. This is a limitation of the
  slice (the contract asks for one attack and End turn), not a finding about the rules: the full
  game's reinforcement phase is what feeds the board.
- **A known inherited defect, not fixed here.** A failure penalty that costs the attacker its last
  province leaves that player with no provinces but not eliminated, and the game does not end:
  elimination is checked only on capture. This is a faithful port of `core/rules/rules.gd`
  (`_attack` calls `_check_elimination` only when a province was captured), so the defect is in the
  Godot core too. It belongs to whichever core survives the platform decision.
- **The RNG is not bit-compatible with Godot's PCG32.** The same seed deals a different board here. Porting
  PCG32 is possible (64-bit state, `BigInt` or hi/lo pairs); it was not done.
- **Map validation is a subset** (schema, shape, unknown keys, identity, island membership, crossing
  symmetry, polygon size). Contiguity, polygon geometry and connectivity checks are not ported.

## Lines of code

`wc -l` equivalents, counted by script over the files named (blank lines and comments included; the
second figure excludes blank and comment-only lines). The Godot figures are the contract's:
`core/` 1,890, `game/` 1,022, `test/` 1,762 (the same count over the clone gives 1,897 / 1,022 / 1,762).

| Area | Godot (`.gd`) | TypeScript | What the TypeScript covers |
|---|---:|---:|---|
| Rules core | 1,897 | **767** (614 code) | the slice only; see below |
| UI | 1,022 | **1,519** (1,377 code) | `src/ui/*.ts` + `main.ts` 852, `styles.css` 654, `index.html` 13 |
| Tests | 1,762 | **878** (750 code) | Vitest 484, Playwright 394 |
| Config and CI | n/a | 151 | `vite.config.ts`, `playwright.config.ts`, `tsconfig.json`, `package.json` 79; `src/core/tsconfig.json` 10; workflow 62 |

How to read this, honestly:

- **Core.** Not like for like. Godot's `core/` has hazards, cards config, the full rule set, geometry and
  connectivity validation. The Godot files that hold what was ported (`combat_resolver`,
  `deterministic_rng`, `game_map`, `province`, `island`, `player`, `action`, `game_setup`, `game_state`,
  `rules`, `map_reader`, `map_validator`, `rule_set`) total 1,708 lines, of which the slice uses a part.
  So no ratio is claimed. `types.ts` (about 125) is plain interfaces where Godot has one class file each.
- **UI.** The TypeScript UI is larger, and the figure hides why: 654 of the lines are CSS (theme,
  animation, dialog, dice faces), and the UI does more than Godot's `game/` does today: a result dialog
  with dice, a score card, a battle log, a tooltip, keyboard use, a toast. Godot's `BoardView` draws flat
  colour in one `_draw()` and reports attacks in a text label. The line counts say nothing about which
  UI is nicer.
- **Tests.** 878 against 1,762. Godot's `test/` plays 100 full games per run, has cross-configuration, hazard and save-archive
  suites; none of that exists here. The TypeScript tests are
  shorter because the slice is smaller, not because a stack writes tests shorter; no claim there.

## Time to build

- **Wall clock:** about 15 minutes from the first command (06:08Z) to the opened PR (06:22Z), by one
  Claude Sonnet session working alone, including the two screenshot passes that changed the UI
  (letterbox, target tags, panel wrapping) and the mutation runs. That is the first round only; the
  review's rework round (a pixel-level render gate, a compiler-level purity layer, the arrow and marker
  placement, panel scaling, this page's corrections) came after the PR was opened and is not in it.
- **Where it went:** reading `core/` and the docs, then writing the core and its tests, then the UI, then
  the e2e tests. The e2e tests passed on their first run, which is a reason to distrust them; the
  mutation runs below are what makes them believable.
- **Machine time:** `npm ci` ~1 s from a warm npm cache, `npm run build` 0.1 s for `vite build` (plus type-check), Vitest 0.3 s
  for 32 tests, Playwright ~8 s for 22 runs including a fresh `vite build` and `vite preview`.

## What was easy

- **Pure core, tested against a scripted die.** `resolve` takes a `DiceSource`; the hand-worked cases pass
  the exact dice, so each case is one assertion of numbers worked from `combat_resolver.gd`. The Godot
  engine tests loop 400 seeds to hit a penalty; here the penalty case is a three-number array.
- **Tooling is one `npm`.** Type-check, bundle, unit tests, browser tests and the dev server share a
  single config and a lockfile. A new machine needs Node and `npx playwright install chromium`.
- **SVG from the polygons.** `<path d="M x y L ...">` per province, `viewBox` from the map bounds: the
  board is resolution-independent for free, as Godot's camera framing is.
- **Look per effort.** Drop shadow on the coast, a sand stroke that unions the polygons into an island,
  dice drawn in CSS and a toast cost a few CSS lines each. `prefers-reduced-motion` is one rule.
- **Accessibility came cheap:** `role="button"`, `tabindex`, `aria-label` and a `<dialog>` give keyboard
  play and focus handling with no extra system.

## What was hard

- **No reactivity, so redraw discipline is mine.** The map builds its SVG once and updates in place; the
  panel and dialog rebuild children with `replaceChildren`. It stayed manageable at this size, but every
  new piece of state needs a manual place in `App.render`. This is what the "no framework" judgement
  costs; a bigger game would feel it first here.
- **SVG z-order.** Hover and selection outlines need to sit above neighbouring provinces, and SVG paints
  in document order. The fix is an overlay layer redrawn on every change (`pointer-events: none`).
- **Strictness has a price.** `noUncheckedIndexedAccess` turns every `array[i]` and `record[key]` into
  `T | undefined`, so the core has a visible sprinkle of `as` casts and `?? 0`. GDScript's typed arrays
  and `Dictionary.get` have a similar tax, but TypeScript's is more visible on the page.
- **Matching Godot's numbers.** No bit-compatible RNG, so no replaying a Godot save here (see gaps).
  Floats: `threshold` still multiplies by a float ratio, as `combat_resolver.gd` does.
- **The browser's own rules:** `<dialog>` modality and focus, `pointerenter` on SVG groups for hover,
  and a letterbox where the board's 16:9 does not match the pane (fixed by painting the sea beyond the
  `viewBox`).
- **Playwright in WSL** needed nothing beyond the browser build that was already installed; version 1.63
  expects Chromium revision 1243, which was the installed one.

## What the UI tests can check that the Godot gates could not

The Godot gates (`tools/gates.sh`): format, lint, gdUnit4 suites, a 90-frame headless smoke, export. The
smoke test exists "because the other four stayed green while the game opened blank"
(`CLAUDE.md`). `--headless` runs a dummy renderer, so nothing draws a pixel there, and none of the
suites listed drives the UI.

Not run here: Godot with a display, and whether gdUnit4's scene runner could simulate clicks. So the
claim is about the gates as they stand, not about Godot's limits.

The Playwright tests check, on a real browser at two real sizes:

- **The blank-page failure, in two layers.**
  - *The DOM layer:* all 14 provinces exist, each has a box over 40 px inside the viewport, and is the
    topmost element at its own badge (`elementFromPoint`). This catches a missing group, `display: none`,
    `visibility: hidden` and a transparent fill. It does **not** catch a board that exists but is not
    painted: `opacity: 0` on the provinces layer passed all 18 tests in the first version, which the
    review found.
  - *The pixel layer (`the board is painted`):* a real screenshot, then for every province a grid of
    points inside its polygon, clear of its badge and name, compared with the owner's fill (RGB distance at
    most 28, or from the hatched shade for the second seat), at least 70% matching, at both
    viewports. It also asserts the owner's colour is far from the sea's, or the comparison proves
    nothing. Shown to fail for: `opacity: 0` on the whole layer, `opacity: 0` on one province, `display:
    none`, `visibility: hidden`, a transparent fill, an opaque panel laid over the board, and a missing
    group. Not shown: every way to wreck a picture (a wrong but plausible colour that matches the
    owner's fill, for instance, would pass).
- **What a player sees:** two distinct computed fills, the owner's initial, the hatch on the second seat,
  the army count on the badge equal to the state, province names above 11 px as rendered, no page scroll
  at 1280x800 and 1920x1080, both buttons inside the viewport.
- **Overlay hygiene:** the FROM-to-TARGET arrow runs over no badge or name, and each legal-target marker
  lies wholly inside its own province and clear of every label, for every (source, target) pair the seed
  offers.
- **Real input:** hover outlines and names a province; clicks select, highlight targets and dim the rest;
  Attack stays disabled until a target is chosen; an illegal target is refused with the reason; Escape
  clears; keyboard Enter/Space selects.
- **UI and engine agree.** The dialog carries the engine's own losses for the attack; after one attack by
  clicks the dice labels' counts equal them, and the map's armies and owner afterwards equal them
  (captured, lost, or neither). The labels come from the same `pairResults` the engine takes its losses
  from, so the tie rule is applied in one place (a unit test pins it under `ties: "attacker"`).
- **No errors in the console or page** during any of it (a fixture fails every test otherwise).
- **Pictures of it,** in CI, per size, for the owner to look at. They are one sequence from one game,
  from one test: `01-start`, `02-selected`, `03-result`, `04-after-attack`, and `05-amber-turn` (the same
  game after Blue ends the turn, before Amber acts).

What neither can check: whether it is beautiful. The screenshots are for the owner.

## Honest comparison of the screens

The owner judges; these are observations.

**What I saw and did not see.** I saw the TypeScript screenshots (`spike-ts-screenshots`). I did not
see the Godot game running: there is no display in this session, and the repository holds no
screenshots of it (`ROADMAP.md` lists them for Iteration 5, unchecked). What follows about Godot is read
from `game/board_view.gd`, `game/player_palette.gd`, `game/play_screen.gd` and `ROADMAP.md`'s own words
("programmer art", "the look is Iteration 5"). Place the two side by side before believing any of it.

| | Godot proof of concept (from the code) | This spike (from the screenshots) |
|---|---|---|
| Board | flat colour polygons, a 4 px coast, province borders, lane lines | the same polygons, a sand coast with shadow, hatch fill on one seat, dotted sea lanes, a wave texture |
| Ownership | colour (same two) + the owner's initial | colour + initial + badge shape (pill or hexagon) + hatch |
| Selecting | selected and target colours on the polygons | white outline on the source, dashed amber on legal targets, a FROM tag, a TARGET tag, dimming of the rest, an arrow between them |
| Attack result | text lines in an event label | a modal with dice faces, pairwise wins and holds, a headline (captured, lost, held) and the tally |
| Turn and score | HUD labels | a turn card in the player's colour, a score card, a battle log, a toast on turn change |
| Hover | a hovered province is drawn | an outline, plus a tooltip with owner, armies, island bonus |
| Animation | hazard flashes (1.2 s) in `board_view.gd` | dice tumble, a flash on changed provinces, a toast; all off under `prefers-reduced-motion` |

Weaknesses of the TypeScript screens, plainly:

- The province names are about 12 px at 1280x800 (the board scales with the pane, so the text does, and
  the test asserts at least 11 px as rendered); readable, not roomy. At 1920x1080 they are about 20 px.
- The board is 16:9 in a pane that is not, so at 1280x800 the map uses about 60% of the area and leaves
  the sea empty around it.
- The result dialog is small at 1920x1080 and covers part of the map while it is open.
- Everything is flat vector with CSS shading. It is a nicer register than the Godot proof of concept's
  programmer art, but it is not "gorgeous" in the `ROADMAP.md` sense and does not try to be: no
  textures, lighting, particles or shaders. What the browser stack can reach there (SVG filters, CSS
  shaders via WebGL, a canvas layer) is untested in this spike.

## What this spike does not tell the owner

- **Anything about AI, search or the 100-game simulations.** The pure core would run in Node unchanged,
  but nothing here measures it.
- **Packaging.** Godot exports desktop and Android builds; this is a web page. A desktop shell (Electron,
  Tauri) or Android wrapper was not tried. `CLAUDE.md` says "no browser" for the Godot project; that
  line is the owner's to revisit, not this spike's.
- **Performance** on a large board, or on a phone.
- **Save and resume,** the archive format, and the Windows/Linux determinism claim: the TypeScript RNG is
  integer-only and deterministic by construction, tested for replay, but not cross-browser tested
  (Chromium only).

## Reproducing

```
cd spike-ts
npm ci
npm run build          # tsc --noEmit, then vite build
npx vitest run         # the core
npx playwright test    # needs: npx playwright install chromium; writes screenshots/<size>/*.png
npm run dev            # http://localhost:5173/?seed=1994 fixes the game
```
