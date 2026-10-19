# Review-package checks

Prepared in a managed cloud session on 2026-10-19 against malpaco source
`e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`. Scope is this documentation directory
and append-only `RUN-NOTES.md`. No product files, task contracts, dependencies,
rules, release settings or historical review evidence change.

Checks performed on the final package:

- All twenty SVG files parse as XML, have accessible title/description elements,
  and contain no scripts or external image/asset references.
- Regenerating with `python3 docs/plans/finished-game-vision/draw-sketches.py`
  produces byte-identical drawings. [Hashes](validation/sketch-sha256.txt) identify
  the checked SVGs.
- Every relative Markdown target resolves to a file in the checkout. Pinned
  responsive references use the actual planning revision, since that directory
  is absent on main.
- Chromium, controlled through Playwright, rendered all twenty static SVGs at
  their declared dimensions. [Render output](validation/render-report.json)
  records zero text elements extending beyond the horizontal canvas. Visual
  inspection of representative capture, ordinary turn, setup, late-game and
  result drawings checked hierarchy, label crowding and the short landscape
  scroll convention. This is a drawing check, not a game/browser acceptance run.
- `git diff --check` and the staged whitespace check pass.

Semantic self-audit against #215:

| Requirement | Package evidence / boundary |
| --- | --- |
| Full journey including late match/result | README opening-to-another-match journey, explicit loss/watch/resign branches, late-game goal and limitations |
| Capabilities and exclusions with named unresolved choices | README completion bar; V1–V5 and follow-up evidence/decision owners in OWNER-REVIEW |
| Original sketches across selected layouts | SKETCHES gallery: five scenes × four form factors, each visibly schematic and described as a static concept |
| Existing authority reconciled without silent rule change | AUTHORITY crosswalk; D1–D3 retained, T50 measurement targets and T55 sound obligations preserved, current restrictions distinguished from future contracts |
| Backlog reconciliation only after owner review | No new roadmap, task or disposition list; AUTHORITY contains an unfilled format for later use |
| Owner approval before dispatch/publication | OWNER-REVIEW defines sequential gates; no checkbox or owner answer is marked complete |

No independent model review is claimed. No game tests/build, live-site playtest,
AI benchmark, geography generation, touch/accessibility acceptance, release,
deployment or owner approval was performed. Static drawings cannot establish
those outcomes. Product/design decisions and later backlog approval remain with
the owner under #215.
