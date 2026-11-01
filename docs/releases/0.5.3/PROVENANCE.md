# 0.5.3 candidate provenance

Verified owner-review source is **`b6f9e5458fc066a4badce518404d4ed10bbfe53c`**
(version 0.5.3), pinned on [milestone #440](https://github.com/diegoami/malpaco/issues/440).
Exact-main CI and downloaded archive verification passed. The owner launches the
independent milestone review; no reviewer, tag, release or deployment has been
launched by preparation. Owner visual acceptance and physical-device/screen-reader
testing are not inferred. Later documentation-only commits record these receipts
without moving the runtime candidate or substituting new archive bytes.

## Boundaries

Previous immutable release/tag v0.5.2 is
`198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`; preserve its
[publication](../0.5.2/PUBLICATION.md), [provenance](../0.5.2/PROVENANCE.md), source
and published CI bytes. v0.5.1 remains
`2fec967d39d8cc0a367df47db5900708ccd12d3d`; all older tags/assets stay unchanged.

- Core tree: `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba`, same as v0.5.2.
- Fixture tree: `97eb8e0703af6868a2d23c9d8e1665aa069c1222`, same as v0.5.2.
- Only package.json/root-lock product versions move to 0.5.3; dependency records
  are unchanged. No rules/AI, save format/identity or native-delivery change.
- BUILD.json retains schemaVersion 1, full sourceCommit and minimumNode 22, and
  takes version 0.5.3 from package metadata.
- Illustrated guide/Help use the curated eight images and source hashes in
  [manual provenance](../../manual-images/PROVENANCE.json). Dirty captures are
  disclosed and committed with matching source, not claimed as clean-head visual
  acceptance or physical-device/screen-reader evidence.

## Included changes and owner decisions

Contracts: [release plan](../../plans/release-0.5.3.md), T162–T166. The owner
confirmed **interior → enemy border, with Swap** in
[#441](https://github.com/diegoami/malpaco/issues/441). Equal-border pairs keep tap
order; illegal reversals never override legal selections. Merge commits preserve
verified stacked heads, following the owner’s existing preference.

| Task / request | Implementation PR | Source head |
| --- | --- | --- |
| T162 / #435, related #433 | #438 | `3f23b7207bc4ba85ae028214385a1413ee2db0dc` |
| T163 / #437 | #442 | `9b4509cabbea2f03724f44646c3fd27f038c07cc` |
| T164 / #436 | #443 | `381e5751ba697240b3a1251ffec6a5b7d84b9bc8` |
| T165 / #439 | #444 | `d4f7393f27c42c08b461b28d9567e8526aa70f61` |
| T166 / #445 | #446 | `4c5605345e08a2808ff34a394be9f24f15345704` |

No independent per-PR review was launched for these UI changes. The owner’s
milestone review covers the whole v0.5.2-to-candidate diff. That diff also contains
post-tag documentation PRs #431/#434 recording the prior handoff/publication,
and planning commits `4dc25fa`/`fdf7b99`; they are administrative history, not a new
0.5.2 runtime release. Release preparation is tracked in #445.

Integration corrections are included in the updated T164 head: repeated destination
taps preserve Swap; a refused paused cancellation folds the card so Resume stays
reachable; contextual actions avoid the restore chip. Tall views retain initial
destination adjacency and Swap keeps that anchor; compact views use the pair’s
bounds. Original failed CI 41339338114 (667 passed, 8 failed, 383 intentional skips)
and superseded child cancellations remain in the evidence. Stale empty-window
assertions and paused-clock placement drivers were corrected while preserving
all action/geometry assertions, limits and existing skips. The tracker layout
snapshot freezes live row replacement instead of weakening row-height checks.


## Verified exact-main receipts

[Main CI 41350534891](https://github.com/diegoami/malpaco/actions/runs/41350534891)
passed build/root+core types, dev-watch, **1196 units / 96 files**, **6 source Help
cases** in both viewport projects, and **687 extracted-playable cases / 395
pre-existing legacy or duplicate-project skips**. All included implementation and
preparation PRs merged only with green checks. Corrected source local checks passed
73 targeted browser cases and the full 1196 units; source-suite CI coverage is
not claimed (#409 remains separate).

Main tree `5240ad7f5490e4d2a8007d54bc25e6acd322268e` equals checked preparation
head `4c5605345e08a2808ff34a394be9f24f15345704`. The local preview now serves the
actual downloaded main CI extraction; all 21 HTTP-served files match its payload
bytes. Localhost URLs belong to the originating computer and are not a
cross-computer handoff dependency.

| Receipt | Value |
| --- | --- |
| CI artifact | `malpaco-playable`, id `13102790438`, expires 2026-11-15T21:41:39Z |
| Original downloaded ZIP | 2,298,263 bytes; SHA-256 `298dcecf3bca9307b233f4f724ad6a8b740f190bd736ba60f5fa63b19b4b57bd` |
| Exact tar.gz | 2,297,446 bytes; SHA-256 `508726737d7d97998da14b48b0e2facef12dba2319f331dfd9694cd38078511b` |
| BUILD.json | schemaVersion 1, version 0.5.3, pinned full source above, minimumNode 22 |
| Payload | All 20 manifest checksums verified; complete coverage of 21 files |
| Manual | Guide, eight source-identical PNGs and offline quickstart verified |

[Retained exact CI candidate](https://drive.google.com/file/d/1sRO5dqIq978rEbqWW4W8SNzJ603Lk-q4/view)
uses the tar bytes above, with a descriptive download name. Its bytes were not
rebuilt. [Exact-main evidence](https://drive.google.com/file/d/1ugww4v0w3uuXP24ys_Thmh9kx2qJl2fA/view)
retains the original ZIP, all verification/readbacks, CI log/counts and scripts:
**2,427,883 bytes**, SHA-256
`f09e75e6bd2bed3611922e2abf41a9813b15a20af7490d6e27311e79e1470bf5`.

The [review folder](https://drive.google.com/drive/folders/1h8gSJWEVMBJ3dcXmU0oezjzB7_1TAgYe)
also retains:

- [Initial implementation proof](https://drive.google.com/file/d/1lw7cUkzBu3hpm6Av6PfIeiM08CjvAiOV/view),
  22,208,149 bytes; SHA-256
  `b492f6e3c177f881175f56de00529a880a1ceb85e4e9c8915f9a809314344a9c`.
- [Corrected integration and CI-rework proof](https://drive.google.com/file/d/1MZurMN_loLRiV7vHcTvpGFxouY5BZppi/view),
  4,973,276 bytes; SHA-256
  `12a3a3bc40e54081ded9568e2f355137f45165394567919e14ab258bed2483c7`.

Upload names/sizes/parents were read back and verified; sharing was not changed.
Original failed and superseded runs are disclosed, never claimed as acceptance.
Intermediate main runs were cancelled after their exact PR heads passed and the
final main run started; only the pinned main run supplies accepted candidate bytes.
Local receipts remain under `artifacts/T162`–`artifacts/T166`.

## Owner review and publication boundary

[ACCEPTANCE.md](ACCEPTANCE.md) defines the claims. The concrete prompt on #440
names the full source above, previous v0.5.2 and `docs/milestone-review.md`. Review
the complete previous-tag diff, including unreviewed PRs and administrative records.
Record the fresh model/SHA/checks/findings and AGREE/BLOCK on the milestone. No
independent verdict exists yet and implementation screenshots are not owner visual
acceptance.

Stop before tags, release assets or deployments. Publication requires the owner’s
review gate, visual acceptance and explicit 0.5.3 approval. A public BUILD.json
readback still names v0.5.2/source `198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`;
old published tags/assets/records remain unchanged. #432, #406/#409/#410, older
quality items and held native/balance/personality work remain separate.
