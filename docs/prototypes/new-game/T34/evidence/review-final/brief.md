T34 review (MiniMax M3)
Review PR #150 at 7f1860dac78932629340c561e8fae4cfcdf44589. Main session implemented (openai family); you are independent minimax under the owner's explicit pairing. No generation/UI/card work beyond this task. The task contract follows in full.

# T34 Seeded island silhouettes and province subdivisions

- **Kind**: slice
- **Issue**: #79 · **Branch**: `task/T34-seeded-island-silhouettes-and-province-subdivisions` · **Merge after**: T33, T24, T62, T63.
- **Difficulty**: Very hard; estimate, not a model assignment.
- **Implementer**: owner-selected under rule 6; use an isolated worktree and record the choice before dispatch.
- **Reviewer**: owner-selected OpenCode model of another family under rule 6; record the choice before review.
- **Evidence**: [pinned core-rules design](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md), owner roadmap accepted 2026-10-15, and upstream task evidence. T23 resolves source anchors; new constants need citations or explicit [designed] provenance.
- **Owns**: src/core/**; tests/core/**; docs/prototypes/new-game/T34/**; docs/spike.md; append-only RUN-NOTES.md.
- **Scope**: Build seeded geography using the owner-selected A construction direction and T62 coast-entry contract alongside unchanged T24 structural limits. Jointly reserve entrance-country coast opportunities, island placement/orientation, water corridors and real label space; do not freeze arbitrary subdivisions before considering links. Derive land adjacency from positive shared boundaries. Rules never read positions. Export partial geography and entrance reservations for T35 inspection, never incomplete playable boards. Start with retained feasible witnesses and preserve failures; a single reference does not prove generality.
- **Done when**:
  1. `npx vitest run tests/core/island-geography.test.ts` — prescribed island sizes, connected valid cells, no interior overlaps/gaps, symmetric shared-boundary adjacency and contract land-degree headroom hold for all exported successes.
  2. `node docs/prototypes/new-game/T34/sweep.mjs` — enumerate seeds 0..99 with fixed bounded attempts; report valid subdivisions/100, per-constraint failures and replay hashes against the approved T24 budget, with no discarded failures.
  3. `npm test` and `npm run build` pass; affected pinned browser suites pass without weakening existing assertions. Retain measured outputs, screenshots where applicable, commands and hashes in the owned evidence path; report negative-before/positive-after checks and exact restoration.
- **Hazards**: Run the feasibility smoke before algorithm changes. If the approved target is unreachable, stop; do not relax degree, label or shape constraints. Main session preflights acceptance before dispatch; unresolved design conflicts stop implementation, never weaken a Done-when.

T34 review (MiniMax M3)
You review PR #150 at 7f1860dac78932629340c561e8fae4cfcdf44589. You did not write it. The task file follows.
0. Prove the tree: HEAD is 7f1860dac78932629340c561e8fae4cfcdf44589 and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, invalid shared boundaries, stale adjacency, port/headroom bypass, noninteger core arithmetic, hidden playable maps, retry/RNG drift, clock-sensitive tests.
   Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
   restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
   a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
   copy inside your worktree (`<file>.saved`, deleted afterwards) or in a `mktemp -d` folder under
   `/tmp`, never as a loose file elsewhere.
6. Apply the complete task-specific review sections below.
Prove each finding (run it, or delete the behaviour and name the test that fails) or label it
unverified. Your final message is the review: the header; the verdict (approve | approve after
named fixes | rework | user decision); per Done-when line `DW<k>: ran <command> → <result>` or
`DW<k>: not run — <reason>`; the findings R1..Rn (file:line, blocking or not); the verdict again
last. Never post it: the script posts it and applies the label.

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: partial seeded geography, exact shared-border adjacency, unchanged T24/T62 constraints, bounded honest seed sweep and retained original failures. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. Unseeded or noninteger core arithmetic, exported playable state/sea adjacency/bonuses, weakened acceptance/assertions, false provenance, or unrelated runtime changes.
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

Dependencies are already installed in /home/diego/projects/malpaco/node_modules. If your worktree has no node_modules, make a symlink to that installed directory; no npm install/ci or dependency change is needed.

Run commands sequentially, with fresh owned outputs. Every measurement/scratch belongs under docs/prototypes/new-game/T34/evidence, never loose files or /tmp. Preserve originals and failures; no deletion or worktree prune. Bash tool timeout >=1800000 for sweep/browser/controls: its default120sec is too short. Do not dump giant JSON/tars/logs. Do not write GitHub, commit, or mutate inherited main/worktrees/Windows preview.

DW1: python3 docs/prototypes/new-game/T34/run-command.py review-geography npx vitest run tests/core/island-geography.test.ts —10 independently checked cases; prescribed sizes, exact positive shared contacts, simple cells/no overlap/gap, label hits, port landing/water/separation, land degree headroom, partial data/no playable rules, replay/fresh vectors, seed variation including coasts/topologies, zero-budget exhaustion.
DW2: python3 docs/prototypes/new-game/T34/run-command.py review-sweep node docs/prototypes/new-game/T34/sweep.mjs —seeds0..99, >=99% within50, exact all outcomes/rejected candidates, hashes/replay. Read report.targetMet, not just exit code. Parent final refined construction has100/100,100 geometry hashes and4land topology hashes; rerun yourself. Output uses integer units1/2048 CSSpx and exact BigInt rational cuts/distance products. The family deliberately starts at our T64 witness and has two eligible T1 sites; it is not arbitrary-planar-graph generation or the complete T35/T36 deliverable. T35 chooses actual sea adjacency/bonuses; T36 integrates/maps1000seeds/owner UI judgment. No owner appearance approval needed for this non-UI partial-data API.
DW3: python3 docs/prototypes/new-game/T34/run-command.py review-units npm test; python3 docs/prototypes/new-game/T34/run-command.py review-build npm run build; python3 docs/prototypes/new-game/T34/run-command.py review-whitespace git diff --check; python3 docs/prototypes/new-game/T34/run-browser.py review-compat --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts —603units/build/whitespace and24pinned cases. Browser runtime/currentgoldens unchanged; new API not wired into the game until T35/T36.

Run python3 docs/prototypes/new-game/T34/controls.py —actual source omissions of topology exchanges/coast warp/port repair/requested attempt budget. Units must fail intended assertions, not infrastructure; no-port-repair must fail the100-seed target (parent77/100) even though a small positive unit sample can pass. Save and restore exact runtime bytes. Add one bounded independent probe if useful; preserve it and all outputs in owned evidence. Do not mutate concurrently with another check. Inspect source and genuine assertion errors before concluding a control works.

Scope: new src/core/island-geography.ts and tests/core/island-geography.test.ts, owned T34 prototype/witness/evidence/helpers, docs/spike.md and appendedRUN-NOTES. One declared blocking mechanical fix rides under rule12: #151, tests/e2e/reference-complete-game.spec.ts changes only page.clock.install() to explicit fake start2026-10-17T00:00Z, retaining existing pause2026-10-17T12:00Z. Old test nowfails both desktops Cannot fast-forward to the past because host time passed its pause timestamp. New line passes both809-action games; no actions/options/assertions/timinglimits/fixture/goldens changed. Exact old test/failure saved.

The core uses a stripped integer witness, with no owners/armies/production/seaLanes/bonuses. It derives actual adjacency, varies subdivision/shore/placement and repairs exposed ports jointly, preserving every failed attempt. Current reference game, historical generation, core rules, saves, combat/deal constants and RNG module are unchanged. Read CONTRACT.md for all designed constants/provenance and bounded-family limits. Original six/100 fixed-topology feasibility reports, broad sampling failures,77/100 unrepaired sweep, parent test-source drift diagnostic, all mocks and exact restoration remain. Large seed/source files live in verified member-hashed archives; loose originals are not required in a fresh clone. First browser run omitted15 already-hashed new inputs from its source archive; exact matching supplemental-inputs.tar.gz retains them; future wrapper corrected. This is disclosed, not current missing evidence.

Invocation-localreviewer150 permissions/retention runner are archived under T34/review-tools; canonical harness untouched. Full owned scope is copied before removing ONLY your own fresh review tree. Reviewer scratch outside owned scope is a workflow defect, so keep every scratch/output inside the owned evidence directory. Existing backupCLI is intentional pending #143; do not migrate tooling in this PR.

Final formatting: ONLY final text starts exactly T34 review (MiniMax M3), newline, approve/rework/etc on its own line. Exactly one DW1,DW2,DW3 line with all commands/results. Number every finding R1..Rn with severity/file:line. No preface, no accidental approveworktree concatenation. Final pass done on its own line immediately before closing verdict on its own line. Full final is posted; main reads flagged grammar rather than paying a second model.
