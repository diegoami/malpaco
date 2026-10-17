Map readability review (MiniMax M3)
You independently review PR #145 at cb6b4a012131c2da2300d1378d86d7bb314b56ec. Main/OpenAI implemented; the owner selected main and MiniMax. Use minimax/MiniMax-M3 at its registered thinking variant. Read the full contract below; do not implement #138, coast/borders or T33.

0. Prove HEAD is the specified head and the diff against origin/main is this PR. Read CLAUDE.md and process before work. Every finding names a changed file.
1. Independently rerun all three Done-when lines, accounting for each. For DW1 run python3 docs/prototypes/new-game/readability137/run.py. For DW2 run READABILITY_COMPATIBILITY=1 python3 docs/prototypes/new-game/readability137/run.py (18 tests incl DW1, existing controls and full replay). Never use --update-snapshots during review. For DW3 run python3 docs/prototypes/new-game/readability137/checks.py and python3 docs/prototypes/new-game/readability137/inheritance.py.
2. New style/drawing dimensions are explicitly designed/derived presentation choices. Core and all rule values, RNG, IDs, histories and saves stay unchanged.
3. Audit all six declared inherited-file amendments: two runtime presentation files, two combined-text expectation files and two opening goldens. Their originals are retained. No geometry/fit/replay/interaction assertion may be weakened. New test rectangle diagnostics preserve their strict condition.
4. Independently delete at least one protected presentation behavior in actual source, rebuild and show its assertion failure; restore exact original bytes in finally. Audit author controls. Use run.py's fresh directories to retain failed outputs. Record exact source identity and compare to reviewed head after restoration.
5. Preserve measured evidence under docs/prototypes/new-game/readability137/evidence, not loose root files. All fresh evidence will be retained before harness worktree cleanup by the local invocation-specific hook. Verify author artifact hashes; do not duplicate inherited big archives. No game presentation approval is yours to grant.

The runner's Docker command binds /home/diego/projects/malpaco/node_modules read-only and isolates Vite caches. This path and /tmp are permission-granted to prevent prior path-rejection failures; use relative worktree paths for your own tools. To run npm test/build in the worktree, create a local node_modules symlink to /home/diego/projects/malpaco/node_modules if needed; do not install/change dependencies. No provider call, other review, CI dispatch or GitHub write from you.

## Blocking means
A Done-when command fails; loss of accessible owner/name/army or keyboard/touch identification; displayed count differs from actual armies; ownership shapes fail the score legend; names do not quiet/emphasize as contracted; labels overlap or large-stack glyphs escape; any changed geometry/core/rules/save/input semantics; weakening a protected assertion outside the explicit combined-text/two-golden amendment; missing measured evidence for a claimed pass. Rate proved likely defects as blocking; hypothetical edges or unchanged-code defects are follow-ups. Rendering approval remains the owner's.

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

Your final message is the complete review. First line exactly `Map readability review (MiniMax M3)`; second line verdict alone; DW1, DW2, DW3 with commands/results; findings R1..Rn in full with changed-file/line, severity and evidence. Final pass done; repeat the verdict alone as the final line. Do not post yourself. Avoid closing keywords before issue numbers.

Full task contract:
# Map readability (#137)

Owner now requires presentation/interaction issues before the game can be shown; this overrides the earlier deferral. Main implements; MiniMax independently reviews. T33 appearance/pacing remains unapproved.

Scope: ReferenceMapView and scoped styles; new actual-browser acceptance; intentionally amend only combined seat/army text assertions and two reference opening goldens. Keep T63 drawing/board, core, saves, histories, hit geometry and input semantics byte-exact. Names remain visible but substantially quieter, strengthening on hover, focus and selection. Army counts are the only numeric annotation inside regions. Distinct ownership badge shapes match the score legend; full accessible name/seat/armies and selection context remain.

Done when:
1. `python3 docs/prototypes/new-game/readability137/run.py` passes actual root setup, four-seat ownership, name hierarchy, mouse/keyboard/touch and large-stack real save upload at both sizes. Retain matched views and actual-negative baseline; inspect images, owner judges appearance.
2. The reference-game and battle-controls pinned browser suites pass after the declared text/golden amendment; geometry, complete replay and fit assertions remain exact. Retain original goldens and all failures. No update of unrelated goldens.
3. `npm test`, `npm run build`, `git diff --check` pass; record source identity and evidence before independent review and one final CI. Preserve inherited entries/worktrees.

No broad coastline/border redesign (#111/#117), direct-attack change (#138), legacy-rule change (#139), OpenCode migration (#143), or owner acceptance inferred.

