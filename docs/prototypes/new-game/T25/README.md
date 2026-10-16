# Seed-1994 reference proposal

Open [preview.html](preview.html) directly in a browser; it needs no build or network assets. [map.svg](map.svg) is the standalone drawing. This is an original fixed development reference, not the production map generator. The current playable game is unchanged.

The proposal retains all 46 country identities, nine island memberships, and opening owners, armies and production centres from T22’s generated seed inputs. Rounded coastlines and shared subdivisions follow T22’s visual direction. Country borders are orthogonal inside rounded silhouettes; they are not a reproduction of G’s Voronoi polygons. All 15 unchanged T24 constraint groups pass, including 40px hit squares, 44px compact-frame spacing, centred coast endpoints and fairness. Actual labels and interactions pass pinned browser checks at 1280×800, 1920×1080 and 800×540.

**Review the [exact topology and bonus proposal](topology.md) before integration.** There are 61 land edges and 16 sea edges, but 28 land pairs and 14 sea pairs are replaced relative to the current playable graph. Extra crossings connect existing nearby island neighbours. Harbor income changes 4→5, Palm 5→6 and Great 7→9 by the unchanged entrance-based formula. T22 visual approval does not approve these exact T25 changes. The owner judges coastlines, route clarity and appearance before T26 integrates this fixture.

## Reproduce acceptance

From the repository root:

```sh
node docs/prototypes/new-game/T25/verify.mjs
node --test docs/prototypes/new-game/T25/acceptance.test.mjs
node docs/prototypes/new-game/T25/browser.mjs
node docs/prototypes/new-game/T25/mutations.mjs
git diff --check
```

Browser commands run only inside `mcr.microsoft.com/playwright:v1.63.0-noble`, with the checkout writable and shared node_modules read-only. Use uid/gid 1000; no dependencies are added. Every command writes fresh evidence directories instead of overwriting earlier results. `verify.mjs` and `browser.mjs` optionally accept another board JSON/HTML as first argument for preflight. Run checks sequentially: `mutations.mjs` temporarily edits the actual installed preview/data, restoring saved bytes in `finally`, so no simultaneous browser/build or commit may read a mutant.

`build.mjs` constructs one hand-arranged board with explicitly designed placements, rounded outline exponent, subdivisions and sixteen country pairs; it is not a seeded generation algorithm or a success-rate measurement. It first refuses invalid fixed geometry before routing. It writes a new candidate directory, never overwrites the installed reference. Ports use binary-rational interpolation on the intended exposed segment, remaining within T24’s unchanged 1px centre tolerance. This representation prevents spurious floating intersection slivers, not real gaps. Routing follows water visibility outside island silhouettes; routes may cross other routes under T24. No claim of general generation or opponent balance follows from one fixture.

## Evidence and negative controls

The authoritative rounded candidate is `evidence/build-4sl7nH/`; it passes every T24 group and preserves identities/opening state. The final `mutations-CwJOLd` run proves baseline static/browser green; seven actual-source deletions/alterations fail their intended assertions (keyboard selection, visible neighbour styling, rendered name, rendered sea path, identity, opening armies, island income); restored static/browser runs are green and both original SHA-256 hashes match exactly. Browser output includes PNGs and exported SVGs at all three sizes. Consult that run’s stdout paths for its individual immutable evidence directories.

`preflight/attempt-a` records G’s expected static/browser rejection and a labelled T24 schematic mock’s positive acceptance. The schematic is a disposable acceptance control, not the intended look or approved topology. Five tests independently protect identity/opening state and reconstructed edge diagnostics; T24’s independently reviewed tests protect its 15 existing groups. `preflight/mutations-a` proves deleted keyboard/neighbour behavior and a changed rendered name are refused while the original mock remains unchanged. Preflight hashes use paths relative to this T25 directory.

All rejected construction drafts and screenshots remain preserved, including the first rectilinear draft and browser label escapes. They are historical evidence, not current acceptance. `evidence/construction-v1-source.txt` preserves the initial builder source. A zero-length residual falsely reported by T24’s sloped shared-border check is documented with a reproducer in issue #109; this reference leaves that checker untouched and uses exact shared orthogonal boundaries. Real tiny-gap/overlap safeguards and all approved tolerances remain intact.

Proposal/source hashes are in [proposal-manifest.json](proposal-manifest.json). Original measurement directories are immutable; evidence hash indexes are versioned rather than replaced.

The failed-run drawings in `build-KGBcrF` and `build-pKqzUo` contain whitespace-only lines. Their original bytes are preserved losslessly in `raw-drawings.tar.gz` with SHA-256 entries in `raw-drawings.json`; the uncompressed local originals are ignored, not edited. To check an older hash index on a clean checkout, unpack each archive into its own directory first. The source whitespace check remains unchanged.
