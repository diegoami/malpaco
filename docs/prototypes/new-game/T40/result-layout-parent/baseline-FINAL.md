# Final T40 standalone loss-layout diagnostic

The same defect reproduces on unchanged final T40 alone, HEAD
64bbe6edaf121aad6e4d3cb8a132d9102e3ef695. No T41 policy/default/UI candidate was
installed. The exact retained human-loss450 options/actions file was uploaded
through the native Load game input. This is independent of running T41 policy.

Both pinned desktop tests fail because BOTH required loss choices extend below
the Compact action-card bottom. Detailed-mode required choices fit. All choices
are visible/enabled and inside the viewport. Both modes were fully measured and
screenshotted BEFORE any fit assertion; soft assertions retain every violation.

Measured rectangles (CSS viewport coordinates; x,y,width,height):

| Viewport/mode | .action | Watch computers | Stop game |
|---|---|---|---|
|1280×800 compact|934,282.171875,330,320|943,560.0625,152,66|1103,560.0625,152,66|
|1280×800 detailed|934,282.171875,330,380|943,560.0625,152,66|1103,560.0625,152,66|
|1920×1080 compact|1485.1875,263.953125,414.015625,416|1496.578125,623.359375,190.421875,85.1875|1697.390625,623.359375,190.421875,85.1875|
|1920×1080 detailed|1485.1875,263.953125,414.015625,493.984375|1496.578125,623.359375,190.421875,85.1875|1697.390625,623.359375,190.421875,85.1875|

At1280 compact, action bottom602.171875; both button bottoms626.0625:
23.890625px overflow. Detailed action bottom662.171875 contains both buttons.
At1920 compact, action bottom679.953125; both button bottoms708.546875:
28.59375px overflow. Detailed action bottom757.9375 contains both buttons.
Horizontal bounds and viewport bounds pass in every mode. The exact offending
IDs are watch-computers-button and stop-game-button; this resolves the earlier
combined Boolean test's ambiguous loop variable.

Visible direct action children, also retained before assertions:

-1280: victory-result at943,291.171875,312,334.890625, bottom626.0625;
 card-interactions at943,632.0625,312,71, bottom703.0625.
-1920: victory-result at1496.578125,275.34375,391.234375,433.203125,
 bottom708.546875; card-interactions at1496.578125,716.34375,391.234375,91.65625,
 bottom808.

Thus the public card-interactions child extends below .action in BOTH modes,
even though Detailed required loss buttons themselves fit. This is an additional
measured layout observation, not an assertion relaxation or proposed fix.
GEOMETRY-SUMMARY.json and each project's geometry.json preserve full children,
button and viewport rectangles plus scroll/client heights and overflow styles.
Four PNGs cover compact/detailed at both sizes; FINAL-VERIFY lists their paths.

Execution:2 tests collected,2 failed,0 skipped/flaky;3.54s Docker process,
2.51s Playwright. Each test's only failing checks are Compact Watch computers and
Compact Stop game containment (four failures across two tests). Other enabled/
visible/viewport and Detailed choice-containment checks pass.

Command inside pinned mcr.microsoft.com/playwright:v1.63.0-noble:

```text
node_modules/.bin/playwright test --config <owned diagnostic>/playwright.config.ts
```

receipt.json retains complete Docker arguments: network none, no published port,
2 CPUs/6GiB/1GiB shm, user1000:1000,2 workers, internal4182. Config inherits pinned
base projects, adds explicit webServer.cwd=/work and changes only owned probe/
output/report/dist and preview port. Root config/source/tests/fixtures unchanged.
Owned unit mlp-t41-t40-loss-diagnostic-155522 completed before monitor start;
monitor reported not-running. No repeat18-suite or extra seed was executed.

Probe source: probe.spec.ts
SHA-256: eeb10831c99def8a56226c340930cd6350be705db2d8d015859f6d8fef3265cd
Input envelope: human-loss-450.json
SHA-256: e9a62a51acc472a49f0c39c8b56482651b026da9576a769051dd7724cad6613b

source-before.json + receipt + FINAL-VERIFY show all source hashes unchanged,
empty source Git diff, absent T41 computer-view.ts and all39 frozen T40 inputs
exact. No mutation/restoration was needed because no source was changed. The
probe, owned config, raw output/report, input/provenance, four screenshots and
geometry are retained here, with MANIFEST hashes.

No fix, assertion weakening, CI, Git action, formal review, Windows or production
adoption. Parent owns T40 triage and any authorized correction/revalidation.
