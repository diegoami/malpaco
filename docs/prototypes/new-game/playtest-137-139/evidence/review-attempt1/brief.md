Current-flow playtest review (MiniMax M3)
Review PR #142 at e820073afbc98c57f42a8c98f1a981cb8977da34. Main session (OpenAI family) implemented; you are independent MiniMax M3. Read the entire brief. This evidence-only investigation is deliberately not T33 and does not implement #137/#138 interaction/design changes or fix legacy #139 capture-all.

# Current playable flow: bounded playtest of issues #137–#139

Main session implements the investigation; independent MiniMax M3 reviews, as selected by the owner on 2026-10-17. This is evidence gathering before gameplay dispatch, not T33 or approval of its appearance/pacing.

Scope: reproducible browser probes and retained evidence comparing the current root and the owner-confirmed generated-game URL. Use seed 1994, four seats, one human/three computers, ordinary legal actions, real downloads/uploads and both desktop layouts. Observe selection/repeat behavior, manual Stop, capture interruption/choice, pending save/resume and visible map annotation. No runtime, historical rules/save semantics, goldens or inherited assertions may change. Do not infer the owner's exact historical attack history from a new reproduction.

Done when:
1. `python3 docs/prototypes/new-game/playtest-137-139/run.py` passes four browser probes (two flows at two layouts), retaining screenshots, raw output, URLs, saves/action histories, source hashes and immutable fresh evidence directories.
2. `npm run build` and `git diff --check` pass. The runtime and inherited tests match the parent byte-for-byte. The report separates observations from proposed design, accounts for gaps, and recommends the next scope under rule 11 without declaring T33 ready or owner-approved.

The observations are characterization, not acceptance of click-to-attack or a claim that the legacy route is fixed. Runtime correction, new interaction design and readability changes require their own agreed scope/preflight. Reviewer should independently repeat the probes and inspect screenshots and saved histories; preserve fresh review evidence before harness cleanup.


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

## Blocking means

Any one is enough; a blocking finding means rework, never approve.
1. A Done-when line fails, or cannot be run as written.
2. What this task protects can be got past: the correctness and attribution of the current-root versus legacy-route observations and the unchanged production/inherited source boundary. A bypass you proved is blocking, even when it
   looks like an edge case. Never "follow-up hardening" or "outside the threat model" unless the
   task says so; if it does, quote the line. (L47)
3. Behaviour the task forbids, or behaviour nobody asked for, inside a file the task requires. (L44)
4. Unjustified outcome claims or lost measured artifacts.
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

Practical instructions:
- DW1 is the actual run.py command above; repeat it in your own worktree with Docker, which mounts the existing dependency directory read-only. It does not require local npm ci. DW2 build needs npm ci first if dependencies are absent. Check unchanged src/tests/data/config/dependency paths with git diff against parent ee147f9. Review the findings report and scope limits; owner appearance approval is not claimed.
- The two source controls are not required in DW1 but inspect their evidence and run one bounded own control if useful. Any source edit must save bytes and restore exactly in finally, never git restore/checkout/reset.
- Source/outputs archives include inherited files by provenance; no need to read inherited files unrelated to the comparison. Validate hashes and claimed fresh source identity. Existing failed attempts are intentionally retained, not green evidence. Probes are characterization with actual-source negative controls, not a false claim that a production feature was added.
- Do not run full source/extracted browser CI or packaging: production is unchanged. Run exactly the bounded contract, and mention practical coverage limits. Read screenshot previews; the owner judges appearance.
- Fresh evidence is automatically retained by a local precleanup hook; do not delete any output. Before final, also archive your newly produced evidence to /tmp/opencode/pr142-retained in case of interruption; this path is granted by the reviewer permissions and output rules below. Mention exactly what was retained.
- Use the exact first line including the closing parenthesis and no period. Account for DW1 and DW2. Report every finding, with evidence, then Final pass done and final verdict.
