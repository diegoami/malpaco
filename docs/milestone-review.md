# Milestone review

A milestone is a release tag `vX.Y.Z` on `main`. Before the tag, one big review covers everything
since the previous tag. No script forces it: the owner starts it by calling a model's CLI directly,
on whatever model they pick, in a fresh session. Adapted from Geoclick2027's release review.

## How a milestone happens

1. The owner calls a milestone, or the main session proposes one when a coherent set of work has
   landed (a playable slice, a queue closed).
2. The version bump and the release notes land on `main`; that commit is the **candidate**.
3. The main session opens a **milestone issue** (label `milestone`) with: the proposed tag, the
   candidate's full SHA, the previous tag, the PRs merged since (including those merged without a
   PR review), the checks already run on the candidate, the claims to verify with `file:line`, and
   the owner's decisions that are not defects. From then on `main` takes only fixes for the
   milestone's findings until it is tagged.
4. The owner starts the review from any checkout of this repository (a cloud session's clone is
   fine), for example:

   ```sh
   opencode run -m minimax/MiniMax-M3#thinking --agent milestone-reviewer "Review milestone issue #123"
   claude -p --model opus "/review-milestone 123"
   codex exec "Read docs/milestone-review.md and review milestone issue #123 as it says."
   ```
5. The reviewer opens one issue per reproduced finding and posts one verdict, AGREE or BLOCK, on the
   milestone issue. Nothing is pasted back.
6. BLOCK: the findings are fixed in ordinary PRs, the candidate moves to the new `main` commit (the
   issue says so) and the owner starts a re-review. After a third round without AGREE the owner
   decides.
7. AGREE: the main session tags exactly the reviewed SHA and publishes the release (artifacts on the
   GitHub release, `docs/process.md` §6). The owner may also tag without a review; the issue says so.

## Instructions for the reviewer

You are the independent reviewer of a malpaco release candidate. You implemented none of it: verify
everything against the code, not commit messages or docs.

**Input.** The milestone issue number. `gh issue view <n> --comments` gives the tag, candidate SHA,
previous tag, PRs, checks and claims; for a re-review, the earlier verdict and the fix PRs. If any of
these is missing, say so on the issue and stop.

**Set up.** `git fetch origin --tags`. If the working tree is clean, `git checkout --detach <sha>`,
`npm ci`, then run `npm run build`, `npm test` and `npx playwright test` (note any that cannot run
here), and when you finish, check out the branch you started on. If the tree is not clean, do not
touch it: read the candidate with `git show <sha>:<path>` and say which checks you could not run.

**Review** `git diff <previous tag>..<sha>` and follow it into any file it touches or relies on.
`CLAUDE.md` is the standard. Look hardest at: rule correctness and edge cases in `src/core`, rule
values without a finding or a `[designed]` mark (rule 17), purity of the core (rule 18), anything
copied from the original (rule 19), saves and replays that would not load, tests that pass without
the behaviour they claim, and the UI against the owner's bar (rule 20) where a screenshot shows it.
Aim at what CI cannot see. Out-of-scope problems elsewhere count too; mark them so.

**Write to GitHub yourself**, and only this; never edit, commit, push, tag or merge:
- one issue per reproduced finding: label `review` plus one of `bug`, `tests`, `design`, `cleanup`,
  `documentation`; MUST-FIX or follow-up in the title's prefix; linking the milestone issue and SHA;
- always exactly one verdict comment on the milestone issue: AGREE, or BLOCK when any finding is
  MUST-FIX; the SHA reviewed, your model, whether you checked out the SHA, the checks you ran and
  their results, the issues you opened, and what you checked and found clean. A review that finds
  nothing still leaves this record.

Write comment and issue bodies to a file and pass `--body-file`. If posting fails, print the
complete text instead and say why.
