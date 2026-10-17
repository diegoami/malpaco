T34 review (Claude Sonnet High)
approve after named fixes

DW1: ran `npx vitest run tests/core/island-geography.test.ts` → 25/25 passed, exit 0 (33 s). The seeds0..31 corpus puts the 10-country island both inside and outside the middle third, and one island's aspect ratio varies by ≥5%.
DW2: ran `node docs/prototypes/new-game/T34/sweep.mjs` → exit 0, `targetMet:true`, 100/100 valid, output `evidence/sweep-o3L8Go`.
- It reports 100 geometry hashes and 4 topology hashes.
- The 10-country island sits in the middle third for 38 seeds and outside it for 62.
- Failure counts are labels 926, attachment 584, water 120, degree 41, traceability 11. They are identical to the earlier rounds, so replay is stable.
- Per-island aspect ranges are retained in the report.
DW3: ran `npm test` → 42 files, 618 Vitest passed plus 6 harness tests, exit 0. Ran `npm run build` → exit 0. Ran `python3 docs/prototypes/new-game/T34/run-browser.py reviewer-r4 --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts` → 24 passed, exit 0, `sourcesUnchangedDuringRun:true` (`evidence/reviewer-r4-adb07wn6`). I did not re-run the author's negative-before/positive-after records; I ran my own mutations instead.

Where I worked
- HEAD is `05780526ba23cbbc8268c3f7975db145e179ff67`, a clean worktree. `git diff a842967 HEAD -- src` is empty, and `src/core/island-geography.ts` still has sha256 `ddf63b0a…`, byte-identical to the previously reviewed core.
- Since the last review, the executable or test changes are `tests/core/island-geography.test.ts` (+33 lines, a pure append; the diff against `a842967` has 0 removed lines) and the new `r4-controls.py`. The rest is documentation and receipts: RUN-NOTES, README, `artifacts.json` and `file-inventory.json`.
- All 105 manifest paths match their sha256 and byte size, including every alias, and all 9 packet hashes match. I read every numbered packet in full. The 3 HTML galleries were parsed structurally and show no scripts, events or URLs. Element counts match the renderers: 46 polygons per board, 14 or 15 routes per board, and 9 and 6 articles. I viewed both gallery PNGs.
- I read the full RUN-NOTES diff (append-only, 46 added lines), the docs/spike diff, README, CONTRACT, `family-provenance.json` and `review-tools/README.md`.
- `file-inventory.json` has 78 entries with 0 hash mismatches. `artifacts.json` has 1070 entries, 0 missing and 0 mismatched. `r4-controls` retained evidence shows the core restored to `ddf63b0a` and all three omission runs with exit 1.

New degree tests
- The three cases use overlapping-triangle cliques, so adjacency is derived and never mocked. They set the source island to one country so repair cannot move the excess lanes.
- Each case asserts the exact degree refusal in every failure record. Each also asserts that the other two upper subconditions are false in those records, so the three clauses are isolated.
- Mutations ran in the real core with targeted `-t` patterns and exact restoration in `finally` (`git status` clean for `src` and `tests`).

| Mutation | Result |
|---|---|
| Omit `\|\|p.borders.length>4` | `refuses more than four land neighbours…` fails |
| Omit `\|\|p.borders.length+lanes>5` | `…four land neighbours plus two lanes…` fails |
| Omit `\|\|lanes>2` | `…more than two reserved lanes…` fails |
| `>4` → `>5`, `+lanes>5` → `>6`, `lanes>2` → `>3` | each fails its own test, so the fixtures sit exactly on the boundary |
| Omit all three | exactly the 3 new tests fail |

Findings

R1 (non-blocking, follow-up): `src/core/island-geography.ts:192` (the `degree:` guard); tests at `tests/core/island-geography.test.ts:133-136`.
- The boundary mutation `p.borders.length<2` → `<1` survives the focused file. Only the zero-neighbour fixture exercises the lower bound.
- I measured reachability over seeds 0..99: of 635 rejected candidates, none had a country with exactly one land neighbour, and no export has fewer than two. No input in the family reaches that boundary, and the independent oracle still rejects it. Deleting the whole lower clause is caught.
- Likelihood of a real bypass is low. A one-neighbour fixture would close it.

R2 (non-blocking, owner judgement, unchanged from earlier rounds): the gallery shows the same nine silhouettes warped and swapped across three placement plans. The DW1 breadth measures pass literally, and the PR does not claim owner visual approval.

R3 (non-blocking): the README says `artifacts.json` has 1025 hashes and the file holds 1070, all matching.

No blocking findings. All three new degree subconditions are protected against omission and off-by-one, and nothing else changed in runtime, assertions or constraints.

