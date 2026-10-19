# Issue187 prerequisite merge and proposed portability amendment

## Authorized merge completed

Pushed commit `ccbd39f7` (`ccbd39f7` branch `fix/187-vite-watch-scope`) to the existing origin branch. Commit subject: `Merge T75 prerequisite into issue187 watch investigation [skip ci]`. First parent: issue187 evidence checkpoint `e184b4b8`; second parent: requested T75 head `9653f42851a7c27e561d115e02155361e71d5fb6`.

Only conflict was `RUN-NOTES.md`. Removed only the conflict marker lines, keeping both append histories. The full original conflicted file, stage2/ours and stage3/theirs are retained under this directory. `notes-preservation.json` proves every original line from each stage survives in order; no history was chosen over the other. Git index resolution and merge commit/push were performed with the expressly authorized sandbox escalation. No automatic approval rejection occurred.

All preexisting staged prerequisite changes were included by completing the pending merge; none were independently edited. Main checkout, T75 branch/worktree, runtime config, frozen guards, original fixtures, evidence and previews were untouched. No reset, restore, checkout, stash, prune or removal was used. No tests, review, CI request or PR creation ran. The skip-CI commit was pushed; no remote CI-status query was performed.

`merge-and-guard-receipt.json` records exact merge parents and checks the original three COMMITTED frozen guard hashes still match `acceptance/FROZEN.json`.

## Portability finding

The current frozen Vite probe calls `readdir('/proc/self/fdinfo')` unconditionally. That fails on macOS and Windows before the functional checks complete. Its numeric watch-growth assertions also assume inotify. The Vite/Vitest relative-path records use native `path.relative`, then compare them with POSIX literals such as `src/main.ts` and `.cache/retained-existing/src/`; Windows native backslashes would cause false failures even after gating `/proc`.

The functional Vite API checks are portable in design: `getWatched()`, directory and entry counts, source HMR messages, source/data/public HTTP responses, source/data/public/test change events, and Vitest's automatic test-edit rerun. They must continue to run on every platform. HMR URLs already use forward slashes and need no conversion.

## Exact minimal proposed edits (not applied)

`proposed-portability.patch` contains an unexecuted proposed patch for exactly two frozen input scripts. Full candidate text is also available as `probe.mjs.proposed` and `vitest-probe.mjs.proposed`. This is a proposal only: parent owns amendment, re-freeze and preflight. Parent-owned working edits were detected during preparation; this proposal uses immutable HEAD copies and never overwrites those edits.

1. In acceptance/probe.mjs, add `relativePath(root,file) => path.relative(root,file).split(path.sep).join('/')`, and use it for watcher event paths and getWatched directory keys. Preserve config absolute-path assertions and exact per-checkout cache anchoring.
2. At the start of `watches()`, return `null` when `process.platform !== 'linux'`. Linux retains the original `/proc` measurement and numeric assertions; failures to list `/proc` on Linux still fail instead of silently producing a false successful count. Non-Linux evidence records `null`, not a fabricated zero.
3. After both fixtures finish, always assert that proposed getWatched directories are deeply identical before/after cache addition and entry counts are equal; baseline directory and entry counts must both increase. Existing explicit baseline-cache-presence, proposed-cache-absence, nested dependency/Git exclusions, source/data/public/test events, HTTP200 and actual source-HMR assertions remain in force. Gate only the two kernel count assertions with `process.platform === 'linux'`.
4. In acceptance/vitest-probe.mjs, use the same slash-normalizing helper for recorded module paths and getWatched directory keys. Preserve both successful test runs and cache exclusion/test directory assertions.
5. Keep tools/harness/test/dev-watch.test.mjs unchanged: no platform skip, timeout increase, assertion weakening, subprocess change or additional dependency is required. It still executes both full functional probes on every platform and retains stdout/stderr/receipts.

The added portable growth/stability assertions ensure that non-Linux runs still prove the prevention. Merely skipping kernel assertions would otherwise leave a weaker before/after growth check. The original failure classes remain covered: absent exclusion exposes cache, ancestor-wide glob fails exact anchoring/source behavior, and removed test watching fails change/rerun behavior.

## Parent freeze and validation work

Preserve the existing FROZEN.json, scripts, mutation logs and original preflight results as historical evidence. Apply/review the proposed two-script amendment, then write a new guard freeze with those two new hashes and the unchanged harness hash. Update the contract's platform language: functional behavior required everywhere; kernel allocation/growth proof additionally required where Linux inotify is available. Keep this Linux environment's existing real counter proof.

Re-run the frozen four-case parent preflight (old config fails, exact candidate passes, ancestor glob fails, test watching removed fails), preserving all new streams beside originals. After formal dispatch, run the existing guard/harness/build requirements against the merged prerequisite and amended guard. No macOS/Windows execution has been performed here, so portable behavior remains a source-grounded proposal until those platforms are exercised. Current 400/500ms sleeps are unchanged; if a platform exposes timing flakiness, diagnose it with preserved streams before separately amending synchronization.

The production config proposal is unchanged, and no further runtime edits are needed for this portability amendment. Release remains ahead of final normal CI or merge. This preparation stops here, as requested. A first in-memory proposal attempt detected concurrent guard edits and failed an original-text assertion; no guard or runtime file was written. The proposal was regenerated exclusively from immutable committed scripts.
