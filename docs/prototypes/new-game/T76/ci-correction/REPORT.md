# T76 CI hit-target correction

The T76 toolbar intercepted geographic province input squares at1280x800.
It now stays entirely inside the visible sidebar in both topbar states. Board
geometry, the52px collapsed-sidebar rail, game state, saves and RNG are unchanged.
This is the bounded correction accepted by the parent, within currentT76.

## Diagnosis and changed files

CI39262174494 atd8d2bbcd finished374/380 source cases: six1280 geography failures,
zero skipped/flaky; all1920 cases passed. Package/extracted steps did not run.
Pinned reproduction confirmed the same six corpus failures. At1280, the toolbar
rectangle was x874,y167.375,width40,height258. Actual failed40px hit-square points
landed on its NAV background, Game actions/Cards buttons or SVG children. Seed513
also had a second obstructed province beyond the first canonical failure.
No geographic feature or army font caused the failure.

- `src/styles.css`: the only runtime file changed. Correct hiding-selector
  specificity restores the intended two-toggle expanded state. Those toggles
  occupy reserved sidebar-heading space. With only the topbar hidden, a compact
  horizontal toolbar occupies space above the sidebar turn card. Phase text stays
  in that card; redundant rail summary is hidden while the sidebar is visible.
  Sidebar-hidden controls remain in the original52px vertical rail.
- `tests/e2e/icon-actions.spec.ts`: four new cases cover both hosts and sizes,
  each using reinforcement and mandatory capture with both topbar states. They
  require the whole toolbar outside the board, the correct visible controls,
  physical toolbar/sidebar command reachability and exact saved-state equality.
  Save/load helpers use their original controls directly when already visible;
  hidden controls still require the Settings surface. No old assertion removed.
- `docs/spike.md`: correct the former statement that toggles sit on the board.
- This evidence directory and `review-r2/`: retain diagnosis, controls, commands,
  hashes, immutable-artifact identity, raw-result archives and parent evidence.
  `RUN-NOTES.md` receives append-only plan/progress/END entries.

The parent inspected corrected1280 expanded and topbar-hidden reinforcement and
final capture screenshots, including the mandatory row, and requested no visual
change. This is a parent inspection of the necessary correction; historical
owner approval and independent approval are not represented as a new review.

## Negative controls and the required-choice edge

Before runtime edits, the unchanged canonical1280 corpus failed6/6 and the new
toolbar guard failed4/4. Diagnosis/evidence was committed and pushed at566aadcb
before changing CSS. The first candidate passed12/12 canonical corpus cases and
4/4 toolbar cases. Replacing its stylesheet with original CI CSS reproduced6/6
geography and4/4 toolbar failures; `finally` restored saved bytes and SHA exactly
(`restoration.json`). That proof concerns the first candidate with a4px row gap.

Adding mandatory capture to the same guard exposed a necessary width edge:
both1280 cases failed physical row containment, while both1920 cases passed.
Nine34px buttons with eight4px gaps require338px in a330px row. The final3px gap
fits exactly330px. The full final120-case regression then passes the strengthened
guard. No assertion,40px target, font, generator, rules, save or RNG was changed.

## Final commands and results

Every command ran in pinned image
`sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`,
network none, uid1000, private1GiB shared memory. `full.py` stopped on any failing
command; there was no retry. All recorded runtime/test/package input hashes
match across these final commands. Browser results have zero skipped/flaky.

```text
npx playwright test tests/e2e/hideable-panels.spec.ts --workers=2
8 passed (12.2s)

npx playwright test tests/e2e/icon-actions.spec.ts tests/e2e/compact-panels.spec.ts tests/e2e/battle-panel-fit.spec.ts tests/e2e/cards.spec.ts tests/e2e/cards-result-layout.spec.ts tests/e2e/battle-controls.spec.ts tests/e2e/battle-accessibility.spec.ts tests/e2e/playback-controls.spec.ts tests/e2e/game-event-log.spec.ts --workers=2
120 passed (4.2m)

npx playwright test tests/e2e/geographic-board.spec.ts --workers=2
30 passed (2.0m)

npm test
9 harness tests passed; 60 Vitest files /818 tests passed (54.28s)

npm run build
0.1.1; both TypeScript checks passed; 66 modules; Vite built in211ms

npx playwright test --list
Total: 384 tests in38 files
```

