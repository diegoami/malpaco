# T75 minimal browser environment comparison

Both minimal static-page variants failed ordinary click, native twoRAF and screenshot diagnostics. Removing CDPScreenshotNewSurface through supported PLAYWRIGHT_LEGACY_SCREENSHOT=1 did NOT unblock this host. These failures occur without malpaco, game rules, drawing Worker, external resources, custom fonts or server. No further trial ran.

## Exact bounded execution

Read the full brief and prior adoption03 report/final. HEADcf1809e362fe64226f66e6a45a6efc924e31e7c3/clean tracked tree was verified. Scripts/provenance/append-only notes checkpoint89216674e1581b18b9252b050752edce3d0f781f was committed/pushed [skip ci] BEFORE invocation. One owned mlp-t75-minimal-browser01 unit ran closed-stdin with one60-second monitor. It invoked exactly two fresh Node children sequentially, default then legacy; no app/source/test/config/dependency/npm/build/package/proof/suite/review/CI/preview/release action occurred. Active production metadata was not edited.

Each child launched one browser/context/page with headless=true, viewport1280x800, existing pinned revision1243 and same installed launch defaults. It loaded identical self-contained data URL HTML: plain system sans-serif, visible180x48 button at32,32, an ordinary onclick counter and no external resources. Independent click/twoRAF/screenshot operations each had explicit5000ms diagnostic deadlines; child cap45s. These short smoke limits are NOT acceptance deadlines and modify no test. Each operation ran once, with full error retained even after an earlier independent failure. Pending RAF promises were cleaned by context/browser closure; no active RAF loop, bringToFront, forceclick, rescue or alternative revision/flags was used.

Default child explicitly unsets PLAYWRIGHT_LEGACY_SCREENSHOT; legacy sets1. Both set DEBUG=pw:browser only, without dumping environment/secrets. Installed Playwright core version1.63.0; coreBundle support was inspected before execution; installed-provenance.json records exact bundle SHA/snippets/package/browser manifests. The variable omits --enable-features=CDPScreenshotNewSurface when truthy. DEBUG confirms precisely that flag difference, normal unique temporary profile paths aside. Both launches include installed default --enable-unsafe-swiftshader.

## Actual identity correction

Both DEBUG logs prove ACTUAL executable:

```
/home/diego/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

Installed getExecutableName chooses chromium-headless-shell for default headless. Browser version/revision and full actual launch arguments are retained in comparison.json/raw DEBUG/result files; pinned manifest descriptors retain revision1243. Browser stderr provided no additional renderer explanation. Browser.getBrowserCommandLine is separately retained if available; DEBUG launch is the decisive executable/argument record.

Correction to prior interpretation: earlier chromium.executablePath() values named the API default full Chromium location; they were NOT proof of the actual executable launched by headless defaults. Historical reports remain unchanged. This comparison directly proves headless-shell launch for these two new children; it does not invent historical DEBUG records.

## Results and exits

| Variant | goto | Ordinary click | Two native RAF | Screenshot | Child exit/duration |
| --- | --- | --- | --- | --- | --- |
| Default, legacyunset | pass11.47ms | FAILED5002.81ms | FAILED5002.12ms | FAILED5000.58ms |0/15.447685s |
| Legacy=1 | pass7.48ms | FAILED5004.84ms | FAILED5000.17ms | FAILED5001.86ms |0/15.446975s |

Child exit0 means independent diagnostics completed and browser closed, NOT operation success. Both ordinary clicks stopped waiting visible/enabled/stable. Native twoRAF hit its Node5s deadline. Both screenshot operations timed out5s. No PNG was produced, so there is no screenshot hash to claim. Full stacks/calllogs survive in variant result.json and raw DEBUG/stdout/stderr files.

Before/after DOM snapshots show visibility=visible/hasFocus=true, exact unchanged button rectangle, click counter0 and paint entries=[] in both variants. No game code ran. This supplies a reproducible environment/browser-rendering smoke failure independent of game workload; it does not prove the underlying browser/compositor cause or every role of the launch flags. The legacy toggle alone is insufficient here. It does not explain/waive older compact1280 load failure or reclassify any prior failed control.

## Preservation and practical next recommendation

Before/after scoped immutable inventory covers17,494 current source/tests/config/lock/dependency identity files, all previous evidence/manifests and existing truthful8d package with full modes, including actual Git HEAD/index/ref. preservation.json records unchanged=true; source remains80a79b8afac651479eb4eac4aa878f3a581a3c56ceab51a475ea23846d745c1d. Receipt field packageFiles=12 is the rglob entry count including2directories; package still has10regular files. No broad duplicate backup/archive was created. Probe writes only its newly owned evidence path; inherited dirty/untracked files remain untouched.

Both children were waited and closed browsers; DEBUG confirms clean browser exit0 and temporary-profile cleanup. Runner completed44.666497s, exit0; the unit/single monitor ended. No server was started. All unique raw logs/JSON/provenance/failed outputs are retained and authenticated by evidence-hashes.json except itself. No aggregate model telemetry is available/invented.

ONE practical recommendation for parent decision: isolate the old headless-shell implementation using one supported same-revision full Chromium channel:'chromium' minimal smoke before any game validation. This is a proposed environment comparison only; it was NOT run here, requires no version/dependency/config change, and cannot waive acceptance. Parent owns environment selection, still-unrun controls/FIRST166case suite, independent review, owner judgment, finalCI and publication. Prior165/166, rounding/native-click/initial-PNG failures, console/misclock and screenshot-original preservation limits remain explicit.
