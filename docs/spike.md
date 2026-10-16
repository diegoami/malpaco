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
  armies, adjacency (borders then sea lanes), the deal, the attack check (`why_not`) and one attack resolved as `combat_resolver.gd` resolves it for the legacy `classicRules()` preset
  (dice counts, pairing, ties, capture, failure penalty). Generated games use the reviewed malpaco
  preset, with one die per side, fair tie rerolls and no attacker forfeit; legacy `newGame` retains
  the spike combat. Malpaco games enter a reinforcement phase using T10 ownership-based income;
  Classic keeps the original attack-only turn flow for explicit Classic games.
- **`src/ui/`, the slice.** A hot-seat game for 2 on `small_sea`: SVG map from the province polygons;
  reinforcement income and pool are visible, owned-province clicks place one army through the core
  action, and Start combat opens attacks after the pool is empty. Attack resolves with one die per
  side and a readable result dialog; End turn passes the seat and grants its pool. Hover, selection,
  legal targets and dimming of the rest are drawn as feedback.
- **Tests.** Vitest on the core (32 tests), Playwright headless in two projects, 1280x800 and 1920x1080
  (18 tests each, 36 runs).
- **CI.** `.github/workflows/ci.yml`: `npm ci`, build, Vitest, Playwright — all inside the official
  image `mcr.microsoft.com/playwright:v1.63.0-noble`, pinned to `@playwright/test`'s version in
  `package-lock.json`, which also ships the browsers and their dependencies; uploads the screenshots
  as the artifact `screenshots`.

### Deliberate gaps (the slice does not need them)

- **Opening placement.** Godot has each player place the opening pool by hand, one army at a time. The
  slice deals as `game_setup.gd` does (shuffled round-robin, one army each) and then spreads each
  player's pool (10, +1 short-stack bonus) over their own provinces with the seeded RNG
  (`newGame`, marked "SPIKE STAND-IN"). The opening distribution still uses seeded random placement.
  On Malpaco turns, T11 grants income into a pool and requires it to be placed before attacks; the
  T12 exposes the Malpaco turn flow on the authored map. The opt-in `?view=generated-prototype&seed=1994` previews generated geography and exact
  country connections; it does not integrate generated boards into the playable game. The generated route now offers seed and human-seat setup; other rule options,
  redeployment, hazards, cards and surrender remain absent.
- **Generated-game setup.** T07 adds `createGame(options)` for a generated 46-country board: it uses
  one seeded stream for board generation and the initial deal, then stores three production centres.
  The map-based `newGame` overloads remain the spike's legacy deal; they store an empty centre list
  and keep the opening-pool stand-in. `createGame` defaults to `malpacoRules()` and begins with that
  seat's reinforcement pool; callers may still pass an explicit custom ruleset, and
  `classicRules()` remains available for the spike's original combat and turn behaviour.
- **The earlier combat-only slice dead-ended.** With no reinforcement, armies only ever fell, and an attack needed
  two armies, so a hot-seat game reaches a position where neither player can attack and nothing ends it.
  A throw-away probe played a first-legal-attack policy on seeds 1, 2, 3, 7 and 1994: every game ended
  up with no legal attack for either side, at round 3 to 5, with no winner. T11 adds the core income
  and placement sequence; T12 now uses the Malpaco turn flow on screen.
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
| UI | 1,022 | **1,531** (1,386 code) | `src/ui/*.ts` + `main.ts` 854, `styles.css` 664, `index.html` 13 |
| Tests | 1,762 | **1,300** (1,032 code) | Vitest 484, Playwright 816 |
| Config and CI | n/a | 143 | `vite.config.ts`, `playwright.config.ts`, `tsconfig.json`, `package.json` 79; `src/core/tsconfig.json` 11; workflow 53 |

How to read this, honestly:

- **Core.** Not like for like. Godot's `core/` has hazards, cards config, the full rule set, geometry and
  connectivity validation. The Godot files that hold what was ported (`combat_resolver`,
  `deterministic_rng`, `game_map`, `province`, `island`, `player`, `action`, `game_setup`, `game_state`,
  `rules`, `map_reader`, `map_validator`, `rule_set`) total 1,708 lines, of which the slice uses a part.
  So no ratio is claimed. `types.ts` (about 125) is plain interfaces where Godot has one class file each.
