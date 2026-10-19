T91 review (Sonnet Medium ownership correction)
You review PR #212 at 5c5bfb68644e1e1123146d881a75b6d9388be9ad. You did not write it. The task file follows.
0. Prove the tree: HEAD is 5c5bfb68644e1e1123146d881a75b6d9388be9ad and the diff against origin/main is the PR's; findings name its files.
1. Re-run every Done-when line yourself, and account for each (L32). The PR's evidence is no proof.
2. [evidence-driven] Every constant traces to a fixture, report or investigation; a [designed] one says what was searched.
3. [seeded] No wall clock, unseeded random or order-dependent iteration in rule code.
4. Every changed file and behaviour is one the task asks for (L44); docs it makes wrong are updated.
5. Sweep the diff: tests that pass with the behaviour deleted (mutate, rebuild clean, re-take any
   negative result), branches no input reaches, edge comments without a test, CI misclassification, skipped/cancelled verification, immutable diff binding, sparse missing fixtures, truncated browser inventory, incorrect package provenance, cancellation scope, and evidence loss.
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

# T91 Simplify development CI and document reusable adoption

- **Kind**: infrastructure (validation guard).
- **Issue**: #211; consolidates T66/#108 and T67/#118. **Branch**: `task/T91-development-ci`. **Merge after**: none (independent tooling).
- **Priority / difficulty**: High / Hard.
- **Implementer**: owner-authorized native Sol High, isolated worktree; standing difficulty selection.
- **Reviewer**: independent Opus Medium through direct Claude harness; standing owner selection, one review unless additionally authorized.
- **Evidence**: owner approval 2026-10-19; [baseline CI](https://github.com/diegoami/malpaco/actions/runs/39270431182): 48 minutes, checkout 9m25s, duplicate browser passes 17m34s/17m33s; [checkout](https://github.com/actions/checkout/tree/v4), [concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- **Owns**: `.github/workflows/ci.yml`; `tools/ci/**`; `tests/tools/ci-*.test.mjs`; `docs/ci-development.md`; `docs/prototypes/ci/T91/**`; append-only `RUN-NOTES.md`. Main owns task contracts and index/process amendments.
- **Scope**: Keep unconditional workflow events and a stable required `ci` result. Permit only narrowly approved prose changes to use lightweight validation; uncertain/malformed changes select full. Routine code verification keeps complete unit/harness/type/package checks and every browser case/project once against the extracted artifact. Explicit manual full-release mode adds source-server browsers. Reduce sparse checkout bulk while retaining runtime/fixture closure and real Git provenance. Cancel only superseded same-PR runs. Bound future temporary artifact retention; preserve existing evidence, worktrees and durable release artifacts. Document architecture, measured versus estimated savings, operations, rollback and Goal2 adaptation without changing Goal2.
- **Done when**:
  1. `node --test tests/tools/ci-*.test.mjs` — frozen classification, uncertainty, required-gate and workflow guard cases pass, including unconditional required steps and exact browser commands; each predicted bypass has a failing deletion/mutation control.
  2. `npm test && npm run build` — all existing unit/harness and type/build checks pass from the actual sparse input set, without changing runtime/test assertions.
  3. `node tools/ci/verify.mjs` — verifies workflow wiring, full browser inventory equivalence, sparse input completeness/byte preservation and package source SHA; retains auditable results. The final single required CI executes the entire extracted browser suite; do not run duplicate remote experiments.
- **Pre-dispatch**: Main freezes semantic boundary/tests and red/mock/green evidence before ready.
- **Hazards**: Never infer safety from all Markdown/docs, labels or incomplete diffs. Failed/cancelled/unexpected skipped jobs cannot green the gate. Sparse checkout must preserve executable prototypes/fixtures and provenance; checkout filter overrides sparse inputs. Do not alter existing task Done-when, game code, current T78 CI, publication or repository protections.

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: narrow prose classification, immutable complete Git diff binding, full unit/type/package/browser coverage, failed/cancelled/skipped job gating, sparse dependency closure, true commit provenance and protected evidence. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. An untested bypass of these guards or an unauthorized change to game behavior or existing task assertions.
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

Main review context:
- Main froze task contract, semantic boundary,13 preflight guards before implementation. SHA256 manifest and historical red/mock/green/mutation controls are in docs/prototypes/ci/T91/preflight/. Inspect all new executable code, including historical mock MJS scripts and original/mock YAML; do not rerun historical runners or overwrite historical outputs.
- Re-run all DW commands exactly. Use copied private dependencies in your own review worktree. Do not run npm install/update or any actual GitHub workflow dispatch/rerun/cancel. A single ordinary final-head CI after review will execute full packaged browser suite. Inventory listing is not execution; state limits explicitly. No need to repeat full browser suite locally.
- Audit actual workflow behavior, not just textual tests. Inject at least one bounded realistic bypass mutation, restore saved bytes in finally and show which assertion kills it. In particular inspect whether plan tests/Git metadata failures could light-classify runtime changes, whether aggregator always runs and consumes actual conclusions, and whether cancelled/unexpected skip can green requiredci.
- Check routine retains full existing source/release case+project inventory and only removes duplicated server execution. Type/unit/harness/package/HTTP/checksum gates stay complete. Release mode is explicit workflow_dispatch full_release. Source test commands required by other tasks still apply.
- Sparse checkout omissions are ephemeral and must preserve source/fixture/transitive-code inputs and Git metadata. No filter input alongside sparse-checkout. Evaluate binary dependencies needed by fixture HTML/SVG, package sourceCommit and potential stale-dist acceptance. Do not delete or rewrite any retained evidence/archive/worktree.
- New docs must be usable by another session: operating commands, rollout/rollback, measured versus estimated savings, retention and Goal2-specific discovery. Goal2 currently uses manual-onlyCI with python3 tools/check_premerge.py --expected-head "$GITHUB_SHA"; preserve that design in guidance rather than blindly adding this Vite architecture.
- Raw historical TXT outputs intentionally preserve trailing whitespace. Do not rewrite them or classify it as a blocker. Newly authored executable/docs should pass scoped whitespace checks.
- One independent review: do not publish, change labels, spawn agents, start another reviewer or touch another worktree. Report every blocker together and inspect full changed-file inventory.
- Formatting: begin directly with T91 review (Sonnet Medium ownership correction), standalone SCOPE: complete, exact FILE: path for EACH executable/script/YAML file, including mock sources and workfloworiginal/mock evidence. EVIDENCE: docs/prototypes/ci/T91/ may group generated allowed data suffixes only and must be a bare path with no explanation after it. DW1/DW2/DW3 each need exact ran/result or explicit not-run. Final pass done directly before finalverdict.

Ownership-correction review context (second rework; third review overall):
- Owner sets a session-wide difficulty-based roster: implementer Sol Medium/High/Max, reviewer Sonnet Medium/High or Opus Medium. Main selects Sonnet Medium for this focused ownership correction; earlier main-direct implementation was explicitly authorized.
- Read complete round1/FINAL.md and round2/FINAL.md plus ownership-correction-20261019/REPORT.md. The prior Sonnet approved initial R1/R2 guard-test fixes. Its formatting-only scope omission of implementation-02/SHA256SUMS was independently closed by main's135/135 hash audit. Preserve prior dispositions; check fixes and new code, not unchanged previously inspected code as a new round.
- Final original CI39322938082 at e327eabf failed guard-files with Git128 dubious ownership. Requiredci failed closed. Full failure and fresh verify-WLyJxi receipt retained under ownership-correction-20261019/failed-ci. No rerun of that head. This confirms the prior ownership concern.
- New code: tools/ci/git.mjs (scopedGit), verifier invocation routing and accurate command receipts, tests/tools/ci-git.test.mjs (two actual real-Git ownership tests), brief docs/ci-development.md paragraph. Workflow, existing assertions, core/UI and task contracts unchanged.
- Independently test the five ownership controls: absent scoped trust, wildcard trust, verifier read-helper bypass, final status-helper bypass, original verifier. Restore exact bytes in finally. Check real-Git rejection for unrelated checkout and receipt command accuracy. Never alter global Git trust. Integration fixture deliberately lacks packaging code so package-acceptance fails after all Git reads; that expected bounded failure is not a production verifier pass.
- Main already ran every DW command in the pinned Playwright container as root against owner-owned actual sparse worktree at19144e03;20guards/838Vitest+9harness/type/build/packageHEAD/384matching identities/zero physically excluded files passed, systemdexit0. Read retained raw outputs but rerun yourself on your actual review head. Full checkout is honest if your launcher provides it; do not claim physical sparse omission. Container's bundled Node differs from hosted setup-node22. No local browser pass claimed; final corrected-head CI must execute complete browsers once after approval.
-70 unchanged historical downloaded artifact members are hash-indexed at canonical existing paths; no unique evidence removed. The raw prior Sonnet archive is now included in this branch. Include FILE: docs/prototypes/ci/T91/implementation-02/SHA256SUMS and any new non-generated/executable files in scope acknowledgment; grouped evidence suffix rules do not accept extensionless filenames or source scripts.
- Nonblocking repeatable provenance negative-controls and documented default artifact retention stay explicit. No scope expansion or GitHub workflow dispatch. If blockers remain, report all together; a third rework round requires owner escalation.
