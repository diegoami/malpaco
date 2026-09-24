> Guidance for Claude Code. OpenCode uses [`AGENTS.md`](AGENTS.md); the shared
> principles and the verdict protocol are in [`PRINCIPLES.md`](PRINCIPLES.md).
> **Read it before implementing.**

# The Claude Code mode

This file records the Claude-specific process and the project slot.

## The process

- Claude **implements** the change on a branch, and opens a pull request when a
  remote exists.
- The review is a **fresh-context session** — a new session that has not seen
  the implementation. **The reviewer is the same model family by default; no
  cross-family reviewer is required.** The mechanism may instead be an
  **external process** from another family (for example `codex exec`, or
  `opencode run -m <provider>/<model>`); when it is, record the tool and the
  model id in the review.
- There is **no design stage** and **no AGREE/BLOCK marker**. The review is
  recorded per [`reviews/README.md`](reviews/README.md).
- **Fallback:** a new session, or the external process, recorded. The rules are
  in the protocol.
- The builder fixes findings in the same change; a finding the builder disagrees
  with goes to the owner, not around the reviewer.
- The **owner may review** as an independent option, but an owner is not
  automatically a fresh context — and is not one if they directed or wrote the
  change.
- The **owner merges** (`PRINCIPLES.md`), unless the project slot records
  `merge: auto`. The owner may also ask for a review by OpenCode's process
  instead, when a cross-family check is wanted.

Materiality, fallback, waiver and the defect path are in `PRINCIPLES.md`; the
bootstrap applies as written there — one review, not two stages.

## Project slot

<!-- SLOT:BEGIN -->

- **product:** Malpaco — a turn-based island-conquest game for the desktop,
  built in Godot 4 on a configurable engine, and meant to be beautiful. Take an
  island, hold it, and try not to lose it to a storm: hazards fall on whoever is
  winning and production centres wander, so the board never settles. For
  desktop players (Windows, Linux, macOS; Android later, no browser); whether it
  is a portfolio piece or a commercial release is decided at the vertical slice
  (`DECISIONS.md`, "Commercial intent").
- **paths to inspect:** `core/` (the pure rules engine: `core/rules`,
  `core/validate`), `game/` (scenes and presentation), `data/` (maps as JSON),
  `test/` (gdUnit4 suites, including `test/guard`), `tools/gates.sh`, and the
  documents, each the owner of one thing:
  - [`ARCHITECTURE.md`](ARCHITECTURE.md) — system design, stack, the art
    direction constraint, project layout;
  - [`RULES.md`](RULES.md) — the game specification, the `RuleSet` surface and
    the engine's contract;
  - [`SCENARIOS.md`](SCENARIOS.md) — scenarios, map generation, victory
    conditions and presets;
  - [`ROADMAP.md`](ROADMAP.md) — the iteration plan and current status;
  - [`ONBOARDING.md`](ONBOARDING.md) — setting up a machine, running it, and the
    gotchas that cost someone an evening;
  - [`DECISIONS.md`](DECISIONS.md) — a scannable log of *why* things work the
    way they do: product and design decisions, separate from this file's
    process rules;
  - [`ASSETS.md`](ASSETS.md) — provenance and licence for every asset.
- **the canonical source:** the GDScript under `core/`, `game/` and `test/`, the
  JSON under `data/`, and the documents above. `RULES.md` is the spec the engine
  is judged against, and `SCENARIOS.md` the same for the generator and victory
  conditions. The `*.gd.uid` files beside each script are Godot's and are never
  edited by hand.
- **paths to normally ignore:** `.godot/` — Godot's import cache, regenerated
  by `--import`; `addons/gdUnit4/` — the vendored test framework (6.2.1), not
  ours to edit; `reports/` — gdUnit4's JUnit and HTML output, written by every
  test run; `build/` — export output. Ignoring a path never means deleting or
  gitignoring it.
- **never read or echo:** Android signing material when it arrives (`*.jks`,
  `*.keystore`, `keystore.properties`), any `.env*`, and credentials;
  `export_presets.cfg` holds none today — keep it that way. One machine's paths:
  a local `GODOT_BIN` value is not written into committed files.
- **merge:** owner
- **design:** required — applies to OpenCode mode; Claude mode has no design
  stage.
