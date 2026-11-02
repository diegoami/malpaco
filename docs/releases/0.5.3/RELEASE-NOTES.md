# Malpaco 0.5.3

Published **2026-11-02T00:30:20Z** from reviewed source/tag
`b6f9e5458fc066a4badce518404d4ed10bbfe53c` after AGREE and current owner approval.
See [publication](PUBLICATION.md) and [provenance](PROVENANCE.md).

This release addresses the owner’s post-0.5.2 control feedback. Scope and decisions:
[milestone #440](https://github.com/diegoami/malpaco/issues/440),
[contracts](../../plans/release-0.5.3.md), and
[move direction #441](https://github.com/diegoami/malpaco/issues/441).

- Bottom-left Zoom In/Out stay visible as icons at Fit and while zooming. Out is
  disabled at minimum zoom, In at the existing maximum; focus returns to Fit when
  a focused zoom button becomes disabled. The shown turn widget leaves the camera
  toolbar clear in short landscape, and obsolete placement cards close.
- Move no longer opens an empty window before you select a destination. The draft
  shows From/To names and counts, a map arrow and Swap. A legal interior/frontier
  pair initially points toward the enemy border; equal-border pairs keep tap
  order. Swap explicitly overrides that default, including when you re-tap the same destination; an illegal reverse is
  disabled. Only Confirm transfers armies; while playing, Cancel/Escape abandon the draft. During a pause, closing the card exposes Resume and keeps the draft. The
  redundant “Your turn to move” banner is removed.
- Playable card sets are compact rows of three actual card symbols, including
  wild substitutions. Each row remains one usable button, with full effect names
  in tooltips and accessible labels. Required choices and Your cards agree.
- After a completed game, New game is a separate, larger primary action above
  Standings and Details, including in icon mode. It opens the launcher; Start is
  still explicit. Results and scores keep their existing behavior.

Text, Icons and Text 2 turns then Icons remain supported. The player guide,
inline Help and selected illustrations are maintained together. Pictures show
real retained-game examples, including earlier rules, rather than fresh default
positions. Virtual viewport checks do not establish physical-device/screen-reader
testing or owner visual acceptance.

Core rules, AI decisions, saved-game identity/format and dependencies are
unchanged from v0.5.2. Existing saves, scores and preferences remain local to the
same browser/address. Web release only; native delivery, held
balance/personality work and unrelated quality follow-ups remain separate.

See [ACCEPTANCE.md](ACCEPTANCE.md) and [PROVENANCE.md](PROVENANCE.md). The owner-launched review and separate publication authorization are recorded there. Preserve
v0.5.2 and all earlier published tags/assets unchanged.
