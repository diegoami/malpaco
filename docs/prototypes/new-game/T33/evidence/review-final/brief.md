T33 review (MiniMax M3)
Review PR #144 at f10ce6f25518872264cb06883b95284081ea7a4e. Main session implemented (openai family); you are independent minimax. Owner explicitly approved appearance/pacing by “ok continue” after the revised geographical Windows preview on2026-10-17. No further appearance decision is required for this exact revision. Judge technical contract, not taste. Do not implement cards or generation.

# T33 Reference-game playable milestone

- **Kind**: slice
- **Issue**: #78 · **Branch**: `task/T33-reference-game-playable-milestone` · **Merge after**: T32.
- **Difficulty**: Medium; estimate, not a model assignment.
- **Implementer**: owner-selected under rule 6; use an isolated worktree and record the choice before dispatch.
- **Reviewer**: owner-selected OpenCode model of another family under rule 6; record the choice before review.
- **Evidence**: [pinned ui design](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/ui.md), owner roadmap accepted 2026-10-15, and upstream task evidence. T23 resolves source anchors; new constants need citations or explicit [designed] provenance.
- **Owns**: src/core/**; tests/core/**; src/ui/**; src/styles.css; tests/ui/**; tests/e2e/**; tools/release/**; tests/release/**; playwright.release.config.ts; docs/play.md; docs/prototypes/new-game/T33/**; docs/spike.md; append-only RUN-NOTES.md.
- **Scope**: Package the first new playable milestone with the approved reference board, complete ordinary turn, baseline computer and versioned save/load. Explicitly identify the fixed-reference development scope; the final game still requires generated boards. Reuse the existing release machinery. Capture opening, battle, friendly move, computer turn, save/resume and winner screens, plus clear launch instructions.
- **Done when**:
  1. `npx playwright test tests/e2e/reference-complete-game.spec.ts` — a real human/computer setup, ordinary legal actions, save/upload, elimination and victory complete at both desktop sizes with no engine-state injection.
  2. `npm run package:playable` — the extracted artifact starts without source or dependencies and passes the reference-game browser smoke; retain archive hash and screenshots under this task evidence directory.
  3. `npm test` and `npm run build` pass; affected pinned browser suites pass without weakening existing assertions. Retain measured outputs, screenshots where applicable, commands and hashes in the owned evidence path; report negative-before/positive-after checks and exact restoration.
- **Hazards**: Owner approval of playable appearance and pacing is required. Keep broader generator/card/event work off this milestone critical path. Main session preflights acceptance before dispatch; unresolved design conflicts stop implementation, never weaken a Done-when.


T33 review (MiniMax M3)
You review PR #144 at f10ce6f25518872264cb06883b95284081ea7a4e. You did not write it. The task file follows.
0. Prove the tree: HEAD is f10ce6f25518872264cb06883b95284081ea7a4e and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, input-recipe double attacks, hidden state injection, package source dependency, stale capture/load controls.
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
2. What this task protects can be got past: actual-input complete human/computer play, pending save/load, canonical map/rules identity, isolated standalone package and truthful retained evidence. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. Injected browser engine state, weakened fixture/assertions, unsupported rule changes or false evidence claims.
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

Execute all checks sequentially in your detached worktree, with fresh evidence under docs/prototypes/new-game/T33/evidence. Set bash tool timeout >=1800000 for browser/package/control jobs; shell timeout alone does not override the tool's120second default. Never dump giantJSON/SVG/HTML/tar/CI logs. Preserve all drafts, original bytes and measurements. All scratch files go under owned evidence, never loose/tmp, never delete them. No worktree prune. No GitHub writes or commits.

DW1: python3 docs/prototypes/new-game/T33/run-browser.py review-complete —2actualhuman/computer cases at bothsizes, unchanged809fixtureactions (579human/230computer),14rounds, friendly move, capture choice, real download/reload/upload, elimination, conquest, frozen finished input/restart. Ordinary UI actions only; page.clock drives scheduled computer ticks. Expected pure replay observes, never injects engine state. Read current test and frozen fixture.
DW2: python3 docs/prototypes/new-game/T33/run-release.py —npm run package:playable using existing machinery, fresh extraction outsidecheckout,9files/8checksums/4HTTPpaths/launcher,6extracted complete-game+entry cases. It mounts existing main Gitmetadata read-only at absolute path because worktreeGitmetadata needs that path insidecontainer; this was independently preflighted. Source/dependency mount supplies testing/build tools; the extracted game server only serves isolated package files and uses Node builtin modules. Retain package hash and buildsourceidentity. Do not modify the shared Windows preview, and do not publish your reviewer's freshpackage.
DW3: python3 docs/prototypes/new-game/T33/run-command.py review-units npm test; python3 docs/prototypes/new-game/T33/run-command.py review-build npm run build; python3 docs/prototypes/new-game/T33/run-command.py review-whitespace git diff --check; python3 docs/prototypes/new-game/T33/run-browser.py review-compat --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/region-border-postprocess.spec.ts,tests/e2e/coast-postprocess.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/direct-attack.spec.ts,tests/e2e/battle-controls.spec.ts,tests/e2e/battle-accessibility.spec.ts,tests/e2e/friendly-feedback.spec.ts,tests/e2e/friendly-move.spec.ts,tests/e2e/map-readability.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/computer-turn-flow.spec.ts,tests/e2e/victory-options.spec.ts,tests/e2e/entry.spec.ts —100affected cases (98parent+2new). Units593; build/whitespace must pass. Run python3 docs/prototypes/new-game/T33/controls.py:actual omission of computer dispatch/load replacement each causes both newcases to fail; verify actual assertion errors, not infrastructure failure, and exact restoration. Add one bounded independent probe if useful.

PR changes NO production/runtime/core/fixtures/goldens. Only new T33 complete-game fixture/test/evidence wrappers, fixed-reference scope docs in docs/play.md/docs/spike.md/tools/release/PLAY.md, appendedRUN-NOTES. T33 test's old target-click-plus-Single-exchange recipe was explicitly corrected after2exact-army failures following merged138directattacks; current code removes only the obsolete extra buttonpress. Same fixture/options/expectedstate remain. No generated-board/card/event scope; currentcoreT63 graph/saves invariant; T64/T65drawingalready mergedandreviewed. Do not re-review parent implementations as PR changes.

Evidence: sourcepositive2,release6,593units,2actualsource-controls pairs and all originals retained. Prior older583/56 evidence is historical, not claimed currentproof. Current sourcepackage6f0d0b8/SHA32aa87c8 isbyte-matched to currentruntime/drawing; later commits integration/docs/receipts only. Linux/Windows old versions preserved.111newWindowsfiles+manifest verified; rootOPEN-REVIEWpointerpromoted after parent CIgreen. One corrected metadata loop-shadow report retained besideoriginal; no bundlebytes changed. Main dirtyentries/worktrees explicitly preserved. Independent review invocation-localagent/retentionrunner archived under T33/review-tools, canonicalharness unchanged; completeowned scope copied before removing ONLY your new reviewtree. All direct-command scratch/probe/outputs must also stayinowned evidence.

Formatting: your ONLY final text begins exactly T33 review (MiniMax M3), newline, approve/rework/etc on its own line. Exactly one DW1,oneDW2,oneDW3 line after verdict with all commands/results. No introductory assistant text or accidental approveworktree concatenation. R1..Rn findings, then Final pass done on its own line immediately before closing verdict on its own line. Full final is posted; main reads flagged grammar without buying another modelrun.