- **UI.** The TypeScript UI is larger, and the figure hides why: 664 of the lines are CSS (theme,
  animation, dialog, dice faces), and the UI does more than Godot's `game/` does today: a result dialog
  with dice, a score card, a battle log, a tooltip, keyboard use, a toast. Godot's `BoardView` draws flat
  colour in one `_draw()` and reports attacks in a text label. The line counts say nothing about which
  UI is nicer.
- **Tests.** 1,300 against 1,762. Godot's `test/` plays 100 full games per run, has cross-configuration, hazard and save-archive
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
  for 32 tests, Playwright ~8 s for 36 runs (18 tests × 2 viewports) including a fresh `vite build` and `vite preview`.

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
    review found. It also asserts each province's computed fill equals its owner's palette colour
    (`SEATS`, read through the app's seat order), so a province painted in the other owner's colour
    fails here and not only in the pixels.
  - *The pixel layer (`the board is painted`):* a real screenshot, then for every province a grid of
    points inside its polygon, clear of its badge and name, compared with the owner's **palette
    colour** — not with the page's own fill, which would agree with any wrong colour it was given (RGB
    distance at most 28), at least 70% matching, at both viewports. The hatched seat is matched
    against the whole segment from its base colour down to the 28%-darker hatched shade, so
    anti-aliased stripe edges count; the unhatched seat against its base colour only, so no seat
    accepts a darker shade it never wears. Because that segment also contains the plain base colour,
    the hatched seat must additionally earn a **dark share**: at least 15% of its samples within 28 of
    the shaded stripes themselves, which a province with `.province.seat-1 .hatch { opacity: 0 }`
    cannot reach (it measures 2% — border anti-aliasing only). It also asserts the owner's colour is
    far from the sea's, or the comparison proves nothing. Shown to fail for: `opacity: 0` on the whole
    layer (0% of samples), `opacity: 0` on one province, a province painted in the other owner's
    colour (the DOM layer names the fill and the palette colour), `display: none`, `visibility:
    hidden`, a transparent fill, an opaque panel laid over the board, and a missing group.

  **The painted-board gate, measured.** The thresholds above are [measured], not guessed, and the
  measurement now lives where the tests run: the pinned image (see "Goldens"), whose font rendering
  and anti-aliasing differ measurably from a host browser. On the clean board over this map in the
  image, the lowest-matching province is **Hoko: 76.5% at 1280x800** (next lowest Konko 84.1%)
  and **Hoko: 80.4% at 1920x1080** (next lowest Ventflanko 83.1%), so the 70% floor holds a margin of
  at least 6.5 points. The hatch's dark share measures **23.1–36.9%** on the clean amber provinces at
  both viewports, against the 15% floor and the hidden hatch's 2%. The seat colours sit far enough
  from the sea for the comparison to mean something [measured]: blue 87.6–88.8 (the sea is a gradient,
  so the distance varies with where the corner pixel falls) and amber 206.6, against the asserted 60.
  A 7%
  darkening (`brightness(0.93)`), which the earlier fill-vs-fill
  comparison turned red at 67–70%, measures 79.5–94.7% here: catching uniform colour drift is the DOM
  layer's job (the fill must equal the palette colour), not this gate's; the gate targets boards that
  are not painted at all, which measure near 0%.
- **Every badge and name is painted.** For every province, a pixel check on the badge, the army count,
  the owner's initial and the name: the pixels inside the province under each label (a label straddling
  the coast has sea and sand behind it, which would fake contrast) must clear a floor per kind —
  on the clean board in the pinned image, badge and name measure 290.5–408.8 and the count 327.3–328.1
  (badge and name sampled every 3 px, the count every 1 px), the initial 211.3–262.0 (every 1 px: the
  glyph is small and anti-aliased, and a 3 px grid can step over a glyph's solid core — it measured a
  painted initial as low as 56 on the host, and a one-digit count as low as 236.8 in the image, so the
  count is sampled at every pixel too); a hidden label measures 73.8–208 (the hatch stripes and the
  border stroke; re-confirmed in the image at 73.8 for a hidden badge), a hidden initial exactly 0.
  The floors (badge and count 240, name 300, initial 180) keep at least 31 points under the clean
  minimum and 32 above the hidden maximum. Shown to fail for `.province .badge, .province .name {
  opacity: 0 }`, which used to pass everything, and for `.province .badge-initial { opacity: 0 }`,
  which used to pass the badge gate because the backdrop and the count still filled the badge with
  contrast (round-1 review). The floors are image numbers: the first rounds measured the clean board
  on a host browser at 317–413, and the image's font rendering sits lower still on some glyphs —
  which is why the basis moved into the image with the tests.
