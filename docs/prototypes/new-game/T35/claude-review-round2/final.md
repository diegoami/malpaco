T35 review (Claude Sonnet Medium)
approve

DW1: ran `npx vitest run tests/core/geographic-board.test.ts tests/core/geographic-match-identity.test.ts` → 2 files, 18/18 passed. That is the 12 board cases plus the 6 new identity cases.
DW2: ran `node docs/prototypes/new-game/T35/sweep.mjs` once → 100/100 successes, `failingSeeds=[]`, `invalidSeeds=[]`, `targetMet=true`. The maximum was 36 of 50 attempts. 87 seeds exhaust a one-attempt budget, and each seed record carries board, deal, RNG and failure hashes. The output is in `docs/prototypes/new-game/T35/evidence/sweep-rP9QWw`.
DW3: ran `npm test` → 47 Vitest files, 642/642 passed (the six harness tests ran first). Then `npm run build` → exit 0 (tsc and vite build). Then `python3 docs/prototypes/new-game/T35/run-browser.py rev2 --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts` → 24/24 passed sequentially in 1.9 min, exit 0, including both 1920x1080 entry cases. The output is in `docs/prototypes/new-game/T35/evidence/rev2-d7bfdxql`.

Where I worked:
- **Tree:** worktree `160-review-440d7b35` at HEAD `c55fc55f9d37eb55e54cc47cc425a3e25da6d1de`, diffed against PR base `0c9d7adc`. The local diff has 96 files. All 26 non-evidence changed paths are within the task's Owns list.
- **Rework check:**
  - `69b3ead` changes only the `src/core/geographic-game.ts` message to "Retry with another seed." The budget clamp (50) is unchanged.
  - `5a9fb93` adds `tests/core/geographic-match-identity.test.ts`.
  - The new file has 5 refusal cases (wrong rules id, wrong rules version, wrong action schema, extra `boardGenerator` key, extra `rules` key) and one pinned fixed-reference replay case.
  - The replay case uses the `pinned('placement')` fixture. It checks that the loaded identity equals `REFERENCE_MATCH_IDENTITY` and that the loaded history equals the fixture's actions.
- **Mutations:** I saved the original `src/core/match-save.ts`, applied each omission in place, and wrote the saved bytes back after each one. A final `cmp` against the saved copy matched, and `git status` shows no tracked changes. Every mutation fails the new file:
  - Skipping the rules check for geographic saves fails 3 cases: different rules, different rules version and extra rules key.
  - Skipping the action-schema check for geographic saves fails 1 case: different action schema.
  - Removing the `Object.keys(part).length !== 2` key-count check fails 2 cases: the extra generator key and the extra rules key.
- **Retained browser failure:** the earlier 23/24 run's cause is unproven. My independent sequential rerun passed 24/24, and no timeouts were weakened.
- **Scratch:** `.sweep-out.txt`, `.npmtest-out.txt`, `.build-out.txt` and `.browser-out.txt` in the worktree root, plus the untracked `sweep-rP9QWw` and `rev2-d7bfdxql` evidence directories. All are preserved.
- **Not covered:** I did not read the archived source snapshots inside the multipart and tar archives. I checked their receipts and manifests, and the parent verifies every member independently.

Findings:
- **R1 (not blocking, `docs/prototypes/new-game/T35/README.md`, `tests/core/geographic-board.test.ts:1`).** The frozen "Proposal/UNEXECUTED" and "no producer is included" headers are historical. The README now says so explicitly, and I did not ask for them to be rewritten.
- **R2 (not blocking, `src/core/geographic-game.ts:25`).** The branch for a deal failure after accepted geography is reached by no known input and does not retry. It is an inherited defensive path.
- **R3 (not blocking, `tests/core/geographic-game.test.ts:11`).** The test matches only `/exhausted.*0.*attempt/i`, so it would not catch a regression to the old "larger budget" wording. The message is correct now.
- **R4 (not blocking, `docs/prototypes/new-game/T35/implementation.json`).** The cause of the earlier concurrent 23/24 browser failure remains unproven, though both runs are retained. My rerun did not reproduce it.

Blocking-means check:
- No Done-when fails.
- The rules, schema and key-count refusals are now pinned by tests that fail under each omission.
- Fixed-reference identity replay is pinned by a fixture.
- Exhaustion stays bounded and recoverable.
- No UI or default change.
- No existing assertion was weakened.

FILE: RUN-NOTES.md
FILE: docs/prototypes/new-game/T35/README.md
FILE: docs/prototypes/new-game/T35/acceptance.mjs
FILE: docs/prototypes/new-game/T35/archive-evidence.py
FILE: docs/prototypes/new-game/T35/evidence/current-parent-3v9TNY/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/current-parent-7pa9kM/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/current-parent-ImzpPK/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/current-parent-MdlHuN/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/feasibility-2YSJDZ/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/implementation-final-retained-py0avz4x/.gitignore
FILE: docs/prototypes/new-game/T35/evidence/implementation-initial-retained-ez45n7zq/.gitignore
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
FILE: tests/core/geographic-match-identity.test.ts
EVIDENCE: docs/prototypes/new-game/T35/evidence/
EVIDENCE: docs/prototypes/new-game/T35/claude-review-round1/

For the multipart parts, I checked the receipt part hashes and the concatenated archive hash. The parent independently verifies the full archives.

SCOPE: complete

Final pass done

approve