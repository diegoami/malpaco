# Drawing checks: revision 6

The owner requested applying the changes, with review by someone else. Revision 6
updates the static concepts and expanded first-use sequence directly. This file
records mechanical drawing checks, not a usability review or approval.

Scope remains `docs/plans/finished-game-vision/**`, related owner wording in
`docs/plans/release-0.2.0.md` and append-only `RUN-NOTES.md`. No product files,
task Done-when, rules, dependencies, model assignments or dispatch change.
The source baseline remains `e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`.

## Current drawings

- Forty cross-device gallery compositions, twenty first-use frames and five
  unchanged original geography studies: sixty-five SVGs. The expanded examples
  illustrate one relevant hint/request at a time, not a twenty-screen prerequisite.
- All parse with title/description metadata and named action icons, without
  embedded scripts or external images. Four quiet maps contain no visible text.
- The [native Chromium receipt](validation/revision-6/render-report.json) records
  sixty-five full-viewport map backgrounds, forty quarter-turned portrait views,
  no viewport text/icon overflow, no clipped coasts in **any** fitted overview
  orientation, and no count-badge overlaps with another count or contextual
  panel/action. Focused phone views deliberately crop the world.
- Unlike revision 5's portrait-only coast check, the new renderer checks fitted
  landscape and desktop/tablet overviews too. Layouts use coast bounds with
  shoreline/spline margin; short landscape contexts sit beside the focused pair.
- The new [hash manifest](validation/revision-6/sketch-sha256.txt) identifies every
  current SVG. Regeneration is byte-identical; changed Markdown links, XML,
  planning-only scope, whitespace and append-only notes were checked.
- Selected native renders were inspected to position labels/choices. This is
  drawing verification, not an independent design review or human usability test.

The static capture-odds annotations were checked by exact rational recurrence
under the approved single-die/rerolled-ties model: capture probability is the
average of the two next decisive states, with zero at source 1 and one when the
defender reaches 0. This gives 233/256 for 8 against 3, 247/256 for 8 against 2,
and 15/16 for 7 against 2; their rounded labels are 91%, 96% and 94%. This does
not test a runtime odds implementation. Actual values must derive from the
actual controller and rules. The illustrated losses leave seven surviving
source armies before a possible capture: edited total 3 previews 4 / 3, range
1–6. Existing defaults, conservation, dice and capture ordering are unchanged.

Regenerate with:

```sh
python3 docs/plans/finished-game-vision/draw-sketches.py
python3 docs/plans/finished-game-vision/draw-beginner-walkthrough.py
python3 docs/plans/finished-game-vision/draw-geography-studies.py
CHROMIUM_PATH=/usr/bin/chromium node docs/plans/finished-game-vision/validation/revision-6/render-sketches.cjs /tmp/malpaco-sketch-check
```

The optional Pillow utility groups native PNGs for conversation previews:

```sh
python3 docs/plans/finished-game-vision/validation/revision-6/compose-walkthrough.py /tmp/malpaco-sketch-check
```

Current PNGs are retained at `/workspace/shared/malpaco-previews/revision-6/` in
the cloud workspace; durable SVGs, helpers, receipt and hashes are in Git.

## Historical material

Original root receipts identify the first drawings at `33c0f90`.
`validation/revision-2/` identifies `b45fb71`, revision 3 `3f5e23e`, revision 4
`e2411a8`, and revision 5 `ce55f52` (drawings unchanged through `a7d0f2e`). All
prior raw receipts, hashes and render scripts remain unchanged. Replaced scene
names and the removed main-session assessment remain available in Git history;
they are not part of the current review package.

## Limits

These are original schematic interaction concepts, not an implemented tutorial,
played trace, valid generated graph or real match fixture. No actual-generation,
topology, connectivity, fairness, route or save compatibility result is established.
The broad real-island/regional variety requirement remains; the four studies
are illustrative and do not define a closed generator catalogue.

The 46-country/nine-island/count/adjacency/fairness/route/save contracts remain
binding. No generator algorithm, engine or gameplay rule is selected or changed.
Actual goals, pools, legality, opponents, odds, loss branches, rewards and result
must follow the real controller/options; the illustrations never force a win.
All information remains reachable; required choices and private handover remain
recoverable and cannot timeout or be bypassed.

No game tests/build, live-play session, generation experiment, AI benchmark,
independent review, CI, product implementation, deployment or usability/fun
approval is claimed. Separate review and playable D4 acceptance remain. Reconcile
existing issues/contracts and seek release-slice/backlog approval under #215
before feature dispatch; drawing checks do not authorize it.
