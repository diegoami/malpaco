T69 review (MiniMax M3)
Review round2, focused follow-up of PR156 at d40d24e0b6757e9ebf4c430b554fa7dfda85e071, same implementation/reviewer pairing and session. You approved c7b7c32 with non-blocking R1; OpenCode later exited1 on full system/tmp after your normal completed final. That full final is retained and posted without applying approval. Your checkout is fast-forwarded to d40d24e0b6757e9ebf4c430b554fa7dfda85e071; all your earlier scratch remains. TMPDIR/logs are now on project storage.
Check only fixes/new code since c7b7c32, not the prior archival audit. R1: scope fixture now exercises group-only executable claims. Parent found HTML/JSX/extensionless files passed the earlier suffix exclusion, so known generated-data whitelist now defaults unknown/code files to explicit FILE. New test failed before the fix; omissioncontrol evidence-code must fail. Temp fix: Claude child TMPDIR points to evidence/tmp, preserves parent env and is retained; matching new acceptance failed before. Omissioncontrol child-temp must fail. Shared docs/models copy is restored unchanged; feature guide and issue hold local notes. Docs explain parent launcher temp and existing permission limits. No new model/provider/routing/default changes.
Prove HEAD and c7b7c32..HEAD delta. Re-run the six harness groups, full npmtest/build/selftest/diffcheck (fast), controls.py12classes with source restoration, and verify-evidence.py. Reuse prior source/evidence review for unchanged parts; do not run another paid model, historical agy scripts, broad T68 audit or browser/CI suite. The existing real Claude stdout replays through the final validator and still holds for honest partial scope; no whole-PR153 approval is claimed. Keep all scratch under this worktree owned T69/reviewer-measurements. Report all new findings, exact DW accounting and approve/rework final using the original header. If an earlier non-blocking issue is fixed, say so. Full task and review contract follow.

# T69 Claude CLI review backend

- **Kind**: infrastructure, review guard.
- **Issue**: #155 · **Branch**: `task/T69-claude-review-backend` · **Merge after**: —.
- **Implementer**: main session, standing owner selection, isolated worktree.
- **Reviewer**: standing independent MiniMax selection via OpenCode; Claude is an explicitly requested backend trial, not its own implementation reviewer.
- **Evidence**: owner request; PR153 Claude trials, exact Claude model discovery and retained receipts on branch evidence/claude-cli-review-153; issue155.
- **Owns**: tools/harness/**; harness.json; package.json; docs/harness-claude.md; docs/process.md; docs/models.md; .claude/skills/run-task/SKILL.md; docs/prototypes/new-game/T69/**; append-only RUN-NOTES.md.
- **Scope**: Add selectable Claude CLI review execution to the existing review command, sharing family/blocked/stale-head checks, final parsing, posting and labels. Keep MiniMax default. Ignore repository-controlled Claude settings, use trusted command guards and explicit grants, allow tests/mutations in the isolated tree, retain output and worktree evidence, and supply complete local PR diff/inventory. Verify actual Claude model identity, fail closed on CLI or permission failure, and require scope accounting for approval. No agy work or OpenCode2 migration.
- **Done when**:
  1. `node --test tools/harness/test/claude.test.mjs` rejects wrong/non-Claude model, missing/duplicate init or result, malformed/failed/truncated stream and denied calls; fixtures also prove timeout process cleanup and full evidence retention.
  2. The same tests reject unsafe provider/settings configuration, preserve family/blocked/default semantics, and reject approval with missing/uncovered scope or Done-when, while preserving full findings for manual handling.
  3. `node tools/harness/review.mjs --self-test`, `npm test`, `npm run build` and `git diff --check` pass. A fake-CLI integration exercises the actual shared review entry point, posting/labels and local diff without OpenCode being installed.
  4. One real explicit Claude backend review proves exact model/head, executes the reviewed task checks and a meaningful negative control; prompt/output/receipt/diff hashes and coverage limits are retained. Document invocation, grants, monitoring, exits and cross-repository adoption; post reusable findings to issue155 and model-trials3.
- **Hazards**: Exit0 is not approval. Never load PR-controlled settings/hooks, change global auth, silently map Claude to another provider, prune inherited worktrees or delete evidence. Scope acknowledgments are model claims, not proof of honest reasoning. Preserve all raw finals even on rejection; one final CI only after independent approval.



```text
<T<nn>> review (<model>)
You review PR #<n> at <sha>. You did not write it. The task file follows.
0. Prove the tree: HEAD is <sha> and the diff against origin/main is the PR's; findings name its files.
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
6. <docs/review-brief.md in full: "Blocking means" for this task, then its one-pass section (L47, L49)>
Prove each finding (run it, or delete the behaviour and name the test that fails) or label it
unverified. Your final message is the review: the header; the verdict (approve | approve after
named fixes | rework | user decision); per Done-when line `DW<k>: ran <command> → <result>` or
`DW<k>: not run — <reason>`; the findings R1..Rn (file:line, blocking or not); the verdict again
last. Never post it: the script posts it and applies the label.
```

A further review, such as `/code-review <pr>` on an architecture task, runs only when the user asks
for it and names the model (CLAUDE.md rule 6.2: one review unless the user asks for more); then
always with the PR number, since a bare invocation from an agent reviews the wrong tree. (L8)


# The review brief's own sections

Every review brief carries these two sections, in full, after the numbered block of
`process.md` §5 (or, in the review profile, after the brief's numbered lines). The reviewer reads
the brief in another file, so paste them; never point to this one. Write "Blocking means" for the
task; paste the second section as it is. (L47, L49)

```text
## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: <name it: the guard, check, permission, invariant,
   rule value or file this task exists to protect>. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. <project-specific items: a constant with no evidence, a test that passes with the behaviour
   deleted, a status written into a document>
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
```
