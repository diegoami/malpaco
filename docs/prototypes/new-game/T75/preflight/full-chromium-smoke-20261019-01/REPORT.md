# Same-revision full Chromium minimal smoke

Full Chromium also failed ordinary click, native twoRAF and screenshot diagnostics. Headless-shell selection alone therefore does not explain or resolve this environment's static-page failure. No app/game trial or fallback followed.

Verified starting HEADc269d26c081009381f0dc2fe8789cd06670782c5/clean tracked tree. Scripts/provenance checkpoint162e148a and child-count receipt correctiond1871365b21081308adfe2409e52d321b83608c6 were committed/pushed [skip ci] BEFORE invocation. One owned mlp-t75-full-chromium01 unit/one60-second monitor ran one Node child, one browser/context/page, same exact prior minimal dataURL HTML/1280x800 viewport/independent click-twoRAF-PNG5000ms diagnostics/child45s cap. child.diff proves only supported channel:'chromium' was added to launch options. Legacy was explicitly unset; DEBUG=pw:browser captured actual launch. No rescue/bringToFront/forced click/third variant occurred.

Actual DEBUG executable is `/home/diego/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, not headless shell. Browser manifest remains pinned revision1243, same installed Playwright1.63.0. Raw DEBUG retains full actual flags including headless, CDPScreenshotNewSurface and unsafe-swiftshader, process launch/clean exit; identity.json retains actual launch command/browser identity and exact HTML/viewport equality. Browser stderr supplied no additional cause. No dependency/install/version/config change occurred.

| Operation | Actual result |
| --- | --- |
| dataURL goto | pass18.97ms |
| ordinary button.click,5000ms | FAILED5003.18ms, waiting visible/enabled/stable |
| two native RAF,5000ms | FAILED5001.86ms, Node deadline |
| screenshot,5000ms | FAILED5002.13ms |

Both snapshots show visible/focus true, unchanged180x48 button at32,32, counter0 and paint entries=[]. No PNG was produced; no screenshot hash is claimed. All complete call logs/stacks survive in full-chromium/result.json. These5s deadlines are independent diagnostic limits, not altered acceptance deadlines. The child exited0/15.853242s because diagnostics completed and browser closed; operation failures remainFAILED. Both previous headless-shell variants remain failures too. No speculative renderer/compositor cause is established from this comparison.

Scoped immutable before/after receipt authenticates17,509 source/test/config/lock/dependency identity/prior-evidence/package/Git files unchanged, source80exact. Package still has10regular files; inherited receipt field packageFiles12 counts also2directories. No unrelated backup/archive/proof infrastructure was added. Active production metadata/source/tests/configs/dependencies remain untouched. Probe writes only this owned new path and append-only RUN-NOTES. Browser/context closed; rawDEBUG shows process exit0/temporary-profile cleanup. Runner completed28.982937s with unchanged receipt/exit0; unit and single monitor ended. No server was started.

Practical conclusion: keep game acceptance stopped until parent addresses the broader browser execution environment; switching only old shell→same-revision full Chromium was insufficient. No further variant or app retry is recommended within this closed brief. Parent owns environment setup and still-unrun controls/FIRST166case acceptance, independent review, owner judgment, finalCI/release. No sourcefix or acceptance waiver follows. All earlier165/166/rounding/nativeclick/setupPNG/console/misclock/screenshot-original limitations remain explicit. Native aggregate model telemetry is unavailable/not invented. No app, npm/build/package/proof/suite/review/CI/preview/release action ran.
