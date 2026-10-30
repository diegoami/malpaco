# 0.5.1 publication

Published **2026-10-30T19:51:24Z** after the fresh owner-launched
[AGREE re-review](https://github.com/diegoami/malpaco/issues/407#issuecomment-6530554293)
of source `2fec967d39d8cc0a367df47db5900708ccd12d3d` and explicit owner approval.
The owner answered **“yes do it”** to publishing the verified CI bytes with visual
inspection afterward. Owner visual acceptance is deferred, not claimed complete.

- [Play Malpaco](https://malpaco.netlify.app).
- [Release and offline downloads](https://github.com/diegoami/malpaco/releases/tag/v0.5.1).
- Reviewed source/tag: `v0.5.1` at `2fec967d39d8cc0a367df47db5900708ccd12d3d`.
- Four assets: playable archive/checksum and permanent publication evidence/checksum.
- Web release only; no new native delivery, rule/AI policy or saved-format change.

The exact successful main-CI archive was deployed with `--no-build`. BUILD.json
names the reviewed SHA; all 20 manifest entries cover the 21 package files.
Both draft and canonical production match every payload file byte for byte.
All four public release downloads match their local uploads and GitHub digests.

| Deployment | ID | Verification |
| --- | --- | --- |
| Draft | `6ae4f25a07d82a13c26dde41` | 21 files match; 21 final browser cases pass |
| Production | `6ae4f425fc4292b166df8859` | 21 files match; 21 browser cases pass |

Netlify reports the production deployment ready/active, published
**2026-10-30T19:46:46.341Z**. Publication smoke used installed Playwright 1.63.0
Chromium: Defender/Legacy × Text/Icons at 390×844, 568×320, 844×390, 820×1180 and
1280×800, plus retired-route checks. It covers explicit starts, painted maps,
short-launcher focus, preferences, current-rule Help with opposite next-game
preferences, the guide/all eight images, exact saved resume and browser errors.
Final cases report no page/console errors.

The first draft smoke harness expected lazy-loaded manual images before scrolling:
20 cases failed and the retired-route case passed. Correcting the harness to visit
each illustration produced 21 passes without changing application bytes. The first
production file-readback attempt hit a TLS handshake timeout; the exact retry
passed all 21 comparisons. Both observations remain in the evidence.

Release contents: timed world-event notices, the maintained illustrated guide and
Help, persistent Text/Icons with responsive visible controls, and whole-card short
launchers. #408's stale source-Help assertions are fixed and now guarded by six
source cases in pinned CI. Broader source coverage #409, environment follow-up
#410, documentation follow-up #406 and older quality work remain separate.

See [PROVENANCE.md](PROVENANCE.md) for exact bytes and permanent evidence.
No physical-device, screen-reader or owner visual acceptance is inferred.
Previous v0.5.0/v0.4.0 sources, assets and deployments are retained. Prefer a
compatible forward fix; 0.3.1 is not a routine rollback because of #372 data loss.
