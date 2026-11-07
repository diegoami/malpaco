# 0.5.4 publication

Published **2026-11-07T18:03:28Z** from exact reviewed source/tag **v0.5.4**
`0336f41851e60570eb119dcb7ffd55476ef79c38`, after the owner-launched
[MiniMax-M3 thinking AGREE review](https://github.com/diegoami/malpaco/issues/457#issuecomment-6710682709)
(no findings) and renewed owner visual/publication approval after the review:
“ok then let us move on”, in response to the explicit acceptance/publication question.
The earlier withdrawn waiver was not reused. No physical-device or screen-reader
testing is inferred.

- [Play on GitHub Pages](https://diegoami.github.io/malpaco/).
- [Play on Netlify](https://malpaco.netlify.app).
- [Release and offline downloads](https://github.com/diegoami/malpaco/releases/tag/v0.5.4).
- Web release only; rules/AI, core/fixture trees, game save/replay identities and
  dependencies unchanged. Scoreboard stays schema 2 with its compatible optional
  per-row Legacy classification marker.

The original successful CI archive was deployed to Netlify with **--no-build**;
both draft and production match all **27 payload files** byte for byte. Every
checksum and complete coverage of 26 manifest entries plus SHA256SUMS were verified.
BUILD.json names version 0.5.4, the full reviewed source above, schemaVersion 1
and minimumNode 22. The source was promoted unchanged to main and the new tag;
GitHub Pages builds that same source for `/malpaco/`, so its host-relative build
is verified against its own Pages artifact rather than claimed identical to the
root-path tar. All **23 live Pages files** match that artifact byte for byte.

| Destination | Receipt | Verification |
| --- | --- | --- |
| Netlify draft | `6aef62b8b93e4ea523f912b2` | 27 matching files; 31 general + 35 feature smoke cases pass |
| Netlify production | `6aef6521d9ede522f4694a91` | 27 matching files; 31 general + 35 feature smoke cases pass |
| GitHub Pages | workflow `42398370866`, deployment `7624777158`, artifact `13584173447` | 23 matching files; 31 general + 9 Pages-path feature cases pass |

Netlify reports production ready/active, activated **2026-11-07T17:51:30.666Z**.
Pages reports deployment success at **2026-11-07T17:52:06Z**. Smoke used pinned
Playwright 1.63.0 Chromium at 390×844, 568×320, 844×390, 820×1180 and 1280×800.
It covers both combat presets, Text/Icons/Auto, explicit launch/resume, settings,
speed/widget/zoom, actual-rule Help, manual/eight images and exact saved resume.
Feature cases cover legal End turn and pending-choice refusal, actual human-win
New game text, exactly-once scores and explicit next Start, all scoreboard fields,
known Legacy grouping and version/manual agreement. Pages additionally exercises
real wins and record preservation through its `/malpaco/` path. No limits, framing
or action assertions were weakened for publication.

Host Python HTTPS readback attempts encountered sandbox DNS and TLS handshake
timeouts; the retained IPv4 curl readback verifies all 27 production bytes. These
transport attempts are not reported as payload mismatches or successful checks.

Contents: selected local Oxygen End turn artwork/credits, always-text primary
completed-game New game action, readable phone scoreboard/filter, bounded known
Legacy reclassification, actual-rule Help guards, current review citations,
package-derived player version and maintained illustrated guide/Help.

The accepted [CI run 42385793743](https://github.com/diegoami/malpaco/actions/runs/42385793743)
is a pull-request event associated with prep head `c3ede67243dbcf70732389e31191bb3cd1056a63`;
its actual checkout and BUILD source are the reviewed `0336f418…` above. Its tree
equals that prep head and every included green task head is an ancestor. It passed
**1205 units / 97 files**, dev-watch, **6 source Help**, and **706 extracted-playable
cases / 414 explicit route/project skips**. The later automatic main run is a
repeat, not the source of the sealed accepted bytes.

Playable: **2,470,360 bytes**, SHA-256
`dabe68713d5ed49b780d92955e4cb3c3e46aeb15681b0afb6566865e5f0a2401`.
Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.5.4/malpaco-0.5.4-publication-evidence.tar.gz):
**30,618,150 bytes**, SHA-256
`65ae570b69052a982b5fe2d127b45a0ddb6ec17e37bc92e516d0ba23269e4cd6`;
separate checksum assets accompany both. The 287-member proof includes approval,
review, original CI ZIP/verification, deploy receipts, Pages artifact, smoke
reports/pictures and an included-file manifest. No authentication/configuration
or environment files are included. Public asset readbacks are recorded afterward
on #457 to avoid a self-referential evidence archive.

The reviewer passed all 1205 units and six source Help checks. Its local extracted
run passed 702/skipped 414/failed four; the same two map-card/badge overlap and two
reference-golden failures reproduced on published v0.5.3 on that machine. These
disclosed baseline-local results are not called a clean local full-suite pass.
No candidate defect was found. Owner visual acceptance remains separate from
automated pictures and AGREE.

See [PROVENANCE.md](PROVENANCE.md) and [milestone #457](https://github.com/diegoami/malpaco/issues/457).
Preserve the tag, exact accepted tar and older releases/assets unchanged, including
v0.5.3 at `b6f9e5458fc066a4badce518404d4ed10bbfe53c`, its publication and prior
production `6ae7d5b45d42a9050b8ff7c9`; v0.5.2, v0.5.1 and older records stay intact.
Later documentation-only receipts do not move the tag or replace the sealed bytes.
#90/#409/#410/#432, native delivery and held balance/personality work remain separate.
Do not automatically start another task/review/release/deployment or carry this
publication approval forward. Prefer compatible forward fixes; #372 makes v0.3.1
an unsafe routine rollback for newer scores/preferences.
