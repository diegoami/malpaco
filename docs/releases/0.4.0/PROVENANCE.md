# 0.4.0 provenance

Milestone [#371](https://github.com/diegoami/malpaco/issues/371), scope #334,
T129–T143. These records follow publication; the reviewed source/tag stays unchanged.

## Accepted source and evidence

- `v0.4.0` points directly to **`327bfe13bc7055343cd5ab44adbe765ca819c08d`**.
- [Independent AGREE](https://github.com/diegoami/malpaco/issues/371#issuecomment-6413457201)
  covers the entire v0.3.1-to-candidate diff. The owner accepted the draft's gameplay
  and visual bar and authorized publication on 2026-10-26.
- Sole improved AI for future moves, including resumed games; recorded histories
  remain exact. Defender wins ties is the new-game default, with Legacy rerolls
  selectable. Kept games retain their immutable rules. No personalities, native
  delivery or held balance experiments are included.
- Exact main-push [CI 40294830798](https://github.com/diegoami/malpaco/actions/runs/40294830798)
  passed build/types, 1,191 units and 546 extracted-playable browser cases;
  254 intentional project skips. Preparation root/arena types and complete serial
  units also passed. Reviewer contention failures and passing reruns remain in the
  original verdict and permanent evidence; they are not presented as a clean first run.

## Published CI bytes

| Field | Value |
| --- | --- |
| CI artifact | `malpaco-playable`, id 12639503423 |
| ZIP | 953766 bytes; SHA-256 `90d4e7224b80d7fe9887fc2d1525d548a70fed92ea17e3ad00472f5502383259` |
| Runtime archive | 953463 bytes; SHA-256 `b3ec459e79773505854ffd4407ca0e5716c00f8fc0d12bf8700e2561b284bfc0` |
| BUILD.json | sourceCommit `327bfe13bc7055343cd5ab44adbe765ca819c08d`, minimumNode 22 |
| Manifest | All 11 entries verified; all 12 package files match draft and canonical production |

The exact CI files were published without rebuilding. Public release assets and
checksums were downloaded back and verified against local uploads and GitHub's
asset digests. The runtime archive matches the CI bytes exactly.

Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.4.0/malpaco-0.4.0-publication-evidence.tar.gz):
60,781,671 bytes, SHA-256
`03a8872d130d7f58b288fb2d7491e1d2122bfe7ead1bb85b4d47ae25c6e4bb5c`.
Its checksum is a separate release asset. It retains independent review probes,
logs/screenshots, original failed contention runs and reruns, the verified draft,
owner authorization, CI verification, production file comparisons, browser scripts
and all eight production smoke cases. Final public-download and publication-time
readbacks are linked from #371 after the evidence archive was assembled.

## Deployment and limits

Production deploy `6adf297b8400a9b4acd6d8aa` became active at `2026-10-26T10:20:44.681Z`.
Draft `6adf27df748bf1de57b15437` and canonical production both passed byte checks
and pinned Playwright 1.63 smoke for Defender/Legacy at 390×844, 844×390,
820×1180 and 1280×800. Checks cover start, painted map/assets/worker, unchanged
saved games after Settings changes, Help with the opposite preference selected,
exact reload/resume, retired routes and no page/console errors.

Six independent review follow-ups remain: #372 downgrade data compatibility,
#373 attack fallback coverage/disclosure, #374 committed Help regression coverage,
#375 comments/citation, #376 historical score grouping and #377 phone scoreboard
layout. Original study denominators/cutoffs remain intact. Four later self-play
probes saw 59–75% attack-budget fallback under different seeds/rosters; do not pool
those rates with T138. No universal-strength, optimality, enjoyment or termination
claim. Evaluation seeds 1000–1031 remain untouched. #362/#370 and prior nonblocking
follow-ups remain separate.

## Recovery

The previous v0.3.1 production deploy `6add2a3289d62280a160abb2` is retained,
but **is not a routine rollback target**. As reproduced in #372, old code rejects
new scoreboard/preferences formats and can permanently replace score history
following a game. Prefer a 0.4-compatible forward fix. An emergency downgrade
requires an explicit owner decision acknowledging these data effects. No rollback
was needed. Preserve all accepted tags and published archives unchanged.
