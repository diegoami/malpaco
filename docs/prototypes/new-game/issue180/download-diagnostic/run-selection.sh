#!/bin/bash
set -u
start=$(date +%s)
docker run --pull=never --rm --init --ipc=host --user 1000:1000 -v "$PWD:/work" -w /work -e HOME=/tmp mcr.microsoft.com/playwright:v1.63.0-noble node_modules/.bin/playwright test tests/e2e/computer-cards.spec.ts -c docs/prototypes/new-game/issue180/download-diagnostic/selection.config.ts --grep 'three consecutive computers' --project 1280x800 --output docs/prototypes/new-game/issue180/download-diagnostic/css5-selection-results
result=$?
printf 'exit=%s duration_seconds=%s\n' "$result" "$(($(date +%s)-start))"
exit "$result"
