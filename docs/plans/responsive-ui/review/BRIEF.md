T77 review (claude-opus-high)

T77 review (claude-opus-high)
You review PR #196 at 6fbfd60ab7c8b204244602b99bd0a977e70d914a. You did not write it. The task file follows.
0. Prove the tree: HEAD is 6fbfd60ab7c8b204244602b99bd0a977e70d914a and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, <project classes>.
   Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
   restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
   a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
   copy inside your worktree (`<file>.saved`, deleted afterwards) or in a `mktemp -d` folder under
   `/tmp`, never as a loose file elsewhere.
6. Apply the full Blocking means and one-pass sections below.
Prove each finding (run it, or delete the behaviour and name the test that fails) or label it
unverified. Your final message is the review: the header; the verdict (approve | approve after
named fixes | rework | user decision); per Done-when line `DW<k>: ran <command> → <result>` or
`DW<k>: not run — <reason>`; the findings R1..Rn (file:line, blocking or not); the verdict again
last. Never post it: the script posts it and applies the label.

# T77 Combined Pro-informed responsive UI/UX plan

- **Kind**: slice (planning only; no product implementation).
- **Issue**: #191 and #194 · **Branch**: `task/T77-responsive-ui-plan` · **Merge after**: T76.
- **Priority / difficulty**: High / Hard.
- **Implementer**: owner-selected native Sol Max agent in an isolated worktree. The owner's explicit effort selection overrides rule 6.7 for this task.
- **Reviewer**: owner-selected independent Opus High through the Claude CLI harness, with `--variant high`; verify returned exact model. Explicit effort overrides rule 6.7; no global roster/default change.
- **Evidence**: owner now requests joint planning of #191/#194, superseding their earlier separation and #191's after-0.1.x planning timing. Study the reviewed own-word Pro manual at archaeology revision `084c1087119fcf45f0d0d2774eea7121487f1cb4`, and check later corrections. Cite manual guide, atlas, reference, coverage and checklist. Compare actual malpaco 0.1.1 source/design and T76 limitations; distinguish inspection from playtesting.
- **Owns**: `docs/plans/responsive-ui/**`; append-only `RUN-NOTES.md`. Main session owns this contract/index and issue/PR coordination.
- **Scope**: A concrete original redesign proposal combining mobile portrait/landscape, tablet and desktop. Recommend a direction and compare a meaningful alternative. Include original low-fidelity sketches, representative complete turn flows, map readability/zoom/selection, simple defaults, a bounded settings inventory, accessibility, layout/orientation state continuity and a proposed unscheduled implementation sequence. Explain a bounded 0.1.2 portrait slice versus any broader redesign; release/version scope remains an owner decision. No working prototype, source/test/dependency changes, product assets, release or implementation dispatch. No original screenshots, help text, artwork or code may enter malpaco. Preserve research unknowns #259/#278.
- **Done when**:
  1. `test -s docs/plans/responsive-ui/PROPOSAL.md` and `test -s docs/plans/responsive-ui/SOURCES.md` pass; manual revision/limitations, source-cited assessment, recommendation/alternative, retain/change/omit rationale and current-game gaps are explicit.
  2. `test -s docs/plans/responsive-ui/WIREFRAMES.md` passes; original static sketches cover mobile portrait AND landscape, tablet AND desktop, plus required-choice/card/map-target interaction. Annotate usable map area, overflow and essential-action placement; no tiny full-board readability promises.
  3. `test -s docs/plans/responsive-ui/ACCEPTANCE.md` and `test -s docs/plans/responsive-ui/BACKLOG.md` pass; proposed concrete viewport/minimum matrix, touch/keyboard/zoom, safe areas, resize state invariants, click-driven future Playwright scenarios and owner appearance decisions are documented. Every backlog item is proposed/unscheduled with priority, difficulty, dependency and measurable criteria; no implementation authorization implied.
  4. `git diff --check` passes; PR changes only owned planning text and append-only notes. Record semantic self-audit of DW1–3, explicit owner decisions and validation limits. Documentation-only: no game build/browser tests or implementation preflight is claimed; no production changes exist to exercise.
- **Hazards**: Shrinking a desktop board is not a phone interaction design. A sheet must not block map-target selection or required confirmation. Hidden totals/logs/controls must remain discoverable. Never conflate researched Pro behaviour with newly designed mobile conventions, or proposal approval with implementation authorization.

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: planning-only boundary, faithful source/unknown handling, feasible responsive essential-action flows, and explicit implementation authorization. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. fabricated observed Pro behavior, missing required device orientation, or an essential action blocked by the proposed layout
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

Review the planning deliverable, not a product implementation. No npm install, game build, browser run, product mutation or prototype is needed. Run exact documentation existence and diff checks, then semantically read every proposal/wireframe/acceptance/backlog/source file and full changed-file inventory. Read cited Pro own-word prose via pinned repository source or gh API if needed; do not fetch or copy original images/assets/help/code.

