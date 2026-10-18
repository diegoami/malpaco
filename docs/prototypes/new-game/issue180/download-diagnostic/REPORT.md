# T73 native-download diagnostic report

The download failure mechanism remains unresolved. The final controlled run passes both original 1280×800 tests with unmodified helpers, deadlines and assertions, the final capped CSS, and a config extending the exact earlier acceptance config. The earlier combined run and exact retake failures remain valid evidence. No runtime or test-helper fix is established or proposed from these controls.

## Original failures and current positive evidence

The anchor-correction combined run passed 108 of 110 tests; the two 1280 computer-card cases timed out in nativeSave waiting for download events. Main's one exact retake failed both again, recorded in `../parent-download-retake-20261018-183413/receipt.json` and its raw output/error contexts. `retained-failure-references.json` hashes those original files. Those results were not replaced or relabelled as passes.

The final configuration-selection control uses the actual original computer-cards.spec.ts, not a diagnostic clone. Both cases pass in 4.7 and 5.1 seconds (see css5-selection.log). This supplies positive evidence for the two previously failing cases under the same CSS and unchanged assertions. It does not turn the earlier 108/110 run into a green complete run or remove the requirement for independent regular-suite validation and final green CI.

The final source CSS input remains the unchanged bounded proposal, SHA256 `9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64`. No additional CSS correction was identified in this diagnostic.

## Instrumentation and bounded controls

The owned probe imports the actual core and actual computer-card fixture helpers. It preserves engine oracles, legal recorded actions, identities, saves, private-card checks and all original assertions. The diagnostic nativeSave separately records click resolution/rejection and download resolution, with 3-second click and 5-second event bounds only inside this owned probe. These diagnostic bounds were never installed in actual acceptance tests.

Heavy probes retain every save's before/after rectangle, pointer hit, ancestor scrolling/clipping, connectivity, disabled/focus state, visible match-error text, history/phase/turn, user activation, page errors, console/CDP events, Blob URL creation/revocation, anchor clicks, actual downloads and DOM mutation counts. All events include browser virtual-clock information and real Node timestamps. Buffered probes retain browser events until failure/end to avoid a protocol round-trip around each save. Traces and screenshots remain in their unique result directories.

Across the instrumented probes, all 316 native saves produced 316 downloads and 316 anchor clicks. All recorded anchor clicks had active user activation. All 158 buffered click-hit records hit reference-save-game. No click rejection, missing download, Save failed alert, page error or console/CDP warning was observed in those instrumented runs. The Blob creation, anchor and download counts agree; URL revocations occur through the unchanged clock-driven production path. This is successful-run evidence, not proof of what happened during the original failures.

The initial heavy run accidentally used one worker because the first owned config omitted fullyParallel; its config is retained as source/playwright.serial-first.ts and its result is labelled css5. The corrected css5-parallel control uses the normal two workers. Heavy instrumentation slowed the tests to roughly 14–16 seconds, so its passes alone were insufficient to classify the original gap. Lower-overhead controls then passed near normal speed.

| Experiment | Exit | Wall time including build/server |
| --- | --- | --- |
| css4-actual | 0 | 10.09s |
| css5-actual | 0 | 9.24s |
| css5-exact | 0 | 9.82s |
| css5-fast-minimal | 0 | 10.65s |
| css5-fast | 0 | 11.99s |
| css5-listener | 0 | 10.53s |
| css5-parallel | 0 | 23.17s |
| css5 | 0 | 31.12s |
| css5-roundtrip | 0 | 10.36s |
| css5-selection | 0 | 9.49s |

The listener and roundtrip controls keep nativeSave byte-identical: one adds an upfront no-op download listener; the other adds one startup browser round-trip with no download listener. Both pass. The exact clone then removes all added hooks/counters and also passes. The actual-spec control removes clone-location differences and passes. CSS4 with the same actual-spec diagnostic configuration passes as well. `control-source-proof.json` proves the normalized exact clone equals the frozen original, and nativeSave is identical in the original, exact, listener and roundtrip controls.

