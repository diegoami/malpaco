# Issue 187: recursive development watcher investigation

Investigation/proposed change only; base commit `8e016fd556c1fdc4ed4782903d455a2f7b94e06b`, branch `fix/187-vite-watch-scope`. No commit, push, review, CI, shared config adoption, process restart or kernel change performed. The main session supplied the initial incident observations and containment receipt. All reproduction watchers were limited to newly created, tiny fixture roots. Installed Vite is 8.3.2, Vitest 5.0.3, Node v24.21.0.

## Established cause

Vite creates its Chokidar watcher with the entire project `root`, config dependencies, env files and public directory. `server.fs.allow: ['.']` controls file serving; it does not restrict this recursive watcher. Its default exclusions cover `.git`, `node_modules`, exact `test-results`, the Vite cache directory (normally `node_modules/.vite`) and configured build output. They do not cover the repository's separate root `.cache`. Chokidar does not automatically use `.gitignore`, and `.cache` is not in this checkout's ignore file anyway.

Consequently retained source trees, review worktrees and evidence below root `.cache` became ordinary watched project files. Both an already populated cache at startup and subsequently added worktrees produce watch allocations. Nested `node_modules` are excluded by the existing Vite defaults: private dependency trees themselves were NOT the cause, although the surrounding retained worktrees were.

The incident process had 524,223 watches (main-session observation), close to the previously observed shared per-user limit of 524,288. The current measured limit is 1,048,576; that later value does not establish which limit or remaining per-user budget applied when the original failure happened. Other processes share that budget. A large retained cache plus unrestricted recursive watching explains the exhaustion; raising the limit alone would leave unbounded growth in place.

No pre-containment per-path watch dump or time series survives. Therefore we cannot apportion the original 524,223 watches among worktrees, evidence or other root directories, or tell how much accumulated at initial startup versus later additions. The bounded measurements establish that BOTH mechanisms exist; no claim is made that one exclusively caused this particular incident.

Source extracts, exact line references and hashes are in `installed-source-extracts.txt` and `source-hashes.json`.

## Bounded measurements

`node docs/prototypes/dev-watch/issue187/probe.mjs` creates one Vite dev server at a time, watches only a tiny fixture, listens on an ephemeral localhost port, reads its own `/proc/self/fdinfo`, records `watcher.getWatched()`, requests three URLs, and closes the server in `finally`. Each synthetic retained worktree contains eight source directories with three files each, plus an equally sized nested dependency tree. A root dependency tree and Git tree are negative controls.

Final positive run: `run-2026-10-18T20-43-27.130Z/{baseline,proposed,summary}.json` and `anchored.{stdout,stderr}`.

| Check | Baseline | Proposed |
| --- | ---: | ---: |
| Kernel watches after initial fixture startup | 45 | 10 |
| Kernel watches after adding another retained worktree | 79 | 10 |
| Cache source directories present in getWatched | yes | no |
| Nested/root dependency or Git contents watched | no | no |
| Source, map JSON and public HTTP responses | all 200 | all 200 |
| Source, map JSON, public and test file change events | all observed | all observed |
| Actual Vite source HMR update message | observed | observed |

The test failed before changing the config: `before.stderr` shows the absent exclusion assertion; `run-2026-10-18T20-42-39.319Z` contains both baseline and nominal-proposed snapshots, each with cache growth. No baseline whole-root watcher was started.

An attempted broad glob `**/.cache/**` failed positively on source changes: `after.stderr`. Its fixture was itself under the isolated checkout's ancestor `.cache`, so that glob ignored the entire project. This is why the proposed exclusion is an absolute directory resolved relative to the actual config file, rather than a wildcard matching every ancestor named `.cache`. The final probe checks the loaded config's resolved exclusion before rebasing it into the bounded fixture. All fixture roots remain below a `.cache` ancestor, protecting this case.

`node docs/prototypes/dev-watch/issue187/vitest-probe.mjs` ran actual Vitest watch mode against one bounded test, then changed that test: the initial run AND the automatic rerun passed, the test directory remained watched, and the fixture cache remained excluded. Evidence: `vitest-2026-10-18T20-43-58.602Z.json`, `vitest.{stdout,stderr}`. This matters because excluding `tests` in the shared Vite config would break this workflow. The probe transfers the loaded config's exact cache exclusion into its synthetic root; it never starts a checkout-root Vitest watcher.

`npm run build` passed in the isolated worktree: both TypeScript checks and production Vite build (63 modules), `build.{stdout,stderr}`. No browser/full test suite or dependency installation was needed for this config-only proposal.

The main session's broad local containment wrapper also stayed at exactly 165 watches while this full 13,541-file worktree was populated below root `.cache`; see supplied `containment-receipt.json`. That independently checks live containment, but its broader local policy is not the proposed shared configuration.

## Smallest durable prevention

Apply only `proposed.patch` to `vite.config.ts`: import `fileURLToPath`, then add

```ts
watch: { ignored: [fileURLToPath(new URL('./.cache', import.meta.url))] },
```

Chokidar automatically excludes the named directory and its descendants for a literal ignored directory. Resolving against the config file anchors this to the current checkout's own cache, works when launching from a checkout beneath another checkout's `.cache`, and retains the existing Vite exclusions. Keep application source, data, public assets and tests watched. Keep `server.fs.allow`, build and test configuration unchanged. Do not copy the local wrapper's exclusions of tests/docs into the shared config.

Durable regression coverage should retain the bounded before/after growth probe and actual Vitest test-edit rerun, together with the ancestor-cache check. These can be moved from the prototype directory into a normal development-tool test path during formal dispatch. Neither needs a new dependency or browser. The prototype scripts already load the actual proposed config; the Vite probe fails against the unchanged config. Evidence JSON/stdout/stderr, extracts, report and patch are review inputs. Generated fixture trees from earlier probe attempts are preserved; they need not be included in the formal PR.

## Other launchers and residual limits

- `npm run dev` / direct `vite` / programmatic Vite `createServer` using this config inherit the fix. Any caller overriding `configFile:false` or replacing `server.watch` must provide its own policy.
- Interactive `npx vitest` uses a top-level Vite watcher and inherits the same cache risk; the bounded actual watch probe confirms the proposed exclusion preserves test reruns.
- `npm test` uses `vitest run`; installed Vitest closes its top-level watcher after setup in run mode. Before that closure it may temporarily traverse root, so the exclusion is useful there too. The exact transient allocation was not measured.
- Current Playwright uses `vite build` followed by `vite preview`; release acceptance uses the Node static server. Vite preview constructs an HTTP server without the development root watcher. Neither is the identified recursive development-watch path.
- Build without `--watch` does not create this dev watcher; release packaging and preview behavior remain unchanged.
- Any other future large retained directory outside this checkout's `.cache` can still grow the watcher. `.claude/worktrees` is a known alternate retention convention in `.gitignore`; the current investigation did not walk or measure it, and it is outside this smallest incident fix. If that convention becomes active, give it a similarly anchored exclusion. A fixed watch-count ceiling should not be asserted for an evolving source tree.

Release risk is low: only development watcher input selection changes, production build passes, source HMR/data/public serving and Vitest watching are preserved. The durable patch has NOT been adopted into the main checkout or its running server. The already running scoped wrapper remains the main session's containment. Formal acceptance freeze, independent review and any adoption/restart are parent-owned.
