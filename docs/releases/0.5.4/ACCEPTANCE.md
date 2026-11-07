# 0.5.4 acceptance protocol

Parent [#457](https://github.com/diegoami/malpaco/issues/457); choices
[#458](https://github.com/diegoami/malpaco/issues/458); T167–T171. Gates, not a
verdict or permission to publish.

## Source and exact candidate

- Preserve v0.5.3 at `b6f9e5458fc066a4badce518404d4ed10bbfe53c`, its sealed archive,
  all older releases and existing production. Main pushes publish Pages, so keep
  implementation and review on `release/0.5.4` until explicit publication approval.
- Integrate only green included heads with no unresolved findings. The exact
  successful CI checkout/merge commit may be promoted unchanged by a fast-forward
  to that branch once every included task head has passed. Record the CI event,
  associated PR head, actual checked-out SHA and reachable branch pin separately.
  A temporary PR merge ref alone is not durable provenance. No force-push or rebuild.
- Package and both root lock versions are 0.5.4; other dependency records and
  core/fixture trees match v0.5.3. Scoreboard schema remains 2 with an optional
  compatible per-row classification marker; game save/replay identities do not move.
- Build/core+root types, dev-watch, full units, pinned source Help and full
  extracted-playable CI pass on the accepted source. Local browser checks cover
  affected specs, not the full source suite (#409). Preserve failures, cancellations,
  retries, limits and assertions. Record duplicate-project versus pre-existing skips.
- Download the original successful CI ZIP and tar. Record run/artifact IDs,
  sizes and SHA-256. BUILD.json must name 0.5.4, the exact source, schemaVersion 1
  and minimumNode 22. Verify every checksum and complete payload coverage,
  illustrated guide/eight source-identical images, quickstart and local Oxygen
  source/authors/licences. A local rebuild is never called downloaded CI bytes.

## Player behavior and record preservation

- In Text/Icons/Auto, legal End turn is named, reachable and >=44px at phone,
  short landscape, tablet/desktop. Icons/Auto show the selected locally bundled
  artwork at root and /malpaco/. Click/keyboard perform one legal handoff; capture
  and playable-set decisions cannot be bypassed. Credits/source work offline.
- A real human win shows **New game** as visible text in the full-width primary
  row in every label mode. Retain title, expansion/fold/restore, keyboard/click,
  explicit next Start and exactly-once score behavior. Watch/Stop remains intact.
- At 320/390 portrait, short landscape, tablet/desktop, all six scoreboard fields,
  captions and filter are readable/reachable without sideways dialog scrolling.
  Filter target is >=44px and text >=18px. Table relationships remain accessible;
  screenshots do not establish screen-reader acceptance. Reset still asks.
- Known configurable-cards/1 results use Legacy. Preserve overall totals/ids,
  ordering/caps, all outcomes and unknown older counts. Repeated parse/write and
  an actual v0.5.3 reader/writer round trip must not transfer a marked row twice;
  only a new attributable unmarked result transfers. Never guess from seeds or
  preferences, or make damaged counts negative. Manual record review is recommended.
- Help describes actual running Legacy/Defender rules despite opposite next-game
  preferences in both directions, preserving exact saved bytes/preferences. A
  temporary selector-on-open mutant must fail those checks, then exact restoration
  returns green. Corrected review citations keep the same criteria.
- Player badge, Help, generated manual and BUILD version agree. Badge respects
  safe insets, catches no map input and covers no control; diagnostic reference
  screenshots retain their existing goldens without a version overlay. Maintain
  guide/Help/quickstart and inspect every refreshed picture/caption, including phone.
  Captures are illustrative retained games, with dirty source hashes disclosed.

## Owner gates and later publication

Post full source, previous v0.5.3, all included/unreviewed PRs (including hosting and
administrative history), exact archive/evidence and a concrete
`docs/milestone-review.md` prompt on #457. Freeze that candidate; fix real blockers
through green PRs with an explicitly moved pin and reverified archive.

The owner launches the independent milestone review and judges the actual build.
Automated pictures are not owner visual, physical-device or screen-reader approval.
No reviewer, tag, release, draft deploy, Pages/main or Netlify publication is launched
by preparation. Publication needs current review/visual acceptance and explicit
owner approval; earlier permissions do not carry. Before any later main promotion,
verify the approved source/tree and exact bytes plus host-path behavior again.
