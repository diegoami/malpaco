T68 review (MiniMax M3)
You review PR #153 at 5526800 (resolve full hash with git). You did not write it. Main session implemented under standing owner choice; independent family MiniMax reviews. Exact final header: T68 review (MiniMax M3)

# T68 Pilot agy CLI review workflow with Sonnet

- **Kind**: infrastructure, bounded model trial.
- **Issue**: #152 · **Branch**: `task/T68-agy-sonnet-review` · **Merge after**: —.
- **Difficulty**: Medium; external CLI permissions and evidence retention.
- **Implementer**: main session, as already selected by the owner, in an isolated worktree.
- **Reviewer**: standing owner-selected MiniMax via OpenCode reviews workflow changes; the owner explicitly selected Sonnet through agy for the supplemental T34 pilot. Existing T34 MiniMax review remains authoritative.
- **Evidence**: owner request of 2026-10-17; installed `agy --help` and live `agy models` output.
- **Owns**: docs/harness-agy.md; docs/prototypes/new-game/T68/**; append-only RUN-NOTES.md.
- **Scope**: Establish a reproducible optional agy review procedure using a live Sonnet model ID, isolated checkout, bounded noninteractive execution and retained prompt, CLI output, exit code and duration. Try one actual supplemental review of T34. Diagnose startup/auth/permission failures and retain them; never claim a failed trial approved code. Keep canonical OpenCode review automation and its current T34 run intact. No CI dispatch for this measurement or provider fallback.
- **Done when**:
  1. `python3 docs/prototypes/new-game/T68/verify.py` validates live discovery, exact reviewed commit, prompt and output hashes, exit/duration and parent assessment for the actual attempted review. It refuses missing or altered receipts.
  2. `git diff --check` passes; workflow documentation gives the actual invocation, permissions, progress/retention procedure and observed limitations, and the trial is recorded in model-trials #3, cross-linked with isle-wars-archaeology#9.
- **Hazards**: Permission failures require explicit grants, never silent retries with a different provider. Do not expose credentials, alter another review worktree, weaken T34 checks or count a supplemental review as its CI gate. Include Sonnet's tripwire in full. Planning contract is authored on main; production documentation and measurement occur in the task worktree.



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

Blocking means: T68 receipt verifier accepts missing/altered evidence or mistakes denied trial output for approval; scope changes canonical harness/game or exposed credentials; actual trial is falsely represented. This is a bounded optional workflow pilot, NOT a new security boundary or general-purpose merge gate. Unlikely concerns and improvements outside that contract are follow-ups under rule22.

Run DW1 python3 docs/prototypes/new-game/T68/verify.py; run DW2 git diff --check. Audit full owned changed files, recorded Sonnet result and parent assessment/model-trial links. Inspect receipts/JSONL/gzip diagnostics as needed. All three attempts are historical measurements. NEVER EXECUTE attempt-*/run.py: those files recreate paid model trials and temporarily change global settings. No external agy/OpenCode/CI run, installation, server or mutating GitHub action.
Meaningfully prove the receipt guard: copy the minimal fixtures to a fresh directory inside docs/prototypes/new-game/T68/evidence; invoke verify.py with fixture-directory argument. Test at least changed prompt, missing output/attempt, accepting denied result and false cleanup receipt. Preserve raw command results and source hashes and restore exact bytes; retain all scratch. No /tmp scratch and no deleting evidence. Full final header line, verdict alone, DW1/DW2 lines, all numbered findings, Final pass done and closing verdict alone.
