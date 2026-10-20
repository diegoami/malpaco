# Process

`CLAUDE.md` holds the rules; this file says how a task runs.

## 1. Setup (local or cloud)

`npm ci`, then `npx playwright install chromium` for the browser tests. Optional: `gh` (issues,
PRs), `opencode` or `claude` (reviews), `rclone` (Drive artifacts). Nothing outside the
repository is required. The checks: `npm run build`, `npm test`, `npx playwright test`.

**Cloud sessions** (Claude Code on the web) set up by the session-start hook, from the
environment's secrets:
- `GH_TOKEN`: a fine-grained GitHub token for `diegoami/malpaco` with read and write access to
  contents, issues and pull requests. Without it `gh` cannot read labels, open or merge PRs, and
  autonomous work stops at the first PR.

  **Only GitHub's REST API is reachable** from a cloud session: GraphQL is blocked ("GitHub
  GraphQL is not available from Claude Code sessions"), so `gh auth status`, `gh pr …` and
  `gh issue …` fail although the token works. Use the GitHub MCP tools, or `gh api`
  (`R=repos/diegoami/malpaco`):

  | Instead of | Use |
  | --- | --- |
  | `gh issue list --label L` | `gh api "$R/issues?labels=L&state=open" --jq '.[] \| "#\(.number) \(.title)"'` |
  | `gh issue view N` | `gh api $R/issues/N` and `gh api $R/issues/N/comments` |
  | `gh issue create` | `gh api $R/issues -f title=… -F body=@file -f 'labels[]=L'` |
  | `gh issue edit N --add-label L` | `gh api $R/issues/N/labels -f 'labels[]=L'` |
  | `gh pr list` | `gh api "$R/pulls?state=open"` |
  | `gh pr create` | `gh api $R/pulls -f title=… -f head=<branch> -f base=main -F body=@file` |
  | `gh pr checks N` | `gh api $R/commits/<head sha>/check-runs --jq '.check_runs[] \| "\(.name) \(.status) \(.conclusion)"'` |
  | `gh pr merge N --merge` | `gh api -X PUT $R/pulls/N/merge -f merge_method=merge` |
  | `gh pr comment N` | `gh api $R/issues/N/comments -F body=@file` |

  `tools/review.mjs` and the milestone review use `gh pr`/`gh issue`; they run on the owner's
  machine, not in a cloud session.
- `MALPACO_RCLONE_TOKEN` (and, with the owner's own OAuth client, `RCLONE_DRIVE_CLIENT_ID` and
  `RCLONE_DRIVE_CLIENT_SECRET`): Drive artifacts, §6.

## 2. Task files

`docs/tasks/T<nn>.md` from `docs/tasks/TEMPLATE.md`, 150–400 words. **Done when** lines are each
one check a command can run; before dispatch each fails on `main`. **Owns** names directories or
files. A task likely to outlast about an hour of implementation is split into tasks that each
merge on their own. The main session edits task files directly on `main`, the reason in the commit.

## 3. The loop

`status:ready → implement → PR → (optional review) → green CI → merge → follow-ups`.

**Branches.** Locally, each task has its own branch, `task/T<nn>-<slug>` from `origin/main`,
squash-merged. In a cloud session, the session's own branch (`claude/…`, which the session
starts on and may be the only one it can push to) is the work branch for every task in that
session, one PR per task. Cloud PRs merge with a merge commit (`gh pr merge --merge`), never
squash: the session branch is then contained in `main`, so `git pull --ff-only origin main`
brings it level and the next task starts there, with no force-push. A PR still open when a
session ends is continued by the next session (check it out, then work on the new session's
branch from it, or finish it in place).

The implementer (the main session, or the `implementer` subagent) works on the work branch in
the current checkout, pushes after every commit and opens the PR. The PR body: `Closes #<issue>`;
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
  GitHub release, `python3 tools/artifacts.py release <tag> <file>...`. CI also keeps its
  screenshots and playable archive as Actions artifacts for 14 days.
- **Otherwise** (proof runs, measurements, diagnostics): the owner's
  [Google Drive folder](https://drive.google.com/drive/folders/1aUlXfup_GwQOxF3njvXODbOPyrublgeS)
  (`artifacts.json`), through `tools/artifacts.py`, the same interface as goal2's:
  `push [--to T<nn>] <path>...` uploads, `pull [NAME...]` copies into `artifacts/`, `where`
  prints the location. Link the subfolder in the PR or issue.
- **Setup**, once per machine: install rclone, then
  `rclone config create malpacodrive drive scope=drive root_folder_id=1aUlXfup_GwQOxF3njvXODbOPyrublgeS`
  (a browser login; the remote sees only this folder). **Cloud sessions:** the environment's
  secret `MALPACO_RCLONE_TOKEN` holds the remote's token (the JSON after `token =` in
  `rclone config show malpacodrive`); the session-start hook installs rclone and creates the
  remote from it. Never commit the token. Without it, attach to a release, or leave the file in
  `artifacts/` and say so.

Test fixtures the suite reads (saved matches, frozen boards) are not artifacts: they live in
`fixtures/` and stay small. Evidence removed on 2026-10-20 (`docs/prototypes`, 11 GB) was cut from
the history too, so clones stay small. It is archived, with every old branch, as a Git bundle in
the Drive folder's `archive/` (`python3 tools/artifacts.py pull archive`, then
`git clone artifacts/archive/malpaco-full-2026-10-20.bundle`; its README says more).

## 7. Working autonomously, and what goes to the user

The main session works through a milestone's queue without asking per task: it marks tasks
`status:ready` itself, runs them one after another (`/run-task`), and stops at the milestone
review. **Questions are gathered early:** when a milestone starts, the main session reads every
task and plan in its queue and opens one issue, `Questions for <milestone>` (label `question`),
listing every owner decision it can foresee, each with its options and a recommendation. It asks
again only for what nobody could foresee, and meanwhile works on tasks no question blocks.

Goes to the user: a design question; the look of the game (rule 16); a Done-when would have to
weaken; anything destructive (force-push, rewriting `main`, deleting an issue); a new external
dependency.

## 8. Requesting an archaeology investigation

When a question needs exploration of the original game, open an issue in
[`diegoami/isle-wars-archaeology`](https://github.com/diegoami/isle-wars-archaeology/issues)
(check existing findings first) with: the bounded **question**; the **consumer** (the malpaco
issue and decision it informs, and whether work is blocked); **existing evidence**; the
**expected result** (answers with sources, confidence and explicit unknowns). Cross-link it from
the malpaco issue. Only behavioural and design conclusions come back, as citations (rule 15); an
unanswered request is never evidence, and research never decides malpaco's design.