- **What a player sees:** each province's computed fill equal to its owner's palette colour, the
  owner's initial (painted, not merely in the DOM), the hatch on the second seat, the army count on the
  badge equal to the state and painted, province names above 11 px as rendered and painted, no page
  scroll at 1280x800 and 1920x1080, both buttons inside the viewport.
- **The panel never overflows.** At 1366x768, 1600x900 and 1920x1080: New game and the seed fully in
  the viewport, no page scroll, and the panel itself without an internal scrollbar. The zoom
  breakpoint is gated on height as well as width (`min-width: 1600px and min-height: 1000px`); at a
  short-but-wide screen the battle log shrinks first (floor 96 px, [measured]: the panel's spare
  height is 119 px at 1366x768 against 75 px at a zoomed 1600x900). Removing the height condition
  fails the 1600x900 test, so the guard has teeth.
- **Overlay hygiene:** the FROM-to-TARGET arrow runs over no badge or name, and each legal-target marker
  lies wholly inside its own province and clear of every label, for every (source, target) pair the seed
  offers. The legend names the case the code has: a dashed outline on every target, with a marker only
  where one fits inside the province.
- **Real input:** hover outlines and names a province; clicks select, highlight targets and dim the rest;
  Attack stays disabled until a target is chosen; an illegal target is refused with the reason; Escape
  clears; keyboard Enter/Space selects.
- **UI and engine agree.** The dialog carries the engine's own losses for the attack; after one attack by
  clicks each dice column's label is checked against its two dice faces under the engine's tie rule
  (`pairResults` over `classicRules`' ties), so an inverted pair fails even when the counts still
  match, and the labels' counts equal the engine's losses. The faces are read as drawn — the pixel at
  each of a die's nine cells, matched against the face layouts — before any verdict is compared, so a
  die whose pips are hidden or removed fails with "no readable face" instead of agreeing with a
  `data-face` the player cannot see (round-1 review); a die whose pips are drawn but unreadable fails
  too, because each lit cell must sit at least 150 RGB from the die's face on the screenshot itself
  (clean faces measure 314.8–349.5, pips one RGB level from the face measure 1.7 — round-2 review),
  and each unlit cell must show the face itself. The verdict labels are also gated as painted: each
  must span at least 120 RGB over the dialog's surface (clean verdicts measure 161.2–258.6, the tie's
  em-dash the low end; a hidden verdict measures 0), which `.verdict { opacity: 0 }` — invisible in
  the picture with class and text intact — failed (round-2 review); afterwards the map's armies and
  owner equal the engine's outcome (captured, lost, or neither). The labels come from the same
  `pairResults` the engine takes its losses from, so the tie rule is applied in one place (a unit
  test pins it under `ties: "attacker"`).
