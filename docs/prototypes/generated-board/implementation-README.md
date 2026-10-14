# T13 geographic preview verification

The geographic preview uses a single sea atlas, irregular island coasts, separated
country regions and explicit solid land/dashed sea connections. The region positions
do not supply graph edges. Country selection retains focused SVG nodes, highlights
exact neighbours and incident edges, and reports full names/IDs by connection kind.
Only `view=generated-prototype` opts into this presentation. Seed controls call the
existing generator; refusal remains visible with retry. No core/generator edits.

All source layout/style constants are [designed], after inspecting board-gen.ts
placeholder geometry and mapView.ts label/marker/coast/route placement. The owner
judges the screenshots rather than a numeric aesthetic assertion. East Isle's
anchor was raised from 300 to 260 to clear Great Isle's title/coast before goldens.

## Verification

All browser checks and goldens ran in
`mcr.microsoft.com/playwright:v1.63.0-noble`, using the worktree's isolated locked
dependencies. The final evidence is `implementation-20261014-c/`:

- `npx vitest run tests/ui/generated-board-layout.test.ts`: 7 passed (six layouts
  plus the existing generator refusal fixture).
- `npx playwright test tests/e2e/generated-board.spec.ts --workers=2`: 8 passed,
  including the two new prototype golden comparisons.
- `npm test`: 339 passed.
- `npm run build`: exit 0.
- `npx playwright test --workers=2`: 48 passed, including all 40 unchanged legacy
  cases and all eight new prototype cases.
- `git diff --check`: exit 0. Core, legacy test suites and existing golden files
  have no diff against origin/main.

The acceptance preflight establishes red-before-green behaviour: missing layout
fails import; an identity projection fails all six geometry checks; absent route
fails all six new functional viewport/test combinations. The generator refusal
fixture and legacy regression checks were already green, as disclosed in preflight.
The acceptance tests were not changed during final implementation.

## Actual-source mutations

`verify-final.mjs` saves `src/ui/prototype/preview.ts` before each mutation and
restores its exact contents in `finally`. It requires a new evidence directory.
Its manifest records target source, line, exact replacements, commands and hashes.

1. At preview.ts:95, add opacity zero to the first country's `country-shape`
   creation. Both independent non-golden pixel tests fail on painted share zero;
   both goldens also fail. Four tests fail and four pass. The label/selectable
   group is still present, proving the paint test catches the missing painted
   country without relying on the golden.
2. At preview.ts:111, omit the first sea path after adding its pair to `seen`.
   Both exact-connection tests fail because the independently generated sea edge
   is absent; both goldens also fail. Four tests fail and four pass.

After restoration, all eight prototype checks and the full 48-case UI suite pass.
Source SHA-256 before/after is
`d3b924e8788f675cf54c13d2f3720f22ed32fbeb891ab1f0f3fb0120c607deac`.

## Screenshots and goldens

Opening screenshots from functional/pixel checks are retained in the unique
`paint-*` folders within each implementation evidence batch; the final ones are
in batch C. The two settled reference goldens are
`tests/e2e/generated-board.spec.ts-snapshots/generated-preview-1280x800-linux.png`
and `generated-preview-1920x1080-linux.png`. Batch A preserves the first functional
run; B preserves prototype-only golden creation after the island gap correction;
C preserves mutations and restored full verification. Earlier evidence is never
removed or overwritten. `implementation-sha256.txt` hashes the implementation
source, final evidence and new goldens.

`docs/spike.md` describes the opt-in atlas and keeps playable generated-board
integration listed as later work. The one-line vite.config.ts UI-test discovery
addition from preflight is the documented mechanical scope exception.
