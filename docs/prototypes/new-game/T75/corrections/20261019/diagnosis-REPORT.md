# T75 final-CI latency diagnosis — 2026-10-19

Completed diagnostic only, on unchanged worktree HEAD `9653f42851a7c27e561d115e02155361e71d5fb6`. No runtime, test, assertion, helper, deadline, guard or configuration edits; no commit, CI retry, full-suite repeat, review or publication. All preceding phases remain present. Parent must approve a separate provider scope before implementation.

## Finding and limits

Cold geographic preparation latency directly reproduces both reported five-second failure forms on the unchanged real Worker. It is dominated by Worker computation (3.810–4.149 seconds), preceded by about 0.62–0.78 seconds of main-thread reconstruction/preparation. A page-target CPU throttle increases the pre-Worker delay to 1.313 seconds and produces a mount at 5.472 seconds. Native, unprofiled time also reproduces both failures. A genuinely paused Playwright clock reproduces them with nearly identical timings: the Worker continues and replies normally. No stuck/canceled response or content-key/reload identity defect was observed in these paths.

These observations establish a concrete sufficient cause with matching symptoms, not individual causal proof for all 55 CI failures: the failed CI had no CPU trace. The existing assertions remain binding; a late diagnostic observation is never counted as an acceptance pass. No deadline increase or assertion waiver is proposed.

CI 39168930877 had 289 browser passes and 55 failures; packaging was skipped. Parent's parsed failures comprise 44 old Load-game widget detach polls, ten missing-element visibility checks, and one other predicate; 45 explicitly report 5000ms. Successful geographic paint setup cases took 12–16 seconds in CI. The retained representative snapshot shows “New geographic game”, “Loading game…”, and no alert. Raw CI log, full failure summary and representative context are copied here unchanged; the parent originals remain intact.

## Bounded execution and evidence

`prepare.py`, `run.py`, `profile.mjs`, `run-poll.py`, `profile-poll.mjs` and `summarize.py` retain exact commands and observation code. Commands/results are in `commands.json` and `poll-commands.json`. Two owned systemd jobs (`mlp-t75-ci-diagnosis01`, `mlp-t75-ci-poll02`) ran with closed stdin and one monitor per job; both completed. The initial job built with `npx vite build --outDir <this-directory>/build` (exit 0, 1.186s), then ran the driver (exit 0, 21.556s). The second reused that build and ran the clock/poll control (exit 0, 13.971s). This is a diagnostic driver, not a canonical Playwright-suite run, and its zero exit does not mean its retained readiness failures passed.

The actual bundled dedicated Worker was fetched and executed through unchanged `tools/release/serve.mjs` copied into the owned build, at port 4311. The server is now closed. File-input loads used the actual UI and a legal seed-1994 geographic save: `payload.json` derives from the existing T71 geographic reinforcement fixture, with two human seats and no actions. This is a focused representative path, not a claim to have rerun a literal failed CI test. Observation wrappers record File.text, native Worker construction/post/reply, and SVG mount; CDP samples native Worker and page CPU. No private Worker computation or assertions were changed. All outputs/build/profile files are retained here.

Each scenario executes a cold file load, identical warm file reload, then New game with the same seed. Both original readiness checks retain their 5000ms limits. After recording those results, the driver separately observes eventual completion for diagnosis; that observation does not repair a failed check. Full errors are in the individual result files.

## Timing results

Milliseconds relative to first File.text start, rounded below; `timing-summary.json` contains full precision and individual readiness errors.

| Scenario | Clock | File read | Read-end → Worker post | Worker post → reply | Reply → mount | Cold mount | Five-second checks |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| normal-profile | native | 3.3 | 751.7 | 3809.7 | 50.2 | 4614.9 | both pass |
| initial `mock-clock` filename | **native** | 2.1 | 621.8 | 3880.2 | 36.8 | 4540.9 | detach fails, visible passes |
| throttle2 | native, page target rate 2 | 8.7 | 1313.0 | 4077.5 | 72.5 | 5471.7 | both fail |
| normal-unprofiled | native | 3.9 | 757.4 | 4148.9 | 41.2 | 4951.4 | both fail |
| mock-clock-polls | paused | 2.6 | 780.7 | 4060.4 | 43.5 | 4887.2 | both fail |

The first driver's case named `mock-clock` accidentally omitted `clock:true`; its raw result correctly says false. It is preserved unchanged and excluded from all mock-clock claims. The separate follow-up `mock-clock-polls` explicitly installs and pauses the clock, and is the valid clock control. The throttle is CDP page-target Emulation throttling, not evidence that the dedicated Worker itself ran at half CPU speed: its Worker round trip stayed near the native measurements.

The unprofiled native detach callback observed the old input connected at 4.668s; native mount happened at 4.951s. The paused-clock callback last observed connected at 4.676s; mount happened at 4.887s. Neither poll sampled again before its five-second budget. The first callback was also delayed behind main work (native 38ms → 794ms; paused 26ms → 810ms). Thus a DOM commit just inside five seconds can still fail the bounded retry observation. This explains the directly reproduced timeout without treating fake time as frozen Worker execution. Both native and paused visibility checks also retain their failures and exact “element(s) not found” errors; no claim is made that the observer's mount timestamp guarantees Playwright's visibility observation.

