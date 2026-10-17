# T64 Natural coastline postprocessing

- **Kind**: slice
- **Issue**: #111 · **Branch**: `task/T64-natural-coastlines` · **Merge after**: T63 and #138.
- **Difficulty**: Hard; coast detail must preserve every protected landing and usable region.
- **Implementer**: owner-selected main session, isolated worktree; main preflight and recorded contract required.
- **Reviewer**: owner-selected MiniMax M3 via OpenCode; independent family, live ID required.
- **Evidence**: owner selected A; on 2026-10-17 explicitly required coastline/border polish before another presentation, superseding the deferral. Owner additionally selected recovery of #66/T22’s approved geographical direction, allowing visual country/label positions, ports and route shapes to move while preserving gameplay connections and saves. T60 constraints and adopted T62/T63 safety reservations remain binding; their absolute coordinates are no longer fixed.
- **Owns**: src/ui/**; tests/ui/**; tests/e2e/**; docs/prototypes/new-game/T64/**; append-only RUN-NOTES.md.
- **Scope**: Recover #66/T22’s approved geographical direction in the fixed-reference playable map with an original deterministic layout and coastline treatment. Generated-board integration follows under T36; it no longer delays this reference presentation pass. Visual country positions, label anchors, port positions and route shapes may change; rebuild valid landing zones and water corridors at their new positions. Update each island silhouette and its outer country boundaries consistently, retaining exact current adjacency, connected cells, full label/hit reservations and selectable rendered regions. Keep engine map/save identities byte-exact: relocated drawing geometry is presentation only. Coherent subdivision may move with layout; canonical shared-border naturalization is T65; terrain decoration is #119. No game-rule, income or generator-distribution changes.
- **Done when**:
  1. `npx vitest run tests/ui/coast-postprocess.test.ts` — identical inputs/seed reproduce output; exact current graph, shared boundaries, coast attachment, rebuilt reserved corridors, label/hit areas and valid subdivision remain intact across the retained corpus.
  2. `npx playwright test tests/e2e/coast-postprocess.spec.ts` — rendered coast geometry is painted and selectable in a standalone view at 800×540, 1280×800 and 1920×1080, plus actual playable input at both supported desktop sizes; actual labels and routes remain clear; save matched before/after full views and close-ups for owner judgment.
  3. `npm test`, `npm run build` and `git diff --check` pass; affected pinned browser suites pass; retain all drafts, failures, measured outputs and hashes.
- **Hazards**: Main preflights commands before dispatch and splits further if the work exceeds one run. Do not jitter independent polygon copies or turn decorative coves into topology changes. Automated checks protect geometry; matched views include approved T22 G as the visual reference. Owner judges geographical coherence, naturalness and clutter. No automatic approval follows from passing constraints. This presentation pass is an owner-required prerequisite to the next T33 presentation. Keep T22 G and T63 source fixtures immutable; intentionally amend reference-only painted-geometry expectations/goldens with originals retained and the reason declared, never weaken topology/fit/replay assertions.

## Implementer contract

You implement <T<nn>>. The task file above is the contract.
- Build only what the task asks for, even inside a file it requires; say why for each changed file. (L44)
- A Done-when you cannot meet: stop and report. Never weaken an assertion, skip a test or edit the task file.
- **Constraint-feasibility probe** (when the task names structural constraints and a target success
  rate): before any algorithmic change, run a small smoke test that confirms the constraint
  set alone is feasible at the target rate (often a wide-seed sweep of the existing generator
  body, plus the new constraints, with no algorithmic rewrite). If the probe shows the target
  is unreachable, STOP and report. Do not weaken a constraint to make the algorithm pass
  (rule 5); the user prefers a design amendment (preferred) over a quieter relaxation, and
  the probe surfaces the conflict one round earlier than a full implementation.
- Every new test fails before your change and passes after it; say how you checked.
- Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
  restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
  a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
  copy inside your worktree (`<file>.saved`, deleted afterwards) or in a `mktemp -d` folder under
  `/tmp`, never as a loose file elsewhere.
- If you measure: every output a finding or the PR may cite goes under a tracked path the task owns,
  pushed per batch and every 30 min, never deleted or overwritten; originals out, hashes recorded. (L40)
- A comment that asserts behaviour at an edge comes with the test that visits that edge.
- A defect you find outside the task: report it. A one-file mechanical fix that blocks you may
  ride this PR, declared under Scope in the PR body.
- Update any document your change makes wrong, in this PR. Never write status into a document.
- PR body: Closes #<issue>; Scope (files and why); a fenced block with each Done-when command and
  the tail of its output; Docs changed.
