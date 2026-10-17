T34 review (Claude Sonnet High)
rework
DW1: ran `npx vitest run tests/core/island-geography.test.ts` → 14/14 passed (37.9 s). The seeds0..31 corpus puts the 10-country island in the middle third and outside it. At least one island's aspect ratio varies by 5% or more. Mutating the source to drop layout, warp or failure recording fails the matching tests (details under R1).
DW2: ran `node docs/prototypes/new-game/T34/sweep.mjs` → 100/100 valid, `targetMet:true`. Output is `evidence/sweep-AHN9CY`.
- Replay hashes are identical, with 100 geometry hashes and 4 land graphs.
- The largest island sits in the middle third in 38 seeds and outside it in 62.
- Failure counts: labels 926, attachment 584, water 120, degree 41, traceability 11.
- Every seed's result and failures are retained; none are discarded.
- Per-island aspect max/min runs from 1.215 to 1.401, matching the receipt.
DW3: ran `npm test` → 607 Vitest passed plus 6 harness tests, exit 0. Ran `npm run build` → exit 0. Ran `python3 docs/prototypes/new-game/T34/run-browser.py reviewer-current --suites reference-complete-game,reference-game,versioned-match,entry` → 24 passed, exit 0, `sourcesUnchangedDuringRun:true` (`evidence/reviewer-current-4fnisiwu`). I did not re-run the author's negative-before/positive-after record. I ran my own source mutations, and every mutation was restored byte-exact (`git diff` is empty).

Where I worked
- Worktree HEAD is a842967717584549e58b10d37869c1fe4dd461d6. The diff against base 7ce8911 is 957 files, of which only 4 are outside T34: `RUN-NOTES.md`, `docs/spike.md`, `src/core/island-geography.ts` and `tests/core/island-geography.test.ts`. T24 and T62 are untouched. All 40 frozen T24/T62 copies under `evidence/feasibility-*/sources` are byte-equal to the live files.
- `prepare-witness.mjs` reproduces `witness.json` byte-exactly from T64/board.json, whose sha256 matches `witness-provenance.json`.
- I ran seeds 100..699 through the independent oracle (scratch script `.scratch/wide.mjs`). 599 were valid, 0 exports were invalid, and seed 398 exhausted (the maximum was 44 attempts). Together with seeds 0..99 that is 699 valid out of 700.
- The rule code has no clock, no random source and no order-dependent iteration. `rng.shuffled` and Map/Set insertion order are deterministic.

Findings

**R1 — BLOCKING** (`src/core/island-geography.ts:181,185,189,192,199,249`; `tests/core/island-geography.test.ts`). Acceptance survives deleting protected behaviour. I mutated the real source and ran the real acceptance commands.

| Guard removed | Line | Result |
|---|---|---|
| The three `cells:` guards (non-simple polygon, outside frame, island touch/overlap) | 189, 199 | DW1: 14/14 pass. DW2 sweep with these plus the next two guards removed: `targetMet:true`, 100/100. |
| `crossings: duplicate reserved country pair` | 181 | Same as above. |
| `crossings: insufficient bonus headroom` | 185 | Same as above. |
| The `degree:` guard (`borders<2`, `borders>4`, `+lanes>5`, `lanes>2`) | 192 | DW1 passes 14/14 and the DW2 sweep passes 100/100 (`evidence/sweep-2CjENm`). The 41 degree rejections in the real sweep all co-occur with other failure classes. |
| `Math.max(0,…)` in the budget clamp | 249 | DW1: 14/14 pass. A negative budget would return a negative `attempts`. |
| `Math.floor(raw)` in the budget clamp | 249 | DW1: 14/14 pass. A fractional budget would return a fractional `attempts`. |

- **What is missing:** no input in 700 seeds ever triggers the `cells:`, duplicate-pair or bonus-headroom branches, and no mocked witness exercises them. The task protects "connected valid cells, no interior overlaps/gaps", unique crossings, land-degree headroom and bounded exhaustion.
- **Why it matters:** the only thing that currently catches these is the oracle, and only if the constructor ever exports such a result. The constructor's own refusal of those candidates is unprotected.
- **Fix:** add a mocked-witness test per guard, in the style of the existing fortress test at `tests/core/island-geography.test.ts:83`. Each test should assert the exact constraint string in the failure records. Also test negative and fractional budgets.
- **Protected, for the record:** these mutations were caught.
  - Omitting layout fails the middle-third test.
  - Omitting warp fails the aspect test.
  - Omitting the failure push fails 10 tests.
  - Omitting flip fails the topology test.
  - Omitting the label-hit guard fails 3 tests.
  - Omitting the fortress/concentration guards fails the mock test.
  - Omitting the water/attachment corridor guards fails 6 tests.
  - Restricting layout to plans 0 and 1 fails the middle-third test, so plan 2 is required.

**R2 — non-blocking (follow-up)**
- `family-provenance.json` and CONTRACT.md name the [designed] plan translations (306/−303, 26/155, −75/−167) but say only "reviewed T24/T62/T63 and T64/T65 geometry studies". They do not say what was searched. The in-code comment "Approved 14-route plan" (`src/core/island-geography.ts:242`) names no approver. The 48px, 24px and three-pass values do trace to retained probes (`breadth-amplitude-m02i9_al`, `breadth-joint-r8ghb3fn`).
- Likelihood is moderate that the owner wants the search described, but the numbers are retained and traceable.

