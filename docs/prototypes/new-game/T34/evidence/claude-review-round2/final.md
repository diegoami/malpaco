T34 review (Claude Sonnet Medium)
rework

**Where I worked**
- Worktree HEAD is `d59e33fd5e4d3e759fdc82cceeb0945305644d61`. The diff against base `7ce8911` is the PR's.
- `git diff a842967 HEAD -- src` is empty, so `src/core/island-geography.ts` is byte-identical to the previously reviewed core.
- T24, T62 and T63 are untouched against the base.
- Since `a842967`, the only executable or test changes are `tests/core/island-geography.test.ts` (+53 lines, appended after the original tests), `verify-evidence.py` (one line), and the new `r3-controls.py` and `r3-integrity.py`. I also saw `CONTRACT.md`, `README.md`, `family-provenance.json`, `review-tools/README.md`, `RUN-NOTES.md`, `artifacts.json` and `file-inventory.json` change. `docs/spike.md` is unchanged since `a842967`.
- Evidence checks:
  - `file-inventory.json` hashes match the files (0 mismatches).
  - All 1031 `artifacts.json` hashes match, with none missing.
  - `verify-evidence.py` ran and verified 117 reports (`evidence/integrity-mokjmps2`).
  - The 40 frozen T24/T62/T64/T65 copies in `evidence/feasibility-QiwWlL` and `feasibility-zjVwJN` are byte-equal to the live files.
  - `feasibility-wide.mjs`, `feasibility-smoke.mjs` and `flip-probe.mjs` each have a byte-equal retained copy.
- Scratch lives in `.scratch/` in my worktree. Each mutation was restored byte-exact (`cmp` against the saved copy, `git status` clean for `src`).

**DW lines**
DW1: ran `npx vitest run tests/core/island-geography.test.ts` → 22/22 passed, exit 0. The 8 added tests (6 refusals, negative budget, fractional budget) all pass.
DW2: ran `node docs/prototypes/new-game/T34/sweep.mjs` → exit 0, 100/100 valid, `targetMet:true`.
- Output is `evidence/sweep-IFkC7M`: 100 geometry hashes, 4 topology hashes, middle band 38 and outer band 62.
- Failure counts: labels 926, attachment 584, water 120, degree 41, traceability 11. This matches the previous sweep exactly, so replay is stable.
DW3: ran `npm test` → 42 files, 615 Vitest passed, exit 0. Ran `npm run build` → exit 0. Ran `python3 docs/prototypes/new-game/T34/run-browser.py reviewer-r3 --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts` → 24 passed, exit 0 (`evidence/reviewer-r3-8r7dour4`). I did not run `r3-controls.py`, because it needs no re-run of what I mutated myself.

**Mutation results on the new tests**
I changed the real core in place and ran the focused test file each time.

| Guard removed | Result |
|---|---|
| `cells: non-simple polygon` | caught by the new non-simple test |
| `cells: outside frame` | caught |
| `cells: islands touch/overlap` | caught |
| `crossings: duplicate reserved country pair` | caught |
| `crossings: insufficient bonus headroom` | caught |
| `p.borders.length<2` | caught |
| `Math.max(0,…)` in the budget clamp | caught |
| `Math.floor(raw)` in the budget clamp | caught |
| `Math.min(MAX_ATTEMPTS,…)` cap | caught |
| **`p.borders.length>4`** | **22/22 pass, survives** |
| **`p.borders.length+lanes>5`** | **22/22 pass, survives** |
| **`lanes>2`** | **22/22 pass, survives** |

**Findings**

