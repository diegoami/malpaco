# T75 single paired cold-load observation

This bounded diagnostic did not reproduce the retained extracted-suite failure. Both observed cold loads passed their original 5000ms widget/map checks and the 46-country count. This is diagnostic evidence only: the earlier 165/166 acceptance result remains a failure, and this pair supplies no causal diagnosis, acceptance waiver, review approval or release approval.

Parent authorized one paired measurement through the retained dispatch brief and PR188 issuecomment-6261769151. HEAD was ead258b505c8e27a92830f8d49b0945025632327. No runtime, provider, tests, fixtures, task, configuration, dependencies, geometry, save or RNG bytes changed. No build, package, suite retry, CPU profile, new candidate, model run, review, CI, merge, tag or publication occurred.

## Method and actual commands

`run.py` recorded source/prior evidence/Git and output inventories, copied the existing screenshots, authenticated the existing package and asserted port4312 free before starting the server. It read the extracted package at `/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-corrected-fc33zzrh/malpaco-playable` without writing it. BUILD.json names committed source cb8e320b73b0f134ac8c73ba210b554211b0a0ad. The bundled Worker is DGiQULpt,6023bytes,SHA2568aa6884eafe24bffc4eae3a784a1c4178680077a30aaa6c5649d6587b0ac2ce7.

One owned `mlp-t75-cold-overlap01` unit was started using `bash tools/harness/run-unit.sh t75-cold-overlap01 <owned>/overall-unit.txt -- python3 <owned>/run.py`. One `watch.sh --unit mlp-t75-cold-overlap01 --every 60` monitor naturally ended with `exited: driver exit 0`. A direct supplementary `systemctl show` was sandbox-denied; no reroute or second monitor was started. The existing monitor completed normally.

Actual commands are retained in commands.json:

- `node <existing-package>/serve.mjs --port 4312`: owned server, deliberately terminated in finally, return -15; closed and port free afterward.
- `node <owned>/diagnostic.mjs`: exit0,5.553089s. Exactly one Chromium invocation, two fresh1280x800 contexts, one cold file load each. Driver plus inventories/backups completed in41.847295s, exit0.

Both contexts install/pause the original clock at2026-10-18T12:00:00Z BEFORE goto('/'), install the original save-blob observer, and load exact T71 geographic-reinforcement.json bytes as panels.json. A/B actual load starts differ754.246826ms. Native page timestamps are captured through bound performance.now before the clock shim, and absolute Node-native poll timestamps remain independent of paused page time. Both Date/performance clock receipts stayed unchanged across each load. Every poll start/end/value is retained. Map-visible observation runs alongside the original widget poll; the count assertion follows successful readiness. No assertion or polling interval/deadline changed. No late observation was needed. No warm reload/New game/retry occurred.

## Measured results

All durations below are milliseconds. File→mount uses the native page clock; load→poll success uses Node-native time. Complete raw events include File text, Worker messages/full geometry/full drawings/keys, DOM mount/widget detach, poll samples, UI state, console and errors. Browser/server stdout/stderr have distinct files and do not collide with the overall unit log.

| Context | File read | Read end→Worker post | Worker post→reply | Reply→mount | File→mount | Load→widget poll success |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 1.0 | 577.5 | 1959.5 | 37.5 | 2575.5 | 3461.3 |
| B | 1.5 | 652.6 | 1883.9 | 36.5 | 2574.5 | 3534.6 |

Each context received exactly one matching successful derive response; neither recorded cancellation, Worker/page error or additional derive. Inputs and complete outputs compare exactly A=B and against the prior candidate paused-clock trace, without projecting away fields. Actual Worker HTTP200 body is retained and hashes to the package asset. The mounted UI had46 countries and empty alerts. Status was “Seat3 is playing…”; no game timer was advanced by this diagnostic. This status does not claim any new gameplay/save/RNG proof.

Both timelines show the same expected ordering: file read, synchronous preparation, Worker reply, mount and old widget removal. Poll sampling adds visible observation latency after mount. These observations establish successful lifecycle/identity for these two paths only. Worker time was lower than the prior sequential candidate controls, so this pair does not establish an overlap penalty. The old failing acceptance lacks per-load timing and its cause remains unknown.

## Limits and next recommendation

This is one Chromium process with two contexts; the actual two Playwright workers normally use separate browser processes. Both contexts were prepared before A loaded, unlike independently scheduled tests. Simultaneous map observation also makes this a diagnostic, not literal suite execution. Host load is a single read-only snapshot (load average9.02/6.08/2.99,32 CPUs/affinity0–31); ps percentages are cumulative and cannot attribute scheduling during the pair. Recorded root cgroup cpu.max/memory.max are not a claim about every ancestor/unit limit; run-unit used its normal6G cap. No resource policy was changed. One successful pair cannot explain or overturn the earlier failure or establish a universal latency bound.

ONE next recommendation, if parent authorizes further measurement: use one bounded pair in two separate Chromium processes with the same fixture, clock order and instrumentation to close the remaining worker-process scheduling mismatch. Do not revise provider code based on this passing pair. Segment dx/dy/norm precomputation remains a plausible exact-output opportunity at provider lines18/45/53, but its benefit and relevance remain unmeasured and no edit was made.

## Preservation and evidence

Before/after receipts authenticate15,818 protected source/test/task/fixture/prior-evidence/Git files, all unchanged. Worktree screenshots/dist/release/cache/Vite/test-result/report roots retain exact before/after inventories, including absence where applicable; the existing extracted package's complete file bytes/modes match. These inventories apply to the worktree roots and specifically named extraction, not every unrelated main-root cache. Main inherited files were not edited. Source/Git inventory proof is pre-result-commit; the later authorized evidence/RUN-NOTES commit intentionally changes index/ref.

A retained screenshots-backup contains122 existing files, exact bytes/modes against the pre-run screenshots inventory. Every diagnostic output is under this unique owned directory; no fallback screenshot writer/test runner ran. Browser contexts/browser/server and the single monitor ended. Port4312 is free. No prior screenshot or output was restored because none changed.

Historical preservation gap remains explicit: the earlier acceptance driver omitted COMPACT_PANEL_EVIDENCE_DIR and VERSIONED_MATCH_EVIDENCE_DIR, and prior ignored compact screenshot originals may already have been overwritten. This new backup proves preservation of the current bytes only, never those earlier originals. Old mislabeled clock and prior console-retention limitations remain historical and are not repaired by this measurement.

`evidence-hashes.json` authenticates every retained evidence file except itself; source/scripts/fixture/server/package hashes appear in the complete protected/package manifests. Raw context-A/B.json, results.json, timing-summary.json, comparison.json, commands.json, preservation.json and before/after manifests support the claims above. Source remains unchanged; earlier release gates remain parent-owned.
