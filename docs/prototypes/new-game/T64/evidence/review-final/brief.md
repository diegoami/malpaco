T64 review (MiniMax M3)
Review PR #147 at 26daa2b95173e114343678c0ea95d0b0695cc005. Main/OpenAI implemented; you are the owner-selected independent MiniMax M3 reviewer. This is the single first review; do not write to GitHub.
Prove HEAD and the diff against origin/main. The owner approved recovery of T22/#66 geography with visual relocation, keeping current game connections and saves. Owner appearance/pacing approval is separate T33 work after T65; technical approval does not provide it.

# T64 Natural coastline postprocessing

- **Kind**: slice
- **Issue**: #111 · **Branch**: `task/T64-natural-coastlines` · **Merge after**: T63 and #138.
- **Difficulty**: Hard; coast detail must preserve every protected landing and usable region.
- **Implementer**: owner-selected main session, isolated worktree; main preflight and recorded contract required.
- **Reviewer**: owner-selected MiniMax M3 via OpenCode; independent family, live ID required.
- **Evidence**: owner selected A; on 2026-10-17 explicitly required coastline/border polish before another presentation, superseding the deferral. Owner additionally selected recovery of #66/T22’s approved geographical direction, allowing visual country/label positions, ports and route shapes to move while preserving gameplay connections and saves. T60 constraints and adopted T62/T63 safety reservations remain binding; their absolute coordinates are no longer fixed.
- **Owns**: src/ui/**; tests/ui/**; tests/e2e/**; docs/prototypes/new-game/T64/**; current-reference notes in docs/spike.md; append-only RUN-NOTES.md.
- **Scope**: Recover #66/T22’s approved geographical direction in the fixed-reference playable map with an original deterministic layout and coastline treatment. Generated-board integration follows under T36; it no longer delays this reference presentation pass. Visual country positions, label anchors, port positions and route shapes may change; rebuild valid landing zones and water corridors at their new positions. Update each island silhouette and its outer country boundaries consistently, retaining exact current adjacency, connected cells, full label/hit reservations and selectable rendered regions. Keep engine map/save identities byte-exact: relocated drawing geometry is presentation only. Coherent subdivision may move with layout; canonical shared-border naturalization is T65; terrain decoration is #119. No game-rule, income or generator-distribution changes.
- **Done when**:
  1. `npx vitest run tests/ui/coast-postprocess.test.ts` — identical inputs/seed reproduce output; exact current graph, shared boundaries, coast attachment, rebuilt reserved corridors, label/hit areas and valid subdivision remain intact across the retained corpus.
  2. `npx playwright test tests/e2e/coast-postprocess.spec.ts` — rendered coast geometry is painted and selectable in a standalone view at 800×540, 1280×800 and 1920×1080, plus actual playable input at both supported desktop sizes; actual labels and routes remain clear; save matched before/after full views and close-ups for owner judgment.
  3. `npm test`, `npm run build` and `git diff --check` pass; affected pinned browser suites pass; retain all drafts, failures, measured outputs and hashes.
- **Hazards**: Main preflights commands before dispatch and splits further if the work exceeds one run. Do not jitter independent polygon copies or turn decorative coves into topology changes. Automated checks protect geometry; matched views include approved T22 G as the visual reference. Owner judges geographical coherence, naturalness and clutter. No automatic approval follows from passing constraints. This presentation pass is an owner-required prerequisite to the next T33 presentation. Keep T22 G and T63 source fixtures immutable; intentionally amend reference-only painted-geometry expectations/goldens with originals retained and the reason declared, never weaken topology/fit/replay assertions.

## Reviewer contract (process section5)
0. Prove the tree: HEAD is the requested head and the diff is the PR; findings name its files.
1. Re-run every Done-when yourself and account for each. Author evidence is not your proof.
2. Every rule constant traces to reviewed evidence; visual constants are explicitly designed with retained probes.
3. No wall clock, unseeded random or order dependence enters rule code. Engine code/map/save identity must remain unchanged.
4. Audit every changed behavior/file against scope; docs made wrong must be updated.
5. Sweep tests that survive deletion, unreachable branches, edge comments, mismatched paint/hit areas, broken shared edges/ports/corridors, mutated input, stale generated assets, hidden captures and unauthorized geometry/assertion changes. Mutate actual source, rebuild clean where assets are involved, run, retain evidence and restore saved bytes in finally. Never git checkout/restore/reset.

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: exact current graph, coherent shared subdivision, coast attachment and sea reservations, readable/selectable native paint, immutable canonical map/saves and original fixtures. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. untraced rule changes, copied original-game assets, weakened topology/fit/replay assertions, tests that survive deletion of the new behavior, or a document used as a status board
Not blocking: wording, style, and defects in code the PR did not change: file those as follow-ups.
When unsure, say how likely the problem is. Rate it blocking only if it is likely and would get
past what the task protects; otherwise it is a follow-up. (L53)

## Report every blocking finding in this one review

This review is your only pass before the author fixes. Do not stop at the first blocking
finding: finish reading the whole diff and the task file, check every Done-when line and
every item under "Blocking means", and report all blocking findings together.

- Before you write the verdict, make one last pass over the full diff for anything you have
  not yet rated, and say "Final pass done" as the last line before the verdict.
- Number the findings R1, R2, … in order of severity. A finding you held back because an
  earlier one was already blocking is a review defect: if two problems share a cause, list
  both and say so.
- Do not rely on a later round. The author fixes everything you list, and the next review
  checks those fixes and new code only, not anything you saw but did not report.
- If you ran out of time or context before covering the whole diff, say which files or
  sections you did not cover. Do not approve in that case.

## Independent execution and evidence
- Prepare shared dependencies if needed with `ln -s /home/diego/projects/malpaco/node_modules node_modules` only when node_modules is absent. The pinned browser wrapper mounts them read-only with temporary Vite caches; do not install new dependencies or update goldens.
- DW1: `npx vitest run tests/ui/coast-postprocess.test.ts` (5 cases); also `node docs/prototypes/new-game/T64/construct.mjs --check` compares all installed assets exactly. Pure construction is offline; application imports only the SVG. The geometry seed is canonical1994; game seeds change rules/deals, not this fixed drawing. Generated-board integration/rates are explicitly T36, not a hidden T64 wide-seed requirement.
- DW2: `python3 docs/prototypes/new-game/T64/run.py` runs the requested npx Playwright acceptance in the established pinned1.63 image (8 cases: all46 selected at3 standalone sizes, both actual desktop sizes). Config inherits the canonical projects/webserver; no skips/tolerance changes. Read actual native label/caption checks and real download/replay assertions. Do not invoke host browser binaries as a replacement for the pinned environment.
- DW3: `python3 docs/prototypes/new-game/T64/checks.py` (588 units/build/whitespace), `COAST_COMPATIBILITY=1 python3 docs/prototypes/new-game/T64/run.py` (90 affected cases), and `python3 docs/prototypes/new-game/T64/inheritance.py` (451 inherited files; only4 declared input paths differ).
- Run actual-source negative controls, including at least one independent probe: `controls.py [case-name]` supports8 classes; it snapshots/restores6source/assets and regenerates fresh assets for caption removal. Audit retained initial failures and exact restoration. A behavior that survives deletion is retaken, not asserted covered. Save independent tools, outputs, originals and mutated bytes ONLY under docs/prototypes/new-game/T64/evidence so the local precleanup hook retains them. Source scratch copies must restore exact bytes. Never overwrite or delete an existing measured run.
- Inputs and raw outputs are preserved in paired archives plus hashes. Verify archive members and current successful source manifests programmatically; do not dump huge SVG/HTML/report/index files into context. Read layout.mjs/render.mjs/construct.mjs, new tests, the small runtime diff, and README's artifact guide. Inspect matched PNGs in previews/ as useful; owner judges aesthetics. T22 G is a visual reference with a different graph; do not substitute its69land/16sea pairs or bonuses.
- Existing reference-game.spec.ts changes ONLY drawing/route expectations from T63 to T64, plus test wording; exact originals/two goldens are retained. All semantic/history/fit/timing assertions and every other existing test remain. Core/T22/T63 files are unchanged. Unit first-case exact target comes from the independently preflighted candidate, not from calling the subject to compute its expectation.
- Author's82-case run predates only close-up captures, ATTACK_EVIDENCE_DIR routing and adding accessibility/friendly-feedback to the compatibility selector. Additional8 cases and current source/raw manifests are retained. You run all90 fresh. Prior148 direct capture/save fallbacks are preserved and archived; the2-case routing smoke verifies fresh raw outputs. No missing output should be claimed as present.
- No CI/model dispatch, branch/PR changes or external publication. The local main-side retention hook preserves owned evidence before removing ONLY this invocation's new review tree and never globally prunes inherited registrations.

## Final format
The first line is exactly `T64 review (MiniMax M3)`, second line the verdict. Then exactly ONE line each for DW1, DW2, DW3, formatted `DWk: ran <commands> → <results>`; combine additional commands on that same DW line, never duplicate DW3. If omitted/not run, state the reason and do not approve. Number every finding R1..Rn with file:line, evidence and blocking rating, or explicitly say no findings. Finish the full diff sweep, then `Final pass done`, then repeat the verdict as the final line with nothing after it. Do not conceal unverified hypotheses or invent owner approval.
