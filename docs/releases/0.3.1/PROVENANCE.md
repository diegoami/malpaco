# 0.3.1 provenance

T127 (#325/#327/#329), T128 (#320), milestone [#335](https://github.com/diegoami/malpaco/issues/335).
These records follow publication; the accepted source and tag remain unchanged.

## Accepted source

- `v0.3.1` points directly to **`6e75ad9cff3529b3bb13d1dff31a336a86c64627`**.
- [Independent AGREE](https://github.com/diegoami/malpaco/issues/335#issuecomment-6389980069)
  covers the complete change from v0.3.0, including #331, #332 and #333.
- Reserve routing changes future computer decisions while preserving the original
  rules, allocation, RNG and save identities. Historical action witnesses remain
  hash-pinned separately from current-policy acceptance.
- This release contains neither personality/parameter tuning (#334), held balance
  experiments (#283/#294), nor native persistence/APK delivery (#315).

## Exact CI archive

| Field | Value |
| --- | --- |
| Main-push CI | [40133483835](https://github.com/diegoami/malpaco/actions/runs/40133483835), success at accepted SHA |
| Checks | Build/types, 1065 units, 540 extracted-playable browser cases passed; 248 intentional skips |
| Artifact | `malpaco-playable`, id 12575854703, ZIP 943583 bytes |
| ZIP SHA-256 | `ecb01e2d0aa78f5fffb49739126f50242d466e5c109d5358f89d8fedb65000bc`, matches API digest |
| Archive | `malpaco-playable.tar.gz`, 943217 bytes |
| Archive SHA-256 | `2ad92a9b34aab1a71eb61c92e64e38f03f05c45858aeff8534641c27f756291e` |
| BUILD.json | sourceCommit `6e75ad9cff3529b3bb13d1dff31a336a86c64627`, minimumNode 22 |
| Manifest | 11 entries verified locally; 12 files including manifest match on draft and production |

The public GitHub runtime archive and checksum were downloaded back and match the
verified CI files byte-for-byte. No source rebuild was used for publication.

## Evidence and limits

[Publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.3.1/malpaco-0.3.1-publication-evidence.tar.gz),
7412874 bytes, SHA-256:

```text
de8656683be865dd9f85dbbc1ff5e287e594a532baab28f9846a926f8f483312
```

Its checksum is a separate release asset. Both evidence assets' server digests and
sizes match the uploaded bytes. The archive retains the complete review, exact-CI
log, artifact verification, deployment receipts, GitHub runtime readback, byte
checks, four-size smoke screenshots and three AI reserve browser checks on each
of draft and production.

The reviewer accepted two nonblocking findings:
[legacy source-only map-lab legend](https://github.com/diegoami/malpaco/issues/336)
and [obsolete speed-preference test seed](https://github.com/diegoami/malpaco/issues/337).
Neither changes this release's runtime behavior. The complete review records host
font/framing failures and their passing pinned-container rerun. Bounded AI matrix
outcomes, including unfinished games, remain evidence rather than claims of
stronger play or universal termination. Physical-device and long-game limits remain
as stated in the release notes and acceptance protocol.

## Rollback

Previous v0.3.0 production deploy **6adcea7bcb43a38b1059dd0d** is retained.
Restore via Netlify Deploys / Publish deploy, or:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"4195ad92-b174-4e41-a6c4-8024619255c3","deploy_id":"6adcea7bcb43a38b1059dd0d"}'
```

Keep both accepted release tags and archives intact. No rollback was needed.