**R1 — BLOCKING** (`src/core/island-geography.ts:192`, `tests/core/island-geography.test.ts` degree case). Three of the four sub-conditions of the land-degree headroom guard are unprotected.
- The guard is `p.borders.length<2||p.borders.length>4||p.borders.length+lanes>5||lanes>2`. The only degree test uses a detached cell with zero neighbours, which exercises only `borders<2`.
- Deleting `borders>4`, `borders+lanes>5` or `lanes>2` leaves the 22 focused tests green.
- I also removed all three together and ran the real DW2 sweep. It still exits 0 with `targetMet:true`, 100/100 valid, and the same 100 geometry hashes and 4 topology hashes.
- No test input or sweep seed reaches those branches. The task names "contract land-degree headroom" as protected, and the constructor's refusal of an over-degree or over-lane candidate can be deleted without any acceptance failing.
- This is the same defect class as round-1 R1, fixed only for the zero-neighbour case.
- `r3-controls.py` removes the whole `degree:` `fail.add` line, so it cannot show this gap.
- Fix: add one mocked-witness case per sub-condition, each asserting `degree: insufficient entrance headroom` in every failure record.
  - Five or more shared-boundary neighbours.
  - Four neighbours plus two lanes, which gives more than five.
  - Three reserved lanes on one country.
- Extend `r3-controls.py` to remove each sub-condition separately.

**R2 — non-blocking.** The README says `artifacts.json` indexes 1025 hashes. The file holds 1031 entries, all matching. This is a count in the docs only.

**R3 — non-blocking (owner judgement, unchanged).** The earlier gallery observation still stands: the nine silhouettes are warped and swapped variants of one witness. The DW1 breadth measures pass literally. This round does not change that.

**R4 — non-blocking, resolved.** The round-1 documentation items are fixed as narrow documentation. `family-provenance.json` and `CONTRACT.md` now say what the manual placement search covered. The "Approved 14-route plan" comment is explained as a locally validated plan, not a separate approval. `review-tools/README.md` labels the runner and agent snapshots inert. Both snapshot files are byte-identical to `a842967`. The core still imports `witness.json` from the docs path, which is documented.

**SCOPE: incomplete**
UNCOVERED:
- I did not read `r3-controls.py` past about 500 columns per line, `run-browser.py` past about 200 columns per line, or the clock-fix wrapper past about 700 columns per line.
- I did not read `candidate.ts` in full. I diffed it against the live core, and it is not imported by anything outside the evidence and inventory files.
- I did not read `retention-runner.mjs` or `reviewer150.md` in full. I grepped them, and both are byte-identical to `a842967`.
- I did not read `RUN-NOTES.md` beyond the diff, which I saw with lines cut at 600 characters.
- I did not individually read the other root scripts, which are unchanged since `a842967`: `acceptance.mjs`, `sweep.mjs`, `run-command.py`, `r1-controls.py`, `r2-controls.py`, `r2-final.py`, `r2-preflight.py`, `controls.py`, `preflight.py`, `full-preflight.py`, `prepare-witness.mjs`, `archive-captures.py`, `archive-evidence.py`, `family-smoke.mjs`, `family-smoke.py`, `family-gallery.py`, `family-candidate.ts`. I ran `acceptance.mjs`, `sweep.mjs` and `run-browser.py` by executing them.
- I did not read the three gallery HTML files. I only grepped them for scripts and links and found none.
- I did not read the remaining scripts under `evidence/` and `preflight/`.

FILE: src/core/island-geography.ts
FILE: tests/core/island-geography.test.ts
FILE: docs/prototypes/new-game/T34/verify-evidence.py
FILE: docs/prototypes/new-game/T34/r3-integrity.py
FILE: docs/prototypes/new-game/T34/feasibility-smoke.mjs
FILE: docs/prototypes/new-game/T34/feasibility-wide.mjs
FILE: docs/prototypes/new-game/T34/flip-probe.mjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-amplitude-m02i9_al/run-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-amplitude-m02i9_al/smoke.mjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/run-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/smoke.mjs
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/candidate-sweep.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/global-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/global-label-probe.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/gallery-metrics.py
FILE: docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn/render-gallery.cjs
EVIDENCE: docs/prototypes/new-game/T34/

Final pass done
rework