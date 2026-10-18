# Card sets, Wilds and Surge evidence

T38 adds opt-in trade-v1 core rules. `docs/spike.md` describes the API and frozen replay stages; `parent-preflight/PROPOSAL.md` records the original disposable design and its scope decisions.

## Acceptance and negative controls

`parent-acceptance/FROZEN-ACCEPTANCE.json` freezes three independently authored test files and eight ordinary-action replay fixtures. The parent retained baseline31 failures/one old-compatibility pass, mock32 passes, an Anchor5-to6 mutation causing five failures and a stricter Wild-limit mutation causing nine failures. `parent-acceptance/mock-20261018T114049512928Z/receipt.json` records exact restoration; the final frozen32 positive receipt is `mock-20261018T115510554619Z/receipt.json`. All earlier drafts/failures remain preserved.

`implementation/mock-runtime-equivalence.json` proves all eight adopted source token streams equal the parent-proven mock after omitting only comments/whitespace. The production source commit is8f90366. The implementation reused those executed negative controls and made no temporary source mutations.

## Fresh production measurements

`implementation/validation-20261018T124257123824Z/receipt.json` records one sequential systemd validation run on actual production source:

- `npx vitest run tests/core/card-sets.test.ts`: pass.
- `npx vitest run tests/core/card-sets-replay.test.ts`: pass; focused total32.
- `npm test`:697 Vitest and8 harness tests pass.
- `npm run build`: pass.
- Pinned Playwright image `mcr.microsoft.com/playwright:v1.63.0-noble`, two workers:28 pass across versioned-match, reference-complete-game, game-event-log and geographic-review-guards suites.

All snapshotted source/test/data/config inputs remained byte-identical after every command; all11 frozen acceptance files remained exact. Raw stdout/stderr, UTC/durations, source-input archive and browser screenshot/report archive are in that validation directory. `archive-member-verification.json` hashes every regular member of each implementation archive; `implementation.json` summarizes verified results and hashes. Original loose browser output remains in the worktree, while `inherited-browser-artifacts.tar.gz` preserves70 earlier browser files before the new run. `validation-unit.log` and `validation-monitor.log` retain the sole unit and monitor outputs.

This evidence does not claim independent review, CI, merge or owner appearance approval. Playable defaults remain victory rules; T39 adds targeted Raid, T40 card UI, T41 computer card policy. Native aggregate token telemetry is unavailable; measured command durations are retained.
