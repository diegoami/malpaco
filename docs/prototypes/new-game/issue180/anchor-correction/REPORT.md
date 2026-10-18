# T73 action-area anchor correction preflight

The final CSS proposal caps the action area at 410 CSS pixels and returns extra space to the independently scrolling history. The targeted Squall/decisive check passes at both sizes. The combined canonical browser regression plus all seven affected suites passed 108 of 110 tests, with 2 unresolved native download-event timeouts. Both canonical layout projects and all cards cases pass. The full build passes. The complete browser suite is not green; no assertions were changed or tests retried.

## Cause, negative evidence, and correction

After the parent corrected the newly proposed empty-log helper, the actual cards suite reached a genuine remaining layout failure: the 1280×800 Squall/decisive test measured a 42.796875-pixel difference against its unchanged relative-height anchor. The four-seat anchor uses a roughly 200-pixel header; the three-seat decisive checkpoint uses roughly 157 pixels. Candidate 4's remaining-space action row absorbed that difference.

The original negative run is retained in `../parent-validation-20261018-182244/corrected-affected.stdout`: 23 passed, one failed at the binding relative-height assertion in cards.spec.ts. The preceding 110-test run and its empty-log helper failure remain in `../parent-validation-20261018-181731/`. `negative-evidence-references.json` freezes their logs, receipts and input-manifest hashes. These originals and the completed preflight directory were left untouched.

The complete final CSS is `source/styles.proposed.css`. Relative to the preserved candidate 4 copy, its only change is:

```css
grid-template-rows: 64px minmax(0,410px) minmax(88px,1fr);
```

The action row is bounded across three- and four-seat headers. The history keeps its minimum readable allocation and receives extra desktop space. `source/allocation.diff` contains the one-line diff; `source/styles.candidate4-original.css` preserves the previous complete proposal. The final proposal SHA256 is `9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64`.

## Commands and results

All commands ran from `/home/diego/projects/malpaco/.cache/issue180-work`.

- `short`: `["bash", "docs/prototypes/new-game/issue180/anchor-correction/run-browser.sh", "short", "--grep", "Squall loss and decisive reward"]` → exit 0, 7.62s.
- `combined`: `["bash", "docs/prototypes/new-game/issue180/anchor-correction/run-browser.sh", "combined"]` → exit 1, 299.38s.
- `build`: `["npm", "run", "build"]` → exit 0, 1.02s.

The short command selects the existing Squall/decisive test through `--grep`, running both configured sizes and both detail modes. Its passing result preserves the old relative-height checks. The combined command runs the actual canonical battle-panel-fit test and cards, card-result-layout, computer-cards, compact-panels, battle-controls, battle-accessibility and direct-attack suites together. Each Docker invocation uses the existing pinned Playwright 1.63.0 image, `--pull=never`, `--user 1000:1000`, `--ipc=host`, HOME=/tmp, private real node_modules and only this worktree mounted at /work. Complete argv is retained in run-browser.sh and run-proposal.py.

Long commands ran as unique systemd units via:

```text
bash tools/harness/run-unit.sh issue180-anchor-short-1 docs/prototypes/new-game/issue180/anchor-correction/short.log -- python3 docs/prototypes/new-game/issue180/anchor-correction/run-proposal.py short
bash tools/harness/run-unit.sh issue180-anchor-combined-1 docs/prototypes/new-game/issue180/anchor-correction/combined.log -- python3 docs/prototypes/new-game/issue180/anchor-correction/run-proposal.py combined
bash tools/harness/run-unit.sh issue180-anchor-build-1 docs/prototypes/new-game/issue180/anchor-correction/build-unit.log -- python3 docs/prototypes/new-game/issue180/anchor-correction/run-build.py
```

Each unit had closed stdin and one watch.sh monitor at 60-second intervals. The combined browser run was not green. After it finished and restored source, a separate unique build unit ran `npm run build` once against the identical proposed CSS, with its own finally restoration. Full npm test was deliberately not repeated: the previous 784 Vitest tests plus harness tests passed; `unit-input-reuse.json` verifies 132 relevant TypeScript, core-test, harness and package inputs are unchanged.

## Unresolved download failures

The combined run timed out after 90 seconds in two 1280×800 computer-card cases: consecutive Raid decisions/human-loss, and consecutive discards/return to human placement. Both errors are nativeSave waiting for `page.waitForEvent('download')`; the save button is focused in the retained page snapshots. The same cases pass at 1920×1080 in 5.0 and 5.2 seconds. Prior candidate 4 also passed both. This is an observed intermittent download-step failure, not a proven CSS cause or a proven infrastructure diagnosis. No layout assertion fails in those cases because execution stops before completion. Errors and full snapshots remain under combined-results/. No unchanged retry, test edit, timeout increase, or controller change was made. Parent must resolve this remaining validation gap before treating the full acceptance suite as green.

## Geometry, screenshots, and history

`measured-bounds.json` retains all canonical phase/mode measurements and checks. The canonical test captured all 48 screenshots and both modes before soft assertions, and passed physical attack/Stop/capture clicks, ancestor clipping, complete battle bounds, exact engine state/RNG, mandatory cards, retained chronological history, oldest-row readability, reading position and bottom-follow. Existing cards tests additionally exercise the three-seat decisive reward against the four-seat anchor without changing that assertion.

Representative geographic Detailed running bounds, in physical viewport pixels (list client/content heights are CSS pixels):

| Viewport | Action top–bottom | Action height | Battle top–bottom | Log client / content |
| --- | --- | --- | --- | --- |
| 1280×800 | 282.17–692.17 | 410.00 | 291.17–573.73 | 47 / 4449 |
| 1920×1080 | 263.95–796.95 | 533.00 | 275.34–620.27 | 157 / 4649 |

The fixed 410-CSS-pixel action track corresponds to 533 physical pixels under the existing large-layout zoom. The unchanged relative-anchor tests pass across checkpoints. Screenshots are in short-results/, combined-results/ and combined-screens/. The owner still judges the resulting visual allocation; this is a proposal rather than production adoption.

## Exact restoration and scope

Both wrappers saved actual CSS bytes and mode before mutation and restored them in finally. Final actual source SHA256 is `257fbe1be6f70f4dda1a7750ca1fd4ba9be9950ef54e1c9b0d97bd14abf7b7d9`, mode `0o644`, exact restoration `True`. Before/after manifests cover all actual src, tests, task contracts, root/config inputs and every prior preflight artifact; combined mismatches: `[]`. Receipts retain each command's exit and duration. No actual tests, task files, Git/index/HEAD, prior preflight evidence, Windows, preview servers, CI or review were changed or dispatched. All new evidence is confined to anchor-correction/; generated dist output comes from the authorized build.

Proposed production scope remains the existing T73 scope. This additional correction changes only the CSS grid allocation relative to candidate 4. Parent must read this full report before archiving, freezing or formal production work. Final review and CI remain subsequent steps.
