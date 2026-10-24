# 0.3.0 provenance

T124 (#318), milestone [#319](https://github.com/diegoami/malpaco/issues/319).
These records follow publication; the accepted source and tag remain unchanged.

## Accepted source

- Tag `v0.3.0` points directly to **`414bea058f8db0e49f24a29f4c4b518dfc3c50f2`** on main after #324.
- [Independent milestone review: AGREE](https://github.com/diegoami/malpaco/issues/319#issuecomment-6387085631) for that exact SHA, covering
  all changes since v0.2.1. The preceding UI review's named fixes are included.
- Version 0.3.0 in package.json and both package-lock root records. Browser/offline web
  only: no production Android APK, native persistence or signing claim.
- The owner accepted 46/72/96 maps, Min/Max and the UI changes, and chose turn/phase-only
  banners. AI improvements (#320), balance experiment #283 and native #315 stay separate.

## Exact CI archive

| Field | Value |
| --- | --- |
| Main-push CI | [40111353807](https://github.com/diegoami/malpaco/actions/runs/40111353807), success at the accepted SHA |
| Checks | Build/types, 1031 units, 536 extracted-playable browser cases passed; 244 intentional project skips |
| Artifact | `malpaco-playable`, id 12567966627, ZIP 943581 bytes |
| ZIP SHA-256 | `4d3c16a814b3aa144c5036af7f009a6b69bd8697681877e19f2f9a82540005dd`; matches GitHub artifact digest |
| Archive | `malpaco-playable.tar.gz`, 943200 bytes |
| Archive SHA-256 | `897e37562e58a3a44b0b01a981649607ddc0474ec4a77936ced3da937752bba7` |
| BUILD.json | sourceCommit `414bea058f8db0e49f24a29f4c4b518dfc3c50f2`, minimumNode 22 |
| Manifest | All 11 entries verified locally; all 12 packaged files including SHA256SUMS verified on draft and production |

Publication uses CI's own downloaded archive. No local rebuild or PR synthetic-merge
artifact substitutes. Downloading the archive and checksum back from the public release
produced byte-identical files. Netlify used the extracted directory with `--no-build`.

## Evidence and limits

[Publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.3.0/malpaco-0.3.0-publication-evidence.tar.gz),
5102619 bytes, SHA-256 `af48ba41a693978227d85e414c154af5dc030d23fedf3960f5e0b972ecfb330c`;
its checksum is a separate release asset. It contains the complete review, exact-CI log,
artifact verification, both byte checks, deployment responses and screenshots at four viewport sizes.
Both evidence assets' server digests/sizes match the uploaded bytes.

The review accepted three nonblocking follow-ups: [legacy source goldens](https://github.com/diegoami/malpaco/issues/325),
[leftover-army allocation test coverage](https://github.com/diegoami/malpaco/issues/327),
and [unused speed-preference cleanup](https://github.com/diegoami/malpaco/issues/329).
Eight source-only legacy screenshot cases remain stale after the intentional solid-lane
change; the published-build suite passes. Physical-device coverage and long-game/economy
limits remain as stated in the release notes and acceptance protocol.

## Rollback

Previous 0.2.1 production deploy **6adb010c9a01a624d43b6c43** is retained.
Restore it through Netlify's Deploys / Publish deploy, or:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"4195ad92-b174-4e41-a6c4-8024619255c3","deploy_id":"6adb010c9a01a624d43b6c43"}'
```

Keep the accepted tag/archive intact. No rollback was needed for this publication.
