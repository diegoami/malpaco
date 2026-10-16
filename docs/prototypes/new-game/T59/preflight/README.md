# T59 feasibility before implementation

Base: T25 reviewed source b5cdbf6 (final baseline adds only verification evidence).
These are disposable layout mocks, not an approved implementation or final visual.
T24 contract, geometry, parameters and T25 source were not changed. Source snapshots
retain the absolute paths used for this local probe, as historical provenance.

Commands: `node /tmp/t59-preflight/build.mjs`,
`node /tmp/t59-preflight/build-third-edge-proposal.mjs`,
`node /tmp/t59-preflight/build-remove-redundant-proposal.mjs`.
Browser: pinned Playwright v1.63.0-noble container, uid 1000; run the retained
browser script on `evidence/build-s3I11q/preview.html` with the source checkout
mounted read-only and the probe directory writable. No production files changed.

- `build-RpDtEX`: exactly the two requested replacements; rejects Central Isle
  bonus 6 above country count 5. Four entrance countries cannot satisfy the
  unchanged formula and cap simultaneously.
- `build-jwZrTE`: additionally transfer South fell–Marsh keep to South fell–Stone
  watch; graph change alone is insufficient: no centred water route exists with
  this mock geometry. Not proposed as a completed solution.
- `build-s3I11q`: instead remove South fell–Marsh keep; all 15 static groups pass,
  15 sea links, Central Isle bonus 5. Optional proposed third change, awaiting
  owner decision. Other land/sea edges remain unchanged.
- `browser-GxgVyF`: actual positive mock click/keyboard/render/label checks pass
  at 800x540, 1280x800 and 1920x1080. Screenshots and SVGs retained; these prove
  feasibility, not visual approval.

Modest translations in these mocks test placement feasibility while preserving
the original cell graph and protected labels. The main session stops before
implementation/contract amendment until the owner chooses the topology.
