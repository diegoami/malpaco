# 0.5.0 provenance

Milestone [#393](https://github.com/diegoami/malpaco/issues/393), scope #381,
T144–T149. These records follow publication and do not move the reviewed tag.

## Reviewed source and owner decision

- `v0.5.0` points directly to **`2f993c7d56e09e197942d091b4f81e44f4d29cd1`**.
- [Independent AGREE](https://github.com/diegoami/malpaco/issues/393#issuecomment-6466493402),
  Claude Opus 5.5, covers the entire v0.4.0-to-candidate diff. No MUST-FIX findings.
- The owner explicitly authorized publication on 2026-10-28 before later visual
  inspection: “publish, I will look at it later.” This supersedes the planned
  pre-publication visual-acceptance gate; it does not assert visual acceptance.
- Included PRs: #387 (Attack/Move), #388 (centers), #389 (mobile icons), #390
  (launcher), #380 (results), #392 (version/notes/protocol), plus the final
  documentation-only continuation pointer. No core, fixture, dependency, AI,
  combat-rule, saved-format, native-delivery or balance-policy changes.
- Exact-candidate [CI 40661303775](https://github.com/diegoami/malpaco/actions/runs/40661303775)
  passed build/root+core types, dev-watch checks, **1191 units / 96 files** and
  **577 extracted-playable browser cases / 285 existing project/route skips**.
  Combined local source checks passed 61 cases with 61 duplicate-project skips.
  Android and GitGuardian passed on the integrated release PR source.

The review's local browser run had ten failures also reproduced on v0.4.0 on that
machine; all new/changed cases passed. Original feature CI failures/corrections,
the intermediate random-new-map persistence click failure, and passing final
runs remain in evidence. They are not described as a clean first pass. Reviewer
limitations include no physical-device/screen-reader testing, no owner visual
judgement and no explicit star/count overlap assertion after Shift.

## Published CI bytes

| Field | Value |
| --- | --- |
| CI artifact | `malpaco-playable`, id `12805203045` |
| Artifact ZIP | 955720 bytes; SHA-256 `498afd2bdab1ba2e1d3ad80e097dd5c25b3686d3cd08947612efe648cec217d8` |
| Playable archive | 955407 bytes; SHA-256 `ba005ad4fc5eae60a72fab4b74206980a17d3baae9e7e95d8f57ecda8aed2416` |
| BUILD.json | schemaVersion 1; sourceCommit `2f993c7d56e09e197942d091b4f81e44f4d29cd1`; minimumNode 22 |
| Manifest | All 11 entries verified; all 12 package files match both deployments |

The exact CI files were published without rebuilding. All four release downloads
were read back and checked against the local uploaded files, byte counts and
GitHub asset digests. The offline archive is identical to the verified CI archive.

Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.5.0/malpaco-0.5.0-publication-evidence.tar.gz):
**23825768 bytes**, SHA-256
`07a648606d1931b752bb15afcc1f6f57048eaf6b9abab660a03c22f6b715e178`.
A separate checksum asset is attached. Evidence includes the independent verdict,
owner authorization/deferred visual decision, original feature proofs and
corrections, exact CI artifact ZIP/verification, draft/production file comparisons,
both eight-case smoke reports, scripts and screenshots. Final public-download
readback and release publication time are recorded on #393 after evidence assembly.

## Deployment and recovery

Draft `6ae1d0c2660b2977ad7c2ef5` and production
`6ae1d127c8b090a2288caf48` pass file and browser checks described in
[PUBLICATION.md](PUBLICATION.md). Netlify reports production ready/active since
**2026-10-28T10:40:40.664Z**. GitHub release publication:
**2026-10-28T10:42:52Z**.

Short-landscape launcher follow-up #394 remains open and non-blocking; earlier
0.4.0 follow-ups #372–#377 remain separate. This release makes no broader AI,
balance, phone-map, physical-device or accessibility-completeness claim.

Previous 0.4.0 production `6adf297b8400a9b4acd6d8aa` is retained; its source/tag
and release assets are immutable. No rollback was needed. Prefer a compatible
forward fix. The older 0.3.1 deploy is not a routine fallback: #372 reproduces
scoreboard loss and preference reset on downgrade.
