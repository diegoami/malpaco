# 0.4.0 publication

Published **2026-10-26T10:23:09Z**, after the independent milestone
[AGREE](https://github.com/diegoami/malpaco/issues/371#issuecomment-6413457201)
and the owner's gameplay/visual acceptance and explicit publication go-ahead.

- [Play Malpaco](https://malpaco.netlify.app).
- [GitHub release and offline archive](https://github.com/diegoami/malpaco/releases/tag/v0.4.0).
- Reviewed tag/source: `v0.4.0` at `327bfe13bc7055343cd5ab44adbe765ca819c08d`.
- Four assets: playable archive/checksum and permanent review/publication evidence/checksum.
- This is a web release; no Android APK or native persistence delivery ships.

The exact candidate's successful main-CI archive was verified and deployed with
`--no-build`. BUILD.json matches the reviewed tag; all manifest entries pass.
All four public assets match the uploaded bytes and server digests after readback.

| Deployment | ID | Verification |
| --- | --- | --- |
| Draft | `6adf27df748bf1de57b15437` | All 12 package files match; eight browser cases pass |
| Production | `6adf297b8400a9b4acd6d8aa` | All 12 package files match canonical origin; eight browser cases pass |

Netlify production publication time: **2026-10-26T10:20:44.681Z**. API readback confirms the
deploy is ready and active. Both Defender and Legacy passed start, Settings,
actual-rule Help, exact save/resume and retired-route checks at 390×844,
844×390, 820×1180 and 1280×800, with no page or console errors. The production
phone screenshot was inspected. CI passed 1,191 units and 546 browser cases,
with 254 intentional project skips.

Review follow-ups #372–#377 remain open. Phone scoreboard overflow, historical
result classification and bounded attack-planning fallback limits are disclosed;
publication does not claim they were fixed. Downgrade to the retained v0.3.1 deploy
can erase newer scoreboards/reset preferences and must not be used as routine
rollback. See [PROVENANCE.md](PROVENANCE.md) for hashes, permanent evidence and
recovery limits. Prior published source and archives remain immutable.
