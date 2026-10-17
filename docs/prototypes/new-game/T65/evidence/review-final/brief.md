T65 review (MiniMax M3)
You independently review PR #148 at ffe49c10851d06476497d471b7f82df2593c0e99. Main session implemented; you did not. The PR is stacked on task/T64-natural-coastlines, whose product has already received independent approval on #147. Prove git HEAD and git diff origin/task/T64-natural-coastlines...HEAD; this is the actual PR scope. Against origin/main it also includes separately-reviewed T64, because #147 single CI is pending; do not misattribute T64 to T65. Merge remains after T64. No CI or other model run.

# T65 Natural shared region borders

- **Kind**: slice
- **Issue**: #117 · **Branch**: `task/T65-natural-region-borders` · **Merge after**: T64.
- **Difficulty**: Hard; both sides of each border must remain one exact shared boundary.
- **Implementer**: owner-selected main session, isolated worktree; main preflight and recorded contract required.
- **Reviewer**: owner-selected MiniMax M3 via OpenCode; independent family, live ID required.
- **Evidence**: owner explicitly required this before another presentation on 2026-10-17; owner subsequently selected recovery of #66/T22’s geographical direction, permitting T64 to relocate visual countries/labels/ports/routes while preserving the current gameplay connections and saves. T62/T63 safety constraints and T64’s resulting coast reservations remain binding.
- **Owns**: src/ui/**; tests/ui/**; tests/e2e/**; docs/prototypes/new-game/T65/**; append-only RUN-NOTES.md.
- **Scope**: For the approved fixed-reference board after T64, replace long ruler-straight internal divisions with coherent original curves/polylines. Generate a canonical shared boundary once and use it for both countries. Preserve positive-length adjacency, all island subdivisions, stable outer coast/ports, route corridors, label/hit reservations and deterministic output. Keep terrain decoration separate (#119); no movement/combat barriers or topology changes.
- **Done when**:
  1. `npx vitest run tests/ui/region-border-postprocess.test.ts` — same input/seed gives identical boundaries; both incident countries use the same curve; exact contact graph, no gap/overlap, connected cells and protected reservations hold on the retained corpus.
  2. `npx playwright test tests/e2e/region-border-postprocess.spec.ts` — all affected regions remain selectable with matching neighbours and readable labels at a standalone view at 800×540, 1280×800 and 1920×1080 plus both supported playable desktop sizes; save matched views and boundary close-ups for owner assessment.
  3. `npm test`, `npm run build` and `git diff --check` pass; affected pinned browser suites pass; retain original drafts, seeded parameters, failures, measurements and hashes.
- **Hazards**: Main preflights before dispatch. Independent noise on adjacent polygons creates cracks and accidental contacts. Renderer hit geometry must agree with painted geometry. Owner judges the result against #66/T22’s approved geographical direction; aesthetic approval is not a proxy threshold. Split further before dispatch if needed; no parallel terrain implementation is implied. This is owner-required before another T33 presentation; generated-board integration remains T36. Keep T22 G and T63 source immutable; intentionally amend only reference painted-geometry expectations/goldens with retained originals and a declared reason, preserving topology/fit/replay assertions.


T65 review (MiniMax M3)
You review PR #148 at ffe49c10851d06476497d471b7f82df2593c0e99. You did not write it. The task file follows.
0. Prove the tree: HEAD is ffe49c10851d06476497d471b7f82df2593c0e99 and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, shared-boundary cracks, topology drift, label or port encroachment.
   Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
   restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
   a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
   copy inside your worktree (`<file>.saved`, deleted afterwards) or in a `mktemp -d` folder under
   `/tmp`, never as a loose file elsewhere.
6. <docs/review-brief.md in full: "Blocking means" for this task, then its one-pass section (L47, L49)>
Prove each finding (run it, or delete the behaviour and name the test that fails) or label it
unverified. Your final message is the review: the header; the verdict (approve | approve after
named fixes | rework | user decision); per Done-when line `DW<k>: ran <command> → <result>` or
`DW<k>: not run — <reason>`; the findings R1..Rn (file:line, blocking or not); the verdict again
last. Never post it: the script posts it and applies the label.

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: exact shared boundaries, current contact graph, connected subdivision, stable coasts/ports/routes/labels, native hit/label reservations and deterministic canonical saves. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. Unjustified design constants, an assertion weakened to fit the drawing, or changed rules/save geometry.
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

Run each Done-when independently with retained output. All measurement outputs must stay inside docs/prototypes/new-game/T65/evidence; helpers create fresh dirs and archive inputs/raw. Do not write /tmp browser outputs or dump huge SVG/HTML/JSON files; inspect boundedly/programmatically. Set a bash tool timeout of at least 1800000 for full browser/control commands; shell timeout is insufficient when the tool defaults to120seconds. This avoids T64's corrected tool-timeout retry. No global worktree prune.

DW1: python3 docs/prototypes/new-game/T65/checks.py --focused (5 units, all5 corpus seeds), then node docs/prototypes/new-game/T65/construct.mjs --check.
DW2: python3 docs/prototypes/new-game/T65/run.py (8 native tests:3 standalone viewports in2projects +2playable).
DW3: python3 docs/prototypes/new-game/T65/checks.py (593units/build/whitespace), env BORDER_COMPATIBILITY=1 python3 docs/prototypes/new-game/T65/run.py (98affected browsers), python3 docs/prototypes/new-game/T65/inheritance.py. Run controls.py plus one independent bounded probe into owned evidence.
Exactly ONE DW1, ONE DW2, ONE DW3 line in final, containing all relevant commands/results. Findings must be explicit and complete. Do not add duplicate DW3 lines.

Inspect CONTRACT.md/README.md, actual borders.mjs, construct and source diffs. Input is immutable T64 board; acceptance target locked before production from retained probe. Identity stub baseline has2intended failures/3invariants honestlygreen; mocked corpus passes5 and native mock8; all5temporarypaths restored. No aesthetic proxy threshold:60of61borders curve; protected Southridge/Southreach remainsstraight as documented. All15amplitude/seedprobes pass unchangedT62. Owner appearance/pacing remains unapprovedT33, not your decision. No generated-map integration/T36/terrain119 scope.

Only runtime change is SVGimportT64→T65. Current reference painted-geometry source and2openingPNGgoldens intentionallychange; exactoriginals retained. Coastbrowser helper usesT65onlyforcurrentplayableexpectations; standaloneT64 assertions stayimmutable. No core/gamegraph/save/assertion/fit/timing weakening. Check actualsavepolygons/labels remainT63.

Sourcecontrols mutate actualhelper/view, restore5originals in finally; use appropriate timeout. Never commit/stage/push/writeGitHub. Capture all outputs in owned evidence; exact localreviewagent/retentionrunner archived in review-tools, canonicalharnessunchanged. Runner retains fullownedtree before removing only its own freshreviewworktree. T64fixtures/assets/coasts/ports/routes/labels must remain byteexact. Earlier98positive source archive predates solely expanded provenance capture of T64staticinputs in run.py; final8/currentchecks include that capture correction, product/assertion bytes unchanged. Retain all failure/raw outputs rather than deleting them. Use unchangedinspect, not a relaxed replacement.
