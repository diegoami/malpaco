# Review-package checks

Revision 5 records the owner's real-island/province reference direction and
explicit inclusion of usability in their review. New original forms replace
repeated generic island/cell construction in the static sketches. Source baseline
remains `e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`.

Scope is `docs/plans/finished-game-vision/**`, related owner-amendment wording in
`docs/plans/release-0.2.0.md`, and append-only `RUN-NOTES.md`. No product files,
task Done-when, rules, dependencies, model assignments or dispatch change.

## Current drawings: revision 5

- Twenty-four UI compositions, eight teaching frames and five geography study
  boards: thirty-seven original SVGs total. The study boards are design references,
  not extra product screens.
- Island forms use the owner's Sicily/Cuba/Borneo/New Zealand examples as
  high-level references. Coast coordinates and internal boundaries are authored
  here; no source map/data is traced or imported. The drawing helper supplies
  fixed examples for documentation, not a production generator.
- Regions include unequal coastal chains and interior/coastal configurations.
  Study counts are original game-sized examples, not actual administrative counts.
- All thirty-seven parse with title/description metadata; action icons have
  names. No scripts, external images or predecessor assets are embedded.
- Chromium rendered all thirty-seven at native size. The
  [receipt](validation/revision-5/render-report.json) records zero text/icon
  overflow, thirty-seven full-canvas backgrounds, twenty rotated portrait views
  and no clipped fitted-portrait coast outlines. Four quiet maps contain no
  visible text. Study, overview, portrait and teaching layouts were inspected.
- Capture controls were repositioned below both selected counts following the
  geographic change; selected count labels remain visible in the checked frames.
- [Hashes](validation/revision-5/sketch-sha256.txt) identify the current SVGs.
  Regeneration is byte-identical. Relative links, whitespace, notes-prefix and
  planning-only scope checks pass.

Regenerate original drawing sources with:

```sh
python3 docs/plans/finished-game-vision/draw-sketches.py
python3 docs/plans/finished-game-vision/draw-beginner-walkthrough.py
python3 docs/plans/finished-game-vision/draw-geography-studies.py
```

Using the existing Playwright dependency and Chromium:

```sh
CHROMIUM_PATH=/usr/bin/chromium node docs/plans/finished-game-vision/validation/revision-5/render-sketches.cjs /tmp/malpaco-sketch-check
```

The unchanged optional Pillow pairing utility can arrange the new teaching
screenshots for inline review:

```sh
python3 docs/plans/finished-game-vision/validation/revision-4/compose-walkthrough.py /tmp/malpaco-sketch-check
```

Review PNGs are retained at `/workspace/shared/malpaco-previews/revision-5/` in
the cloud workspace. Durable sources/helpers/receipts are in Git. These commands
read static drawings and do not start or import the game.

## Historical evidence

Original root receipts identify first-package drawings at `33c0f90`.
`validation/revision-2/` identifies `b45fb71`, `revision-3/` identifies `3f5e23e`,
and `revision-4/` identifies `e2411a8`. All those original receipts and scripts
remain unchanged. They identify historical SVGs, not the current ones. No earlier
owner response or independent review is rewritten.

## Semantic review and limits

Owner V1–V5, required original organic geography, deferred flavour, vivid stable
ownership, full-screen/icon/contextual presentation and portrait fit remain.
The user now explicitly includes usability in their review and refines geography
with real island/province character. The source-cited reference brief distinguishes
consulted context from newly authored forms and future generator requirements.

The 46-country/nine-island/count/adjacency/fairness/route/save contracts remain
binding. The sketches have not been checked as valid graphs, connected province
partitions, compliant sea routes or real generator output. Natural-looking shapes
alone do not satisfy those contracts. No generator algorithm or constraints are
changed by the drawing helper.

The teaching sequence remains a possible illustrated branch, not a played trace
or forced win. Hints must adapt to real options, pools, legality, losses and cards;
capture totals and required-choice gates remain. All information remains
reachable on request; first-use explanations clear afterward.

No game tests/build, generation experiment, AI benchmark, independent model
review, CI, product implementation, publication or usability approval is claimed.
The owner will review usability alongside appearance/interaction in actual builds.
Reconcile existing issues/contracts and seek separate release-slice/backlog
approval after the visual direction is accepted under #215.
