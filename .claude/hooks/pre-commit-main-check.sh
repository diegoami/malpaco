#!/usr/bin/env bash
# PreToolUse hook: refuse `git commit` if the main checkout's branch is not `main`.
#
# Rule 2 (CLAUDE.md): nobody works in the main checkout but the main session,
# and the main session works on `main`. A commit on a feature branch in the
# main checkout is almost always a mistake — process fixes, doc changes, and
# other non-feature work belong on `main`, not on a T<nn> branch.
#
# The hook reads the upcoming Bash tool call's command from $CLAUDE_TOOL_INPUT.
# If the call is a `git commit` (with optional flags and paths, but not
# `git commit-tree`, `git commit-graph`, etc., and not a continuation of
# another word), it checks $CLAUDE_PROJECT_DIR's current branch and refuses
# (exit 2) if the branch is not `main`.
#
# Exits 0 in all other cases (non-commit commands, hooks fired for other
# tools, or commits on `main`).

set -e

input="${CLAUDE_TOOL_INPUT:-}"

# A `git commit` invocation: a leading `git`, optionally followed by
# flag-argument pairs (`-C <path>`, `-m <msg>`, `--amend`, etc.), then
# `commit`. We do NOT match `git commit-tree`, `git commit-graph`, etc.,
# because the closing delimiter excludes word characters (notably `-`).
if ! printf '%s' "$input" | grep -qE '(^|[;&|]|[[:space:]])git\b(\s+(-[A-Za-z]+|--[A-Za-z][A-Za-z0-9_-]*)(\s+("[^"]*"|'\''[^'\'']*'\''|\S+))?)*\s+commit(\s|[;&|]|$)'; then
  exit 0
fi

# Identify the main checkout. CLAUDE_PROJECT_DIR points to the project root
# (the repo this session is running against); the main checkout is the
# primary worktree at that path.
project_root="${CLAUDE_PROJECT_DIR:-/home/diego/projects/malpaco}"

if [ ! -d "$project_root/.git" ]; then
  # Not a git project; allow.
  exit 0
fi

branch=$(git -C "$project_root" branch --show-current 2>/dev/null || true)

if [ -z "$branch" ]; then
  # Detached HEAD or unreadable ref; allow (commits here are unusual but
  # legitimate, and we cannot tell a wrong-branch commit from a workflow
  # that explicitly detached the checkout).
  exit 0
fi

if [ "$branch" != "main" ]; then
  cat >&2 <<EOF
PreToolUse hook refused the upcoming 'git commit':
  $project_root is on '$branch', not 'main'.

Rule 2 (CLAUDE.md): nobody works in the main checkout but the main session,
and the main session works on 'main'. Process fixes, doc changes, and other
non-feature work belong on 'main', not on a $branch branch.

Fix:
  git -C $project_root checkout main

If the main checkout is dirty, resolve that first (the rule forbids
'git stash'); if a worktree conflict blocks the switch, stop and ask the
user.
EOF
  exit 2
fi

exit 0
