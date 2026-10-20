---
name: run-task
description: Run a task or fix end to end - implement on a branch (main session or the implementer subagent), open the PR, optionally review it, merge on green CI, file follow-ups. Main session only.
---

# Run a task

Argument: a task id (`T<nn>`) or a bug issue number. Follow `docs/process.md` §3–§5.

1. **Read** the task file (or the bug issue) and its issue. Check `gh pr list` for an open PR on the
   task's branch: if there is one, continue it rather than starting over. Label the issue
   `status:in-progress`.
2. **Implement** on the work branch (`docs/process.md` §3): locally `task/T<nn>-<slug>` from
   `origin/main`; in a cloud session the session's own branch, first brought level with
   `git pull --ff-only origin main`. Either directly,
   or spawn the subagent: `Agent(subagent_type: "implementer", model: <alias>, prompt: <brief>)`,
   the brief being the task file pasted in full plus, on a rework round, the review's URL. Do not
   do other work in this checkout while the subagent runs. Read its final report before acting.
3. **PR.** Check that the PR body has every Done-when line with its output. Re-run the one the
   task rests on most. Label `status:in-review`.
4. **Review (optional).** Only when the task file asks for one or the change is risky:
   `node tools/review.mjs --pr <n> --brief docs/tasks/T<nn>.md` (add `--checkout` on a clean tree
   so the reviewer can run tests). Relay its findings in full. Rework once on the same branch;
   what remains becomes follow-up issues with `triage:needed`.
5. **Merge** when CI is green. Locally: `gh pr merge <n> --squash --delete-branch`, then return
   this checkout to `main` and pull. In a cloud session: merge with a merge commit (never squash,
   never delete the session branch) through the GitHub MCP tools or
   `gh api -X PUT repos/diegoami/malpaco/pulls/<n>/merge -f merge_method=merge`, since `gh pr`
   does not work there (`docs/process.md` §1), then `git pull --ff-only origin main` on the session branch.
   Label the issue `status:merged`.
6. **Report** to the user: what landed, what review ran (if any) and its outcome, follow-ups
   filed. Then stop; do not start the next task without being asked.

Escalate (`docs/process.md` §7) instead of weakening a Done-when.
