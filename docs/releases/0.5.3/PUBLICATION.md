# 0.5.3 publication

Published **2026-11-02T00:30:20Z** from reviewed source/tag **v0.5.3**
`b6f9e5458fc066a4badce518404d4ed10bbfe53c`, after the owner-launched
[AGREE review](https://github.com/diegoami/malpaco/issues/440#issuecomment-6565103075)
(GLM-5.3-Flash, no findings) and current owner visual/publication approval:
“Game looks great, we can continue”, followed by “resume” after the announced
publication’s read-only preflight was interrupted. Earlier permissions were not
reused. No physical-device or screen-reader testing is inferred.

- [Play Malpaco](https://malpaco.netlify.app).
- [Release and offline downloads](https://github.com/diegoami/malpaco/releases/tag/v0.5.3).
- Web release only; core rules/AI, saved identity/format and dependencies unchanged.

The exact successful main CI archive was deployed with **--no-build**. Both Netlify
deployments match all **21 payload files** byte for byte; every manifest checksum
and complete coverage of 20 entries were verified. BUILD.json names version 0.5.3,
the reviewed full source above, schemaVersion 1 and minimumNode 22. All four public
GitHub downloads matched local uploads, sizes and GitHub SHA-256 digests.

| Deployment | ID | Verification |
| --- | --- | --- |
| Draft | `6ae7d1fdc60318fd5471699d` | 21 matching files; 31 general + 41 feature smoke cases pass |
| Production | `6ae7d5b45d42a9050b8ff7c9` | 21 matching files; 31 general + 41 feature smoke cases pass |

Netlify reports production ready/active, activated **2026-11-02T00:13:42.071Z**.
Smoke used pinned Playwright 1.63.0 Chromium with phone 390×844, short 568×320,
landscape 844×390, tablet 820×1180 and desktop 1280×800. General cases cover both
Defender/Legacy combat presets, Text/Icons/Auto, explicit launch/resume, settings,
speed/widget controls, persistent zoom at Fit with the shown widget, actual-rule
Help, eight guide images, exact save bytes and browser errors, plus retired routes.
Feature cases exercise real retained hands/sets and Skip, legal move defaults and
Swap/repeated taps/cancellation/exact transfers, and the primary victory action,
result expansion/fold/restore and exactly-once score recording. All 72 cases pass
on each deployment; no code, test limit or assertion changed for publication.

Contents: persistent icon zoom/limits and short-layout clearance; no empty
pre-destination Move window or redundant Move banner; explicit From/To/counts/map
arrow/Swap, legal interior→enemy-border default and stable explicit direction;
paused draft/Resume/restore-chip access; compact three-card symbol alternatives;
primary New game after completion; maintained Help/guide and curated illustrations.

Playable: **2,297,446 bytes**, SHA-256
`508726737d7d97998da14b48b0e2facef12dba2319f331dfd9694cd38078511b`.
Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.5.3/malpaco-0.5.3-publication-evidence.tar.gz):
**20,352,584 bytes**, SHA-256
`be5e849c856fdcdd33837a119904ff5c17ad2d068e0134ebacac3e65945e597c`;
a separate checksum asset is attached. It retains approval/review, original CI ZIP,
verification/readbacks, deploy receipts, smoke scripts/reports/pictures and an
included-proof manifest. No auth/config/environment files are included. Public
asset readbacks were recorded after evidence assembly on #440.

See [PROVENANCE.md](PROVENANCE.md) and [milestone #440](https://github.com/diegoami/malpaco/issues/440).
Preserve v0.5.2 at `198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`, its publication/assets,
and prior production `6ae7548ddc4c0e92de7aa4fe`; v0.5.1 and all older records remain
unchanged. #432, #406/#409/#410, older quality items, native delivery and held
balance/personality work remain separate. Do not auto-start another task. Prefer
compatible forward fixes; v0.3.1 is not a routine rollback (#372).
