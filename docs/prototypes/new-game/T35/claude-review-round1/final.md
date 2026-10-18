T35 review (Claude Sonnet High)
approve after named fixes

DW1: ran `npx vitest run tests/core/geographic-board.test.ts` → 1 file, 12/12 tests passed in 11.9s.
DW2: ran `node docs/prototypes/new-game/T35/sweep.mjs` once → 100/100 successes, `failingSeeds=[]`, `invalidSeeds=[]`, `targetMet=true`. The maximum was 36 of 50 attempts. Route counts were 14 on 13 seeds and 15 on 87 seeds, all within 14–18. A 1-attempt budget exhausted on 87 seeds, and the zero-budget case was checked. All 100 per-seed hash sets (result, map, geography, failures, board RNG, deal, game RNG, bounded) equal the producer's retained `sweep-Ym4STu`, extracted from the verified final bundle.
DW3: ran `npm test` → 6 harness tests plus 46 Vitest files, 636/636 passed.
DW3: ran `npm run build` → `tsc` for `src/core` and for the app, then `vite build`, all succeeded.
DW3: ran `python3 docs/prototypes/new-game/T35/run-browser.py rev --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts` → 24/24 passed sequentially in 2.1 min, exit 0, including the 1920x1080 entry-route case. Evidence is in `docs/prototypes/new-game/T35/evidence/rev-c0lp25nq`.

Where I worked:
- **Tree:** worktree at HEAD `caed7b2938936673ddc156c79a2716b4f1454d8f`, base `3b57a08dd8b4ee641a47ec3b3809cc0d17310e55`. The 61 changed files match `inventory.json`, and every one is within the task's Owns list.
- **Hashes:** the nine hash-listed source and test files match `implementation.json`.
- **Evidence bundles:** `verify-evidence.py` confirmed the initial bundle (105 members), the final bundle (584 members) and the parent-preflight bundle (897 members). The parent verifies the full archives independently.
- **Mutations:** I applied each mutation in place and restored the saved bytes afterwards. `git status` shows no tracked changes; my only additions are untracked `rev-*` and `sweep-*` evidence directories.
  - Dropping the entrance term from the bonus formula fails 6 tests.
  - Setting `seaLanes:[]` fails 7 tests.
  - Restarting the RNG in `createGeographicGame` fails the continuation test.
  - Removing the geographic dispatch in `deserializeVersionedMatch` fails the replay test.
  - Skipping the rules check for geographic saves, and skipping the action-schema check for them, both leave 13/13 passing (see R1).
- **Option probe:** I ran a scratch probe of 72 `createGeographicGame` variants (seeds 0–11, humanShare −4, 0 and 4, armies 1-2 and 1-4) with the default four seats. All succeeded with 46 countries and 9 islands, and I deleted the probe afterwards. Seat counts other than four were not probed.
- **Save refusals:** a probe confirmed a geographic save with the wrong rules, wrong action schema or an extra key is refused at runtime. Only the version-999 refusal is asserted by the PR's tests.
- **Retained browser failure:** the producer's 23/24 run failed at `entry.spec.ts:85` (`#generated-prototype` not found within 5000ms, 1920x1080 only). `git diff` shows no change under `src/ui` or `src/main.ts`, and that route does not import the new modules. My unchanged sequential run passed 24/24, so I could not reproduce it. The cause is unproven, which matches the producer's own statement.

Findings:

**R1 (blocking, `src/core/match-save.ts:95-110`, `tests/core/geographic-board.test.ts:134`).** Save-identity dispatch for `geographic/1` is only half-tested.
- `supportedIdentity` has a geographic-specific branch that requires `victory/1` and action schema 2. The README claims unknown combinations are refused. The only refusal test sets `boardGenerator.version = 999`.
- I confirmed by mutation that these two weakenings still pass 13/13 tests:
  - skipping the `rules` check when `expected===GEOGRAPHIC_MATCH_IDENTITY` (line 101)
  - skipping the `actionSchemaVersion` check for geographic (line 106)
- A geographic save with `rules=malpaco/1` or schema 1 would then load against the wrong replay semantics, which is the save-identity dispatch the brief asks to be checked.
- Fix: add refusal assertions for `geographic/1` with `malpaco/1` rules, with action schema 1, and with an extra identity key. Also assert that `fixed-reference/1` still loads, so the historical identity is pinned next to the new one.

