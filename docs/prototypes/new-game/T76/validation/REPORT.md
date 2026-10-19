# T76 implementation evidence

T76 independently hides and restores the desktop top/sidebar, gives their space back to the map, and retains a narrow accessible icon rail. Original phase/battle commands appear directly as icons; cards, quantities, settings/files and complete history use one nonmodal surface. Required choices remain discoverable, Raid can select on the map, pause gates relocated controls, and Escape returns focus to a visible opener or recovery control. Expanded initial defaults remain compatible.

## Checks

All commands ran as the same nonroot user in pinned Playwright image sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27, network none, private1GiB SHM, physical existing dependencies, no retries. Full argv/logs and source identities are archived.

- DW1: `npx playwright test tests/e2e/hideable-panels.spec.ts --workers=2`:8/8 passed at both hosts and desktop sizes. Frozen test SHA equals parent preflight; it was never changed.
- DW2: all nine named suites:112/112 passed, twice. Existing assertions were unchanged. The final full run includes the vanished-required-opener edge fix and vector icons.
- DW3: `npm test`:818 Vitest tests across60files and all9 harness tests passed. Initial `npm run build` then exposed TS2322: the DOM types allow HTMLElement.hidden to be boolean or until-found. Explicit boolean coercion fixes the disabled assignment; all32 frozen/new browser cases passed again on that source. `npm run build` for0.1.1 passed (66modules, Vite180ms).
- Parent's same-task release amendment was merged before version changes. Only package.json.version and package-lock top/root versions changed to0.1.1. Dependency entries and232 runtime/test/tool/workflow/config inputs match exactly before/after the version edit. No full browser repetition solely for version was performed, as parent directed. Earlier npm/browser logs truthfully retain0.1.0 metadata.

Collapsed coverage includes sidebar-only rail fit with topbar expanded, zero rail scrolling and physical hit checks, direct placement/start/battle commands, pause gating, capture/friendly quantities, arrow/Home/End keyboard navigation, discard/reward, trade/skip, nonmodal Raid, human-loss/result choices, replacement/New game, log access/reading offset and exact core state/RNG oracles.

## Negative evidence and corrections

Parent preflight8 baseline failures and reversible8 mock passes are retained separately. All24 icon cases failed against the original pre-feature host and that source was restored exactly. The new disappeared-opener assertion failed at both viewports before its visible-focus fallback fix.

Earlier batches remain evidence, not passes: focused01 was deliberately stopped after diagnosed CSS-specificity failures (exit137 from stopping only the owned container, not OOM; no resource changes); focused02 exposed hidden-history scroll loss; focused03 exposed the event-log dialog under a hidden ancestor; focused04 exposed rail command-group layout. Focused05 passed32/32 after those fixes. The original TypeScript build failure remains archived; the fresh0.1.1 build is the positive replacement.

## Preservation and handoff

attempts-01.tar.gz contains the first batch. Concatenate attempts-02.tar.gz.part-000 through part-006 to reconstruct the second archive (189429091bytes); attempts-02-manifest.json pins all parts, the reconstructed hash and685 original member byte/type/permission identities. Every member and concatenated archive was verified. All raw directories and the unsplit archive remain locally, including failures. Parent historical94d hosted-preview evidence is preserved separately, with no final-icon approval claim.

The immutable final dist copy is `.cache/T76-preview-final/` in this isolated worktree; final-dist-files.json pins its six files. No core, RNG, save, generated geometry, old acceptance or golden file changed. Parent owns independent Opus review, final SVG preview correspondence/owner judgment, one green final CI, and publication. PR193 remains draft. No new task, review, CI, merge or release was started by the implementer.
