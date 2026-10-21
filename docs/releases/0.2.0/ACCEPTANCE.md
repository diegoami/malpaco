# 0.2.0 release-candidate acceptance

T89 (#208). This document records how the 0.2.0 candidate was verified before the independent
review and the owner's D4 judgment. Publication belongs to T90 and waits for both.

## Candidate

| | |
| --- | --- |
| Version | 0.2.0 in `package.json` and both `package-lock.json` entries; no dependency changed |
| Candidate source | `4d2dedc` (T89 code). This document follows in a docs-only commit, with the same code |
| Playable build | `npm run package:playable` with `VITE_MALPACO_RELEASE=1`: the legacy views are retired, and version-1 saves load in the main screen (R4, A13) |
| Archive | `malpaco-playable.tar.gz`, SHA-256 `82d6fb253b28d5282302934b5d815f8c2863d091a7b6e898c389539d8c8411aa` (built from `4d2dedc` in the pinned image) |
| `BUILD.json` | `{"schemaVersion":1,"sourceCommit":"4d2dedc27a28f452b6cdb47a0746081b8140c09a","minimumNode":22}` |
| `SHA256SUMS` | Every packaged file checks OK after extraction |
| Evidence | Logs and the archive are on Drive under `T89-acceptance/` (`tools/artifacts.py`), not in Git |

Every run used `mcr.microsoft.com/playwright:v1.63.0-noble`, the image CI uses, with Chromium.

## Results

| Run | Result |
| --- | --- |
| `npm test` | 68 files, 893 tests passed |
| `npm run build` | Built |
| Full source browser suite (`npx playwright test --workers=4`) | 463 passed, 72 skipped, 1 failed |
| The extracted artifact's browser suite (`playwright.release.config.ts --workers=4`) | 363 passed, 73 skipped, 0 failed, no retries |
| `tests/e2e/release020-matrix.spec.ts` (source and artifact) | Every test passed in both runs, including the release-only check that the legacy views are retired in the artifact |

About the source-suite failure:

- **The failure:** `computer-cards.spec.ts:108` at 1920×1080. A geographic-map load did not finish within the 5 s poll while four workers shared the machine.
- **Reruns:** the same test passed 6 of 6 when rerun alone in the same image, and it passed in the artifact run.
- **What it means:** it is recorded here as a load-timing failure, not a defect. CI runs with two workers. It stays visible rather than being rerun away.

Skipped tests are the sizes each new spec sets itself (they run once, on the 1280×800 project). The
artifact run also skips the legacy-view suites, which run on the source build only.

## What the acceptance matrix covers

`release020-matrix.spec.ts` drives real clicks and keys. Every staged choice is compared with
an exact saved-match snapshot, and every command with the engine's own next state (the
independent action oracle).

| Case | Covered by |
| --- | --- |
| Viewport matrix | Every acceptance size from 320×568 to 1920×1080, plus 800×540, the width seams 680 and 1100 ±1, the height seams 320, 500 and 600 ±1, 640×240, and 200% and 400% zoom (640×400, 320×200). Both hosts; nothing acts |
| A1 | Setup in portrait: seed, seats, files and help, then Start makes that game |
| A2 | Place 1 by map and list until the pool is empty. Stage by map, list and keyboard with no change; odds shown. A stale or paused Attack is refused; one Attack is one exchange; Fight on appears after it. A set trades once; a skip only changes the phase |
| A3 | A capture draft survives fold, rotation, history and pause. Counts stay dashed until one Confirm. At 640×360 both badges stay on their own land |
| A4 | A friendly-move draft survives resize; Cancel changes nothing; one move and handoff |
| A5 | Raid folds; a list pick stages the target with its preview; covered counts reappear; one raid |
| A6 | No draw shown before the discard; Escape, resize and the clock change nothing; one acknowledgment |
| A7 | Pause exact for 10 s; Fast-forward equals the computer-only oracle; complete history; Changes marks exactly the computer actions |
| A8 | A tiny region reached by Countries, Inspect and Focus; the tap places there; a drag and a repeated key act on nothing |
| A9 | Above a keyboard and inside safe insets, an invalid amount persists and is refused, and a valid one confirms once. Rotation never commits |
| A10 | A load with a card open retires old controls. On a human loss, Watch shows and Stop game keeps its label (D); result details, standings and New game work |
| A11 | Each country is hit at its own badge at six seams; overlays clear, no duplicate ids |
| A12 | Automated part only: at phone Fit in both orientations, on seeds 7 and 1994, every count is at least 14 px and centred on its own country |
| A13 | A version-1 save loads into continued play from the main file UI and saves back byte for byte. The test runs in the extracted artifact, so the upload is a real one |
| A14 | The first Fit picks 0° or 90° and shows every country. A swipe at Fit does not pan. Rotation keeps the zoom and the capture draft |

The earlier 0.2.0 suites (T79–T88) also ran in both runs. They are listed in
`DEVICE-REPORT.md`.

## Left for the owner

- **A12, the ten-country read** on real phones in both orientations. Record it in the table in
  `DEVICE-REPORT.md`; until it is filled, A12 is not reported as passed.
- **The device pass** in `DEVICE-REPORT.md`: real touch, safe areas, the virtual keyboard, a screen
  reader and real browser zoom.
- **The independent review** of the T89 PR, by an engine other than this session's
  (`node tools/review.mjs --pr <n>` from the owner's machine), with its findings answered before
  any merge.
- **D4**, the owner's judgment of the candidate, recorded on the milestone issue (#222 Q4).
- **The exact-head CI result** of the final T89 commit, linked on the PR when it completes. This
  document cannot record its own commit's CI.