The final source browser suites executed158 cases. The384 count is the canonical
inventory for parent CI, not a claim all384 ran locally. The corrected diagnostic
also checks all46 actual40px hit squares in12 scenes. Board, map, stage, sidebar
and topbar rectangles equal the original diagnostic numbers exactly; see
`geometry-comparison.json`. Frozen hideable and geographic acceptance hashes,
all TypeScript runtime inputs and package/dependency bytes remain unchanged.

## Preservation, archives and limits

`diagnosis-manifest.json`, `controls-manifest.json` and
`full-validation-manifest.json` record every archived member's bytes, SHA and
POSIX mode, plus split-part and joined archive hashes. Archive readback verifies
each regular member and the concatenated parts. Prior tracked reports/archives
and retained raw directories remain. The ignored-output limitation follows.

| Archive | Bytes | Members | Parts |
| --- | ---: | ---: | ---: |
| diagnosis | 3,621,505 | 40 | 1 |
| controls | 12,273,420 | 88 | 1 |
| full-validation | 99,621,316 | 348 | 6 |

An evidence-routing omission has an explicit preservation limit: the first
12-case geography positive run lacked `GEOGRAPHIC_EVIDENCE_DIR`, so it wrote the
ignored `screenshots/geographic-*` defaults. No tracked files existed there;
prior ignored-file existence and identity were not inventoried and are unproven.
The current12 outputs were copied into that attempt and archived. The original
runner is retained. Before any further command, geography routing was added and
all remaining default output roots inventoried. Final byte/mode inventories
match exactly after subsequent commands. There was no extra repeat merely for
the routing correction. Do not infer complete preservation of pre-attempt
ignored geographic screenshots from this report.

The parent's curated failed-CI pack is copied byte-exact under `failed-ci/`:
834,596bytes/13members, including the full CI log, metadata, inventories, complete
summary, geographic details and all six error contexts. CI failed before its
success-only geography screenshots; no CI failure PNG is claimed. The parent's
full screenshot/HTML zip originals remain there and were not duplicated here.

`../review-r2/` retains the historical Opus5.5 Medium APPROVE atd8d2bbcd:
CLI0,453.436s, no denials/native failure; harness4 was omitted literal FILE
acknowledgments for split suffixes. Parent verified the20 flagged parts and three
joined hashes. Its six-part90,045,479byte archive has446 verified members. This
approval predates new CSS. Initial review/rework evidence stays immutable.

Historical `../rework1/check.py` and `check02.py` are distinct one-shot attempt
drivers with intentionally unique output directories, not reusable canonical
tests: `check.py` stopped at the10/12 native-scroll measurement failure before
its mutation loop; `check02.py` ran the corrected12/12 positive and four deletion
controls, each4/4 failures/restored exactly. Neither old script/report was edited.

## Exact artifact and handoff

The six-file immutable build is `.cache/T76-preview-ci-correction/` in this
worktree, with actual paths/bytes/hashes in `dist-files.json`. CSS is
`assets/index-DEbt5Y0R.css`, SHA256
`839eaa9c28c896debc023222e3e29107b69e82d8328c3cd8230f385fc36218f3`.
The JS entry filename changes to `assets/index-D3fDmbKu.js`; its bytes remain
SHA256`87313292303e15a7c98afa06c5026c162bfe86041c49d26a2dadc6a15015a4d7`.
HTML has new asset references; worker/font/license bytes remain unchanged.
Use this new manifest, not the historical rework1 manifest.

No further implementation or tests are planned. No review, CI, merge, release or
new task was started here; every implementer commit uses skip-ci. Parent owns
any additional review authorization, one corrected-head CI and exact-artifact
publication. Prior R4/R5 remain deferred; R6 remains owner-approved.
