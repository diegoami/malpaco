# Geographical fixed-reference drawing — T64 / issue111

The reference interface uses an original geographical drawing following the direction approved in [T22/#66](https://github.com/diegoami/malpaco/pull/67#issuecomment-6209845674). The owner explicitly allowed visual countries, label anchors, ports and route shapes to move. The current 61 land/15 sea graph,46 country identities,9 islands, bonuses, canonical T63 engine map, ordered deals and saves remain unchanged. T22G proposed a different graph; its topology is not imported.

`layout.mjs` is a pure deterministic construction from the canonical T63 board. It uses the existing outer country cycle and shared graph-face vertices to build coherent subdivisions, with seeded coast variation and exact shared coordinates. The ten-country ladder retains a bent broad-cell subdivision so its hit areas stay usable. Dyadic1/1024 coordinates avoid numerical residuals without changing the existing geometry assertions. These are original [designed] presentation choices developed in the retained probes. Generated-board integration belongs to T36; shared-border curvature belongs to T65.

Country labels reserve the existing 40px hit square and 44px Euclidean spacing. Native measurement found 45-unit emphasized label bounds; 47 vertical/44 horizontal separation accounts for 20-unit product badges and 1 unit clearance. `render.mjs` places island captions in water, outside route strokes, and gives the standalone prototype the existing quiet/emphasized name hierarchy. Actual browser bounds, hit tests and all 46 selected countries protect this independently. Production stars use drawing anchors; saves retain canonical T63 coordinates.

`board.json`, `map.svg` and self-contained `preview.html` are generated assets. The application imports only the SVG; expensive construction does not run during play. Main intentionally amended only reference painted-geometry/route expectations and two opening goldens. Their exact originals are retained in `originals/`; every semantic, replay, fit, timing and other existing assertion stays unchanged.

Reproduce with the established pinned Playwright 1.63.0-noble image/read-only shared dependencies:
```sh
node docs/prototypes/new-game/T64/construct.mjs --check
python3 docs/prototypes/new-game/T64/checks.py --focused
python3 docs/prototypes/new-game/T64/checks.py
python3 docs/prototypes/new-game/T64/run.py
COAST_COMPATIBILITY=1 python3 docs/prototypes/new-game/T64/run.py
python3 docs/prototypes/new-game/T64/inheritance.py
python3 docs/prototypes/new-game/T64/controls.py
```
`construct.mjs [fresh-output-directory]` preserves generated files, exact construction inputs and hashes; it refuses an existing explicit output. With no argument it creates a fresh evidence directory. `--check` compares all three installed assets exactly. No golden update is part of these commands. Browser runs preserve source/raw archives, member hashes, exits and input-stability checks; final unit checks archive project source/test inputs. `index.py` hashes nonraw evidence/deliverables; raw directories remain local with complete compressed originals. Ignore generated Python bytecode only.

Retained evidence landmarks:

| Evidence | What it establishes |
| --- | --- |
| `feasibility-baseline.json` | Immutable T63 passes the unchanged T62 contract. |
| `shape-probe-*`, `geography-probe-*`, `tutte-probe-*`, `dual-probe-*` | Every accepted/rejected shape, actual failures, exact scripts and native captures; chronological explanation retained in `evidence/README-before-production-summary.md`. |
| `checks-q7lynffn`, `run-b6bhqjou` | Identity fails the new coastline assertion;4invariants already hold. Old actual renderer fails atbothdesktop sizes; standalone artifact is absent. Earlier JSON-loader failure `run-hs4c0g2s` is infrastructure, not a behavioral proof. |
| `mock-preflight-xs4xoemy` | Disposable5focused/588fullunits/build/8browser positive; all5temporary source/asset paths restore exactly. |
| `run-1fd1lbm6`, `run-qj68usrq`, `run-osz33r8n`, `run-mq0mq4rh` | Native on-land caption and opening/selected label failures retained without weakening the guards. |
| `label-diagnose-OCKjAe`, `dual-probe-pBNspT`, `run-gbtg5_5g` | Measured emphasized glyph bounds, corrected layout, allunchangedT62constraints, final disposable8/8browser proof with exact restoration. Old technical paint targets are retained under `acceptance/board-before-*`. |
| `checks-b4_j8vjo`, `build-H3ndEH`, `checks-toehrisd` | Real pure constructor matches the locked candidate; generated assets reproduce;588units/build/whitespace pass. |
| `run-1omrt5d_` | Intentional regeneration of only the2declared reference opening goldens; source-stability flag correctly records those writes. Initial missing compatibility selector `run-f2_b0xmu` retained. |
| `run-9lsg_1fb` | 82/82affected pinned cases on stable recorded inputs, including both541-action complete games, direct attacks, save/load, computer gates and readability. |
| `inheritance-hjpzemxt` | 451inherited files; only the renderer, declared paint expectations and2goldens differ. T22/T63/core/other tests remain exact. |
| `controls-1332g1ae` | Eight actual-source assertion negatives: identity, graph metadata, inland port, invalid label, stateful construction, old paint, old star positions and caption reservation deletion. All6source/asset files restore exactly. Caption control regenerates fresh assets before testing. |

The matched full views, T22 reference and coast close-ups support owner judgment. Automated geometry/input checks do not establish appearance or pacing approval; the owner judges the T33 milestone after the requested coastline and border pass.

Final production receipts: `checks-5dytkdwr` passes 588 units/build/whitespace after mutation restoration; its archived inputs and output hashes match. `run-238x6nzl` passes 8 final browser cases with matched full views/close-ups and exact current input hashes. `run-1fmrg5u8` passes 2 direct-input cases after forwarding `ATTACK_EVIDENCE_DIR` into each fresh raw archive. The earlier82-case run predates only that output-routing fix and additional close-up capture calls; runtime/assertions are identical. Its 148 direct captures/saves fell into the inherited suite’s `screenshots` fallback, all within that run’s recorded time window; exact originals remain and are archived/hash-verified under `compatibility-direct-captures-gftxlp99`. `integrity-syidvi9d` verifies current final sources, source/raw archive members, unit outputs and the two declared compatibility-only input differences. `previews/provenance.json` records 38 unchanged PNG copies and their exact source paths/hashes.

Coverage completion: `run-4elvj6jz` passes8additional existing accessibility/friendly-feedback cases, with source/raw archives and current inputs verified. The combined affected set is82+8cases; the compatibility selector now includes those two suites, and independent review runs all90 together. That is the only later configuration difference from the final eight-case/route-smoke manifests; their default selection, runtime and assertions are unchanged. The earlier integrity record applies at its recorded checkpoint; `coverage-integrity-*` documents this bounded selection expansion. No additional CI run was started.
