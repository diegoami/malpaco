#!/bin/bash
set -u
label=$1
start=$(date +%s)
docker run --rm --pull=never --user 1000:1000 --ipc=host -e HOME=/tmp -e DIAG_LABEL="$label" -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.63.0-noble node_modules/.bin/playwright test -c docs/prototypes/new-game/issue180/download-diagnostic/playwright.config.ts
result=$?
printf 'exit=%s duration_seconds=%s\n' "$result" "$(($(date +%s)-start))"
exit "$result"
