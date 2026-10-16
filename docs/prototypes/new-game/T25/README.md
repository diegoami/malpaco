# Seed-1994 compliant reference proposal

This prototype preserves the 46 country identities, nine island memberships and original opening owners, armies and production centres from T22’s retained seed inputs. T24 supplies the unchanged geography and fairness contract. It does not replace the current playable graph.

Run `node docs/prototypes/new-game/T25/verify.mjs` for the reference data and exact topology diagnostics, and `node docs/prototypes/new-game/T25/browser.mjs` inside the pinned Playwright 1.63.0-noble image for rendered selection/geometry checks. Each writes a new evidence directory; existing measurements are never overwritten. Optional first argument selects a disposable board JSON or HTML for preflight. No dependencies are added.

## Acceptance preflight

The retained G graph/geometry is the negative baseline. `preflight/attempt-a` records expected static and browser rejection. It is displayed in the new acceptance renderer without changing its source coordinates; its bounds/packing are intentionally not repaired. The browser rejects its invalid contract before interaction. This is not a new claim about G’s earlier visual acceptance.

`preflight/mock-board.json` is T24’s rectangular schematic, explicitly relabelled with the original seed identities/opening state. It passes static/browser acceptance and is solely a disposable positive control, not the proposed visual design or an approved topology. `acceptance.test.mjs` protects identity/opening-state checks independently of T24, and reconstructs edge diagnostics. T24’s existing independently reviewed tests protect its 15 constraint groups.

`preflight/mutations-a` removes keyboard selection, removes selected-neighbour feedback and changes a rendered name in separate mock copies. Each browser run must fail at its specific assertion. The original mock remains byte-identical; its hash is recorded. These controls prevent already-selected countries or embedded metadata from making broken interactions look green.

All measured evidence is retained under this directory. Later runs must use new names. SHA256SUMS indexes the preflight outputs. Any final reference requires owner judgment of the exact topology and appearance before T26 integrates it.
