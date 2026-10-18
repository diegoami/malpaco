# T73 native-save rate correction preflight

The one authorized regular-root-config run passes all four targeted cases: both consecutive-computer tests at both supported sizes. The proposal adds only per-Page native-save pacing in Node real time. No production adoption or Git action was performed; the actual spec is restored exactly and every protected input matches.

## Primary-source explanation and original failure

CI39157702142 shows that the last Save clicks completed in 46/47ms, but their download events never arrived. One failure reached the eleventh attempt after 969ms; the other entered its failing burst of eleven attempts in 972ms. This now distinguishes completed clicks from missing download events, unlike the earlier waiting-event stacks alone. The original CI analysis and source excerpts are copied under source/; original raw CI artifacts remain untouched and are hash-referenced in original-ci-evidence-references.json.

Chromium's [LocalFrame implementation](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/frame/local_frame.cc) defines a ten-request burst limit. ShouldThrottleDownload uses native monotonic TimeTicks and accepts another request only after more than one real second since burst start. DownloadURL returns before sending the download when that gate is active. The supplied primary excerpt and a live read agree on this behavior. The observed CI click/event timing aligns with that gate, making native download-rate throttling the clearly likely cause, rather than a failed Save click or CSS clipping. Historical unresolved reports remain preserved; this new evidence supplies the bounded explanation.

## Minimal proposal

`source/computer-cards.proposed.ts` is the complete proposed actual test file; `source/pacing.diff` shows the only delta. Two Node imports provide monotonic performance.now and promise timers. A WeakMap<Page,number> stores the completion time of the previous native download. Before the next Save, the helper waits for a minimum target interval of 120ms from that completion, rounded up to integer timer milliseconds. The first Save has no added wait. Completion is recorded after the original download.path/readFile flow.

The 120ms interval is a [designed] conservative margin above the browser's burst budget. Eleven consecutive attempts cannot fit inside its one-second reset window with ten intervals of at least roughly 120ms, even before the native download work. This does not mock or replace downloads: every real Save click, download event, path/read and core oracle remains intact. The helper's Page keys do not keep closed pages alive.

Node time/timers run outside the browser context. Waiting in Node does not call page.clock, run browser fake timers, dispatch a game action or advance the paused game clock. All existing page.clock calls, 90-second deadlines, assertions, fixture inputs and expected engine outcomes remain byte-identical. proposal-proof.json verifies that reversing only the pacing/import delta reconstructs the complete original spec exactly. No runtime/save/controller/browser-flag change is proposed.

## One run, exact command, results

The command used the unchanged regular playwright.config.ts, both projects and two workers. Only reporter/output locations were supplied to keep every result owned:

```text
["docker", "run", "--pull=never", "--rm", "--init", "--ipc=host", "--user", "1000:1000", "-v", "/home/diego/projects/malpaco/.cache/issue180-work:/work", "-w", "/work", "-e", "HOME=/tmp", "-e", "PLAYWRIGHT_JSON_OUTPUT_NAME=/work/docs/prototypes/new-game/issue180/download-rate-correction/results.json", "-e", "PLAYWRIGHT_HTML_OUTPUT_DIR=/work/docs/prototypes/new-game/issue180/download-rate-correction/html-report", "mcr.microsoft.com/playwright:v1.63.0-noble", "node_modules/.bin/playwright", "test", "tests/e2e/computer-cards.spec.ts", "-c", "playwright.config.ts", "--grep", "three consecutive computers", "--workers", "2", "--output", "docs/prototypes/new-game/issue180/download-rate-correction/test-results", "--reporter", "list,json,html"]
```

Started as a unique systemd unit with stdin closed:

```text
bash tools/harness/run-unit.sh issue180-download-rate-1 docs/prototypes/new-game/issue180/download-rate-correction/unit.log -- python3 docs/prototypes/new-game/issue180/download-rate-correction/run-preflight.py
```

One watch.sh monitor used a 60-second interval. Browser command exit: 0; elapsed: 23.233s. Playwright reports four passed in 21.2s; no retries, skips or failures. Raw stdout/stderr, JSON, HTML and normal screenshots/attachments are retained in this directory.

| Project | Existing test | Result | Duration |
| --- | --- | --- | --- |
| 1280x800 | three consecutive computers perform literal Raid decisions and reach the correct human-loss choices | passed | 7.799s |
| 1280x800 | three consecutive computers discard oldest cards and return a living human to actual board placement | passed | 7.973s |
| 1920x1080 | three consecutive computers perform literal Raid decisions and reach the correct human-loss choices | passed | 7.684s |
| 1920x1080 | three consecutive computers discard oldest cards and return a living human to actual board placement | passed | 7.900s |

These are four targeted positives, not a claim that the whole affected suite or CI was rerun green. No unchanged failed retake, broad npm/test/build, CI/review/preview or additional diagnostic experiment was run. The ordinary root webServer performs its normal Vite build as part of the browser invocation.

## Exact inputs and restoration

Original actual spec SHA256: `eee85a8514a13de3c4e1580fda10740283c9bfb4da28c6559c9b80bbe838c69a`; mode `0o644`. Proposal SHA256: `c29e6902face86cdbaaaaae99ca310c54705a881625699c3240a830408c689f0`. Finally-restored actual spec: `eee85a8514a13de3c4e1580fda10740283c9bfb4da28c6559c9b80bbe838c69a`, mode `0o644`, exact restoration `True`. The temporary saved file was removed after its bytes were restored; the immutable original copy remains under source/.

All 226 protected actual src/tests/data/config/contract inputs match their pre-run bytes and modes: `[]`. Runtime CSS remains `9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64`. Existing frozen historical inputs, adoption verifier, earlier reports and evidence were not edited. All new files are confined to download-rate-correction/.

## Handoff

Parent may adopt and freeze this exact proposed test-helper file under the amended T73 scope after reading the full report. Preserve the original spec and CI failures. The only requested amendment is native-save pacing in computer-cards.spec.ts; no assertion, deadline, clock, controller or product change is needed. Independent required validation and final green CI remain parent-owned. No Git/index/HEAD writes, source adoption or external review/CI dispatch occurred in this preflight.
