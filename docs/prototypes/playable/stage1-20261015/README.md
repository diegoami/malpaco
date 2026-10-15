# T21 Stage 1 candidate replay

`baseline-package-command.txt` preserves the initial `npm run package:playable`
result: exit 1 because `package.json` has no such script. The replay repeats this
baseline through the real acceptance command after temporarily installing only
the acceptance file, so the test itself reports the missing package script.

The `.mockfixtures/` files are the exact candidate source intended for
`tools/release/`, `playwright.release.config.ts`, and
`docs/prototypes/playable/acceptance.mjs`. `node
docs/prototypes/playable/stage1-20261015/replay.mjs` temporarily installs them,
adds the package command, runs the actual-source acceptance and artifact-only
browser suite, removes the extracted JavaScript entry to prove an HTTP 404, then
restores the checkout files byte for byte. It records each command, result,
captures, and hashes in a unique `evidence/replay-*` directory.

The parent ran the replay in the pinned `mcr.microsoft.com/playwright:v1.63.0-noble`
container with Node 22 and shared `node_modules`. A stopped at the missing Git
metadata mount; B exposed and recorded a false-positive JavaScript import
reference; C passed package acceptance, the 104-test artifact browser suite, and
the extracted-entry HTTP 404 mutation. All three evidence directories and their
hashes are retained unchanged. The assigned worktree has no local
`node_modules` or `dist`; no local browser or npm check was part of Stage 1.