**R3 — non-blocking (owner judgement).**
- The gallery PNG (`family-gallery-pi361ktz`) shows the same nine silhouettes and internal seams. They are stretched, moved between two swapped slots, and flipped once per island. The seed-3, 6 and 10 boards look near-identical.
- The Done-when measures pass literally, and per-island aspect ratios are only weakly correlated (median −0.11 across 100 seeds), so this is not one global stretch.
- The PR says it is not owner visual approval. The owner should judge whether this meets "broader shapes".

**R4 — non-blocking.**
- `src/core/island-geography.ts:22` imports `docs/prototypes/new-game/T34/witness.json`. Production core depends on a prototype docs path. It is allowed under Owns, but pruning docs breaks core.

**R5 — non-blocking.**
- `review-tools/retention-runner.mjs` (15.8 KB) is a modified copy of `tools/harness/review.mjs`. It imports `./lib/*`, which is absent, so it cannot run. It also contains `git worktree remove --force` and `fs.rmSync` on a T34-specific path. `review-tools/reviewer150.md` is an agent definition copy. The task did not ask for either, and I suggest dropping them or labelling them inert.
- `evidence/breadth-joint-r8ghb3fn/gallery-metrics.py` hard-codes `/home/diego/projects/malpaco/.cache/t34-work` paths.
- Several RUN-NOTES.md entries have their spaces stripped, for example "keepsmapgenerationbeforecards". The file is append-only as required.

**R6 — informational.**
- The sweep's target-met gate holds, but seed 398 exhausts 50 attempts. That is 1 in 700 seeds, which is within the T24 99% target.

Coverage
FILE: src/core/island-geography.ts
FILE: tests/core/island-geography.test.ts
FILE: RUN-NOTES.md
FILE: docs/spike.md
FILE: docs/prototypes/new-game/T34/acceptance.mjs
FILE: docs/prototypes/new-game/T34/sweep.mjs
FILE: docs/prototypes/new-game/T34/run-browser.py
FILE: docs/prototypes/new-game/T34/run-command.py
FILE: docs/prototypes/new-game/T34/r2-controls.py
FILE: docs/prototypes/new-game/T34/r1-controls.py
FILE: docs/prototypes/new-game/T34/r2-final.py
FILE: docs/prototypes/new-game/T34/r2-preflight.py
FILE: docs/prototypes/new-game/T34/controls.py
FILE: docs/prototypes/new-game/T34/preflight.py
FILE: docs/prototypes/new-game/T34/full-preflight.py
FILE: docs/prototypes/new-game/T34/prepare-witness.mjs
FILE: docs/prototypes/new-game/T34/verify-evidence.py
FILE: docs/prototypes/new-game/T34/archive-captures.py
FILE: docs/prototypes/new-game/T34/archive-evidence.py
FILE: docs/prototypes/new-game/T34/family-smoke.mjs
FILE: docs/prototypes/new-game/T34/family-smoke.py
FILE: docs/prototypes/new-game/T34/family-gallery.py
FILE: docs/prototypes/new-game/T34/feasibility-smoke.mjs
FILE: docs/prototypes/new-game/T34/feasibility-wide.mjs
FILE: docs/prototypes/new-game/T34/flip-probe.mjs
FILE: docs/prototypes/new-game/T34/CONTRACT.md
FILE: docs/prototypes/new-game/T34/README.md
FILE: docs/prototypes/new-game/T34/witness-provenance.json
FILE: docs/prototypes/new-game/T34/family-provenance.json
FILE: docs/prototypes/new-game/T34/witness.json
FILE: docs/prototypes/new-game/T34/family-candidate.ts

I read `family-candidate.ts` only as a diff against the installed core. I read `RUN-NOTES.md` with lines cut at 900 characters.

EVIDENCE: docs/prototypes/new-game/T34/evidence/sweep-AHN9CY/ (fresh run, plus my own mutation sweeps in `sweep-GwTA7u` and `sweep-2CjENm`)
EVIDENCE: docs/prototypes/new-game/T34/evidence/reviewer-current-4fnisiwu/
EVIDENCE: docs/prototypes/new-game/T34/evidence/family-gallery-pi361ktz/ (PNG viewed)
EVIDENCE: docs/prototypes/new-game/T34/evidence/feasibility-QiwWlL/ and feasibility-zjVwJN/ (frozen T24/T62 copies compared byte-equal to live; `flip-probe-Tg7Pmr/flip-probe.mjs` is byte-equal to `flip-probe.mjs`)

SCOPE: incomplete
UNCOVERED:
- `docs/prototypes/new-game/T34/candidate.ts`: historical first-family copy, only grepped for Date/Math.random.
- `docs/prototypes/new-game/T34/review-tools/retention-runner.mjs` and `reviewer150.md`: read in part only.
- The scripts under `evidence/breadth-amplitude-m02i9_al`, `evidence/breadth-joint-r8ghb3fn` and `evidence/clock-fix-49d9ipkk`: first about 40 lines at 260 columns only.
- The 749 `evidence/` files, 172 `preflight/` files, `artifacts.json` and `file-inventory.json`: not individually audited. I checked only that the inventory's 75 paths match the changed executable files exactly.

Final pass done
rework