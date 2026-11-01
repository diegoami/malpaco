# 0.5.2 candidate provenance

The pinned review source is **`198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`**.
[Milestone #422](https://github.com/diegoami/malpaco/issues/422) holds the full
claims, owner decisions, retained evidence and review prompt. This documentation
checkpoint follows candidate verification; it does **not** move the candidate.
A later documentation-only main HEAD is not the source named by the sealed archive.
No accepted verdict or published 0.5.2 release is claimed.

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

[Download the exact CI candidate](https://drive.google.com/file/d/1xE3_8NuJuZH9h7x_2WskxXuU3jJvL_qN/view?usp=drivesdk).
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
2026-11-15; use the retained copy after expiry. Access uses the owner's existing
Drive permissions; sharing was not changed.

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

## Review on another computer

1. Read this file, `ACCEPTANCE.md`, current `CLAUDE.md`, `docs/milestone-review.md`
   and #422 including comments. #406 tracks stale rule numbers in review templates;
   use current CLAUDE numbering. Review has not been launched by the author session.
2. In a clean checkout, fetch and detach the exact pinned source:

   ```sh
   git fetch origin --tags
   git checkout --detach 198de7ef8a7cc2aaa48ae7107860f3dbb488cad0
   ```

   If that checkout has uncommitted work, preserve it and use the read-only
   `git show <sha>:<path>` route in the review instructions. Never stash or reset it.
   The candidate predates this checkpoint, so consult the latest provenance/#422
   before detaching. All implementation and documentation are pushed; no private
   assistant memory or original computer's `artifacts/` directory is required.
3. Follow the milestone instructions to install dependencies and run checks.
   Pinned browser environment: `mcr.microsoft.com/playwright:v1.63.0-noble`.
   If local unit contention reproduces #410's unchanged 5s timeouts, retain the
   failure and serial retry receipt; do not increase limits. Full serial local
   verification passed 1196/1196. Broader source-suite CI #409 remains separate.
4. Download the retained CI candidate, check its digest and BUILD.json source,
   extract it and run `node serve.mjs` from `malpaco-playable` (Node 22+). This
   reviews the sealed compiled bytes; a source rebuild is a separate diagnostic.
5. Use the prompt on #422. The owner chooses and launches a fresh independent
   reviewer, which posts reproduced findings and one AGREE/BLOCK verdict there.
   The author session launched no reviewer. Publication, tags, release assets and
   deployment still require the separate 0.5.2 owner go-ahead after the review gate.

Production readback after candidate verification still named published v0.5.1
source `2fec967d39d8cc0a367df47db5900708ccd12d3d`. No 0.5.2 deployment was performed.
The owner gave positive local visual feedback and requested milestone preparation
and this handover; that does not assert physical-device/screen-reader testing or
standing publication permission. Begin no unrelated task during this checkpoint.