- **the gates table:** all five run by `./tools/gates.sh`, which the pre-push
  hook runs (`git config core.hooksPath .githooks`, once per clone) and GitHub
  Actions runs (`.github/workflows/gates.yml`) on every pull request and on
  pushes to `main`. Godot is found through `GODOT_BIN`, else `godot` on `PATH`.
  Locally, format and lint are **skipped**, not failed, when gdtoolkit is not
  installed, and the run can still end "all gates green": read the `SKIP` lines.
  CI installs gdtoolkit, so there they always run.

  | gate | command | covers | when | repeats | failure model |
  |---|---|---|---|---|---|
  | format | `gdformat --check core game test` | GDScript formatting | every push, every PR | 1 | deterministic |
  | lint | `gdlint core game test` | GDScript lint rules | every push, every PR | 1 | deterministic; gdtoolkit 4.5 lags the 4.7 engine, so a failure on plainly valid syntax is suspected in the linter first (`ONBOARDING.md`) |
  | test | `godot --path . --headless --import`, then the gdUnit4 runner (`tools/gates.sh`) | every suite in `test/`: the purity guard over `core/`, the validator, the rules engine, the Classic checklist, the cross-configuration and determinism tests, and 100 full games a run | every push, every PR | 1 | deterministic: all chance comes from the seeded RNG in `GameState`, so a repeat measures nothing; a flaky test is a determinism defect |
  | smoke | `godot --path . --headless --quit-after 90`, failing on any script error | the game actually starts and loads the main scene | every push, every PR | 1 | deterministic; exists because the other four stayed green while the game opened blank |
  | export | `godot --path . --headless --export-release "Linux" build/linux/malpaco.x86_64` | a desktop build is produced | CI always (`MALPACO_REQUIRE_EXPORT=1`); locally only when export templates are installed, otherwise skipped | 1 | deterministic |