Warm reloads took about 0.49–0.57s natively and 1.052s with page throttling. Same-seed New game took about 0.50–0.585s natively and 1.053s throttled. Across every scenario there was exactly one derive request, successful response id 1 with matching content key, no cancel/error, and no second Worker derive for either warm action. This supports correct cache reuse and lifecycle on the measured paths. It does not cover every cancellation race or every seed.

## CPU attribution

`cpu-summary.json` aggregates self-sample time by function/URL/line/column, rather than losing repeated profile nodes. Full raw `.cpuprofile` files remain retained. Worker profile: 5120.75ms duration, 4464 samples, about 1326.82ms idle. Its approximately 3794ms active sample time is dominated by:

| Worker source operation | Bundle function/column | Self time | Approximate active share |
| --- | --- | ---: | ---: |
| velocity | r / 4307 | 1175.59ms | 31.0% |
| labelGap | N / 4169 | 1101.72ms | 29.0% |
| Euclidean distance, Math.hypot | i / 174 | 620.26ms | 16.3% |
| base vector field | C / 2832 | 289.04ms | 7.6% |
| garbage collector | native | 243.33ms | 6.4% |
| derivePresentation | p / 1748 | 179.45ms | 4.7% |
| pointSegmentGap | s / 287 | 70.96ms | 1.9% |

The unchanged provider's velocity evaluates labelGap for 46 labels in its force loop and scans all labels again for the minimum used in spread. Protected-line/port distance `.map`/spread arrays and projected-point allocations also sit in this hot path. Profiling supports redundant label scans and allocation overhead as the first optimization target; no speedup has yet been measured for any proposed change.

Main profile spans cold plus both warm actions, so its total is not cold-only reconstruction time. It contains 4101.97ms idle of 6077.98ms. Aggregated active hot functions include cross-product helper z/98959 (277.97ms), `pointGap` Gt/100398 (232.39ms), corridor checking tn/104423 (150.49ms), GC (149.66ms), and edge/norm helpers. These correspond to actual geographic engine validation/reconstruction, including BigInt distance comparisons, rather than a blocked Worker reply. The direct cold timeline independently measures the roughly 0.75-second pre-Worker contribution.

## Identity and preservation

All five actual returned Worker drawings exactly equal the existing seed-1994 frozen oracle under the same complete typed geometry projection used by `tests/ui/generated-geography-presentation.test.ts` (seed, bounds, every island/province polygon, ids, labels, borders, routes). `worker-output-equivalence.json` records the oracle hash and every equality. No golden was generated or changed.

Source SHA256:
- pure provider `ec0bdf8aad3b67b847be19926bf2470738a498f99f6aa762d7a28a944dbe548a`
- worker `3dc714a7387900f8a0795f0a549859d300b1528b88c8a9db5161862132ca3374`
- service `c5dd8c8f80cb76f1ac5bd95257551fbb92ff58633ec3857a9d4df333d6c8a1df`
- served Worker asset `31ec2b83bc75618f758d3357e156faceff73c27446d2d4b82b453fb884deb7a2`
- frozen drawing `f3000667fdfc04d16fc8a9f59b4607834acc51dc77d49e629795196a299e67b0`

`before-manifest.json` and `final-preservation.json` verify all 208 protected inputs, including source/tests/public/data/release tooling, modes, actual Git HEAD/index/ref: zero changes. HEAD stays 9653. No restoration was needed. All preexisting output/evidence directories remain; only this new directory was written. `evidence-hashes.json` pins every retained diagnostic file and built runtime asset; it excludes itself. This diagnostic build is temporary-source evidence, not an owner preview, publication or official release artifact.

## Proposed next scope — requires parent approval

The smallest justified candidate is a pure performance change only in `src/ui/generatedGeographyPresentation.ts`: accumulate the minimum label gap during the existing ordered label-force loop and reuse it, avoiding the second scan; replace hot temporary `.map`/spread arrays and projected-point allocations with scalar computations/loops preserving exact arithmetic grouping, iteration/minimum semantics, early returns, and force-addition order. No constants, steps, output version, geometry, cache policy, Worker/service behavior or runtime validation changes are justified by this diagnosis. Main reconstruction is secondary and should remain untouched in that initial scope. Do not substitute approximate distances or regroup floating-point expressions. Far-segment culling should be excluded initially unless a separately reviewed proof shows the skipped original contribution is saturated with exactly identical output.

Parent must explicitly amend/freeze T74 provider scope before a producer starts. The existing full-geometry 12 accepted seed oracles plus refusal398 remain binding. A candidate must demonstrate complete frozen output equality (and any parent-approved additional fixed seeds), retained save/RNG/input identity, unchanged real Worker/cache/cancellation behavior, and the representative five-second checks with useful performance margin. CI's 55 failures remain unresolved release failures until a separately authorized candidate and required acceptance pass. No implementation or next-stage checks were performed here.
