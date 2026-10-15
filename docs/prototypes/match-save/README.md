# Match save and resume evidence

C-SET-05/07 specifies readable versioned settings, seed and action replay. Local
file controls and errors are [designed] after inspecting `save.ts`, `setup.ts`,
`app.ts` and `generatedGame.ts`. The match format stores no state/RNG snapshot.
The options-only format remains compatible. UI loading supports human seats;
computer files receive an explicit unsupported message until computer play lands.

`replay.mjs <fresh-output-directory>` runs acceptance red on baseline, installs
one disposable reference, runs core/browser/build/full suites, omits replay and
accepts an illegal history independently, then restores exact original bytes in
finally. Use the pinned Playwright image. Preflight A exposed a footer overflow
when failure text expanded the header. B passes 23 new core tests, eight new
browser cases, all418 unit and all78 browser tests; its original source hashes
match after restoration. Parent visual inspection of B exposed a right-aligned
alert obscuring the turn heading, now protected by a nonoverlap assertion and
positioned in the upper-left map margin. A/B evidence is retained and indexed by
`preflight-{a,b}-sha256.txt`; no original assets were used.

`verify-final.mjs <fresh-output-directory> [--update-goldens]` tests installed
production, both actual-core mutation classes, the previous right-alert
position, discarded nondefault loaded options and leaked controller listeners. It restores exact saved bytes and records hashes. The optional golden
refresh is limited to existing generated-game and setup/four-seat snapshots:
the added Save game / Load game controls change these pictures. Authored-map and
prototype goldens and all prior assertions remain unchanged. Save-specific
screenshots are captured separately for owner judgment at both viewport sizes.

Changed production files: `src/core/match-save.ts` supplies validated pure replay;
`src/core/index.ts` exports the APIs; `src/ui/app.ts` exposes ordinary history and
removes replaced-controller listeners/dialogs; `src/ui/generatedGame.ts` retains
actual options and adds download/atomic file loading; `src/styles.css` styles
only the new local-file controls/errors. `docs/spike.md` describes the behavior.

Actual-source `implementation-20261015-b/` passes23core/eightbrowser, build,
all418unit/all78browser. Replay omission fails three cases; illegal histories
accepted fails four. Right-alert overlap, lost presentation options and leaked
controllers each fail at both viewport sizes (leak expects one listener, gets
three). Restored23core/eightbrowser pass and all five source hashes match.
`implementation-b-sha256.txt` indexes every retained log/screenshot/manifest.
Failed implementation A is preserved with its own index: an optional absent
alert probe auto-waited and was corrected with count() before measurement.
