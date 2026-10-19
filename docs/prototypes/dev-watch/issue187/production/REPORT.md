# Issue187 permanent Vite watcher prevention

## Result and source context

The exact parent-frozen production candidate is adopted in `vite.config.ts`. Its only behavior change excludes this checkout's absolute config-relative `.cache` directory from Vite development watching. `README.md` explains the safe `npm run dev` default and preserved application/test watching, including checkouts beneath another `.cache` directory.

Implementation began from `efc409e450d622c635962c1a9fb343bdcd0919a7` on `fix/187-vite-watch-scope`, after the requested merge of approved T75 prerequisite commit `9653f42851a7c27e561d115e02155361e71d5fb6` through merge commit `ccbd39f7`. The parent froze portable guard v2 at `efc409e4`; no frozen guard/contract was edited. Installed Vite 8.3.2, Vitest 5.0.3 and Node v24.21.0 ran on Linux/WSL. Parent preflight establishes old-config failure, candidate success, ancestor-glob failure and removed-test-watching failure, with exact restoration. The same guard passes on this implementation.

## Changed files and purpose

- `vite.config.ts`: exact candidate bytes (SHA256 `4cae5bff592c0ddf81b0ab12ec4d0778ec153d90bb34a07d8d7cfbfb95a7d6c5`); import `fileURLToPath` and add `server.watch.ignored: [fileURLToPath(new URL('./.cache', import.meta.url))]`. Keep fs.allow, build settings and test policy unchanged.
- `README.md`: development-watch explanation only.
- `docs/prototypes/dev-watch/issue187/production/**`: this report, exact commands/exit/durations, full stdout/stderr, pre/post protected manifests, frozen-input verification, copied original guard evidence, baseline/adopted build outputs and preexisting output preservation/restoration proof. `run-command.py` captures commands without overwriting streams; `verify.py` records identities and input preservation. It performed the one-time preservation transaction and is retained as its exact source, not an idempotent check command.
- `RUN-NOTES.md`: append-only implementation checkpoint and END record.

No game source, data, dependencies, tests, test policy, serving boundary, build/CI policy or parent-owned guard changed. The local emergency service/wrapper was retained untouched; main adoption/restart is parent-owned.

## Done-when evidence

All new evidence is under `validation-20261018-01/`; earlier reports, failed attempts, parent preflights, generated fixture trees and raw streams remain intact.

| Required check | Exit/result | Duration |
| --- | --- | ---: |
| Baseline `npm run build`, before config adoption | 0 | 1.243s |
| `node --test tools/harness/test/dev-watch.test.mjs` | 0; 1/1 passed, 0 skipped | 3.903s |
| `node --test tools/harness/test/*.test.mjs` | 0; 9/9 passed, 0 skipped | 3.927s |
| Adopted `npm run build` | 0; TypeScript checks and Vite build pass | 1.167s |
| Identity/protection verification | 0; all required equalities pass | 0.070s |

Exact expanded arguments, working directory, exit and durations are in the five `*.receipt.json` files. Separate matching stdout/stderr files contain complete output, including empty successful stderr streams.

DW1: the focused guard and the additional harness invocation each recorded real bounded Vite and Vitest evidence. Baseline Vite fixture watch counts grow **45→79**, watched directories **18→28**; the adopted policy stays at **10→10** watches and **7→7** directories, with directory sets and watched-entry counts unchanged. Existing and newly added retained cache trees are excluded. Source/data/public/tests all emit change events; source HMR emits an actual update; source, map JSON and public URLs return 200. Actual Vitest initial run and automatic test-edit rerun both pass; tests remain watched and cache excluded. Nested dependency/Git contents remain excluded by Vite defaults. Fixture roots remain beneath an ancestor `.cache`, exercising correct anchoring. The guard never recursively watches the checkout root for its negative controls.

The two original `.cache/dev-watch-check-*` evidence directories were copied byte/mode-exact into `focused-guard-evidence/` and `harness-guard-evidence/`; originals are preserved. `guard-evidence-copies.json` records source paths and hashes. Parent v2 negative controls remain under `acceptance/parent-preflight-v2/`; their result/restoration hashes match FROZEN.json. Outcomes remain **old=1 / candidate=0 / ancestor-glob=1 / test-watch-removed=1**. No producer guard/mutation rerun was needed beyond the required positive checks.

DW2: baseline and adopted builds are retained separately as `baseline-dist/` and `adopted-dist/`. **All six output files, path sets, SHA256 values and executable modes match**, including HTML, CSS, JS, font and font-license files. `assets-identity.json` contains the complete comparison. The preexisting `dist` was moved intact to `preexisting-dist/` before either build, then copied back byte/mode-exact after both builds; `dist-restoration.json` records proof. No preexisting output was discarded or overwritten without preservation. No browser or pure-core suite rerun was performed, as allowed by the contract.

DW3: all **195** pre-adoption tracked `src`, `tests`, `data`, `package.json` and `package-lock.json` files retain exact bytes and executable mode. `git diff --exit-code HEAD -- src tests data package.json package-lock.json` also passed. The three frozen guard inputs, exact frozen config candidate, actual production config equality, parent preflight results and restoration hashes all verify. Before/after protected manifests and `verification.json` retain the proof. Historical parent snapshots use broader file scopes and should not be confused with this 195-file producer scope.

## Cause, failed attempts and limits

The prior investigation established that Vite recursively watches project root, while server.fs.allow restricts serving rather than watch traversal. Root `.cache` held retained worktrees/evidence and was not among Vite's default exclusions. Both startup population and subsequent worktree additions allocate watches. Nested node_modules already have a default exclusion and are not the cause themselves.

The original incident's 524,223 watches have no surviving historical per-path/time-series breakdown. Do not attribute that exact count to any one subtree or claim whether startup versus later growth dominated. The bounded reproduction proves the mechanism, and the new guard proves prevention under that mechanism.

Prior failed attempts are preserved: unchanged config failed the retained-cache assertion, and a broad `**/.cache/**` glob disabled watching when the checkout lived beneath `.cache`. Parent guard v1/v2 originals and negative streams remain historical evidence. No command failed during this formal producer validation; there were no assertion changes, skipped checks, deadline changes or discarded streams.

Portable path normalization and functional watch assertions come from the parent-frozen v2 guard. Linux additionally measures actual inotify counters. macOS/Windows execution was not performed. A future large directory outside this checkout's `.cache` can still consume watches; this narrowly scoped incident fix does not claim a global watch ceiling. Files inside the retained cache are intentionally excluded from dev updates; normal source/data/public/tests remain live.

## Remaining gates

Producer implementation and required checks are complete. Commits are pushed with `[skip ci]`; no new review, CI, PR, merge, kernel change, Windows action or systemd action was initiated. Parent owns the existing PR190 body/labels, standing independent Kimi K3 low review, and any rework.

Merge remains blocked on publication of v0.1.0, integration of actual main, the approving independent review, exactly one final normal-CI receipt on the integrated head, and a fresh guard immediately before merge. This change must not alter or delay the frozen T75 release. Historical tests/build identities prove this producer head only; they do not replace integrated-head CI.
