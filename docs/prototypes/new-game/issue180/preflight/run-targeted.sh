#!/bin/bash
set -u
start=$(date +%s)
docker run --rm --pull=never --user 1000:1000 --ipc=host -e HOME=/tmp -e COMPACT_PANEL_EVIDENCE_DIR=docs/prototypes/new-game/issue180/preflight/targeted-screens/compact -e BATTLE_EVIDENCE_DIR=docs/prototypes/new-game/issue180/preflight/targeted-screens/battle -e ATTACK_EVIDENCE_DIR=docs/prototypes/new-game/issue180/preflight/targeted-screens/attack -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.63.0-noble node_modules/.bin/playwright test -c docs/prototypes/new-game/issue180/preflight/targeted.config.ts
result=$?
printf 'exit=%s duration_seconds=%s\n' "$result" "$(($(date +%s)-start))"
exit "$result"
