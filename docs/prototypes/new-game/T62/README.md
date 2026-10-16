# T62: proposed country attachment and route contract for A

This proposal replaces T24's facing-chain midpoint prescription **for dependent
work only after the owner approves this contract**. It does not change T24,
production, A's picture, graph or geometry. T60 A is the chosen visual direction;
that choice does not approve these numeric limits. T63 must wait for a decision.

The original malpaco [A fixture](../T60/evidence/build-LrdPTV/coast-first.json)
and [baseline](../T60/evidence/build-LrdPTV/baseline.json) are pinned directly,
without reading the mutable T60 study selector. The probe hashes both inputs,
all checker dependencies, its source and acceptance tests. Reproduction writes a
fresh directory and never repoints a selector or overwrites a measured report.

## Proposed criteria

All five new distances in [parameters.mjs](parameters.mjs) are **[designed]**.
They are conservative choices compatible with this A reference, not inferred
predecessor rules or established human recognition thresholds. Distances are CSS
pixels at the existing 800×540 compact viewport with 800×460 usable board;
the unchanged T24 scaling function applies to other coordinate frames.

| Group | Proposed acceptance | Rationale and conflict |
| --- | --- | --- |
| Attachment | Each endpoint lies on the intended country's boundary **and** island silhouette, with no other country containing or touching it. | Retains exact exposed, unique attachment using T24's 1e-6 board-unit geometry tolerance. Internal borders, interior points and shared coast junctions reject. No new 1px snapping allowance. |
| Attachment | At least **8px** from any competing country on the same island. | A's observed minimum is about 9.86px, baseline 27px. This reserves a measurable margin but explicitly accepts a smaller competitor margin than baseline. T60's 10px soft search preference was not a guarantee and would reject A. |
| Attachment | Reverse the first/last route segment and continue **12px** into the intended country. The entire open continuation must stay strictly inside, including the final point. | Extends T60's 12px sample into a full segment check. Prevents a coast direction that suggests another country, and a notch exit/re-entry hidden by a final sample. Does not draw a landing mark or establish recognition. |
| Water | Retain the complete T24 route/land intersection check. Additionally require **10px** from every unrelated island coastline along the whole polyline. | No land re-entry, boundary following or tangency is allowed, including source/destination. A's unrelated-coast minimum is about 64px; baseline about 1.5px. Endpoint islands are exempt only from the *extra* distance margin, never from no-land/no-touch checks. |
| Traceability | Direct distance between route endpoints is at least **20px**. | A has three approximately 24px routes; a 25px threshold would reject it. Baseline has approximately 5.8px spans. Direct span prevents a long loop disguising a tiny water gap. No universal lower gap follows from archaeology. |
| Traceability | Distance between every two route polylines is at least **10px**, including all endpoints and all shared-country pairs. | A's minimum is about 22px; baseline has six contacting pairs. No merge, crossing, shared port, endpoint crossing or near-parallel exception exists. Separate links of one country need separate ports. |
| Traceability | No zero-length segment, positive adjacent reversal or nonadjacent self-contact. | Prevents self-merges and loops that cross themselves; forward collinear subdivision and ordinary noncrossing bends remain valid. |
| Preserved | All **13** unaffected T24 categories run unchanged. | Counts, symmetry, connectivity, degree, cells, borders, crossings, bonus, fortress, concentration, remoteness, crowding and labels retain every existing rule and number. The legacy `intersections` category runs unchanged in `water`; only `coasts` is replaced by country attachment. |

The proposed 20/10/8px distances deliberately leave some slack below the one
chosen reference's observed minima; there is no optimization or perception
experiment selecting them. The 12px continuation preserves the earlier explicit
diagnostic distance. These values are separately reviewable owner decisions.
Route length, detour ratio, bends and full legacy errors remain reported without
inventing a maximum route length, bend budget or straight-only rule.

## Evidence, sources and limits

