# 0.5.2 candidate provenance

The authoritative exact-source, CI archive and review receipts are recorded on
[milestone #422](https://github.com/diegoami/malpaco/issues/422). Keeping those
post-build receipts on the issue avoids changing the candidate SHA merely to
record its own build results. This document does not claim an accepted or
published release.

## Source and boundaries

Previous published tag v0.5.1 is immutable at
`2fec967d39d8cc0a367df47db5900708ccd12d3d`; its
[publication](../0.5.1/PUBLICATION.md) and
[provenance](../0.5.1/PROVENANCE.md) remain unchanged.

Scope: T156–T161; requests #413–#421; implementation PRs #424–#428 and preparation
#429. [Owner decisions #423](https://github.com/diegoami/malpaco/issues/423)
confirm two personal turns and the speed/widget choices. Bounded contracts are in
[the release plan](../../plans/release-0.5.2.md) and task files.

- Core tree: `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba` (same as v0.5.1).
- Fixture tree: `97eb8e0703af6868a2d23c9d8e1665aa069c1222` (same as v0.5.1).
- Dependency records are unchanged; only package/root-lock versions move to 0.5.2.
- New BUILD.json records product version alongside existing schemaVersion 1,
  sourceCommit and minimumNode 22. No saved-game format change is implied.
- Selected manual screenshots and source hashes are in
  [manual provenance](../../manual-images/PROVENANCE.json). Dirty captures are
  disclosed, not clean-head release visual acceptance.

## Required exact-candidate receipts

#422 records the full integrated main SHA, previous tag, included/unreviewed PRs,
run and artifact IDs, original ZIP size/SHA-256, playable tar size/SHA-256,
BUILD.json readback, all manifest comparisons and complete payload coverage,
manual/eight-image/quickstart presence, and links to retained evidence. The main
run's extracted-playable and pinned source Help checks must pass. Do not substitute
local rebuilt bytes for the downloaded archive.

Local receipts under `artifacts/T156`–`artifacts/T161` preserve failing-before
cases, actual layout defects and fixes, stale pre-change test assumptions and their
bounded corrections, initial unchanged 5s contention timeouts and serial retries,
and manual captures. Live CI is authoritative; earlier interrupted/superseded runs
must not be reported as passes. Broader source-suite CI #409 and environment #410
remain separate.

Review/verdict and publication authorization must be read on #422. Automated checks
and inspected virtual-viewport screenshots do not establish owner visual,
physical-device or screen-reader acceptance. No reviewer or deployment is started
by candidate preparation.
