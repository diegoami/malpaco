# Geographic feasibility contract

T24 keeps the approved game constraints intact while measuring the existing implementation.
The [first-iteration numerical contract](contract-proposal.md) was approved by the owner:
40×40 CSS px hit areas, 44 px maximum-coordinate label separation, and an 800×460 board
inside an 800×540 window. Coordinate, area and coast-centre tolerances are named in
[parameters.mjs](parameters.mjs). The >=99% / <=50-candidate target is an objective to
measure, not an assumption that the current generator achieves it.

The approved rules are pinned in the proposal. In particular the canonical island-graph
degree cap is **four**, even though production currently permits five. Country degree
remains 2–5; crossings remain 14–18. No production files change here.

## Run the acceptance

Use Node 24 (22.15+ provides the TypeScript loader hooks, but this task was measured on 24):

```sh
node docs/prototypes/new-game/T24/probe.mjs
node --test docs/prototypes/new-game/T24/contract.test.mjs
node docs/prototypes/new-game/T24/mutations.mjs
git diff --check
```

The task's 15 individual `--test-name-pattern` commands work as written. Tests began as
parent-authored positive/mutated controls, committed before the checker. The retained
mock transcripts show that a fixture mock passes while an accept-everything fake fails
all negative cases. The real checker is then independently deletion-mutated one group
at a time; each group must fail through assertions, then the saved bytes are restored
in a `finally` and the complete suite reruns. Evidence records identical restoration hashes.

Each probe/mutation run creates a fresh tracked-path evidence directory and prints its
location. Earlier measurements are never overwritten. Default runs use all seeds 0–99
and stop at the first accepted candidate or after 50 attempts. Per-seed files retain every
candidate's map/scene hash, failure groups, observed attempt number and time, with detailed
first-attempt failures. A continuous existing game RNG stream is used, advancing once
after each rejected body just as the production retry boundary does. A source snapshot
and a reproducibility hash distinguish semantic results from machine-dependent timings.

`targetMet: false` is a valid measurement outcome; the CLI still exits zero if the
measurement and its positive control ran correctly. It never silently reports a failed
rate as success. A broken witness or runtime failure exits nonzero. Read the report's
`targetMet`, not just the process exit status, before authorising downstream work.

## What the checks establish

[contract.mjs](contract.mjs) audits graph invariants and all five fairness checks.
[geometry.mjs](geometry.mjs) checks finite simple polygons, containment/overlap, actual
shared boundary lengths (including split/T-junction edges), exposed coasts, and route
intersections. Point contacts are not borders. Coast chains comprise exposed directed
edge pieces facing the destination island centre; contiguous pieces form chains. Choose
the longest chain, with lexicographic start-point tie-break, then its arc-length midpoint.
Every route endpoint must be on that country's exposed coast and within 1 CSS px of it.
The route interior cannot touch or pass through land, including its source/destination.
Sea routes may cross other sea routes: this probe does not certify visual lane separation.

Label checks scale positions into the agreed compact board, require 40 px hit squares
inside their countries and frame, and check 44 px maximum-coordinate spacing. The maximum
coordinate distance avoids the mistake of using Euclidean separation alone for square
hit areas. The 14 px text / 4.5:1 contrast fields express the schematic's specification;
they are not measurements of a running browser. T52 must measure actual rendered text,
palette, hit targets and ownership cues. No metadata can substitute for that UI acceptance.

The [witness](witness.mjs) is a hand-arranged rectangular subdivision with 46 countries,
nine islands and 16 crossings. Its geometry, ports and water paths are built independently
of the checker, and it is inspected by the same checks as the baseline. This is **one
schematic compatibility example**, not a new production generator, 100 different maps,
visual approval, or a demonstrated generation success rate. Its SVG is a technical drawing.

[existing.mjs](existing.mjs) reads production TypeScript without modifying it, applies the
existing layout and coast function, and retains exact graph/polygon/label information.
Its sea path diagnostics sample production's quadratic formula at 16 intervals; positive
curved-path clearance is not certified. The centre endpoints are exact and already fail
the coast requirement. Hit-size bounding-box estimates are upper bounds, and unmeasured
contrast is marked unknown, never invented. The substantive border/gap/spacing failures
do not depend on those unknown metadata fields or curve approximation.

## Next gate

The report must distinguish joint compatibility (a witness) from generator performance
(the seed sweep). An existing implementation failing every trial does not prove the
constraint set mathematically impossible. Preserve failures and the owner's constraints;
obtain owner review of the resulting evidence before downstream algorithm work. The
reference-board task also requires approval of exact topology and appearance. Do not
promote this schematic as the intended Isle-Pro-like visual direction.

## Measured result

The authoritative [full-source-fingerprinted sweep](evidence/runs/run-bbMp5F/report.json)
found **0/100 successful seeds after 5,000 candidates** (50 per seed). The witness passed
all 15 groups. Every candidate failed cells, borders, coasts, intersections and labels;
157 also failed remoteness/island degree. All other graph/fairness groups passed.

The [schematic SVG](evidence/runs/run-bbMp5F/witness.svg) and
[complete witness data](evidence/runs/run-bbMp5F/witness.json) show the positive control.
[All acceptance pattern outputs](evidence/acceptance-v1/summary.json) pass, and
[all 15 guard-deletion mutants](evidence/mutations/run-qjxt9M/report.json) were killed
with byte-identical restoration and all 85 tests passing afterward.

The earlier run-NKe9GQ sweep is retained as a preliminary measurement under the original
checker (commit 9fd8f2f); it predates the explicit tiny-slit and finite-text regressions
and full prototype-source fingerprinting. The authoritative rerun above includes those
fixes. Both report zero existing-implementation successes; neither is proof that no
future geographic generator can meet the target. The source-fingerprinted report is
the result to use for decisions.

The existing layout therefore needs geographic construction rather than more retries.
Carry the current graph/fairness checks forward, but derive land links from actual
shared subdivisions and choose sea endpoints from exposed coastline midpoints. Begin
with an owner-approved reference board (T25) after owner review of this feasibility
evidence. Keep the 99% / 50-attempt generation objective unproven until T34–T36 measure
the replacement; this task does not authorise silent relaxation or production changes.

## Review R1: protect scaled separation independently

Kimi's round-1 review proved that deleting `*scale` from the spacing check left
all 85 tests passing: the old resize control failed through hit-square containment
instead of spacing. [The reproduced pre-fix result](evidence/rework-r1/before-tests.txt)
is retained. The added control uses an enlarged frame giving scale 0.8: 50-unit
cells still contain 40px hit squares exactly, but labels are only 40px apart, so
only the 44px spacing check rejects them. It additionally asserts that every
reported error is a spacing error, preventing the former confounding refusal.

The [updated mutation audit](evidence/mutations/run-Po8FYb/report.json) kills all
16 mutants: the 15 complete-group deletions and the targeted scale-only deletion.
Source bytes restore exactly; all 86 tests then pass. The
[updated task-pattern outputs](evidence/rework-r1/acceptance-v2/summary.json) also
pass. The original 82/85-test and 15-mutant evidence remains historical evidence,
not a claim about the extended suite. No production, checker or probe behaviour
changed for R1, and every authoritative sweep source fingerprint still matches.
Unknown contrast remains explicit; only a rendered UI check in T52 can establish it.
