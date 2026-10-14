# T13 acceptance preflight evidence

The final replay is `preflight-20261014-g/manifest.json`. It ran in
`mcr.microsoft.com/playwright:v1.63.0-noble`. No final prototype implementation
was retained. The reference layout and UI are disposable feasibility fixtures;
the owner still judges geographical appearance from final implementation screenshots.
No permanent prototype goldens were created in this stage.

## Reproduce

From the task worktree, with the unchanged source and isolated dependencies:

```sh
node docs/prototypes/generated-board/preflight-20261014-b/replay.mjs docs/prototypes/generated-board/<new-directory>
```

Run that command inside the pinned container. The replay requires a new evidence
directory, saves production source bytes in memory, and restores them in `finally`.
It refuses an existing prototype implementation. The mock files remain only as
`.txt` reference fixtures. The normal route and existing goldens remain unchanged.

## Results

- Missing layout export: collection fails at the missing import.
- Identity projection: all six new seed-layout checks fail; the existing generator
  failure-seed fixture passes. This rules out accepting placeholder geometry.
- Missing prototype route: all six non-golden UI viewport/test combinations fail.
  The initial run also failed both new golden tests because the route was absent.
- Temporary mock: seven layout tests pass; six non-golden UI combinations pass at
  1280x800 and 1920x1080. Layout preserves frozen input and exact map semantics.
  Pixel checks compare country fill against screenshot samples and sea, and require
  name contrast; rendered font, box overlaps, viewport bounds, and name-center hit
  targets are checked. Graph checks cover every country, exact edge sets, SVG
  endpoint anchors, names/IDs, highlighted neighbours and links, keyboard focus,
  and border/sea stroke distinction. Seed editing, reload, refusal and retry pass.
- `npm test`: 339 pass, comprising the existing 332 and seven layout checks.
- `npm run build`: exit 0.
- Existing slice/reinforcement Playwright suites: 40 pass with unchanged goldens.
- Unpainted-country mutation: adds opacity zero to the first country's shape;
  both non-golden paint tests fail on that country's expected-fill share (0).
- Missing-neighbour-link mutation: omits the first undirected sea path;
  both exact-connection tests fail (expected edge absent). Mutations are performed
  by the replay's two source replacements and restored from saved bytes.
- Restored mock: all six non-golden UI combinations pass again.
- Final source: `src/main.ts` has identical before/after SHA-256
  `df14d443d2acffaeede25b18fb71c4f12a59d90bd098722342947a55e644c14c`;
  temporary `src/ui/prototype/layout.ts` and `preview.ts` are absent again.

The seed-1506 generator-refusal test is a pre-existing-behaviour regression fixture,
not a red-before-green acceptance claim. Likewise, build and the legacy suites are
compatibility checks. New goldens are deliberately excluded from mock feasibility;
stage two must create and pass them, repeat mutations, and run the full E2E suite.

## Diagnostics retained

B contains fixture source, replay and initial missing-route evidence. C demonstrates
that `vite.config.ts` originally discovered only core tests. The one-line include
addition for `tests/ui/**/*.test.ts` is the permitted blocking mechanical fix.
D/E retain failed mock runs caused by Playwright treating a stroke-only horizontal
or vertical SVG path's zero-area bounding box as hidden. The corrected acceptance
check tests stroke eligibility, ancestor visibility and positive path length, so
straight painted lines are accepted. F completed the first successful replay;
G repeats it with final assertions and straight links over regions, masked around
full names. Screenshots have unique directories and earlier measurements are retained.

All new layout/mock numeric display constants are [designed], after inspecting
`board-gen.ts` placeholder geometry and `mapView.ts` label placement. Pixel-reader
thresholds are [designed], after inspecting `slice.spec.ts` screenshot sampling.
They establish feasibility and deletion sensitivity, not an aesthetic score.
