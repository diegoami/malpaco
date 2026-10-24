# 0.3.0 publication

Published **2026-10-24T17:29:57Z**, after the owner authorized the web release,
accepted the UI and supplied the independent milestone [AGREE](https://github.com/diegoami/malpaco/issues/319#issuecomment-6387085631).
This record is added after publication; it does not move the reviewed tag.

- [Play Malpaco](https://malpaco.netlify.app).
- [GitHub release](https://github.com/diegoami/malpaco/releases/tag/v0.3.0): public, neither draft nor pre-release.
- Accepted source/tag: `v0.3.0` on `414bea058f8db0e49f24a29f4c4b518dfc3c50f2`.
- Download assets: `malpaco-playable.tar.gz`, its `.sha256`, and publication evidence
  plus its `.sha256`. No Android APK ships.

## Archive and readback

CI run 40111353807, exact main push at the accepted commit; artifact 12567966627.
ZIP SHA-256 `4d3c16a814b3aa144c5036af7f009a6b69bd8697681877e19f2f9a82540005dd` (943581 bytes) matches the API digest.
The archive is 943200 bytes, SHA-256:

```text
897e37562e58a3a44b0b01a981649607ddc0474ec4a77936ced3da937752bba7
```

All 11 SHA256SUMS entries pass. BUILD.json contains:

```json
{
  "schemaVersion": 1,
  "sourceCommit": "414bea058f8db0e49f24a29f4c4b518dfc3c50f2",
  "minimumNode": 22
}
```

Downloaded both public runtime assets back after publication: archive and checksum are
byte-identical to the verified CI files. Tag REST readback confirms the exact commit above.
No source rebuild was used for publication.

## Netlify

Site `4195ad92-b174-4e41-a6c4-8024619255c3`; both deployments used the same immutable
extracted CI folder with `--no-build`.

| Deployment | ID | Result |
| --- | --- | --- |
| [Final draft](https://6adce950cc2b5e764cdc0525--malpaco.netlify.app) | `6adce950cc2b5e764cdc0525` | All 12 files byte-match |
| [Production](https://malpaco.netlify.app) | `6adcea7bcb43a38b1059dd0d` | All 12 files byte-match on the canonical origin |

Netlify published production at 2026-10-24T17:27:24.507Z; API readback
confirms that deploy is ready and active. Production's BUILD.json matches the reviewed SHA.

## Browser verification

Pinned Chromium/Playwright 1.63.0 on both final draft and production. Fresh contexts at
390×844, 844×390, 820×1180 and 1280×800 passed: explicit Start, 46-country map, worker/fonts/assets,
next-game Settings preserving the current match, retired-route entry/Resume, and no page
or console errors. Startup waits for the established 60-second map readiness budget;
state/count/error assertions remain unchanged. The production phone screenshot was inspected.
Exact timing, transfers, old saves/replays and the wider acceptance matrix are covered by
CI's 536 browser cases and 1031 units and the independent review.

The full evidence and its SHA-256 are linked in [PROVENANCE.md](PROVENANCE.md).
The previous 0.2.1 deploy remains the rollback target described there. AI work stays after 0.3;
nonblocking review follow-ups #325/#327/#329 remain open. No rollback was required.
