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

have() { command -v "$1" >/dev/null 2>&1 && echo yes || echo no; }
echo "Environment: node $(node --version 2>/dev/null || echo none), gh $(have gh), opencode $(have opencode), claude $(have claude), rclone $(have rclone)."
echo "Review default (harness.json): $(node -p "require('./harness.json').review.default" 2>/dev/null || echo ?). Reviews are optional (docs/process.md §4)."
exit 0
