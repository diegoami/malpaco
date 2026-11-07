# 0.5.4 candidate provenance boundaries

The exact reachable source pin, successful CI event/checkout and original artifact
IDs/sizes/digests are recorded on [#457](https://github.com/diegoami/malpaco/issues/457)
after verification. Do not substitute a newer branch SHA, temporary merge ref or
local rebuild for those pinned bytes. This document is not a publication receipt.

- Previous immutable tag v0.5.3:
  `b6f9e5458fc066a4badce518404d4ed10bbfe53c`.
- Previous exact playable SHA-256:
  `508726737d7d97998da14b48b0e2facef12dba2319f331dfd9694cd38078511b`.
- Core tree remains `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba`.
- Fixture tree remains `97eb8e0703af6868a2d23c9d8e1665aa069c1222`.
- Only package/root-lock product versions change to 0.5.4; dependency records,
  rules/AI, constructors and saved-game/replay identities remain unchanged.
- Scoreboard storage stays version 2. Compatible retained-row classification is
  limited to exact known configurable-cards/1 metadata and preserves unknown
  aggregates, totals, ids and caps. Its marker survives the actual v0.5.3 reader.
- Selected Oxygen source is pinned to KDE commit
  `51b11680df7dbe91361904ad8e92193cb495f5d1`; SVG SHA-256
  `423bd45b641832f72fa8671917297c9787ca319afc169a84eca43cdc7ddd8fed`.
  `public/third-party/oxygen/SOURCE.json` records source/notices/checksums.
- Selected illustrations and their actual source hashes remain in
  `docs/manual-images/PROVENANCE.json`. Dirty captures are explicitly disclosed,
  committed with matching source, and are not clean-head release/device evidence.

Contracts: [scope](../../plans/release-0.5.4.md), T167–T171. Evidence includes the
original version/manual reference-snapshot failure (37 pixels in both projects),
the corrected unchanged-golden checks, initial fixture/driver failures and exact
restorations, scoreboard compatibility probe, and both incomplete setter-only and
complete Help-on-open selector mutations. Failed/superseded runs are not passes.
See [acceptance](ACCEPTANCE.md) for the full byte and owner gates.

Whole-tag review includes prior hosting/link PR #450 and post-v0.5.3 administrative
records, plus version/manual #455, controls #459, scoreboard #460, guards #461 and
release preparation #462's PR. No independent per-PR review is claimed. Existing
v0.5.3 Netlify production `6ae7d5b45d42a9050b8ff7c9`, the 0.5.2/0.5.1 sources and
all older tags/assets/publication records remain unchanged by preparation.
