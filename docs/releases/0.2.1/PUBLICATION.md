# 0.2.1 publication

T99 (#248). Published on 2026-10-23 after the owner accepted the candidate and authorized
publication (“great, publish”); recorded on [#253](https://github.com/diegoami/malpaco/issues/253#issuecomment-6359066994).
The bytes are CI's own archive, with no rebuild.

## The archive

| | |
| --- | --- |
| Source | CI run [39858925242](https://github.com/diegoami/malpaco/actions/runs/39858925242), artifact `malpaco-playable` (id 12461978676), success |
| Accepted commit and tag target | `2b9924ef4f02a91c4c9b91a03bb29b3bd60594cd`, milestone #253 round 3 AGREE |
| CI artifact ZIP SHA-256 | `3dbc805e6d8faf54aa88dc021ec4015995e455d03f68dce372de03c955338140`, 489,653 bytes; matches provenance |
| Archive SHA-256 at download | `ef2ea535e799a9203c8abc43cf365321569b4069832ad9b9fceab7bb2b1e62fc`, 489,343 bytes |
| `SHA256SUMS` after extraction | 9 of 9 files OK |
| Archive SHA-256 downloaded back from the release | `ef2ea535e799a9203c8abc43cf365321569b4069832ad9b9fceab7bb2b1e62fc`; byte-identical to the downloaded CI archive |
| Release checksum asset | Downloaded back and identical to the local `malpaco-playable.tar.gz.sha256` |

`BUILD.json`:

```json
{
  "schemaVersion": 1,
  "sourceCommit": "2b9924ef4f02a91c4c9b91a03bb29b3bd60594cd",
  "minimumNode": 22
}
```

## Netlify

Site `4195ad92-b174-4e41-a6c4-8024619255c3`, deployed with `--no-build` from the
verified extracted folder.

| Deploy | Id | Byte check |
| --- | --- | --- |
| [Draft](https://6adb00d217fee250b2f4bac4--malpaco.netlify.app) | `6adb00d217fee250b2f4bac4` | All 9 files in `SHA256SUMS` fetched and SHA-256 verified; no mismatch |
| [Production](https://malpaco.netlify.app) | `6adb010c9a01a624d43b6c43` | All 9 files in `SHA256SUMS` fetched and SHA-256 verified; no mismatch |

## Browser checks

Chromium through Playwright, on both the draft and production. At each size, opened
`?seed=7` and waited for the map, then opened `?view=generated-game&seed=7` and
confirmed that the published build opens the main game rather than the legacy setup.

| Size | Countries, both routes | Console/page errors | Legacy setup |
| --- | --- | --- | --- |
| 390×844 (phone portrait) | 46 | none | absent |
| 844×390 (phone landscape) | 46 | none | absent |
| 820×1180 (tablet) | 46 | none | absent |
| 1280×800 (desktop) | 46 | none | absent |

Inspected the production phone-portrait screenshot. Raw deploy responses, verification
records, logs and screenshots are under ignored `artifacts/t99-publication/` in the
publishing checkout. The full extracted-playable suite passed in the accepted commit's CI;
these publication checks did not repeat that suite. Real-device limitations remain as
recorded in `ACCEPTANCE.md`.

## Release

- [Malpaco 0.2.1](https://github.com/diegoami/malpaco/releases/tag/v0.2.1), tag `v0.2.1`
  on the accepted commit above; public, neither draft nor pre-release.
- Assets: `malpaco-playable.tar.gz` and `malpaco-playable.tar.gz.sha256`.
- Canonical playable URL: <https://malpaco.netlify.app>.

## Rollback

0.2.0 production deploy `6ad957b9f3e3531111decf98` remains the rollback target;
restore it as `PROVENANCE.md` describes. No rollback was needed.
