# 0.5.1 acceptance protocol

T154 ([#404](https://github.com/diegoami/malpaco/issues/404)); feature contracts
[T150](../../tasks/T150.md), [T151](../../tasks/T151.md),
[T152](../../tasks/T152.md) and [T153](../../tasks/T153.md).
This protocol defines gates; it does not assert a verdict or publication.

## Candidate and bytes

- Implementation PRs #397, #399, #402 and #403 must be merged with green checks.
  Include the release-preparation PR and all previous-tag-to-candidate changes in
  the milestone review, including PRs merged without an independent PR review.
- Package.json and both root package-lock version entries must be 0.5.1. No
  dependency, core, fixture, AI policy or saved-identity change is authorized.
- Pin the exact integrated main SHA and previous tag v0.5.0
  (`2f993c7d56e09e197942d091b4f81e44f4d29cd1`) in the milestone issue. From that
  pin main takes only milestone fixes. A PR-head build is not the main candidate.
- Build, root/core types, full units and exact-main extracted-playable CI must
  pass. The pinned CI job also runs the source-build `tests/e2e/help.spec.ts` in
  both viewport projects as the #408 regression guard. Broader source-suite CI
  coverage remains the separate #409 follow-up; this focused check does not claim
  coverage of every source-only spec. Preserve earlier failures, interruptions
  and superseded runs accurately;
  do not weaken assertions, skip relevant cases or increase limits.
- Download that successful main run's actual playable artifact. Record run and
  artifact IDs, archive sizes/digests and full source SHA. Verify BUILD.json,
  every SHA256SUMS entry and coverage of every payload file. Verify the shipped
  manual, all eight illustrations and the offline quickstart. Local rebuilds are
  diagnostics and must not be described as downloaded CI bytes.

## Behavior and visual checks

- At phone and desktop widths, storm, revolt, harvest and shift notices remain
  visible at 2999ms and dismiss at 3000ms of unpaused time. Acknowledgment persists
  on reload without changing match bytes. Manual close still works. Pause,
  menus, native background, folded notices, replacement and disposal protect
  against hidden or stale timeouts. Resume gives a fresh three-second deadline.
  Required troop/card choices stay explicit.
- Help and the full guide accurately explain setup, controls, turn flow, cards,
  events, combat, results, scoreboard and local persistence. Help reports the
  running game's rule with the opposite next-game preference selected. The guide
  and its eight images load from the extracted archive; the packaged quickstart
  links to that guide. Pictures are real retained-game examples, not assertions
  about a fresh default deal. Inspect pictures with their captions.
- Text is the initial display choice. Text/Icons works in the launcher and during
  play, applies immediately and persists through turns, new games, reloads and
  resizes. A failed write restores the kept selection without altering the match.
  Single and simultaneous map actions obey it through source/target changes.
  Glyphs are visible and named; hidden controls stay hidden; Cards counts remain
  visible. Text is smaller on a phone than desktop and controls retain >=44px
  targets, legal actions, map anchoring and exact intentional action history.
- At 568×320, 640×360, 740×360 and 844×390, both label modes keep the initial
  primary command visible and use whole-card scrolling. Tab through each setting:
  its complete label and select fit the actual scrollport. Scroll/focus back to
  Start/Resume. Cover fresh, saved and configure-new modes, no horizontal overflow,
  preserved choices and rotation to/from taller windows. At 360×640, 390×844,
  820×1180 and 1280×800 retain the taller launcher containment/ordering checks.
- Preserve both combat presets, old saved identities, exact resume, future
  computer decisions, pause/explicit Resume and exactly-once scores. Existing
  rules/AI and compatibility tests remain authoritative. Owner judges integrated
  readability and gameplay; automation is not visual acceptance or a claim of
  physical-device/screen-reader testing.

## Review and publication

The owner launches independent review under `docs/milestone-review.md` against the
entire v0.5.0-to-candidate diff. Record the full SHA, model, checks, findings and
AGREE/BLOCK verdict on the milestone issue. No automatic reviewer is authorized.
Fix actual blockers in ordinary PRs, move the candidate and repeat its verification;
do not silently repoint a reviewed or published source.

Publication requires the review gate, owner visual acceptance and explicit
publication go-ahead for 0.5.1. Any owner-authorized exception must be recorded
accurately; do not carry the older release's deferred visual decision forward.
This preparation task authorizes no tag, draft deployment, release-asset upload or
production deployment.

When separately authorized, smoke-test the verified CI bytes on a draft: both
combat presets and label modes, phone/short-landscape/tablet/desktop layouts,
painted map/assets/worker, current-rule Help/manual, exact save/resume, retired
routes and page/console errors. Compare every deployed payload byte with the
archive, then publish those bytes without rebuilding and retain production and
public-download readbacks in new provenance/publication records.

Preserve v0.5.0, v0.4.0 and all earlier tags/assets and retained deployments.
Prefer a compatible forward fix; do not routinely downgrade to 0.3.1 because
#372 reproduces scoreboard loss and preference reset. Native delivery and held
balance/personality work remain outside this release.
