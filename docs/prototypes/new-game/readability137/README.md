# Army-first region labels — issue 137

The owner requires remaining presentation and interaction work before the game can be shown. This bounded change removes the duplicate seat number, gives each army count the same ownership silhouette used in the score legend, and makes visible names smaller/lighter until hover, keyboard focus or selection. Full name/seat/army/owner descriptions remain in accessible labels and native titles. Existing battle selection still names its source and target.

The four existing palette paths have extents94×34 (rounded pill),76×34 (hexagon),60×34 (rectangle),76×38 (diamond). They normalize to44×20 map units: the old badge width with two extra height units to contain bold count glyphs. These are derived drawing dimensions and designed presentation choices, not rule values. All T63 geometry, hit paths, regions, routes, core, saves and actions remain unchanged.

Measured evidence:
- `evidence/run-jt3i08w3`:4 actual-negative browser cases on unchanged game; combined seat/army text and absent emphasis fail at both sizes. Original sources, output and opening screens retained.
- `evidence/run-l7fcflsn`:initial4/4 positive; later fit checks exposed issues not covered by the first probe.
- `evidence/run-14ndxxtw` and `run-javii4jo`:existing nonoverlap assertions catch overly wide pill badges; both541-action games and battle controls already passed. `diagnose-fit.py` adds temporary rectangle diagnostics and restores the exact test in finally; its failed run is also retained. The pill extends beyond its straight segment, so uniform scaling was insufficient.
- `evidence/run-eeg2fq6f` and `run-656ddr18`:strict large-stack containment catches bold143 extending less than one CSS pixel below the18-unit badge. The latter retains exact rectangles; assertion condition unchanged.
- `evidence/run-_ag5bjv0`:6/6 focused cases pass after44×20 normalization; intentional two-reference-golden regeneration. Its source-change flag correctly records that snapshots were updated during this run.
- `evidence/controls-azhhgapr`:4 source-deletion classes caught, both source paths restored byte-exact: ownership shapes, quiet names, interaction emphasis, accessible ownership. Complete original/mutant sources and raw runs retained. These checks preceded the final badge-height-only adjustment.
- `evidence/run-g02rj6sl`:final18/18 pinned cases without snapshot updates; all recorded source bytes unchanged during run. Includes actual opening/four-seat ownership,143-army real-save upload, mouse/keyboard/touch, selected-region context, Stop/threshold/pending capture min/max/stale controls and both541-action complete replays.
- `evidence/checks-po91arb5`:583 units, TypeScript/build and whitespace pass on final presentation bytes.

`previews/` has matched before/opening/selected/large-stack/touch captures at1280×800 and1920×1080. Main inspected opening and selected views; owner aesthetic judgment remains required after the requested interaction and coastline/border pass. No next presentation is claimed complete here.

The two original reference opening goldens and the two original assertion files are in `originals/`; their only declaration amendments are combined seat·army text → army-only text and those two opening images. Geometry, fit, replay, rules and interaction assertions are preserved. No unrelated goldens change. The diagnostic test gains rectangle values, preserving the strict containment condition. Raw directories remain local and ignored; every run includes source/raw archives plus member hashes and command/exit reports. Failures are retained rather than overwritten. `index.py` indexes all preserved nonraw files.

Reproduction:
```sh
python3 docs/prototypes/new-game/readability137/run.py
READABILITY_COMPATIBILITY=1 python3 docs/prototypes/new-game/readability137/run.py
python3 docs/prototypes/new-game/readability137/checks.py
python3 docs/prototypes/new-game/readability137/inheritance.py
```
The browser runner uses the established pinned Playwright1.63 container and read-only main dependency mount with isolated Vite caches. It creates a fresh evidence directory per run; never update snapshots for ordinary verification. `review-tools/` retains local invocation-specific reviewer permissions and evidence-retention hook; canonical harness files remain unchanged (follow-ups125/143 are separate).

Independent review: MiniMax M3/thinking approves reviewed cb6b4a0 in479.946s, exit0/round1. Full final/session, three findings, parent assessment and46fresh retained files live in `evidence/review-final/`. Seven source/raw archive pairs verify; both green reviewer source manifests match production/test bytes. Four original source-deletion controls rerun on final44×20badges plus independent combined-label mutation fail; sources restore exactly. Parent classifies reviewer scratch copies separately and retains its initial import-classification error. Review wording corrections are in the assessment; no post-review runtime/assertion changes.