**R2 (not blocking, `src/core/geographic-game.ts:25`).** The `if(!created.ok)` branch, a deal failure after accepted geography, is reached by no input I tried: the 100-seed sweep and my 72 option variants. It also loses the retry semantics that the 50-attempt budget gives geography. It is an inherited setup failure mode, so I rated it non-blocking.

**R3 (not blocking, `src/core/geographic-game.ts:20`).** The message says "Retry with another seed or a larger budget", but `generateIslandGeographyWithRng` clamps the budget to 50. A caller already at the cap cannot raise it.

**R4 (not blocking, `tests/core/geographic-board.test.ts:1`).** The stale header "Proposal: install at …; no producer is included" is now wrong. `acceptance.mjs` and `sweep.mjs` carry deliberate "Proposal/UNEXECUTED" headers, which the brief accepts.

**R5 (not blocking, `docs/prototypes/new-game/T35/implementation.json`).** The retained 23/24 browser failure is recorded honestly and the cause is unproven. My independent rerun passed 24/24.

Checks that came out clean:
- **Randomness:** there is no wall-clock or unseeded randomness in the new rule code, and `generateIslandGeography` is behaviour-identical through the new `WithRng` seam.
- **Geometry and constants:** all geometry is checked as safe integers (a fractional-coordinate test exists). The bonus formula is cited to C-BON-02 and the T24 contract, and `acceptance.mjs` reads the map's actual `borders`, `seaLanes` and `bonus` rather than recomputing them.
- **Budget and RNG:** exhaustion returns no `map` or `geography` and keeps `failures` and `rng`. The 50-attempt budget is shared, not 50x50. The RNG object continues through geography and the deal; the continuation test and the mutation both confirm it.
- **Existing tests:** no existing assertion was changed (the diff only adds files and lines). `RUN-NOTES.md` additions are append-only (0 deleted lines), `docs/spike.md` was updated and no UI or default changed.

FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T35/README.md
FILE: docs/prototypes/new-game/T35/acceptance.mjs
FILE: docs/prototypes/new-game/T35/archive-evidence.py
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/originals.tar.gz.part01
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/originals.tar.gz.part02
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/originals.tar.gz.part03
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/originals.tar.gz.part04
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/originals.tar.gz.part05
FILE: docs/prototypes/new-game/T35/evidence/implementation-initial-retained-ez45n7zq/originals.tar.gz.part01
FILE: docs/prototypes/new-game/T35/evidence/parent-preflight-20261018/parent-preflight.tar.gz.part01
FILE: docs/prototypes/new-game/T35/evidence/parent-preflight-20261018/parent-preflight.tar.gz.part02
FILE: docs/prototypes/new-game/T35/evidence/parent-preflight-20261018/parent-preflight.tar.gz.part03
FILE: docs/prototypes/new-game/T35/feasibility.mjs
FILE: docs/prototypes/new-game/T35/implementation.json
FILE: docs/prototypes/new-game/T35/run-browser.py
FILE: docs/prototypes/new-game/T35/run-command.py
FILE: docs/prototypes/new-game/T35/smoke.mjs
FILE: docs/prototypes/new-game/T35/sweep.mjs
FILE: docs/prototypes/new-game/T35/verify-evidence.py
FILE: docs/spike.md
FILE: src/core/geographic-board.ts
FILE: src/core/geographic-game.ts
FILE: src/core/index.ts
FILE: src/core/island-geography.ts
FILE: src/core/match-save.ts
FILE: tests/core/geographic-board.test.ts
FILE: tests/core/geographic-game.test.ts
EVIDENCE: docs/prototypes/new-game/T35/evidence/

For the multipart parts, I checked the receipt part hashes and the concatenated archive hash. I did not read the archived source snapshots, and the parent verifies every archive member separately. The generated `evidence/` directories were audited through their manifests, receipts and sampled outcomes: the initial and final bundles, the parent-preflight receipt, `current-parent-*`, `feasibility-2YSJDZ`, `parent-integration-8fb51e5` and `parent-preparation-20261017`.

SCOPE: complete

Final pass done

approve after named fixes