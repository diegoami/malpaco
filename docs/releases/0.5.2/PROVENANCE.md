# 0.5.2 candidate provenance

Reviewed/published source/tag **v0.5.2** is
**`198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`**. Published **2026-11-01T15:12:26Z** after the
[owner-launched AGREE review](https://github.com/diegoami/malpaco/issues/422#issuecomment-6559292980)
and explicit owner publication approval. [PUBLICATION.md](PUBLICATION.md) records
deployments/smoke and known non-blocking follow-ups. Later documentation-only main
commits do not move the reviewed tag or replace the sealed CI bytes.

## Source and boundaries

Previous published tag v0.5.1 is immutable at
`2fec967d39d8cc0a367df47db5900708ccd12d3d`; its
[publication](../0.5.1/PUBLICATION.md) and
[provenance](../0.5.1/PROVENANCE.md) remain unchanged.

Scope: T156–T161; requests #413–#421; implementation PRs #424–#428 and preparation
#429. [Owner decisions #423](https://github.com/diegoami/malpaco/issues/423)
confirm two personal turns and the speed/widget choices. #430 prepared metadata; #431
recorded the portable handoff. Remaining stack merges used owner-approved merge
commits; #424 was squash-merged first. Bounded contracts are in
[the release plan](../../plans/release-0.5.2.md) and task files.

- Core tree: `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba` (same as v0.5.1).
- Fixture tree: `97eb8e0703af6868a2d23c9d8e1665aa069c1222` (same as v0.5.1).
- Dependency records are unchanged; only package/root-lock versions move to 0.5.2.
- New BUILD.json records product version alongside existing schemaVersion 1,
  sourceCommit and minimumNode 22. No saved-game format change is implied.
- Selected manual screenshots and source hashes are in
  [manual provenance](../../manual-images/PROVENANCE.json). Dirty captures are
  disclosed, not clean-head release visual acceptance.

## Verified candidate receipts

Exact-main [CI 41303853019](https://github.com/diegoami/malpaco/actions/runs/41303853019)
passed build/root+core types, dev-watch checks, **1196 units / 96 files**, **6
source Help cases**, and **630 extracted-playable cases / 338 intentional legacy
or duplicate-project skips**. All included PRs #424–#428 and #430 merged with green
checks; none had an independent per-PR review. The milestone review covers the
whole v0.5.1-to-candidate diff.

| Receipt | Value |
| --- | --- |
| CI artifact | `malpaco-playable`, id `13084000234` |
| Original ZIP | 2,288,610 bytes; SHA-256 `9b2491eda274f2152da24d062ab77ca653a2bc0fef49373f0a9b843414d6f663` |
| Playable tar.gz | 2,287,919 bytes; SHA-256 `03b490664d84bc6f46808b0c3a45c370caa4e7be751f07ffd0bd4559280b35a0` |
| BUILD.json | schemaVersion 1, version 0.5.2, pinned source above, minimumNode 22 |
| Payload | All 20 manifest entries verified; complete coverage of 21 files |
| Manual | Guide, all eight source-identical PNGs and offline quickstart verified |

[Download the published exact CI archive](https://github.com/diegoami/malpaco/releases/download/v0.5.2/malpaco-0.5.2-playable.tar.gz).
The name differs from the original tar; its bytes do not. Verify its SHA-256 above
before using it. Do not rebuild and substitute replacement bytes.

[Exact-main evidence](https://drive.google.com/file/d/10INQipIPEmEMLooEM16s6ZXENeJMcgvE/view?usp=drivesdk)
retains the original downloaded ZIP, complete manifest comparisons, CI log/counts,
source/dependency boundaries and local server readback: **2,355,327 bytes**, SHA-256
`197b590e59d88a38db1245a0aa95c1358020d27f2107bebbb2babb5737d5a6b7`.
All 21 locally served payload files matched these CI bytes. Localhost URLs belong
to the originating computer and are not a cross-computer handoff dependency.

The [Drive evidence folder](https://drive.google.com/drive/folders/1u7pq93gbQ1Qb3nON6CkeTC0yhdp3CrPG)
also retains implementation and CI-correction bundles; their observed sizes,
digests and metadata readbacks are on #422. The original CI artifact expires
2026-11-15; published release assets provide permanent copies. Access uses the owner's existing
Drive permissions; sharing was not changed.

Local receipts under `artifacts/T156`–`artifacts/T161` preserve failing-before
cases, actual layout defects and fixes, stale pre-change test assumptions and their
bounded corrections, initial unchanged 5s contention timeouts and serial retries,
and manual captures. Live CI is authoritative; earlier interrupted/superseded runs
must not be reported as passes. Broader source-suite CI #409 and environment #410
remain separate.

## Review, authorization and permanent publication evidence

Fresh GLM-5.3-Flash (`zai-coding-plan/glm-5.3-flash`) milestone review on the exact
detached SHA: **AGREE**, no MUST-FIX findings. It independently downloaded and
verified the live CI archive/manifest/images and checked the entire v0.5.1 diff.
Reviewer serial units passed 1196/1196; source browser suite passed 633/337 skips;
source Help passed six cases. Parallel unit timeouts and four local extracted-
archive failures were disclosed: the same font/geometry failures reproduced on
published v0.5.1 on that machine, while exact-byte CI passed. These are #410-class
observations, not hidden candidate regressions. #432 is non-blocking dead-chooser
cleanup, deliberately left outside this publication.

The owner gave positive local visual feedback, then explicitly answered **“go
ahead”** after the AGREE verdict. No physical-device/screen-reader testing is
inferred and the older v0.5.1 deferred-visual decision was not reused as permission.

Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.5.2/malpaco-0.5.2-publication-evidence.tar.gz):
**19,679,752 bytes**, SHA-256
`069b6c490b79872bc9581ca5e2562cc6189bb926b69a6141f3e54998a5c42a24`.
A separate checksum asset is attached. It retains authorization/review, original
CI ZIP/readbacks, deployment receipts, original/final smoke scripts and results,
screenshots, and an included-proof manifest. No auth-ticket files are included.
Final public-download receipts were recorded after evidence assembly on #422.

Draft `6ae74fb74c2daa40e602d258` and production `6ae7548ddc4c0e92de7aa4fe` each
match all 21 payload files and pass all 31 final browser cases. Production was
published **2026-11-01T15:02:38.393Z**. All four public release downloads match their uploads,
byte counts and GitHub SHA-256 digests. See PUBLICATION.md for the initial harness
observations and non-blocking short-landscape overlap #433.

Review scope, current labels and any future fixes remain authoritative on
[milestone #422](https://github.com/diegoami/malpaco/issues/422). Preserve this tag,
its assets, previous v0.5.1 production `6ae4f425fc4292b166df8859` and all older
published records unchanged. No native delivery or unrelated follow-up was begun.
