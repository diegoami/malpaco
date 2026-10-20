#!/bin/bash
# SessionStart, Claude Code on the web only: install dependencies and report the optional tools.
# It never fails the session; a missing tool only turns its feature off (docs/process.md §1).
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules ] || npm ci --silent >/dev/null 2>&1 || echo "Setup: npm ci failed; run it by hand."
npx playwright install chromium >/dev/null 2>&1 || echo "Setup: playwright browsers not installed."
if ! command -v gh >/dev/null 2>&1; then
  { apt-get install -y -qq gh || { apt-get update -qq && apt-get install -y -qq gh; }; } >/dev/null 2>&1 \
    || echo "Setup: could not install gh."
fi

# Google Drive artifacts (docs/process.md §6): the remote comes from the MALPACO_RCLONE_TOKEN secret.
if [ -n "${MALPACO_RCLONE_TOKEN:-}" ]; then
  command -v rclone >/dev/null 2>&1 || { apt-get install -y -qq rclone || { apt-get update -qq && apt-get install -y -qq rclone; }; } >/dev/null 2>&1
  folder=$(node -p "require('./artifacts.json').drive.folderUrl.split('/').pop()" 2>/dev/null)
  rclone config create malpacodrive drive scope=drive root_folder_id="$folder" \
    token="$MALPACO_RCLONE_TOKEN" --non-interactive >/dev/null 2>&1 || echo "Setup: could not create the rclone remote."
fi

have() { command -v "$1" >/dev/null 2>&1 && echo yes || echo no; }
if gh auth status >/dev/null 2>&1; then gh_login="logged in"; else gh_login="NOT logged in: add a GH_TOKEN secret (docs/process.md §1)"; fi
echo "Branch: $(git branch --show-current 2>/dev/null) (in a cloud session, the work branch for every task; PRs merge with --merge, docs/process.md §3). gh: $gh_login."
echo "Environment: node $(node --version 2>/dev/null || echo none), gh $(have gh), opencode $(have opencode), claude $(have claude), rclone $(have rclone) (remote $(rclone listremotes 2>/dev/null | grep -qx malpacodrive: && echo configured || echo missing))."
echo "Review default (harness.json): $(node -p "require('./harness.json').review.default" 2>/dev/null || echo ?). Reviews are optional (docs/process.md §4)."
exit 0