Run `node docs/prototypes/new-game/T62/probe.mjs`. Each retained report contains
every criterion's description, individual values, evaluated/pass/fail counts,
all four new group errors, all 15 legacy errors and the T60 route metrics for
both boards. Read the fresh report path printed by the command. A must pass the
proposal; the baseline is a comparison, not a required negative for each rule.

The source rationale was checked against local reviewed archaeology F022 and
the retained [T60 comparison and sources](../T60/README.md#sources-and-evidentiary-limits).
[F022 at commit d5932c2](https://github.com/diegoami/isle-wars-archaeology/blob/d5932c2cea7741e81012bd4619e55430aba81a37/findings/F022-pro-map-presentation.md#answers)
leaves midpoint placement, route construction and coast clearance unknown. Its
three selected approximate visible spans are not whole-board bounds and support
no universal gap or detour threshold. No predecessor files or geometry are
imported. T24's original [designed parameters](../T24/parameters.mjs) remain the
source for inherited graph, geometry, label, bonus and fairness constraints.
T61's projection correction permits A's cells without waiving real slits/overlaps.

The first retained [comparison](evidence/probe-eSYf7Z/summary.json) measured:

| Criterion | Baseline failures / checks | A failures / checks |
| --- | ---: | ---: |
| Unique exposed attachment | 0 / 30 | 0 / 30 |
| 8px competing-country margin | 0 / 30 | 0 / 30 |
| Whole 12px inward continuation | 2 / 30 | 0 / 30 |
| Legacy route/land clearance | 0 / 15 | 0 / 15 |
| 10px unrelated-coast margin | 1 / 15 | 0 / 15 |
| 20px direct water span | 1 / 15 | 0 / 15 |
| Self-tracing exclusions | 0 / 15 | 0 / 15 |
| 10px separation of all route pairs | 6 / 105 | 0 / 105 |
| Unaffected legacy categories | 0 / 13 | 0 / 13 |
| Old midpoint prescription, disclosed conflict | 0 / 30 | 30 / 30 |

The first report includes snapshots of its precise checker/probe sources;
subsequent source/test/document changes have new fingerprints and fresh runs.

There is one reference, not a generator or success-rate measurement. The existing
99% within 50 attempts objective stays unproven; this proposal does not change it.
Geometric attachment, distance and isolation are enforceable proxies. They cannot
prove player comprehension, aesthetic quality or the feasibility of all future
graphs. The owner retains visual judgment and may reject the thresholds, require
stronger margins with a revised reference, or request a separate user study.

## Verification and preservation

Parent [contract.test.mjs](contract.test.mjs) remains byte-identical. Additional
[guards](guards.test.mjs) isolate exact threshold edges, inward notches, hidden
short gaps, shared-country separation, self-crossing/reversal and legacy
delegation. Meaningful mutants for each inherited category compare the entire
prefixed error list with the original checker, so connectivity errors cannot
mask deletion of fortress or concentration. No assertion is weakened.

The probe and validation scripts save fresh outputs, source hashes and original
test logs inside this directory. Historical reports retain their source hashes;
later source changes require a fresh report. Parent preflight files and all T24,
T60 and T61 evidence stay untouched. Full-branch `git diff --check` must pass.

`python3 docs/prototypes/new-game/T62/audit.py` deletes guards reversibly, runs
both T62 suites, restores saved bytes in `finally`, and confirms every added test
fails under at least one relevant deletion. It separately deletes all 13 legacy
delegations, each new margin and each scaling factor. The retained mutant source
edits and exact hashes permit reproduction without editing inherited files.
Run this alone: it temporarily mutates T62's checker during its tests.

`python3 docs/prototypes/new-game/T62/validate.py` runs the exact Done-when
commands, both T62 suites, T24 and T61 regressions, both whitespace checks, and an
empty-diff assertion for immutable parent/legacy paths. All terminal output is
archived losslessly with exact per-member hashes, avoiding trailing-whitespace
changes to originals. `report.json` records command tails and the fresh probe.