- **Goldens pin the look.** Pixel gates assert what a board must satisfy; they do not pin what it
  looks like, and each review round found a new way to lie to them (five evasions across two rounds
  passed every meaningful check before being caught). So three pictures are pinned with Playwright's
  `toHaveScreenshot`, at both projects, on the fixed seed: the whole board (hatched seat included),
  the result dialog with its dice and verdicts, and the panel. Playwright's default comparison options
  apply — no `maxDiffPixels`, `maxDiffPixelRatio` or `threshold` is set anywhere, and there is no
  `expect.toHaveScreenshot` override in `playwright.config.ts` — so a deliberate UI edit fails
  the golden, with its reason in the PR, and the owner judges it. The defaults do not catch every
  conceivable pixel change: hiding the hatch entirely still passed the board golden at both projects
  (each review round found a new way to lie to the goldens — five evasions across two rounds passed
  every meaningful check before being caught); the independent dark-share check catches that evasion.
  The goldens and the dark-share check together cover what the design requires. Nothing is masked: nothing varies run to run, because the seed fixes the game, `toHaveScreenshot`
  freezes animations, and the rendering environment is pinned — goldens are made and compared in the
  official image `mcr.microsoft.com/playwright:v1.63.0-noble` (`<version>` = `@playwright/test`'s
  version in `package-lock.json`, which CI's Playwright job runs in too), never on the host, whose
  fonts and Chromium differ measurably. Regenerating them in the image leaves a clean tree; that was
  checked twice. Locally:
  `docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.63.0-noble sh -c 'npm ci && npx playwright test --update-snapshots'`.
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
npx playwright test    # in the image (see "Goldens"): the browser ships with it; writes screenshots/<size>/*.png
npm run dev            # http://localhost:5173/ opens generated-game setup; authored spike: ?view=authored-game&seed=1994
```


## Generated-board presentation preview

`?view=generated-prototype&seed=1994` opens a separate atlas of the existing
46-country, nine-island generator. `layoutGeneratedBoard(map)` changes only
polygons, label locations and bounds; IDs, names, membership, bonuses and both
edge sets retain their generated values, input maps remain unchanged, and the
projection uses no rule RNG. Larger islands receive more atlas space. Irregular
coasts enclose separated country regions: a geographic neighbour is read from
the explicit solid land connection or dashed blue sea lane, rather than inferred
from region placement. Country selection highlights its exact incident links
and names all land/sea neighbours with IDs. Click, Enter and Space select without
replacing the focused country. A seed control rebuilds through `generateBoard`;
actual generation refusal (including seed 1506) remains visible with retry.

The atlas is presentation only. Generated-game setup opens at the root; a permanent visual choice belongs to later work.
The separate generated-game route below integrates placement and combat. The explicit authored-board route
keeps its existing behaviour and goldens. Atlas dimensions, coast margins, region
spacing, text and route styles are [designed], after inspecting `board-gen.ts`
placeholder geometry and `mapView.ts` label, marker and coast placement.

`tests/ui/generated-board-layout.test.ts` checks immutable, stable, semantically
exact layouts and distinct/in-bounds label/hit regions for seeds 1/2/3/7/42/1994.
`tests/e2e/generated-board.spec.ts` independently regenerates the topology, reads
country/name screenshot pixels, checks full rendered names at least 11px with
no overlaps/overflow, tests label-center hit targets, every connection's exact
IDs and endpoint anchors, bonuses, click/keyboard selection and focus, seed edits,
reload and failure/retry. Its own two goldens pin the atlas in the same official
Playwright image as the playable screen. New tests fail on absent/identity
projection and absent preview route; the generator-failure fixture and existing
playable-screen tests are unchanged-behaviour regressions. Preflight logs,
reproducible disposable fixtures and final verification/mutation evidence live
under `docs/prototypes/generated-board/`. The owner judges the settled screenshots.


## Generated-board gameplay

`?view=generated-game&seed=1994` starts two human seats using `createGame`,
canonical default options with two human seats and no computer strengths, and
Malpaco rules. The initial deal, armies, production centres and RNG remain the
core's exact output. Only map polygons, labels and bounds receive T13's display
projection. The explicit authored route and the generated prototype remain
available independently.

The generated view shares the normal App controller, reinforcement panel,
selection, attack result dialog and seat handoff. Every action goes through
`apply`; map coordinates never decide adjacency. Country labels show
`seat number · armies`, with matching seat colour; island bonuses and explicit
solid land / dashed sea links remain visible. The seed form and refusal alert
support retry and recovery, including the real refused seed 1506. The compact
panel and two text rows are [designed]. At the existing large-screen breakpoint,
the generated route uses the same 440px panel column as the authored route to
fit its enlarged seat cards. Both layouts are measured in the pinned Playwright image
at 1280x800 and 1920x1080; saving and AI remain later work.

`tests/ui/generated-game.test.ts` compares all nongeometry state fields with
independent `createGame` output for seeds 1/2/3/7/42/1994 and freezes projection
input. `tests/e2e/generated-game.spec.ts` checks screenshot owner paint and count
glyphs, label/count bounds and hit targets, seat-card text fitting within the
card and panel, exact connections and endpoint
geometry, initial ownership/counts, bonuses, keyboard selection, a click-driven
reinforcement/attack/handoff against core-predicted results and refusal recovery.
Only its new generated-game screenshots are pinned; the owner judges the look.
Replay and actual-source mutation commands and tracked evidence live under
`docs/prototypes/generated-play/`.


## Generated-game setup

The root route and URLs without a recognized `view` open this setup. Seed, seat
and opponent query settings remain available there. `?view=game-setup` is its
explicit route. Start game
opens `?view=generated-game&seed=N&seats=C`; New game returns to setup with the
same choices. Direct generated-game URLs still default to seed 1994 and two
humans. Seed input accepts whole uint32 values without wrapping, unsupported
seat counts are rejected, and generation refusals leave an editable recovery
form. Retry runs the shared seed validation and reveals the whole-number/range
error beside the refusal only for an invalid edit, keeping the edited seed
available for correction.
Correcting the seed and retrying preserves seat count and opponent mode. The
Generate form keeps keyboard submission. Unimplemented rule options are not
offered. Players also offers one human
versus one to three computers; in this mode the count label becomes Total seats.
The `opponents=computer` query preserves this choice on generated routes and setup.
The generated-board atlas remains at `?view=generated-prototype`; the authored
spike remains at `?view=authored-game`. The latter parses `small_sea` only when
that route is selected.

The UI passes these settings to `createGame` without dealing again. Green and
lavender extend the original two ownership colours; numeric map seats and four
distinct score badges support ownership recognition. Generated panels compact
additional seat rows, wrap selection values and let the two-seat attack log
shrink so names, army counts and controls remain visible at both tested sizes.
The explicit authored route retains its existing goldens. T17 updates only the generated
opening and setup/four-seat goldens to include local file controls.
These form, palette and spacing choices are [designed] after inspecting
`generatedGame.ts`, `app.ts`, `panel.ts` and the T14 clipping regression.

Generated setup and gameplay provide an accessible **How to play**/**Help**
dialog. It describes the implemented seed and player choices, numeric seat and
army labels, explicit land and sea routes, reinforcement placement, combat
requirements and one-exchange attacks, turn handoff and victory, computer
turns, and Save/Load/New game. It makes no promises about unimplemented rule
options. Escape or Close returns focus to the opener; when a computer turn is
active, the dialog clears its pending timer and resumes automation after close.
This control is limited to generated setup and matches; the authored and
generated-prototype routes are unchanged. T20 updates only the generated
setup/four-seat and generated opening screenshots for their new Help controls.

`tests/ui/game-setup.test.ts` checks all supported counts against exact core
state semantics, defaults and invalid inputs. `tests/e2e/game-setup.spec.ts`
drives keyboard/click setup, all 46 ownership/army values, distinct seat cues,
reinforcement/combat/handoff, round-trip settings and refusal recovery. It
measures actual text against cards/panel/viewport and pins setup/four-seat
screenshots at both sizes. Replay, failed preflights, exact restoration hashes
and selected-seed/count mutations live under `docs/prototypes/game-setup/`.


## Complete-game acceptance

`tests/core/complete-game.test.ts` proves existing conquest behavior from ordinary
`createGame`/`apply` actions across seeds 1, 42 and 1994 with two, three and four
human seats. A bounded test-only conqueror/passive-opponent policy completes all
nine matches without injected ownership, armies, dice or RNG. Three/four-seat
matches hand off after the first elimination, visiting the eliminated-seat skip
before the final capture. The checks cover elimination, complete ownership,
winner selection and rejection of every action kind after victory without state
mutation. No game rule or production UI change was needed.

`tests/e2e/complete-game.spec.ts` starts a three-human generated match from normal
setup inputs and drives every placement, combat and turn handoff through clicks
at 1280×800 and 1920×1080. It checks first elimination, living-seat handoff,
readable winner feedback, disabled finished controls, frozen map interactions,
and New game returning to setup and restarting the same seeded deal. Screenshots
of elimination, handoff and winner are retained for owner judgment.

The new coverage passes on existing behavior by design; missing acceptance files
before T16 do not mean conquest was broken. Four independent actual-source
mutations remove elimination, skip, conquest completion, or explicitly accept a
finished action and reopen play. Each fails the acceptance suite; saved exact
source bytes are restored and the focused suite passes again. An earlier local
finished-guard deletion changed refusal wording only; its retained log is not
claimed as an actual acceptance bypass. Commands, results, hashes and screenshots
live under `docs/prototypes/complete-game/`.


`tests/e2e/finished-copy.spec.ts` exercises the finished panel from legal replay
histories: it uploads a near-victory save, wins through real map clicks and the
result dialog, then checks Escape and the frozen board; it also uploads an
already-finished save and restarts the same seeded setup. Finished games show
restart guidance, retain the winner, score, log, seed and file controls, and hide
phase-selection steps, attack legend and stale hints. The focused screenshots
and baseline/candidate replay evidence are retained in
`docs/prototypes/finished-copy/evidence/`.

## Generated-match save files

Save game downloads readable JSON containing a match-format version, the actual
GameOptions (including seed and presentation choices) and ordinary action
history. `serializeMatch` / `deserializeMatch` are pure core APIs; restoration
validates every option/action and calls `createGame` then `apply` for each action.
Map ownership, armies, centres, history/logs, phase, winner and all RNG streams
come from replay. Stored snapshots are rejected. The older options-only API is
unchanged (C-SET-05/07).

Load game accepts a local JSON file from setup or a generated match, and supports
two to four human or mixed seats through opening, reinforcement, combat and victory.
Validation, generation and replay finish before replacing the current controller;
file errors retain the current match and display an actionable alert. Mixed-seat
loads resume computer automation, including consecutive computer turns. Successful loading
clears selection/dialogs, updates seed/seat URL settings and removes the replaced
controller's window listener. Download object URLs are revoked after the click.

The file controls, readable failure alert and its position away from the turn
heading are [designed] after inspecting the generated header, controller and
setup form. `tests/core/match-save.test.ts` compares complete replayed states and
subsequent deterministic actions across all human counts/phases, with malformed
files and illegal histories rejected. `tests/e2e/match-save.spec.ts` uses real
downloads/uploads from setup and gameplay, checks exact saved bytes after load
failures, continues attacks/handoffs, restores victory and measures control/error
text containment. Screenshots and source mutation/restoration evidence live in
`docs/prototypes/match-save/`; the owner judges the settled screenshots.


## Basic computer opponent

`computerAction(state)` is a pure deterministic policy for active computer seats;
humans, eliminated/missing players and finished games return no action. It places
all income on the strongest frontier, or strongest holding when no frontier
exists. Combat prefers the weakest legal target with a smaller army than the
attacking stack, then the stronger attacker, then lexical province IDs. It ends
the turn when no useful attack remains, combat has ended, or the turn has made
as many attacks as the map has provinces. The attack count is derived from the
ordinary history since the last endTurn, so a turn needs at most N+3 actions:
one reinforcement placement, one phase transition, at most N attacks and one
handoff. No hidden mutable policy state or policy RNG is used; `apply` alone
consumes rule RNG. Action-only replay therefore reproduces every later decision.

These priorities, the budget and 350ms UI action spacing are [designed] after
searching core options/types/rules/setup, UI controllers and this design file.
C-PLY-01..03 and computer A2 provide seat kinds and Normal metadata. There is one
basic policy, with no selectable strength variants. All-human setup and direct
route defaults remain compatible. Mixed setup uses one human followed by one to
three computers, labeled in the score and active-turn panel. Automated attacks
advance without a battle dialog. Map/action inputs are gated during computer
play, while Save/Load/New game remain usable. Disposal clears scheduled work and
guards old callbacks; replacements dispose before mounting the resumed match.
Finished games schedule no more work.

Core acceptance covers seeds 1/42/1994 with 2/3/4 seats, immutable input/RNG,
bounded legal turns and replay through computer victory. Browser acceptance uses
actual setup clicks and real downloads/uploads, verifies automatic reinforcement,
attacks, consecutive computer handoffs, human-input gating, replacement,
cancellation and stopped victory at both pinned viewports. Actual-source mutants
disable scheduling, map gating or timer cancellation and fail those checks.
Commands, original failed preflights, passing candidate evidence, screenshots and
restoration hashes live under `docs/prototypes/computer/`. Only setup goldens
change for the new Players choice; authored/prototype goldens are preserved.

## Approved reference-game development route (T26)

Open `?view=reference-game&battle=legacy` for the T26 compatibility UI. Setup offers two to four human
seats and a game seed; the approved T63 Nine Isles geography stays fixed while
the regular seeded deal changes. The map uses the same legal graph as the pure
rules. Place the whole income pool, start combat, select an attacker/target,
resolve exchanges, and hand off; the ordinary conquest result and New game work.
The chosen A polygons and sea ports/routes are preserved, with live seat colours,
counts and production markers. The route reuses the existing App/controller and
pure setup/apply mechanics. Existing generated/authored routes and saved-game
formats retain their behaviour. This legacy reference route does not offer save/load;
the modern reference route uses the T31 versioned files described below.

This is the T26 walking skeleton, with the inventory’s known battle/movement/
victory gaps assigned to T27–T30. It is the temporary reference milestone before
general geography T34–T36. Owner assessment of the integrated screenshots precedes
broader implementation (roadmap checkpoint3); browser checks establish operation,
not visual parity or fun. Evidence/reproduction: [T26](prototypes/new-game/T26/README.md).


## Explicit capture-choice core (T27)

`captureChoiceRules()` opts into the pinned [Ownership change and Victory design](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md#ownership-change). When a defender loses its last army, ownership and elimination update immediately. The engine provisionally transfers one army so both countries remain occupied, enters `capture`, and exposes `pendingCapture {from,to,min,max,defaultAmount}`. This provisional transfer is a [designed] interaction protocol; the pinned design specifies the bounds and choice, but not its intermediate engine state.

The ordinary action `{kind:"captureMove",amount?:number}` chooses the **total** moved into the captured country, including that first army. Bounds are one through all but one of the surviving source armies; omission selects the maximum. Only the remaining difference transfers, with no extra RNG draws or stack cap. Pending choices block all other commands, including end-turn. A completed choice returns to attacks, so its target can make a chained capture. Elimination occurs at ownership change; this preset checks conquest at end-turn before advancing the seat or computing income.

`createReferenceGame(map,options,rules?)` accepts the preset explicitly. The default reference route now extends it with T29 friendly movement and T30 victory options; `battle=legacy` preserves the T26 UI and its exact assertions/goldens. Existing `malpacoRules()`, Classic, generated/authored routes and match-save v1 keep their prior behavior. New choice histories are plain JSON action lists replayed through `apply` from the same initial state; T31 integrates them into versioned files. T32 owns computer policy for the new interaction. T27 does not add a new log event or mutate the previous attack outcome; the outcome records the provisional movement and history records the quantity action.

Acceptance and actual-source mutation evidence, exact restoration records, pinned legacy browser captures and portable hash verification are retained in `docs/prototypes/new-game/T27/`.

## Reference battle controls (T28)

The default `?view=reference-game` is an explicitly developmental setup for the approved
Nine Isles map. Seats default to human, with manual computer-seat controls available.
Its victory preset extends friendly movement and capture choice. The intended
one-human/three-computer game setup belongs to T32. T31 provides reference save/load.
Other routes and their saves retain their prior behavior.

Select source and enemy target, then choose primary **Fight on** or **Single
exchange**. The remembered threshold defaults to 2 and clamps to the source's
starting stack minus one for each fresh battle. It stays fixed as armies fall;
an attack starting with two armies can fight to one. Stop cancels the next
exchange while preserving both stacks and visible context. A long battle pauses
before exchange 13 until Keep watching or Stop. Threshold edits wait until Stop;
Keep watching preserves the current run's threshold.

The [pinned UI5/UI6 design](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/ui.md#combat-feedback)
supplies the proposed presentation values: 400 ms per exchange and a 5-second
watch budget at Normal; Slow scales by 1.5, Fast by 0.5. These are malpaco's
approved proposals, not original-game timing measurements. Current speeds are
Slow/Normal/Fast; Instant and full settings persistence remain T56. Threshold and
speed are remembered through this mounted development setup's New game flow.

`BattleController` has no DOM or wall clock. Its injected scheduler queues at
most one future exchange; `apply` is the only state-changing engine entrypoint.
The independent tie trace calls exported `resolve` on cloned state and seeded
RNG, showing every tie and the decisive dice without extra game-stream draws.
The board, context counts and result update from the authoritative outcome.
Capture controls choose the total moved, default to the maximum, and offer
minimum/maximum, minus/plus and direct typing. Pending move-in blocks unrelated
inputs. Recreated controls capture revisions; cancelled timers carry generations,
so stale controls and old callbacks refuse across transitions and disposal.

The public seat totals and New game sit in the header to keep capture choices
visible beside the board at both desktop sizes. The outcome remains visible
after Stop and move-in. Passing unit/browser checks establish these behaviors;
the owner judges readability and pacing from the retained captures in
[T28](prototypes/new-game/T28/README.md).


## One friendly move ending the turn (T29)

`friendlyMoveRules()` adds the pinned [Movement rule](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md#movement)
to explicit capture choice on the default reference route. The ordinary action
`{kind:"friendlyMove",from,to,amount?}` transfers between owned neighbours while
leaving one at the source; omitted quantity means all-but-one. Land and sea links
share the same declared graph. The transfer immediately runs the existing end-turn
logic, including conquest before next-seat income. No RNG draw or extra log event
is introduced; the action itself records the move, followed by ordinary turn logs.
Classic, malpacoRules, captureChoiceRules and their legacy routes remain unchanged.

**Move armies** opens a transient UI draft: eligible own sources are marked,
then the selected source's own neighbours. Sea-route emphasis follows that same
legal target set. The panel shows both countries and counts, range/default,
minimum/maximum, minus/plus and typed quantity. **Move and end turn** confirms;
**Skip move · end turn** hands off without transfer. **Cancel** or Escape restores
the previous battle selection/outcome and spends no engine action or game RNG.
The draft remains in the engine's attack phase; it is not a recorded intermediate
turn phase. Battle actions are gated until the draft is cancelled or completed.
Controls capture revisions; replacement/disposal discards old drafts. Captured
countries can participate after their explicit capture quantity is confirmed.

The UI protocol follows pinned ui.md “The move and the end of the turn”; its
transient representation is an implementation choice. Reference save integration
remains T31 and default one-human/three-Normal-computer turns remain T32. Acceptance,
lossless initial negatives/disposable mock evidence and actual implementation
captures are under [T29](prototypes/new-game/T29/README.md).


## Round origin and complete victory (T30)

`victoryRules(options)` extends `friendlyMoveRules()` with the existing setup
options `dominationWin` and `roundLimit`, leaving all earlier presets unchanged.
It retains the seeded first-seat index as `roundOrigin`, so rounds wrap across
that fixed origin even when its seat is eliminated. The default reference setup
adds per-seat Human/Computer controls, Domination win and an Off/20/30/40 round
limit. Default controllers remain human until T32. Mixed captions show the actual
human/computer composition; all computer turns in this development host are manual,
including the explicit `control=manual` route used by acceptance. Automatic scheduling
and the intended one-human/three-Normal-computer default remain T32.

The shared completed-turn seam runs after a friendly transfer or End turn and
before next-seat income. Following pinned [Victory](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md#victory),
it checks total conquest, equivalent last-seat standing, the mover's optional
35-of-46 domination, completed-round limit, then human loss. Limit standings rank
countries, armies, then the later seat in the original rotated turn order; there
is no draw. Domination alone does not guarantee termination, despite the pinned
design's stronger sentence. This task follows its explicit termination hazard.
The seam separates pure completion/victory from handoff without adding cards,
rewards, events or callbacks.

A no-human result pauses in `human-loss` before handoff/income. Ordinary
`watchComputers` records consent, clears the temporary result, advances once and
suppresses further loss prompts; `stopGame` freezes that result without inventing
a winner. Neither action draws RNG. `winner` remains authoritative; `result`
provides a reason and sorted final country/army totals. The reference panel shows
the reason/standings, Watch/Stop or restart guidance, with revision-bound controls
and no active battle/move/phase controls at a result. These actions belong to the
plain action history; T31 integrates them into versioned files, and match-save v1
retains its earlier behavior. Evidence and reproduction are under
[T30](prototypes/new-game/T30/README.md); screenshots support owner assessment,
not a claim that automated checks establish visual quality.

## Versioned reference match files (T31)

`serializeVersionedMatch(options, actions, identity)` emits readable JSON with
exactly `format: "malpaco-match"`, `version: 2`, `boardGenerator`, `rules`,
`actionSchemaVersion`, `options` and `actions`. The supported new identity is
`fixed-reference/1` + `victory/1` + action schema 2. These are [designed] storage
protocol constants after inspecting the existing options/match codecs; they
identify the ordered T63 geography/deal path, victory preset and action grammar.
A changed generator or rules algorithm must gain a new identity and explicitly
retain or reject its old path. Full original GameOptions travel with the host;
the envelope identifies the actual map despite the existing `options.board`
vocabulary remaining `"generated"`.

`deserializeVersionedMatch(text)` returns format version, identity, original
options and a rebuilt state. Existing three-key version-1 saves delegate to
unchanged `deserializeMatch`, with normalized `generated/1` + `malpaco/1` +
schema 1 identity. The old serializer/output, options-only codec and generated
UI remain unchanged. Unknown identities/combinations, extra snapshot fields,
malformed actions and illegal histories throw `SaveFormatError` before a live
match changes. All eight action kinds replay through `apply`; no computer policy
runs during load. The current baseline policy consumes no RNG; a future policy
that does needs a versioned replay protocol for those draws.

The modern reference setup accepts Load game; gameplay offers Save game and
Load game in a dedicated header row with inline error feedback. Valid generated
files are clearly directed to the generated view, never painted on fixed SVG.
Successful load/new game disposes readers and the replaced controller; failed
load preserves the match and draft controls. Pending captures restore source,
target and amount choice. Movement drafts, selections and battle playback are
transient; saving a draft records only committed history and loading returns to
attacks. Watch/Stop and terminal standings rebuild from their ordinary actions.
Frozen merged-T30 histories, real browser file flows, source deletion controls,
screenshots and exact restoration evidence live under
[T31](prototypes/new-game/T31/README.md).