- **conventions:**
  - **Language.** Code, comments, commits and documents in English.
    Player-facing interface text is English; every name on the board — the map,
    islands, provinces, nations — is Esperanto, diacritic-free so an id is its
    name lowercased.
  - **Roles.** The user is the product manager and the owner; Claude is the
    developer. Test locally. When a deliverable is complete, don't just declare
    it done — give concrete steps to verify it (what to run, click or look at,
    and what to expect). For anything visual, attach a screenshot: the gates cannot tell
    anyone whether the game looks good.
  - **Branches.** New features and fixes go on a branch, not directly on
    `main`; commit and push the branch without asking first. The owner merges
    to `main` only after an explicit OK — a review gate, not a cost one.
  - **Doc-only changes** **[owner decision, 2026-09-24]** — recommended default
    taken: the harness rule replaces the earlier "small doc-only changes can go
    straight to `main`". A change to a document that states design (`RULES.md`,
    `SCENARIOS.md`, `ARCHITECTURE.md`, `DECISIONS.md`) or to a harness file is
    non-trivial and takes a branch and the review (`PRINCIPLES.md`). A doc edit
    that meets none of `PRINCIPLES.md`'s (a)–(d) — a status tick in
    `ROADMAP.md`, a ledger line in `ASSETS.md`, a typo — stays trivial and may go
    straight to `main`; an `ONBOARDING.md` edit that changes how the project is
    set up, run or worked on does not. Reason: the spec is what the
    engine is judged against, so a change to it is a change to the product.
  - **Keep the documents current**, as part of the change that makes them stale:
    - `ROADMAP.md`: check off tasks as they land, update Status, adjust
      deliverables if scope shifts mid-iteration;
    - `ARCHITECTURE.md`, as part of finishing each iteration — a real map of how
      the code is organized, not just the original design doc; this is how the
      owner, who isn't reading the code directly, keeps a grasp of it;
    - `DECISIONS.md`: record product and design decisions as they're made — not
      what was built (`ROADMAP.md`'s job) but *why*. When a later decision
      supersedes an earlier one, amend that entry rather than leaving a stale
      one to be found first;
    - `RULES.md` is the spec, and the engine is judged against it. If the code
      and `RULES.md` disagree, one of them is a bug — decide which, in writing,
      before changing either. Same for `SCENARIOS.md` whenever the generator
      gains a parameter, a victory condition is added, or the schema changes;
    - `ONBOARDING.md`: if a change adds a gotcha, moves where something
      important lives, or changes how the project is set up or run;
    - `ASSETS.md`, from the first asset: source, author, licence and a link,
      for every image, font, shader and sound. A licence that can't be
      reconstructed later is an art rewrite, and the commercial question is
      still open.
  - **Rabbit holes.** Don't go down debugging rabbit holes when the owner can
    fix it in a couple of clicks. Try the direct route once or twice, then hand
    back.
  - **Stack.** Godot 4.7.x, statically typed GDScript throughout, enforced by
    `project.godot` warnings-as-errors; gdUnit4 run headless; gdtoolkit
    (`gdlint`, `gdformat --check`); Godot 2D rendering — `Polygon2D`,
    `CanvasItem` shaders, 2D lights, `GPUParticles2D`; desktop first, Android
    later, no browser; local storage under `user://`, no backend, no accounts.
  - **Hard rules for the engine** — decided, and not to be re-opened:
    - **`core/` is pure.** Plain `RefCounted` classes: no `Node`, no
      `get_tree()`, no signals, no `load`/`preload`, no `Time.`, no global
      `randi()`/`randf()`. All chance comes from the seeded RNG inside
      `GameState`. A gate greps for these (`test/guard`) — don't work around
      it, and don't weaken it.
    - **Integer arithmetic in the rules.** Floats are presentation only.
      Cross-platform replay determinism depends on this.
    - **No rule is a compiled-in assumption.** Every one is a field of
      `state.rules`. Code that assumes the match rule is on, that hazards
      exist, or that victory means conquest is a bug — the AI's code most of
      all. The cross-configuration tests in `RULES.md` exist to catch it.
    - **JSON only for loaded data.** Never `ResourceLoader`, `.tres` or
      `load()` on a path from a file: Godot resources can carry scripts, and an
      imported scenario is untrusted input.
    - **Presets, not toggles**, on anything a new player sees. Classic is the
      tuning target; a change that improves a large scenario at Classic's
      expense is a regression.
    - Generated and authored maps are one type and pass one validator.
  - **Hard rules for the look** — decided, and not to be re-opened:
    - **The beauty is a system, not artwork.** Maps are generated, so nothing
      can be hand-illustrated per map. An art idea that only works on a
      hand-placed board is not usable.
    - **Ownership readability outranks atmosphere.** Colour-blind-safe palette
      plus a non-colour ownership cue; no effect may compromise reading who
      owns what.
    - Hazards are the set pieces — the mechanic nobody else has is also the
      best thing on screen. Spend effort there first.
  - **Decided elsewhere, with their reasons and measurements:** `DECISIONS.md`
    — read it before proposing a change of direction.
  - **Open work** lives in `ROADMAP.md` (Malpaco's own iteration plan; the
    harness `PLAN.md`/`ROADMAP.md` overlay is not taken). Owner decisions still
    owed are listed at the end of `ONBOARDING.md`.
  - **Milestones.** Harness `r4` has no milestone rules and no `milestones:`
    slot field, so none is recorded here. For reference, the release tags are
    `vX.Y.Z` (`v0.1.0` at Iteration 11) and the plan is `ROADMAP.md`.
  - **Harness provenance:** adopted from harness_template release `r4` (commit
    `39c29e3`), on 2026-09-24. Taken: `PRINCIPLES.md` (its conservative floor
    and ownership map adapted to this repository), `AGENTS.md`, this file,
    `design/README.md`, `reviews/README.md`. Not taken: `PLAN.md`,
    `ROADMAP.md`, `verification/README.md`. The adoption's own owner
    decisions:
    - **Which release** **[owner decision, 2026-09-24]** — recommended default
      taken: `r4`, the tagged release, not the harness's unreleased `main`.
      Reason: a tag is frozen and citable; `main` is in flight.
    - **The overlay** **[owner decision, 2026-09-24]** — recommended default
      taken: keep Malpaco's `ROADMAP.md` and skip the harness `PLAN.md` and
      `ROADMAP.md`. Reason: the project already has a living iteration plan
      with status and history; reshaping it would be churn for no gain.
    - **The modes** **[owner decision, 2026-09-24]** — the recommended default
      was Claude mode only; the owner chose to keep both `AGENTS.md` and
      `CLAUDE.md`, working in Claude mode for now. Reason: OpenCode stays
      available for cross-family work without a later harness change.

<!-- SLOT:END -->
