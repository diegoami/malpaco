# 0.5.2 publication

Published **2026-11-01T15:12:26Z** from reviewed source/tag
`198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`, following the fresh owner-launched
[AGREE review](https://github.com/diegoami/malpaco/issues/422#issuecomment-6559292980)
(GLM-5.3-Flash, exact detached source, no MUST-FIX findings) and the owner's explicit
**“go ahead”** publication approval. The owner had given positive local visual
feedback; no physical-device or screen-reader testing is inferred.

- [Play Malpaco](https://malpaco.netlify.app).
- [Release and offline downloads](https://github.com/diegoami/malpaco/releases/tag/v0.5.2).
- Web release only; no new native delivery, rule/AI policy or saved-identity change.

The successful exact-main CI archive was deployed with `--no-build`. BUILD.json
names version 0.5.2, reviewed source above and minimumNode 22. Both draft and
canonical production match **all 21 payload files byte for byte**; all 20 manifest
entries cover the package. All four public release downloads match their local
uploads, sizes and GitHub digests. Previous published tags/assets are unchanged.

| Deployment | ID | Verification |
| --- | --- | --- |
| Draft | `6ae74fb74c2daa40e602d258` | 21 files match; 31 final browser cases pass |
| Production | `6ae7548ddc4c0e92de7aa4fe` | 21 files match; 31 final browser cases pass |

Netlify reports production ready/active, published **2026-11-01T15:02:38.393Z**.
Publication smoke used installed Playwright 1.63.0 Chromium: Defender/Legacy ×
Text/Icons/Auto at 390×844, 568×320, 844×390, 820×1180 and 1280×800, plus retired
routes. It covers explicit starts, focus/viewport containment, painted maps,
preferences/speeds, widget view controls, always-icon zoom, actual-rule Help with
opposite next-game preferences, the guide/eight images, exact resume and browser
errors. Final cases report no page/console errors.

The initial draft harness passed 24/31: two map-ready checks hit its default 5s
assertion and five 568×320 Fit clicks were intercepted by the shown widget. The
final harness uses the gameplay helper's established 60s generated-map readiness
and normal Hide → camera controls → Show flow in constrained layouts. It passes
31/31 on draft and production without changing application bytes or CI limits.
Original logs/results/scripts remain in the evidence. [#433](https://github.com/diegoami/malpaco/issues/433)
records the short-landscape overlap as a non-blocking layout follow-up; the
provided Hide/Show path keeps Fit reachable. Review cleanup #432 is also separate.

Contents: adaptive launcher columns; compact text commands; Text/Icons/Text 2
personal turns then Icons (default); always-icon zoom; trimmed Move/province-list
controls; New Armies beside Cards; persistent Slow/Normal/Fast/Very fast; widget
size/hide/restore with pause-stable Resume; automatic area-based ambiguous taps;
maintained Help/manual and eight real retained-game illustrations.

See [PROVENANCE.md](PROVENANCE.md) and [milestone #422](https://github.com/diegoami/malpaco/issues/422)
for exact bytes and permanent receipts. Broader source-suite CI #409, environment
#410, documentation #406 and older quality/native/held balance/personality work
remain separate. Retain prior production `6ae4f425fc4292b166df8859` (v0.5.1).
Prefer a compatible forward fix; v0.3.1 is not a routine rollback because #372
reproduces scoreboard/preferences loss.
