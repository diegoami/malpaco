# Drawing checks: revision 7

Revision 7 applies the independent review's corrections and the owner's explicit
choice to keep army counts visible on every territory, including at rest. Prose
remains temporary; the placement pool remains visible independently of hints.
These are mechanical drawing checks, not usability approval.

Scope remains `docs/plans/finished-game-vision/**`, related owner wording in
`docs/plans/release-0.2.0.md` and append-only `RUN-NOTES.md`. Product code, rules,
task Done-when, dependencies and model assignments are unchanged. The source
baseline remains `e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`.

## Current drawings and checks

There are **93 SVGs**: 65 gallery compositions (13 scenes across phone portrait,
phone landscape, tablet portrait, tablet landscape and desktop), 23 focused
teaching examples and five unchanged original geography studies.

- Every SVG parses with title/description metadata; action icons have names.
  There are no embedded scripts or external image assets.
- All fitted overviews have all 46 owner-shaped count badges, with at least 14px
  text. Five resting maps have numbers and no prose. Requested overlays may cover
  the map while open; counts remain on the underlying board.
- The [native Chromium receipt](validation/revision-7/render-report.json) records
  93 full-viewport map backgrounds and 49 quarter-turned portrait compositions,
  with no viewport text/icon overflow, clipped fitted-overview coasts or count
  overlaps with another count or nonmodal context/action.
- The new panel-versus-land check samples at 4px intervals inside actual coast
  paths. Active overview scenes protect all islands; phone close-ups protect the
  focused island. Peripheral cropped geography remains accessible by Fit/pan/list.
  Setup/result/elimination, requested help and private-reward acknowledgment are
  intentional overlays and are exempt. This scoped drawing check does not prove
  all possible runtime panel positions unobstructed.
- No sampled protected land lies under an active contextual panel. No production
  centre overlaps a count badge. Centred labels were inspected in native renders.
- Semantic checks tie ownership to default domination progress (34 / 35), victory
  (35 of 46), and human elimination (no blue countries). They also reject reused
  Fast-forward/Start-combat/New-game icon families. All current cases pass.
- [Hashes](validation/revision-7/sketch-sha256.txt), byte-identical regeneration,
  changed Markdown links, planning scope, whitespace and append-only notes are
  checked. Prior raw render receipts/hashes/scripts remain unchanged.

The independent review's complete body and provenance are preserved in
[reviews/claude-cloud-2026-10-20/](reviews/claude-cloud-2026-10-20/REVIEW.md), with
[a finding-by-finding response](reviews/claude-cloud-2026-10-20/RESPONSE.md).
Its verdict is REQUEST_CHANGES at `cb5c19a`. The [subsequent recheck](reviews/claude-cloud-2026-10-20/recheck/REVIEW.md)
approves revision 7 at `82ae510` with nonblocking follow-ups and confirms all nine
original findings resolved. Both are COMMENT records because the connected
account authored the PR. Their explicit intended verdicts are preserved; the
actual Claude model was not supplied and is not independently verified.

The approving recheck independently reproduces all 93 hashes and the revision-7
render receipt. It also identifies count attribution/leader crossings, lack of
larger-stack fixtures and peripheral-label clutter that the rectangle checks do
not detect. [Follow-ups and acceptance inputs](reviews/claude-cloud-2026-10-20/recheck/FOLLOWUPS.md)
retain those limits. This approval-record update changes no drawing source, SVG
or rendering receipt; all 93 SVGs remain byte-identical to the reviewed commit.

## Reproduction

```sh
python3 docs/plans/finished-game-vision/draw-sketches.py
python3 docs/plans/finished-game-vision/draw-beginner-walkthrough.py
python3 docs/plans/finished-game-vision/draw-geography-studies.py
CHROMIUM_PATH=/usr/bin/chromium node docs/plans/finished-game-vision/validation/revision-7/render-sketches.cjs /tmp/malpaco-sketch-check
```

Native PNGs are retained at `/workspace/shared/malpaco-previews/revision-7/` in
the cloud workspace. SVG sources, helpers, hashes and receipts are durable in Git.
These commands render static drawings and never start or import the game.

## Historical evidence and limits

First-package receipts identify `33c0f90`; revisions 2–6 identify `b45fb71`,
`3f5e23e`, `e2411a8`, `ce55f52` and `cb5c19a` respectively. Those raw receipts,
hashes and scripts remain unchanged. Historical decisions such as hidden counts
are superseded by the explicit count decision, not silently rewritten.

These are fixed original interaction illustrations, not an implemented tutorial,
a deterministic played trace, a valid graph or production generator output. The
four study forms and schematic slivers do not demonstrate required geographic
variety or acceptable country geometry. Existing topology/count/fairness/route,
input/contrast/picking and versioned-save requirements remain binding.

The illustrative capture chances remain 233/256, 247/256 and 15/16 (91%, 96%,
94%) under the approved single-die/rerolled-ties model. They describe fighting to
capture, not the next exchange or a chosen Fight-on stopping condition. Capture
uses seven surviving source armies, edited total 3 and pending 4 / 3, range 1–6;
friendly movement shows 8/4 becoming 5/7 after total 3. Actual stacks, pools,
legality, odds, effects and results must derive from the real controller/options.
No rule, capture default, conservation, timing or RNG contract is changed.

No game tests/build, live play, generator/AI experiment, additional review
dispatch, CI, product implementation, deployment, merge or usability/fun approval
is claimed by this approval-record update. Owner sketch/playable D4 acceptance,
nonblocking follow-through and existing #215 reconciliation/approval gates remain
before feature dispatch.