EVIDENCE for my runs is under the T34 evidence directory: `sweep-o3L8Go`, `reviewer-r4-adb07wn6`. My scratch files are in `.scratch/` in my worktree.

SCOPE: complete
FILE: src/core/island-geography.ts
FILE: tests/core/island-geography.test.ts
FILE: RUN-NOTES.md
FILE: docs/spike.md
FILE: docs/prototypes/new-game/T34/acceptance.mjs
FILE: docs/prototypes/new-game/T34/archive-captures.py
FILE: docs/prototypes/new-game/T34/archive-evidence.py
FILE: docs/prototypes/new-game/T34/candidate.ts
FILE: docs/prototypes/new-game/T34/controls.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-amplitude-m02i9_al/run-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-amplitude-m02i9_al/smoke.mjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/candidate-sweep.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/gallery-metrics.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/gallery-normalized.html
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/gallery.html
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/global-label-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/global-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/render-gallery.cjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/run-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/smoke.mjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/sweep-vNoeqN/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/clock-fix-49d9ipkk/original-browser-wrapper.py
FILE: docs/prototypes/new-game/T34/evidence/family-gallery-pi361ktz/gallery-normalized.html
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/contract.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/contract.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/existing.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/geometry-preflight.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/geometry.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/graph-fixture.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/graph-preflight.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/mutations.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/parameters.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T24/witness.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T34/feasibility-wide.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T62/contract.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T62/contract.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T62/guards.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T62/parameters.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T62/probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T64/layout.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/sources/docs/prototypes/new-game/T65/borders.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/contract.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/contract.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/existing.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/geometry-preflight.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/geometry.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/graph-fixture.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/graph-preflight.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/mutations.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/parameters.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T24/witness.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T34/feasibility-smoke.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T62/contract.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T62/contract.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T62/guards.test.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T62/parameters.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T62/probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T64/layout.mjs
FILE: docs/prototypes/new-game/T34/evidence/feasibility-zjVwJN/sources/docs/prototypes/new-game/T65/borders.mjs
FILE: docs/prototypes/new-game/T34/evidence/flip-probe-Tg7Pmr/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/flip-probe-Tg7Pmr/flip-probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/r2-final-browser-u8o84m6w/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/review-final/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/review-final/measured/evidence/review-compat-g7t7nh3b/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/review-final/measured/evidence/sweep-GvYjai/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/review-final/measured/evidence/sweep-auuZI2/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/review-final/measured/evidence/sweep-xlJwDP/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-1YescW/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-CiLOth/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-JPXDhX/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-PIcr8V/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-QeKZMp/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-XOJBkB/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-XztrJy/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-Y38ssy/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-e5OWlr/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-t4EQcS/.gitignore
FILE: docs/prototypes/new-game/T34/evidence/sweep-xbdOqc/.gitignore
FILE: docs/prototypes/new-game/T34/family-candidate.ts
FILE: docs/prototypes/new-game/T34/family-gallery.py
FILE: docs/prototypes/new-game/T34/family-smoke.mjs
FILE: docs/prototypes/new-game/T34/family-smoke.py
FILE: docs/prototypes/new-game/T34/feasibility-smoke.mjs
FILE: docs/prototypes/new-game/T34/feasibility-wide.mjs
FILE: docs/prototypes/new-game/T34/flip-probe.mjs
FILE: docs/prototypes/new-game/T34/full-preflight.py
FILE: docs/prototypes/new-game/T34/preflight.py
FILE: docs/prototypes/new-game/T34/preflight/mock-browser-pvxo8iov/.gitignore
FILE: docs/prototypes/new-game/T34/preflight/mock-browser-q6skgbxc/.gitignore
FILE: docs/prototypes/new-game/T34/preflight/mock-r2-browser-k1rqqtwi/.gitignore
FILE: docs/prototypes/new-game/T34/prepare-witness.mjs
FILE: docs/prototypes/new-game/T34/r1-controls.py
FILE: docs/prototypes/new-game/T34/r2-controls.py
FILE: docs/prototypes/new-game/T34/r2-final.py
FILE: docs/prototypes/new-game/T34/r2-preflight.py
FILE: docs/prototypes/new-game/T34/r3-controls.py
FILE: docs/prototypes/new-game/T34/r3-integrity.py
FILE: docs/prototypes/new-game/T34/r4-controls.py
FILE: docs/prototypes/new-game/T34/review-tools/retention-runner.mjs
FILE: docs/prototypes/new-game/T34/run-browser.py
FILE: docs/prototypes/new-game/T34/run-command.py
FILE: docs/prototypes/new-game/T34/sweep.mjs
FILE: docs/prototypes/new-game/T34/verify-evidence.py
EVIDENCE: docs/prototypes/new-game/T34/

Final pass done
approve after named fixes