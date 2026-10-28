# 0.5.0 publication

Published **2026-10-28T10:42:52Z**, after independent milestone
[AGREE](https://github.com/diegoami/malpaco/issues/393#issuecomment-6466493402)
and the owner's explicit instruction: **“publish, I will look at it later.”**
Owner visual acceptance is deferred until after publication; it is not claimed complete.

- [Play Malpaco](https://malpaco.netlify.app).
- [GitHub release and offline archive](https://github.com/diegoami/malpaco/releases/tag/v0.5.0).
- Reviewed tag/source: `v0.5.0` at `2f993c7d56e09e197942d091b4f81e44f4d29cd1`.
- Four assets: playable archive/checksum and permanent publication evidence/checksum.
- Web release only; no native APK, AI, combat-rule or saved-format changes.

The exact reviewed candidate's successful CI archive was deployed with `--no-build`.
BUILD.json names that SHA and all 11 manifest entries pass. All 12 package files
match both draft and canonical production byte for byte. All four public GitHub
assets match their local uploads and server digests after download readback.

| Deployment | ID | Verification |
| --- | --- | --- |
| Draft | `6ae1d0c2660b2977ad7c2ef5` | All 12 files match; eight browser cases pass |
| Production | `6ae1d127c8b090a2288caf48` | All 12 files match; eight browser cases pass |

Netlify reports production ready/active, published **2026-10-28T10:40:40.664Z**.
Pinned Playwright 1.63 smoke covers Defender and Legacy at 390×844, 844×390,
820×1180 and 1280×800: explicit Start, painted map/assets, Settings preserving
the current save, actual-rule Help with the opposite preference selected, exact
save/resume and retired routes. No page or console errors occurred.

The release includes both legal Attack/Move actions, readable center stars,
mobile command icons, Start/Resume above viewport-contained settings, and larger
expanded results with compact folding. Non-blocking [#394](https://github.com/diegoami/malpaco/issues/394)
remains open: at 568×320 the settings region is only 32px, clipping selects and
hiding focused labels, while Start/Resume and settings remain usable. Earlier
0.4.0 review follow-ups remain separate. No physical-device, screen-reader or
owner visual acceptance is inferred from automated smoke tests.

See [PROVENANCE.md](PROVENANCE.md) for hashes and permanent evidence. Preserve
the reviewed tag and prior published archives. The previous 0.4.0 deployment is
retained. Do not routinely downgrade to 0.3.1 because of #372's scoreboard and
preference loss; prefer a compatible forward fix.
