# 0.5.2 acceptance protocol

Parent [#422](https://github.com/diegoami/malpaco/issues/422), preparation #429;
contracts [T156](../../tasks/T156.md)–[T161](../../tasks/T161.md) and
[owner decisions #423](https://github.com/diegoami/malpaco/issues/423).
This defines gates, not a verdict or permission to publish.

## Candidate and bytes

- Merge feature PRs #424–#428 and the release-preparation PR only with green CI.
  Review the entire previous-tag-to-candidate diff, including unreviewed PRs.
- Package.json and both root lock versions are 0.5.2. Dependencies, core/fixture
  trees, AI policy and saved identities match v0.5.1 at
  `2fec967d39d8cc0a367df47db5900708ccd12d3d`.
- Pin the full integrated main SHA on #422. From that pin, take only milestone
  fixes; a PR-head build is not the integrated main candidate.
- Build, root/core types, dev-watch checks, full units and exact-main
  extracted-playable CI pass. Serial local workers may avoid contention without
  changing test limits. Preserve original failures, serial retries and superseded
  runs. Do not weaken assertions, skip relevant cases or increase limits.
- Keep the pinned source Help regression in both viewport projects. It does not
  claim full source-browser-suite CI coverage; #409 remains separate.
- Download the successful main run's actual playable artifact. Record run/artifact
  IDs, ZIP and tar sizes/digests, and full source SHA. BUILD.json must name version
  0.5.2, that SHA, schemaVersion 1 and minimumNode 22. Verify every SHA256SUMS entry
  and coverage of every payload file, the guide/eight images and offline quickstart.
  Local rebuilds are diagnostics and must never be described as downloaded CI bytes.

## Behavior

- Launcher: no clipping/horizontal overflow; explicit Start/Resume first, above or
  left of settings without overlap. Portrait/landscape/desktop composition fits
  820×1180, 1180×820, 1024×600 and 1280×800 without internal scrolling. At
  360×640/390×844 and short landscapes (568×320, 640×360, 740×360, 844×390),
  every focused setting label/control is reachable; Start/Resume remain reachable,
  selections survive rotation, and exact kept saves survive until explicit actions.
- Buttons: three persistent modes, automatic default, text through two personal
  turns and icons afterward, including reload/resume. Explicit Text/Icons choices
  remain. Smaller text Attack/Move retain >=44px targets and legal behavior.
  Zoom glyphs stay visible; removed buttons are absent from ordinary play; New
  Armies follows Cards without clipping and uses an army glyph in icon mode.
- Computer pace: exactly Slow/Normal/Fast/Very fast publicly, default Normal;
  preference persists and failed writes roll back visibly without changing match
  bytes. Normal gaps 90ms; feedback reinforcement/attack/capture/move/raid
  520/720/520/640/560ms. Slow/Fast retain old times; Very fast uses 40ms beats.
  All speeds preserve action order/outcomes, pause and stale-callback protections.
- Widget: three bounded content sizes with >=44px controls, no map-zoom or match
  changes; Hide/Show works with focus and Resume reachable while hidden. Phone,
  568×320, tablet portrait/landscape and desktop controls fit; short content is
  keyboard-scrollable. Rendering and pause changes preserve size/visibility.
- Touch: greatest sampled visible cell area in a 12–24px circular footprint,
  2px grid, centre/stable-id ties, 1.25× zoom capped at MAX_ZOOM. Labels and covered
  UI add no area. Verify real borders with an independent denser oracle,
  rotated/zoomed maps, larger contacts and exactly one action despite a following
  click. Illegal/paused, cancel/pan/pinch inputs preserve complete match state;
  mouse and keyboard selection remain valid.
- Help/manual: actual running combat rule remains correct with opposite next-game
  settings; all guide images load from the extracted artifact. Inspect changed
  images with captions. Pictures show retained examples, not a fresh default deal.
- Preserve old saved identities, future AI decisions, exact resume, native explicit
  Resume safeguards, world-event/card notices and exactly-once scores. Owner judges
  integrated readability/gameplay; virtual viewports are not physical-device tests.

## Review and publication

The owner launches review under `docs/milestone-review.md` against the pinned
v0.5.1-to-candidate diff. Record model, full SHA, checks, findings and AGREE/BLOCK on
#422. No automatic reviewer is authorized. Fix actual blockers in ordinary PRs,
move the candidate and repeat verification; never silently move reviewed bytes.

Publication needs the review gate, owner visual acceptance and explicit 0.5.2
publication approval. Record any owner-authorized exception; the 0.5.1 decision
to inspect afterward is not standing permission for 0.5.2. This task authorizes no
tag, GitHub release, release-asset upload, draft deployment or production deployment.

When separately authorized, smoke-test verified CI bytes on a draft across both
combat presets, all display modes and representative phone/tablet/desktop layouts;
check new controls, Help/manual, exact resume, retired routes and browser errors.
Read back every deployed payload byte, then publish those bytes without rebuilding.
Preserve v0.5.1 and all earlier tags/assets/deployments unchanged. Native delivery
and unrelated follow-ups remain outside this release.
