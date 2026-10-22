# 0.2.0 publication

T90 (#209). Published on 2026-10-22 from the owner's machine, after the owner authorized it on the
same day. The bytes are CI's own archive; nothing was rebuilt. The steps are in `PROVENANCE.md`.

## The archive

| | |
| --- | --- |
| Source | CI run [39692085624](https://github.com/diegoami/malpaco/actions/runs/39692085624), artifact `malpaco-playable` |
| SHA-256 at download | `d184dcb9c3d7c416a4eb98bfc87edd4976a9759a8821be5b000d6bfcef41c2c3` (`malpaco-playable.tar.gz`, 480,150 bytes) |
| `SHA256SUMS` after extraction | 9 of 9 files OK |
| SHA-256 of the asset downloaded back from the release | `d184dcb9c3d7c416a4eb98bfc87edd4976a9759a8821be5b000d6bfcef41c2c3`, the same |

`BUILD.json`:

```json
{
  "schemaVersion": 1,
  "sourceCommit": "6e39383198a75ed5e79f0de6debc2988c1dcffb0",
  "minimumNode": 22
}
```

The run was a `pull_request` run, so its `sourceCommit` is GitHub's merge of the reviewed head
`f1aa5a1` into `main`. Its tree is `aba4d1f`, the same as `f1aa5a1` and `cfa39ed`. The first
attempt stopped at this mismatch; the owner accepted the archive, and `PROVENANCE.md` was amended
on `main` (`2e88bbe`) before anything was deployed.

## Netlify

Site `4195ad92-b174-4e41-a6c4-8024619255c3`, deployed with `--no-build` from the extracted folder.

| Deploy | Id | Byte check (every file in `SHA256SUMS`, fetched with curl) |
| --- | --- | --- |
| Draft | `6ad95762deaa518bb4ef5384` | 9 of 9 `ok`, no mismatch |
| Production | `6ad957b9f3e3531111decf98` | 9 of 9 `ok` at <https://malpaco.netlify.app>, no mismatch |

## Browser checks

Playwright 1.63.0 with Chromium, against <https://malpaco.netlify.app> after the production deploy
(and, with the same result, against the draft before it). At each size: open `?seed=7&control=manual`,
select **Start game**, wait for the map; then open `?view=generated-game&seed=7` and look for the
legacy views.

| Size | Countries on the map | Console errors | Legacy view at `?view=generated-game` |
| --- | --- | --- | --- |
| 390×844 (phone portrait) | 46 | none | none; the main game opens |
| 844×390 (phone landscape) | 46 | none | none; the main game opens |
| 820×1180 (tablet) | 46 | none | none; the main game opens |
| 1280×800 (desktop) | 46 | none | none; the main game opens |

The full key-flow suite ran on this archive in CI (`PROVENANCE.md`, Evidence). The real-device pass
(A12) and D4 stay with the owner on #241.

## Release

- Release: <https://github.com/diegoami/malpaco/releases/tag/v0.2.0>, tag `v0.2.0` on
  `cfa39ed37a4a683d4fe7441c9dfd0437da9b2405`, with `malpaco-playable.tar.gz` and
  `malpaco-playable.tar.gz.sha256`. Not a draft or a pre-release.
- Canonical playable URL: <https://malpaco.netlify.app>.

## Rollback

0.1.1's production deploy `6ad6041bb5d4e311f77ddf6d` stays in the site's deploy list; restore it as
`PROVENANCE.md` "Rollback" describes. No rollback was needed.
