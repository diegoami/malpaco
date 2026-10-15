# Game setup acceptance candidate

[designed] Minimal seed and human-seat form after inspecting generatedGame.ts,
app.ts, panel.ts and the T14 panel clipping regression. The first two palette
entries and two-seat panel geometry stay byte-for-byte as before. Extra seats
use distinct colours and badge shapes; the map already prints numeric seats.
Three/four-seat panels reduce card spacing to preserve actions and all scores.

`replay.mjs <fresh-output-directory>` first runs the acceptance red on the base,
installs this single disposable candidate, runs the setup acceptance, build,
full units and full browser suite, mutates selected seed and count independently,
then restores exact original source bytes in a finally block. The evidence
manifest hashes every saved/restored source file. Run inside the pinned
Playwright image (see CI); generated screenshots and logs stay under this path.
The new goldens cover setup and four-seat reinforcement at both configured sizes.
Existing goldens and acceptance files are untouched.

Scope: new acceptance files prove T15 settings/core semantics, validation,
readability, play and round-trip; candidate/replay files make the preflight
reviewable without installing permanent production code.

`preflight-sha256.txt` records the retained preflight evidence bytes, including
failed batches A (empty-message measurement), B (selection text clipping) and
C (attack footer clipping), and successful independent batch D. No original
assets were used. `verify-final.mjs <fresh-output-directory>` tests the actual
installed source and independently removes selected seed/count handling, then
restores exact saved bytes in finally blocks and records hashes. Optional
`--update-goldens` regenerates only this task's setup/four-seat pictures.

Actual-source verification evidence is retained in `implementation-20261015-a/`
and indexed by `implementation-sha256.txt`: setup unit 40, setup browser 8,
full unit 386, full browser 68, and build all pass in the pinned image. Forcing
the route seed to 1994 rejects the selected seed 42 (two ownership mismatches);
forcing two seats rejects selected counts 3/4 (four score-count mismatches).
Restored setup browser passes all eight tests; manifest before/after source
hashes match. All four setup/four-seat pictures were visually inspected at both
sizes by implementer and parent; existing routes' goldens are unchanged.
