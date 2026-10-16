# T59: small island rotations and clearer connections

Open [preview.html](preview.html) locally, or inspect the retained PNG/SVG views
linked below. This is an original reference fixture, awaiting owner judgment
before T26 integration. It does not change the current playable game.

North Isle turns about 10° anticlockwise and Cliff Isle about 10° clockwise.
Labels remain upright. Cliff's narrower cells are slightly wider to fit their
labels after rotation; West Isle and nearby islands are repositioned. Every
shared land border and all 46 identities/opening values remain unchanged.

Relative to T25, add South rest–Fort town and Rock bay–Upper ridge; remove
South rest–Silver ford, Rock bay–Marsh keep and South fell–Marsh keep. The last
removal keeps Central Isle's entrance-derived bonus within its five-country cap.
There are 15 sea links, within the unchanged 14–18 range. All island bonuses
match T25. See [comparison.json](comparison.json) for the exact edge changes,
measured rotation angles, island areas, all 36 water gaps and route lengths.

## Comparing small angles

```sh
node docs/prototypes/new-game/T59/build.mjs          # North -10°, Cliff +10°
node docs/prototypes/new-game/T59/build.mjs -5 5     # subtler comparison
```

Each invocation writes a fresh `evidence/build-*` candidate and reports its path;
it never overwrites the installed board or earlier candidates. Inspect that
candidate's `preview.html`, `map.svg` and `report.json`. A rejected candidate
remains evidence and must not be installed. The shared [rotation routine](rotation.mjs)
accepts finite angles within ±10°. `islandTransform` can rotate another island
in a future layout experiment; default construction rotates only North and Cliff.

The matrix uses binary fractions to keep shared vertices identical. Requested
10° becomes approximately 9.9°, with a small disclosed scale deviation in each
build report. This is a designed numerical representation, not predecessor
behaviour. Geometry is rebuilt, labels repacked and centred ports/routes recomputed;
the preview is not an SVG rotation of text and hit areas.

## Checks and retained evidence

```sh
node docs/prototypes/new-game/T59/verify.mjs
node --test docs/prototypes/new-game/T59/acceptance.test.mjs docs/prototypes/new-game/T59/rotation.test.mjs
node docs/prototypes/new-game/T59/browser.mjs
node docs/prototypes/new-game/T59/mutations.mjs
node docs/prototypes/new-game/T59/rotation-mutant.mjs
git diff --check
```

Browser checks use the repository's pinned Playwright v1.63.0-noble container,
with this worktree at `/work`, the existing node_modules mounted read-only, and
uid 1000. All browser runs write fresh task-owned output directories. They check
all 46 countries by click/Space/Enter, arrow focus, actual labels/ownership/counts,
exact routes/ports and visible neighbour feedback at 800x540, 1280x800 and
1920x1080. Each positive run retains matched T25 before views, after views,
SVGs and close-ups of the two corrected connections.

Parent acceptance was pushed before construction. Unchanged T25 fails exact sea
delta and both actual geometry rotation assertions; the rotated mock passes.
[Preflight](preflight/README.md) retains the original bonus conflict, failed
packing/overlap attempts and feasible mocks. Historical snapshots contain the
absolute paths used then; they are evidence, not the portable build entry point.
Nothing in T24/T25 is edited. The known T24 numeric issue #109 is untouched.

Archaeology returned reviewed [F022](https://github.com/diegoami/isle-wars-archaeology/blob/d5932c2cea7741e81012bd4619e55430aba81a37/findings/F022-pro-map-presentation.md#answers).
Its bounded observations support checking whether shore contact and continuation
identify the intended country, rather than relying on nonintersection alone.
We adopt that evaluation principle. It establishes no predecessor midpoint,
clearance, detour or highlighting algorithm; T24 midpoint/spacing and our rotation
choices remain original design decisions. No upstream images, code or geometry
were imported, and no constraint changed in response to the research.

Natural internal borders and optional visual rivers/mountains are separate
[#111](https://github.com/diegoami/malpaco/issues/111). No terrain rules or
decorative barriers are introduced here. Owner approval remains necessary for
appearance and final topology; automated tests do not judge naturalness.
