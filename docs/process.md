# Process

`CLAUDE.md` holds the rules; this file says how a task runs.

## 1. Setup (local or cloud)

`npm ci`, then `npx playwright install chromium` for the browser tests. Optional: `gh` (issues,
PRs), `opencode` or `claude` (reviews), `rclone` (Drive artifacts). Nothing outside the
repository is required. The checks: `npm run build`, `npm test`, `npx playwright test`.

## 2. Task files

`docs/tasks/T<nn>.md` from `docs/tasks/TEMPLATE.md`, 150–400 words. **Done when** lines are each
one check a command can run; before dispatch each fails on `main`. **Owns** names directories or
files. A task likely to outlast about an hour of implementation is split into tasks that each
merge on their own. The main session edits task files directly on `main`, the reason in the commit.

## 3. The loop

`status:ready → implement → PR → (optional review) → green CI → squash merge → follow-ups`.

The implementer (the main session, or the `implementer` subagent) works on `task/T<nn>-<slug>`
in the current checkout, pushes after every commit and opens the PR. The PR body: `Closes #<issue>`;
Scope (files and why); each Done-when command with the tail of its output; docs changed. The
implementer's contract:
- Build only what the task asks for. A Done-when you cannot meet: stop and report.
- Every new test fails before your change and passes after it; say how you checked.
- Undo a scratch edit by writing back the saved contents, or commit first; never `git checkout`,
  `git restore` or `git reset` a file with uncommitted work.
- A defect outside the task: report it. A one-file mechanical fix that blocks you may ride the PR,
  declared under Scope.
- Update any document your change makes wrong. Never write status into a document.
- Outputs (screenshots, measurements, logs) go to `artifacts/`, never into Git (§6).

## 4. Reviews

**Per PR: optional.** The main session decides whether a PR deserves a review (rule-core changes,
saves, anything risky) and runs `node tools/review.mjs --pr <n> [--brief docs/tasks/T<nn>.md]`.
It uses `harness.json`'s `review.default`; `--model <key>` picks another registered model, of
any family. It reviews in the current checkout: `--checkout` first checks out the PR (clean tree
only); otherwise the reviewer reads the PR head through git. The instructions are
`docs/review-pr.md`. Exit 3 means no review came back: read the error and fix the cause. One
review round, then what remains becomes follow-up issues unless it is a real defect in what the
task delivers. Blocking means a real player or developer would hit it through normal use.

**Per milestone: the big review.** `docs/milestone-review.md`: a milestone issue, then the owner
calls a model's CLI directly (`opencode run --agent milestone-reviewer …`, `claude -p
"/review-milestone <n>"`, or any other tool pointed at that file); the reviewer opens issues
and posts AGREE/BLOCK on the milestone issue. PRs merged without a review are listed there.

## 5. Bugs and triage

Bugs and non-blocking findings are filed with `triage:needed`. Triage decides: **fix** (changes no
outcome; the issue is the contract, its Done-when a failing-then-passing test), **correction
task** (changes an outcome), **fold** into a task not yet ready, or **close** with the reason.

Labels: `task`, `bug`, `fix`, `triage:needed`, `post-playable`, `milestone`, `review`,
`status:{ready,in-progress,in-review,rework,blocked,merged}`.

## 6. Artifacts

Nothing generated goes into Git: write it under `artifacts/` (ignored). Then:
- **Must last** (a release build, the screenshots a milestone was judged on): attach it to the
  GitHub release, `node tools/artifacts.mjs release <tag> <file>...`. CI also keeps its
  screenshots and playable archive as Actions artifacts for 14 days.
- **Otherwise** (proof runs, measurements, diagnostics): Google Drive,
  `node tools/artifacts.mjs drive <path>... [--to T<nn>]`, which copies into a subfolder of the
  [shared malpaco folder](https://drive.google.com/drive/folders/1svRkGxtpasuTbwFuNU2NAHyU10Ac8KUU?usp=sharing)
  (`harness.json` `artifacts`). Link the subfolder in the PR or issue.
  One-time setup on a machine: install rclone, then `rclone config` → new remote named `gdrive`,
  type `drive`, scope `drive`, signed in as the folder's owner. In a cloud session without rclone
  or its login, attach to a release instead, or leave the file in `artifacts/` and say so.

Test fixtures the suite reads (saved matches, frozen boards) are not artifacts: they live in
`fixtures/` and stay small. Evidence removed on 2026-10-20 is in the history and on the `local`
branch (`git show local:docs/prototypes/<path>`).

## 7. Escalate to the user when

A design question; a Done-when would have to weaken; anything destructive (force-push, rewriting
`main`, deleting an issue); a new external dependency.

## 8. Requesting an archaeology investigation

When a question needs exploration of the original game, open an issue in
[`diegoami/isle-wars-archaeology`](https://github.com/diegoami/isle-wars-archaeology/issues)
(check existing findings first) with: the bounded **question**; the **consumer** (the malpaco
issue and decision it informs, and whether work is blocked); **existing evidence**; the
**expected result** (answers with sources, confidence and explicit unknowns). Cross-link it from
the malpaco issue. Only behavioural and design conclusions come back, as citations (rule 15); an
unanswered request is never evidence, and research never decides malpaco's design.