No pacing-only experiment was justified: neither a failed-save ordinal/rate threshold nor blocked activation or URL-lifetime failure was observed. A persistent download listener is not established as a necessary fix, because controls without one pass. No helper, clock, browser flag or controller change was adopted.

## Final configuration-selection control and exact differences

The final command is retained byte-for-byte in run-selection.sh:

```text
docker run --pull=never --rm --init --ipc=host --user 1000:1000 -v "$PWD:/work" -w /work -e HOME=/tmp mcr.microsoft.com/playwright:v1.63.0-noble node_modules/.bin/playwright test tests/e2e/computer-cards.spec.ts -c docs/prototypes/new-game/issue180/download-diagnostic/selection.config.ts --grep 'three consecutive computers' --project 1280x800 --output docs/prototypes/new-game/issue180/download-diagnostic/css5-selection-results
```

selection.config.ts imports the earlier anchor-correction/playwright.config.ts and overrides only its output directory. It preserves the actual testDir, all eight testMatch entries, both original projects, worker count, fullyParallel setting, zero retries, normal trace setting, web server and all other inherited options. CLI selection is the same actual file, grep and 1280 project as the failed main retake. Relative to that retake's retained argv, the differences are the thin config-wrapper filename and owned output path; Docker flags/settings, actual test selection, CSS bytes and assertions remain the same. There are no diagnostic page hooks, listeners, snapshots, counters or modified nativeSave in this final control.

Earlier diagnostic configs narrowed testMatch/project selection or used an unnamed project; those snapshots remain under source/. Their successful results were treated as controls rather than replacements for canonical acceptance. The final inherited-config control resolves that concern and passes without claiming those earlier settings fixed anything.

Each experiment's exact wrapper argv, applied CSS hash, exit, duration and restoration is in its receipt and experiment-summary.json. Long commands used unique issue180-download-* systemd units, closed stdin, pinned existing Playwright 1.63.0, private real dependencies, no installation/network/image pull, and only this worktree bound at /work. No current preview or other worktree was touched.

## Diagnosis, limits and concrete next step

The evidence supports an intermittent native-download/browser-test failure or environmental timing sensitivity. It does not establish a CSS geometry regression, download flooding, inactive user activation, revoked Blob URL, event-subscription bug, serialization error, or specific infrastructure cause. The original helper starts its event promise before awaiting click, so a waiting-event stack alone cannot definitively distinguish a click stall from a successful click without a download. The owned probe separates those outcomes, but did not reproduce either failure. Under rule 22, further speculative runs are not justified after the bounded controls and the parent's stop instruction.

Keep the existing capped CSS proposal and actual canonical tests unchanged. The concrete next step is the selected independent reviewer running the regular affected suite, then final CI with the full suite required green. Preserve all earlier failures in the review/PR evidence. If the native failure recurs, collect separate click/download lifecycle evidence from that failing run before authorizing any change to computer-cards.spec.ts or the controller. There is currently no justified minimal helper/runtime amendment, and no timeout increase, extra listener or pacing workaround should be presented as a proven fix.

## Restoration and scope

All ten experiment receipts confirm exact finally restoration of actual src/styles.css to SHA256 `257fbe1be6f70f4dda1a7750ca1fd4ba9be9950ef54e1c9b0d97bd14abf7b7d9`, mode 0644. All 1400 frozen actual source/test/task/config and prior preflight/anchor-correction artifacts match bytes and modes after each experiment. The actual computer-card test still matches the frozen original. All new files are confined to download-diagnostic/. No actual test, helper, controller, Git/index/HEAD, CI, review, Windows, 4177 preview, 4186 preview or other worktree was changed or dispatched.

Parent must read this full report before adopting or freezing further work. The diagnosis is deliberately bounded and unresolved; the successful final control is positive test evidence, not a waiver of a regular green full run.