The owner explicitly requests joint planning now, overriding the older after-0.1.x timing and separate-portrait statements, with Sol Max author and Opus High reviewer. This does NOT authorize product implementation; #194 remains open and no release scope can be decided by the author. Check the actual source-first selection and current capabilities against clean0.1.1 in this worktree, not inherited root dirty files. Compare the bounded0.1.2 suggestion and larger proposal for hidden scope shifts. All UI constants/targets are designed proposals, never validated claims. Check complete flow coverage, map-legibility/selection feasibility on phones, required cards/capture controls not buried or blocking map targets, safe-area/low-height/keyboard/browser-zoom cases, whole history and player army totals, accessible non-gesture alternatives, and orientation/state/RNG invariants. Keep research #259/#278 unresolved; unobserved Pro card/capture/movement screens cannot justify invented observed interactions. Evaluate if owner can choose a concrete coherent design from sketches plus recommendation/alternative, settings default/effect inventory and owner decisions.

Planning acceptance is not runtime acceptance: do not require implementation, a new verification framework or a working prototype. Existing unrelated defects and style suggestions are nonblocking. Report likely substantive contradiction, missing required deliverable or unusable essential flow as blocking with exact file:line evidence. No need to deliberately corrupt Markdown to prove a documented contradiction. Do not change docs during review. Account for every changed path using literal FILE: exact/path; these are few Markdown files. SCOPE: complete only after full inspection. Final includes exact DW1..DW4 commands and results, all findings, Final pass done, final verdict.


---
OUTPUT RULES (from tools/harness/review.mjs; they override anything above that conflicts):
- Do not post to GitHub, commit, push, label or merge anything. The script posts your review.
  Edit nothing, but for a mutation made in place in your worktree and never committed.
  Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
  restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
  a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
  copy inside your worktree (`<file>.saved`, deleted afterwards) or in your own folder under
  `/tmp/opencode/`. Outside your worktree, write only under `/tmp/opencode/` (a
  `mktemp -d /tmp/opencode/mlp-review-XXXXXX` folder is the tidiest, removed afterwards; the reviewer
  agent file allows nothing else). Every other path outside your worktree is forbidden.
- Your final message is the review and nothing else. Line 1 is exactly: T77 review (claude-opus-high)
  Line 2 is the verdict, alone on its line: approve, approve after named fixes, rework, or user
  decision. Then any where-I-worked lines (worktree, HEAD, diff, the commands you ran), then the
  findings (R1, R2, ... with file and line, blocking or not), then the verdict again as the very
  last line. Nothing comes after it.
- A finding you proved that lets a forbidden action or a wrong result past what the task protects
  is blocking, and blocks an approve: never "follow-up hardening" or "outside the threat model"
  unless the task's text says so (L47).
- Report every blocking finding in this one review, not one per round: read the whole diff, then
  make a final pass and write "Final pass done" as the line before the closing verdict. Name any
  part you did not cover, and do not approve then (L49).
- The task has 4 Done-when lines. Right after the verdict line, account for each, one
  line per Done-when line, DW1 to DW4: "DW<k>: ran <command> → <result>", or
  "DW<k>: not run — <reason>". An approve with one missing, or one not run, is not applied. A review that does not end with its verdict, or that has a
  finding after it, is posted flagged and acted on by no one until the main session reads it.
- Your worktree is /home/diego/projects/malpaco/.cache/review-worktrees/196-review-1d1ce47a at 6fbfd60ab7c8b204244602b99bd0a977e70d914a, and it is already your working directory. Run git
  there without -C, and never type that path: a mistyped path ends the run. This rule is about
  your own worktree only (L61): a Done-when line may send git at a pinned repository outside it
  (git -C <path> show <pin>:<file>); run that exactly as written — OpenCode does not path-check
  git -C — and read a granted outside path only with the L59 recipe.

The launcher dependency tree was copied into a private node_modules directory in this retained review worktree.

CLAUDE BACKEND CONTRACT: The exact PR base is 41621686a1584cbce826fcb6f60be8e3b819d1d8, head 6fbfd60ab7c8b204244602b99bd0a977e70d914a. Do not use origin/main for a merged PR. Complete local diff: /home/diego/projects/malpaco/.cache/review-evidence/pr196-0f1201173550/full.diff; bounded parts: /home/diego/projects/malpaco/.cache/review-evidence/pr196-0f1201173550/diff-parts; full changed-file inventory: /home/diego/projects/malpaco/.cache/review-evidence/pr196-0f1201173550/inventory.json. Read all executable changes. For generated evidence you may audit a group explicitly. Never claim a file you did not inspect. Before Final pass done, emit SCOPE: complete only if you covered all changes; otherwise SCOPE: incomplete plus UNCOVERED: paths/reasons. Emit FILE: <exact path> for each changed file inspected; EVIDENCE: <docs/prototypes/.../ prefix> may account for generated evidence only, never executable scripts. These are coverage claims, not independent proof. Every Done-when must be run; include exact DW lines. A missing scope acknowledgment prevents approval. No subagents or GitHub writes. Native Claude permission denials mirror OpenCode publishing restrictions; the trusted hook protects credential paths for Read/Grep/Glob. Bash is granted for tests and in-tree mutations. These are mistake safeguards, not an OS sandbox. Preserve scratch/evidence; do not clean up. Ignore obsolete OpenCode-only path restrictions above: your scratch is your retained worktree. No blanket permission bypass.
