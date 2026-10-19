T78 review (Sonnet Medium)
You review PR #210 at 7528b9446026210d34dd3aaab6d8abe64db3daa9. You did not write it. The task file follows.
0. Prove the tree: HEAD is 7528b9446026210d34dd3aaab6d8abe64db3daa9 and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, shared mutable state, stale confirmation, private-card leakage, UI actions mutating core/history/RNG.
   Undo a mutation or scratch edit by writing back the file's saved contents (read it first,
   restore it in a `finally`), or commit first; never `git checkout`, `git restore` or `git reset`
   a file with uncommitted work: they return the last commit and destroy the rest. Keep the saved
   copy inside your worktree (`<file>.saved`, deleted afterwards) or in a `mktemp -d` folder under
   `/tmp`, never as a loose file elsewhere.
6. The blocking and one-pass sections below apply.
Prove each finding (run it, or delete the behaviour and name the test that fails) or label it
unverified. Your final message is the review: the header; the verdict (approve | approve after
named fixes | rework | user decision); per Done-when line `DW<k>: ran <command> → <result>` or
`DW<k>: not run — <reason>`; the findings R1..Rn (file:line, blocking or not); the verdict again
last. Never post it: the script posts it and applies the label.

# T78 Responsive workspace state and continuity

- **Kind**: slice (0.2.0 release backlog).
- **Issue**: #197 · **Release**: 0.2.0 (#194) · **Branch**: `task/T78-responsive-workspace-state-and-continuity` · **Merge after**: T76 baseline.
- **Priority / difficulty**: High / Hard.
- **Implementer**: owner-selected native Sol High, isolated worktree (owner update 2026-10-19). Record before dispatch; preflight remains required.
- **Reviewer**: owner-selected independent Opus Medium, direct Claude harness (owner update 2026-10-19); verify exact identity and record before review. One review per PR unless another is authorized.
- **Evidence**: #191 / T77 / PR196 owner decisions; [selected design](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/DECISIONS.md) and [A1–A11 / viewport contract](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/ACCEPTANCE.md); plan mapping P1. Dimensions/accessibility targets are [designed], not measured results.
- **Owns**: src/ui/workspaceState.ts; tests/ui/workspace-state.test.ts; docs/prototypes/new-game/T78/**; append-only RUN-NOTES.md. Main owns this task contract.
- **Scope**: Introduce an independently testable UI state boundary for camera, optional surfaces, history positions, staged attack pair, confirmation, drafts and focus identity. Adapt existing controller data without copying private opponent hands or mutating engine inputs. Establish deterministic legal fixtures for placement, combat, capture, friendly move, cards and result. This foundation does not activate the new attack gesture or rebuild chrome.
- **Done when**:
  1. `npx vitest run tests/ui/workspace-state.test.ts` — Legal fixture/state round trips preserve exact core/history/RNG and invalid numeric drafts; pair or match replacement invalidates confirmation; no caller mutation or duplicate ownership.
  2. `npm test && npm run build` — Existing behavior remains green; retain fixture counts, commands and preservation/negative controls.
- **Pre-dispatch**: Main freezes meaningful red/mock/green checks before `status:ready`; [the state boundary](../prototypes/new-game/T78/BOUNDARY.md) defines the API and controller authority. Preserve failures/evidence; use the pinned browser environment where relevant.
- **Hazards**: UI state is not a new save schema. Preserve old controllers and published input semantics until T82 deliberately activates explicit Attack. No core or generator changes. Preserve inherited dirt/worktrees, core/RNG/save identity and immutable evidence. Independent approval, exact-head green CI and applicable owner visual judgment precede merge.


## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: the main-frozen T78 state boundary, immutable ownership, private-card visibility, confirmation invalidation and exact core/history/RNG preservation. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. new behavior without a meaningful failing control, or an unauthorized change to controllers/core/generator/save/input semantics
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

Main's review context:
- Read docs/prototypes/new-game/T78/BOUNDARY.md in full. Main authored it and the initial frozen17checks before dispatch; do not weaken either. Main's preflight mock is a tracked TXT feasibility control only. Inspect executable preflight Python but do not rerun historical runners (they preserve named outputs, not rerunnable scratch).
- Verify production source is no-op on the live game: new module only, no controller/core/generator/runtime mounting or published-input changes. UI staged confirmation is inert until T82. Real fixtures must represent placement/combat/capture/friendly movement/cards/result, not crafted illegal states. Opponent private-card/deck elements must never be accessed/copied.
- Re-run DW1 exactly and DW2 exactly. Dependency tree is materialized privately by harness. No browser/owner appearance gate applies to this unmounted state foundation; future visible tasks require owner judgment. No need to run unrelated e2e/browser or launch a dev server.
- Check added tests and production mutation controls; recreate a bounded meaningful mutation using saved source bytes/finally, without overwriting retained evidence. Do not run package-install/update/global/cloud commands.
- Raw measured TXT outputs intentionally retain original whitespace. Do not rewrite them or flag raw trailing newlines as a blocker. Newly authored code/docs must pass scoped whitespace checks.
- This is ONE independent review. Finish whole diff including main-authored test/preflight scripts. Report every blocker together; never publish, push, change labels, dispatch subagents or invoke another reviewer.
- Emit exact standalone SCOPE: complete and FILE: exact/path lines, including each executable Python/TypeScript file; EVIDENCE: docs/prototypes/new-game/T78/... may group generated allowed evidence. Account DW1 and DW2; if not runnable, say why and do not approve. All findings need file:line, blocking/nonblocking, reproduction and likelihood when uncertain.


CORRECTION REVIEW (explicit owner authorization, 2026-10-19):
The first independent Opus Medium review is retained byte-exact under docs/prototypes/new-game/T78/review/round1/FINAL.md; read it in full. Production source was correct and remains SHA256 01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34. R1 was a missing test for an unchanged COMPLETE UNCONFIRMED pair; removing only && state.attack.confirmed survived the old19tests. The implementer appended one assertion, retained the exact killed mutation, restored source byte-exact and reran20focused/838unit+9harness/build. Check these corrections and any new changes; do not invent a new feature or change the frozen API. R2/R3 are prior nonblocking, unverified API observations; main will carry patch ownership to T82, and repository exactOptionalPropertyTypes excludes explicit undefined patches from typed callers.
Inspect the complete current executable diff and new evidence; unchanged generated evidence may be audited as groups against the original receipts. Do not rerun historical runner scripts or overwrite their retained outputs. Independently rerun both Done-when commands and the exact R1 mutation in isolated new scratch; restore source in finally. Do not publish GitHub comments, start another reviewer, change global settings, or invoke cloud/deploy/CI.
FORMATTING: start the final directly with `T78 review (Sonnet Medium)` (no conversational preamble). Emit exact standalone `SCOPE: complete`. Every grouped EVIDENCE line must be ONLY `EVIDENCE: docs/prototypes/new-game/T78/implementation/` or ONLY `EVIDENCE: docs/prototypes/new-game/T78/preflight/` or ONLY `EVIDENCE: docs/prototypes/new-game/T78/review/`. Put explanatory prose on separate lines, never after the prefix; otherwise the parser will hold approval. Each .py/.ts file and RUN-NOTES.md still requires its exact FILE line. Keep DW1/DW2 and verdict protocol.
