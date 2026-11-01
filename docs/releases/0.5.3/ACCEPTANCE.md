# 0.5.3 acceptance protocol

Parent [#440](https://github.com/diegoami/malpaco/issues/440), contracts
[T162](../../tasks/T162.md)–[T166](../../tasks/T166.md), owner decision
[#441](https://github.com/diegoami/malpaco/issues/441). These are gates, not a
verdict or publication permission.

## Source and exact bytes

- Merge only green feature/preparation heads. Include every unreviewed PR in the
  owner’s whole v0.5.2-to-candidate review.
- Package.json and both root lock versions are 0.5.3. Other dependency records,
  core/fixture trees, rules/AI and saved identities match v0.5.2 at
  `198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`. Old published records/assets are immutable.
- Pin the full integrated-main candidate SHA on #440; take only milestone fixes
  afterward. A PR-head build is not the integrated candidate.
- Build, root/core types, dev-watch checks, full units, pinned source Help in both
  viewport projects and exact-main extracted-playable CI pass. Keep original
  failures and retries; do not change limits, skip relevant cases or weaken
  framing/action assertions. Local checks cover affected specs, not the full
  source suite (#409 remains separate).
- Download that main run’s actual artifact. Record run/artifact IDs and original
  ZIP/tar sizes and SHA-256 digests. BUILD.json must name version 0.5.3, the pinned
  full SHA, schemaVersion 1 and minimumNode 22. Verify every SHA256SUMS entry,
  complete payload coverage, guide/eight images and offline quickstart. A local
  rebuild must never be described as downloaded CI bytes.

## Player behavior

- In Text/Icons/Auto, Zoom In/Out remain named icons at Fit and after zoom,
  selection/turn updates, rotation/resize and reload. Targets are >=44px and
  reachable with the widget shown in the tested short layouts. Out disables at 1,
  In at existing MAX_ZOOM; focused unavailable controls return focus to Fit.
  Looking at the map preserves exact match bytes. Diagnostic conditional tools
  retain their previous behavior.
- A new friendly move has no empty pre-destination drawer, and cancellation is
  reachable. A legal pair shows exact From/To names/counts, a directed map link,
  amount and Swap before confirmation. New interior/frontier pairs default
  interior → enemy border only if legal, in either tap order. Both-interior and
  both-frontier pairs retain tap order. Swap persists across redraws and re-taps of the unchanged destination until the pair changes;
  illegal reversals cannot be chosen. Amount bounds follow the current source;
  only Confirm commits the exact intended friendlyMove. Cancel/Escape leave the
  match unchanged. Both badges stay clear and both names remain fully visible
  with Confirm reachable at 568×320. The Move banner is absent; countdown and other
  announcements/pause safeguards still work.
- Every distinct playable card-set alternative is one >=44px button showing the
  actual three card symbols. Wild substitutions are distinguishable. Required
  choices and Your cards agree; full names/effects remain accessible and in
  tooltips. Exact card indices/effect, legal deduplication, Skip and blocked views
  are preserved. Narrow views may scroll their choice content normally.
- A completed game shows New game in its own full-width primary row, larger than
  secondary Standings/Details, with its existing accessible name and selected
  text/icon face. It remains reachable on expansion/fold/restore; normal click or
  keyboard opens setup without starting a match. The winner stays readable and
  the score records once across the transition/reload. Unresolved elimination
  Watch/Stop and diagnostic flows remain intact.
- Cover phone (390×844), short landscape (568×320), tablet (820×1180), desktop
  (1280×800) and the existing 844×390 regressions. Preserve both Defender/Legacy
  kept-game behavior and actual-rule Help with opposite next-game preferences.
  Inspect all changed curated pictures with captions. Examples are retained
  positions; automated pictures are not owner visual acceptance or real-device
  and screen-reader tests.

## Owner review and publication

Provide a concrete prompt under `docs/milestone-review.md` naming #440, previous
v0.5.2 and the exact candidate. The owner starts an independent reviewer; record
its model, SHA, checks and AGREE/BLOCK verdict on the milestone. Fix real blockers
in ordinary green PRs, move the pin explicitly and reverify.

This implementation request authorizes no reviewer, tag, GitHub release assets,
draft deployment or production deployment. Publication needs the review gate,
owner visual acceptance and explicit 0.5.3 publication approval. Earlier releases’
permissions do not carry forward. Prefer compatible forward fixes; v0.3.1 is not
a routine rollback because #372 reproduces scores/preferences loss.
