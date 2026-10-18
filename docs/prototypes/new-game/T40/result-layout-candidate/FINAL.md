# T40 bounded CSS-only result-layout proposal

Proposal only, owner standing native Sol Medium, predispatch PR176comment6251985858; frozen parent ecfddf75efb7b12e488e4222bfb1ebe55b47a02f. No permanent production adoption or Git operation.

The visible result section previously kept its intrinsic height, so its mandatory loss choices and following optional hand block extended beyond the fixed action card. Three scoped CSS rules make only a visible result a shrinkable column, keep its title/reason/guidance/mandatory choices from shrinking, and allow its optional standings table to scroll inside remaining space. All normal gameplay/card-choice rules and fixed320/380CSS action tracks remain exact. Hidden result sections, including decisive private Continue, do not match the selectors.

Standalone full proposed stylesheet: styles.proposed.css. Append-only patch: proposal.css. Exact unified diff: proposal.diff. The full file is original bytes plus precisely proposal.css, with no other source edit. Original SHA2562eb627dacc520381fb722f119ed62e281d66f94bebaa221dde3e6290f9773ff5; proposed SHA256257fbe1be6f70f4dda1a7750ca1fd4ba9be9950ef54e1c9b0d97bd14abf7b7d9.

Parent baseline retained in ../result-layout-parent:2browser tests fail Compact loss containment; both loss choices overflow23.890625px at1280 and28.59375px at1920. Detailed mandatory buttons fit before correction, but optional hand extends beyond action in both modes.

Temporary candidate sequence, no retries or test changes:

- Supplemental tests/e2e/cards-result-layout.spec.ts:2passed,0failed/skipped/flaky; Docker4.853906s.
- Original tests/e2e/cards.spec.ts:24passed,0failed/skipped/flaky; Docker60.389716s, including decisive reward Continue.
- Original tests/e2e/compact-panels.spec.ts filtered to reference (compact|detailed): human-loss choices fit and remain usable:4passed,0failed/skipped/flaky; Docker9.095462s. Both Stop game and Watch computers are exercised in these original cases.

Full exact Docker commands in commands.txt and receipt.json. All use pinned mcr.microsoft.com/playwright:v1.63.0-noble,2CPUs/2workers,6GiB,1GiB shm,networknone,user1000:1000,explicit/workcwd and isolated owned config/output/preview4185. Loss config builds the owned dist exactly once using Vite; subsequent configurations preview that same build. No fullnpm/typecheck run for the CSS-only append. Unique systemd unit mlp-t40-result-css-20261018-01 executes run.py, one60-second watcher. run.py saves CSS bytes/mode and restores in finally.

Measured final geometry (viewportCSScoordinates; original fixed action heights preserved):

|Size/mode|Action height|Action bottom|Both loss button bottoms|Hand block bottom|
|---|---:|---:|---:|---:|
|1280compact|320|602.171875|516.171875|593.171875|
|1280detailed|380|662.171875|576.171875|653.171875|
|1920compact|416|679.953125|569.109375|668.5625|
|1920detailed|493.984375|757.9375|647.09375|746.546875|

The1920action dimensions include the pre-existing viewport scaling; their CSS tracks remain320/380. Both mandatory choices are visible/enabled and inside action/viewport in all four combinations. All visible direct action children now fit. geometry-summary.json and both loss-results/geometry.json retain full measurements and overflow descriptors.48PNGs are retained:4supplemental loss,40original cards,4T71loss. I inspected1280compact screenshot: standings has a bounded inner scroll area while mandatory loss buttons and hand inspector remain visible. Owner appearance judgment remains main-owned.

Restoration: CSS bytes SHA2562eb627dacc520381fb722f119ed62e281d66f94bebaa221dde3e6290f9773ff5, mode0644 exactly. All183trackedsource/test/data/configinputs,39originalfrozenacceptanceinputs and2supplementalfrozeninputs unchanged. Source/tests/data/config Git diff is empty. originalFrozenManifestSHA5e5b1922e19375484afa2910620e945f6181bfbe666d36f647e2bb6bb8e7fd57; supplementalFrozenManifestSHA84a80b3535e569abf441e5fb04353fac34a621b8a0da5b02189af2435fca89e1. verification.json and receipt.json preserve exact proof; all old/new originals and failures remain.

Limits: no entire138affected/32compact/fullnpm matrix, no new accessibility/table-scroll-specific test, no golden update, core/controller/DOM/default/policy change, paidreview, CI, merge, push, commit, package or Windows work. CSS table display becomes block to establish native inner overflow; main/reviewer may inspect this presentation before formal adoption. No assertions/deadlines weakened. Native aggregate token telemetry unavailable. Main must read this final, accept/freeze exact proposed bytes and formally dispatch any production adoption.
