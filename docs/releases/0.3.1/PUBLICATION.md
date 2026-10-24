# 0.3.1 publication

Published **2026-10-24T22:01:52Z**, following the independent milestone
[AGREE](https://github.com/diegoami/malpaco/issues/335#issuecomment-6389980069).
This record follows publication and does not move the accepted tag.

- [Play Malpaco](https://malpaco.netlify.app).
- [GitHub release and offline archive](https://github.com/diegoami/malpaco/releases/tag/v0.3.1).
- Accepted source/tag: `v0.3.1` on `6e75ad9cff3529b3bb13d1dff31a336a86c64627`.
- Four assets: playable archive and checksum, publication evidence and checksum.
  This is a web release; no Android APK ships.

## Publication checks

The exact main-push CI archive was downloaded, verified and published without a
local rebuild. All 11 SHA256SUMS entries passed locally. Both public runtime assets
were downloaded back from GitHub and match the CI files byte-for-byte; the tag
readback matches the reviewed source.

Netlify site `4195ad92-b174-4e41-a6c4-8024619255c3`, deployed with `--no-build`:

| Deployment | ID | Result |
| --- | --- | --- |
| [Final draft](https://6add296efabf6937a49c7114--malpaco.netlify.app) | `6add296efabf6937a49c7114` | All 12 package files match |
| [Production](https://malpaco.netlify.app) | `6add2a3289d62280a160abb2` | All 12 package files match on canonical origin |

Netlify production publication time: **2026-10-24T21:59:15.736Z**. API readback
confirms this deploy is ready and active; BUILD.json names the accepted source.

Pinned Playwright 1.63.0 smoke checks passed on both deployments at 390×844,
844×390, 820×1180 and 1280×800: explicit Start, map/worker/fonts/assets, next-game
Settings preserving the current match, retired-route entry/Resume and no page or
console errors. The production phone screenshot was inspected. On each deployment,
three additional browser checks demonstrated a resumed AI moving a formerly idle
reserve, with exactly one legal saved action and the visible movement trail/counts.

Exact-candidate CI passed 1065 units and 540 extracted-playable browser cases,
with 248 intentional project skips. The independent review also passed 91 source
browser cases in the pinned container (21 intentional skips); its initial host
font/framing differences are recorded in full, rather than reported as a passing
host run. No win-rate or universal game-termination claim is made.

See [PROVENANCE.md](PROVENANCE.md) for hashes, permanent evidence and rollback.
Nonblocking findings #336 and #337 remain follow-ups. The broader AI experimentation
and personalities are scoped separately in #334 for 0.4; native and balance
experiments remain separate. No rollback was required.
