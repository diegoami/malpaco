# T75 scratch-tuple feasibility candidate — benefit gate not met

The single permitted candidate preserved exact outputs but did NOT meet the parent-frozen useful-benefit gate. Measured Worker median fell9.2079866%, below the required10%. The candidate is restored out of runtime source and is not proposed for adoption. No second candidate, additional measurement or acceptance retry followed. The earlier165/166 extracted acceptance failure remains binding and unexplained.

Parent dispatched this separate phase at PR188 issuecomment-6261850498 after reading the complete prior paired report. Motivation is the retained CPU/GC profile and binding acceptance failure, not a claim that the passing pair diagnosed that failure. Baseline HEAD was66c2d16ec88ea3f4b8e897c949f23804c0c219d1. Full current task/process4 and allocation brief were read before work. Main's notes-only0f1f89b7 was not merged into this worktree during the transaction.

## Exact candidate and identity reasoning

Only src/ui/generatedGeographyPresentation.ts was temporarily installed. Original59137044a36f65ae303d80e4d5e90861cdbfdb66aa7ef04621152d71b89e1883 and candidatec314fe91cdd974e155e4ac9d7739a7d724c2e9b48331c4fc7e4fc7644753bf38 are retained as original.ts/candidate.ts; candidate.diff names the complete delta. Two tuples allocated once per derivePresentation invocation replace the base() and ordinary velocity() per-point return tuples. Each writes exactly the existing x expression then existing y expression. Every arithmetic expression/grouping, force addition, traversal, early return, Math.hypot, minimum, constant, version and step remains unchanged. No invariant segment arithmetic, culling or approximation was attempted.

The closure-private baseResult is immediately destructured into scalar vx/vy before any next base invocation. The caller consumes velocityResult to update p[0], then p[1], before the next velocity invocation. Input points come from separate copied samples/routes and cannot alias these new private tuples. Neither scratch escapes into state/output; all derivation is synchronous, without await or external callback/reentrancy. Drift/label-speed early returns still return their original arrays, and scratch writes never modify them. Each independent derive call has its own scratch. scope.md records this reasoning. Existing exact frozen tests were used; no new test mirroring the change was introduced for an intentionally identical-output optimization.

## Commands and retained results

One own mlp-t75-allocation01 unit ran through run-unit.sh with closed stdin and its standard memory cap. One watch.sh monitor used60-second intervals and ended naturally after the unit. Distinct overall/unit/build/browser/server logs retain complete actual stdout/stderr. commands.json records actual argv, true returns and durations:

| Command | Actual result | Duration |
| --- | --- | ---: |
| node_modules/.bin/vitest run tests/ui/generated-geography-presentation.test.ts | exit0;1file/15tests passed |48.609916s |
| node_modules/.bin/vite build --outDir <new-owned>/build | exit0 |0.462538s |
| node <new-owned>/build/serve.mjs --port4313 | owned server; deliberately terminated in finally, return-15 | closed |
| node <new-owned>/diagnostic.mjs | exit0;one browser/two cold contexts |4.226144s |

The runner including inventory/backup/restoration took76.521101s, exit0. Frozen unit output is complete and collision-free. Its unchanged15tests cover twelve accepted full-geometry drawings with actual engine/save/RNG/immutability equality, original398 refusal attempts/final RNG, normal-card replay and unsupported-input refusal. No standalone typecheck was needed for this bounded feasibility probe; no full npm tests, packaging, repeated build, review, CI, model, merge/tag/Windows/publication run occurred. This temporary build is not an accepted package or owner preview.

One new build directory was used. Candidate real Worker URL was derived from the actual observed Worker creation, not hardcoded. HTTP200 asset generatedGeographyPresentation.worker-DXGJSXnX.js is6061bytes, SHA2561106dbfef2252a9cd3d2729d1cfae51d774d32bfc46d28e70678988391a0a051; fetched bytes and complete build are retained. Existing extracted cb8 package was read/hash-inventoried and remained unchanged.

