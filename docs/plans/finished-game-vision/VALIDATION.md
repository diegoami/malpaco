# Review-package checks

Revision 2 records the owner's V1–V5 approval and visual amendments, and replaces
the rejected first sketches. Source baseline remains
`e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`.

Scope is `docs/plans/finished-game-vision/**`, the owner-amendment section and
related wording in `docs/plans/release-0.2.0.md`, and append-only `RUN-NOTES.md`.
Product files, task Done-when, game rules, dependencies and model assignments
are unchanged. The release map now explicitly flags the superseded dock/sidebar
assumptions for reconciliation before dispatch.

## Current drawings: revision 2

- Twenty-four SVGs: quiet map plus setup, ordinary turn, capture, late game and
  result, each across portrait, landscape, tablet and desktop.
- Every SVG parses, has title/description metadata and accessible icon names,
  and contains no scripts, external images or imported assets.
- All twenty-four map backgrounds cover their exact viewport. All four quiet-map
  drawings contain zero visible text elements. Action controls are icons.
- Chromium rendered all twenty-four at native size. The
  [render receipt](validation/revision-2/render-report.json) records zero text/icon
  overflows in either direction and twenty-four full-viewport maps. Representative
  quiet, turn, capture, late-game, setup and result layouts were visually checked.
- [Current SVG hashes](validation/revision-2/sketch-sha256.txt) match the checked
  drawings. Regeneration is byte-identical.
- Relative Markdown targets resolve, run-note history is preserved as an exact
  prefix, and whitespace/scope checks pass.

Reproduce the drawings with:

```sh
python3 docs/plans/finished-game-vision/draw-sketches.py
```

With the existing Playwright dependency and Chromium installed, reproduce the
static rendering/overflow/text checks with:

```sh
CHROMIUM_PATH=/usr/bin/chromium node docs/plans/finished-game-vision/validation/revision-2/render-sketches.cjs /tmp/malpaco-sketch-check
```

This script reads static SVGs; it does not launch or import the game. Screenshots
are temporary drawing previews, not gameplay evidence.

## Historical first package

The first twenty drawings and their documentation are retained in Git at
`33c0f90c5f3b0db1da0a4f8a5da0f24838ea95ac`. Its original
[render receipt](validation/render-report.json) and
[hash list](validation/sketch-sha256.txt) remain unchanged; they identify the
superseded drawings at that revision, not the current SVGs. The owner rejected
that composition as too text-heavy. Their V1–V5 approval and qualifications are
quoted in [DECISIONS.md](DECISIONS.md); no approval of the original sketches is
inferred.

## Semantic self-audit

The journey retains late match, loss/watch/resign, recovery, privacy and results.
Organic geography is required and flavour naming deferred. Fixed chrome is
superseded by full-screen geography, accessible icons and requested/contextual
text, while explicit Attack and complete reachable information remain. Critical
choices cannot time out; ordinary text clears when its interaction ends.

V1–V5 need no repeat vote. Revised sketch review and then existing-backlog
reconciliation/approval remain under #215. No task or competing roadmap is
created; no independent model review, game build/tests, live playtest, generation
experiment, AI benchmark, implementation, CI run or publication is claimed.
Actual organic generation, touch/icon discovery, accessibility and full-match
quality still require playable acceptance.
