# 0.5.0 acceptance protocol

T149 (#391), [release scope #381](https://github.com/diegoami/malpaco/issues/381).
This is a preparation contract. It does not assert a complete candidate, passing
checks, a review verdict or publication.

## Integration and candidate

- Required implementation PRs #387 (selection), #388 (stars), #389 (mobile
  commands), #390 (launcher) and #380 (results) must be merged with green checks.
  Resolve overlapping presentation changes while retaining all five behaviors.
  Do not call a version-only preparation build the complete release candidate.
- Package metadata must agree on 0.5.0 in package.json and both root lockfile
  entries. No dependency changes are part of this release.
- After integration, pin the exact main candidate and previous tag v0.4.0 in the
  milestone-review issue, including every merged PR, source claims and check
  receipts. Main then takes only milestone fixes until tagging.
- Build, root/core types and full units must pass. Exact-candidate main CI must
  pass the extracted-playable browser suite. Preserve original failures and rerun
  receipts; do not weaken assertions, skip relevant cases or raise their limits.

## Behavior and visual checks

- Mouse, keyboard and touch can switch from Move to an attack-capable source.
  Both legal actions are offered at a source and transfer destination. A draft
  cancellation leaves armies/history unchanged; one intentional attack or
  confirmed transfer records exactly one legal action. Preserve capture bounds,
  explicit transfer, pause/computer-turn and stale-revision guards. The ambiguous
  touch chooser and direct map taps must allow the same source changes.
- Center stars remain legible at Fit on geographic and reference maps, distinct
  from army numbers, upright after rotation and stable through zoom/Fit. Markers
  follow event visibility/relocation and do not intercept country taps. Identity,
  income and saved bytes stay unchanged by presentation operations.
- Mobile commands have recognizable glyphs, accessible names, visible focus and
  targets of at least 44px. Hidden controls stay hidden. Resizing both ways restores
  desktop labels without duplicate captions or lost Cards counts. Exercise
  dynamic Attack/Move, Pause/Resume, menus, choices, results and Help.
- Start/Resume is initially visible above settings at 360×640, 390×844, 844×390,
  820×1180 and 1280×800. The launcher has no page overflow; every setting remains
  reachable by keyboard/internal scroll. No game starts without explicit action.
  Preserve preference failures, actual combat choice and exact save/resume.
- Expanded victory/elimination results have the larger layout. Folded results
  remain compact and can unfold without changing play. Standings/details and
  result actions remain reachable on phones and short landscape windows,
  including the existing 240px-height checks.
- Verify both combat presets, old saved identities and histories, future computer
  moves, score deduplication and preference retention. No AI/rule/data migration
  change is authorized by this UI release. Owner judges the integrated screenshots
  and gameplay; retain the evidence separately from automated assertions.

## Review and publication

The owner launches the independent review using `docs/milestone-review.md` against
the entire v0.4.0-to-candidate diff. Record its verdict and any findings on the
candidate issue. No automatic reviewer or unattended merge runs.

Before publication, download the exact accepted main-CI archive, verify BUILD.json
against the candidate SHA and every SHA256SUMS entry, then smoke-test those bytes
on a draft deployment. Check assets/worker, both combat choices, actual-rule Help,
save/resume, retired routes and page/console errors at the agreed viewports.
Publication requires owner visual acceptance, the review gate and explicit
publication go-ahead. Deploy the accepted CI bytes without rebuilding and record
the production/download readbacks in provenance/publication records afterward.

Preserve v0.4.0 source, artifacts and deployment. Prefer a compatible forward fix;
do not routinely downgrade to v0.3.1, whose scoreboard/preferences data loss is
documented in #372. Native delivery and held balance experiments remain separate.