## Single paired measurement and benefit

The prior diagnostic was adapted only for origin4313, output path, dynamic actual Worker URL and complete baseline comparison. Both contexts install/pause the original clock BEFORE goto('/'), use exact geographic-reinforcement.json as panels.json, and retain original5000ms widget poll/map visibility plus46-country checks. Actual A/B load start difference747.838623ms followed the requested750ms Node delay. Both clocks stayed paused and all checks passed; no late observation/retry/warm reload/New game occurred.

| Native timing, ms | Baseline A | Candidate A | Baseline B | Candidate B |
| --- | ---: | ---: | ---: | ---: |
| Worker post→reply |1959.5 |1764.6 |1883.9 |1724.9 |
| File→mount |2575.5 |2296.4 |2574.5 |2301.1 |
| Load→successful widget poll |3461.3 |2368.6 |3534.6 |2418.7 |

Candidate read-end→Worker-post was496.5/549.7ms; reply→mount34.4/25.8ms. Worker median baseline1921.7ms versus candidate1744.750122ms gives9.2079865707% reduction: **usefulBenefitAtLeast10Percent=false**. This must not round up into a pass. Faster polling completion additionally reflects discrete poll scheduling and is not the Worker benefit metric.

Each context sent one derive, received one successful matching response, and recorded no cancellation or Worker/page error. Full input and full output JSON compare exactly A=B, each against its prior actual pair context, and each against the frozen prior candidate paused trace. No geometry/output fields were projected away. Worker/service/host/cache/core/save/RNG and fixture bytes were unchanged. Raw context events contain full File text/Worker keys/inputs/outputs, native timestamps and every Node-native poll sample; timing-summary.json and comparison.json retain results.

These are one-host, single-pair observations with no concurrent randomized baseline or repeated distribution. Main-thread preparation also got faster, so host variation may contribute. Shared Chromium/two pre-prepared contexts differ from separate Playwright worker browsers, as previously disclosed. No claim attributes the old failure to allocation or proves a universal bound. The predefined gate failed; work stops here, leaving any further scope decision to parent. No source adoption is recommended from this phase.

## Restoration and preserved evidence

run.py inventories before editing, saves exact source bytes/full POSIX mode and existing incidental output trees, and installs/restores inside try/finally. Source is restored to591 exactly, full mode retained. The only changed incidental root was node_modules/.vite: fresh bytes were copied into fresh-output-copies before restoring the saved original bytes/modes. Other original outputs were untouched. Dist/release/cache/Vite/screenshot/test-result/report before/after inventories compare exactly, including absent roots.

preservation.json authenticates15,966 protected source/test/task/fixture/prior-evidence/Git inputs unchanged, complete output inventories unchanged, original extraction unchanged, sourceRestored=true, serverClosed=true and portFreeAfter=true. This proof precedes the authorized evidence-only commit; its later index/ref and append-only RUN-NOTES change are intentional. Main-root inherited files were not edited. Current screenshots retain their fresh inventory and the exact122-file backup from the previous phase. No screenshot-writing test runner/default evidence output ran.

Historical evidence limits remain: earlier ignored compact screenshot originals are unproven because the earlier acceptance driver missed COMPACT_PANEL_EVIDENCE_DIR/VERSIONED_MATCH_EVIDENCE_DIR; this phase does not repair those bytes. Prior mislabeled clock/console collision limitations remain historical. All original phases/reports/archives are untouched.

All new source copies/diffs/scripts/build/raw logs/events/results/output backups and preserved fresh cache outputs remain under this unique owned directory. evidence-hashes.json authenticates every retained file except itself; complete before/after manifests pin source, fixture, scripts' protected dependencies and original package. Browser/contexts/server/unit/monitor ended. The previous165/166 failure, independent correction review, owner acceptance, fresh finalCI and publication remain parent-owned gates.
