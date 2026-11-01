# 0.5.3 candidate provenance

The exact integrated-main candidate, CI run/artifact and archive receipts are
pinned on [milestone #440](https://github.com/diegoami/malpaco/issues/440) after
main CI and archive verification. Use that full pin, not an arbitrary later main
or a feature PR artifact. This document defines the source boundaries; final
receipts will be recorded here without changing the accepted runtime bytes.

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
| T164 / #436 | #443 | `296452207a47a987dc88d6820f7c28b45d4490e4` |
| T165 / #439 | #444 | `512615887ed274083c6fa606594c0873d1d811c5` |

No independent per-PR review was launched for these UI changes. The owner’s
milestone review covers the whole v0.5.2-to-candidate diff. That diff also contains
post-tag documentation PRs #431/#434 recording the prior handoff/publication,
and planning commits `4dc25fa`/`fdf7b99`; they are administrative history, not a new
0.5.2 runtime release. Release preparation is tracked in #445. Integration added a one-line player-host guard: re-tapping the unchanged destination preserves an explicit Swap. The strengthened real-input regression fails before that guard. This mechanical contract correction rides release preparation; it changes no core rule or saved format.

## Verification and handoff

[ACCEPTANCE.md](ACCEPTANCE.md) defines the exact-main gates and behavioral claims.
Implementation evidence retains failing-before tests, real layout defects,
corrected drivers/old face expectations, unchanged-limit retries and final passes.
Local checks cover affected source specs; full source-suite CI (#409) is not
claimed. GitHub’s live checks remain authoritative.

Before owner review, record the successful main run, original ZIP/tar byte counts
and SHA-256 digests, BUILD.json, every manifest checksum and full payload coverage,
source-identical guide images and quickstart. Retain actual CI bytes and evidence
in the owner’s artifact folder, then give a concrete prompt naming #440 and the
full candidate SHA. Do not substitute a local rebuild.

Stop before independent review, tags, release assets or deployments. Publication
needs the owner-launched review gate, owner visual acceptance and explicit 0.5.3
approval; earlier permissions do not carry forward. #432, #406/#409/#410, older
quality items and held native/balance/personality work remain separate.
