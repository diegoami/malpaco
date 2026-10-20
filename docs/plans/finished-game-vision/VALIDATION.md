# Review-package checks

Revision 4 retains the approved full-screen, contextual-text and portrait-fit
direction, adds vivid ownership colours and more irregular coast/border drawings,
and illustrates a beginner's first-use experience. Source baseline remains
`e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`.

Scope is `docs/plans/finished-game-vision/**`, owner-amendment wording in
`docs/plans/release-0.2.0.md`, and append-only `RUN-NOTES.md`. Product files, task
Done-when, rules, dependencies and model assignments are unchanged.

## Current drawings: revision 4

- Twenty-four gallery SVGs: quiet map plus setup, ordinary turn, capture, late
  game and result across portrait, landscape, tablet and desktop.
- Eight additional portrait teaching frames: start, place, enter combat,
  select/attack, outcome, capture, End turn and reward acknowledgment.
- All thirty-two parse with title/description metadata and named action icons.
  No scripts, external images or predecessor assets are present.
- All thirty-two backgrounds cover the viewport. The four quiet-map drawings
  contain no visible text. Twenty portrait views are rotated; fitted portrait
  coast outlines remain entirely within their canvases.
- Chromium rendered all thirty-two at native size. The
  [render receipt](validation/revision-4/render-report.json) records zero text/icon
  overflows. Gallery and teaching layouts were visually inspected, including
  native-size paired frames. This does not measure touch targets or teachability.
- [Current hashes](validation/revision-4/sketch-sha256.txt) identify all checked
  SVGs. Regeneration is byte-identical. Local links, whitespace, notes-prefix and
  planning-only scope checks pass.

Reproduce the drawings with:

```sh
python3 docs/plans/finished-game-vision/draw-sketches.py
python3 docs/plans/finished-game-vision/draw-beginner-walkthrough.py
```

Using the existing Playwright dependency and Chromium:

```sh
CHROMIUM_PATH=/usr/bin/chromium node docs/plans/finished-game-vision/validation/revision-4/render-sketches.cjs /tmp/malpaco-sketch-check
```

Optionally pair the native screenshots for inline review using Pillow (review
workspace utility, not an application dependency):

```sh
python3 docs/plans/finished-game-vision/validation/revision-4/compose-walkthrough.py /tmp/malpaco-sketch-check
```

These scripts read static drawings; they never start/import the game. PNGs are
review previews, not gameplay evidence. Screenshots used for the conversation
are retained under `/workspace/shared/malpaco-previews/revision-4/` in the cloud
workspace; the SVGs and reproduction helpers are the durable repository sources.

## Historical evidence

The first twenty drawings are retained at `33c0f90`; their original root
`validation/render-report.json` and `validation/sketch-sha256.txt` are unchanged.
Revision-2 receipts remain under `validation/revision-2/` for drawings at
`b45fb71`; revision-3 receipts remain under `validation/revision-3/` for drawings
at `3f5e23e`. Those receipts identify their historical SVGs, not the current ones.
No independent review or earlier result is rewritten.

## Semantic self-audit and limits

V1–V5 approval, organic geography, deferred flavour, full-screen map, contextual
text, stable accessible ownership cues and explicit Attack remain. Brighter
colours do not change ownership semantics. First-use hints are proposed, skippable
and recoverable, clearing after their interaction. Required choices/errors stay
available. The quiet resting board has no tutorial banner.

The beginner sequence is a possible branch, not a valid played trace or scripted
win. Its guide must adapt to real options, pool counts, legal targets, losses and
card phases. The example shows one final placement, one successful exchange,
then later capture. A total transfer of 3 from 8 previews 5/3; the older 5/4
illustration is corrected. Existing combat source was inspected for this protocol;
no rule change or runtime test is claimed.

No game build/tests, generation experiment, AI benchmark, independent model
review, implementation, CI or publication is performed. Actual generation,
readability, icon discovery, teachability, touch feel and full-match enjoyment
still need real-build acceptance. Revised visual review precedes final existing
backlog reconciliation and release-slice approval under #215.
