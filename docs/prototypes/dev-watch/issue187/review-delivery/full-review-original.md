Hashes match the frozen ledger. Running DW1 — the frozen guard:
Guard passes. Now the negative controls. Let me inspect the probe and the original config first:
Negative controls, one at a time with byte-exact save/restore:
Original config fails as required. Control B — broad `**/.cache/**` glob:
Control C — tests directory added to ignored:
All three negative controls fail; candidate restored with exact hash. DW2 — full harness and build:
Now the old-config build comparison within my own run:
DW3 — recompute frozen and protected-input hashes:
All checks complete. Writing the review.

Issue187 review (Kimi K3)
approve

Worktree: /home/diego/projects/malpaco/.cache/review-worktrees/190-review-9f1afa76, HEAD 31d7d5a9e09add110b7d164adc51f128fc6efc72 (matches brief). Diff vs origin/main proven; delta vs approved prerequisite 9653f428 is only vite.config.ts, README.md, RUN-NOTES.md, tools/harness/test/dev-watch.test.mjs (parent-frozen guard v2) and docs/prototypes/dev-watch/issue187/** — every other file (src/ui/*, tests/*, package.json/package-lock, docs/play.md, docs/spike.md, tools/release/PLAY.md) is inherited T75 with zero delta against the independently approved prerequisite. Fresh evidence retained in review-evidence-20261019-01/ and the guard's own .cache/dev-watch-check-* receipt trees; no cleanup performed.

DW1: ran `node --test tools/harness/test/dev-watch.test.mjs` → exit 0, 1/1 pass (4.11s, review-evidence-20261019-01/dw1-guard.*). Negative controls retaken by in-place mutation with saved bytes and hash-verified restore (candidate sha256 4cae5bff… restored exactly after each): (a) original config → exit 1 (dw1-neg-original.*, AssertionError from probe.mjs); (b) broad `**/.cache/**` glob → exit 1 (dw1-neg-ancestorglob.*); (c) adding `./tests` to ignored → exit 1 (dw1-neg-testsignored.*). Probe itself asserts the ignored list equals only this checkout's resolved .cache (probe.mjs:33), checks source HMR update message, 200 HTTP for /src/main.ts, /data/maps/probe.json, /probe.txt, change events for src/data/public/tests, no node_modules/.git watching, bounded directory/entry stability, and Linux /proc inotify count equality (fixed) vs growth (baseline). vitest-probe.mjs (initial run + edit rerun) also ran inside the guard and passed. No unbounded root watcher was run.
DW2: ran `node --test tools/harness/test/*.test.mjs` → exit 0, 9/9 pass (dw2-harness-all.*). `npm run build` with final config → exit 0 (dw2-build-final.*); dist-finalconfig 6-file sha256 set is byte-identical to the parent's pre-adoption baseline-dist (diff → IDENTICAL-TO-PARENT-BASELINE). Temporarily restored old config, rebuilt once in a saved-output transaction → exit 0 (dw2-build-oldconfig.*); its 6-file hashes are byte-identical to both my final-config build and the parent baseline (OLD-AND-FINAL-ASSETS-IDENTICAL). Candidate restored with exact hash afterwards. No dev server started, no extra browser/pure-core runs.
DW3: recomputed all frozen hashes: guard dev-watch.test.mjs (a53e7504…), probe.mjs (89c06105…), vitest-probe.mjs (9ca178a6…) match FROZEN.json parentOwnedGuardInputs; production vite.config.ts equals frozen production-candidate byte-for-byte (both 4cae5bff…); parent-preflight-v2 results.json (97a7c862…) and restoration.json (42aa3fb9…) match FROZEN.json. All 195 entries of formal-protected-inputs.json (src/tests/data/package/package-lock bytes + executable modes) recompute with 0 mismatches (dw3-protected-inputs.txt). Guard/probe scripts audited: assertions cannot be weakened by the implementer (hashes frozen by parent, verify). Old parent-preflight context (v1) preserved separately from the v2 formal ledger; guard-v1 and both preflight generations retained. No source/dependency/CI/guard weakening found; Linux/WSL only, no Windows claim.
DW4–DW10: not applicable — this task defines exactly three Done-when lines (brief DW1–DW3, contract "Done when" 1–3); no further lines exist to run.

Findings: none, blocking or otherwise. The exclusion is anchored via fileURLToPath(new URL("./.cache", import.meta.url)) to this checkout's absolute path (vite.config.ts:10), preserving watching when the checkout lives under an ancestor .cache — verified by the guard running inside this .cache worktree itself and passing. README change is the permitted dev-watch explanation only; RUN-NOTES additions are purely additive.

Final pass done
approve
