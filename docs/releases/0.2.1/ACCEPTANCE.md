# 0.2.1 release-candidate acceptance

T98 (#247). This document records how the 0.2.1 candidate was checked before the milestone review
and the owner's D4 judgment. Publication is T99, and it waits for both.

0.2.1 ships the owner's decisions on #240 and #244:

- **T96 (#250):** the root page is a game at once, kept in this browser and resumed on refresh.
  New game asks first. Save and Load leave the player's UI.
- **T97 (#251):** minimal cards float over the map and never reframe it. The attack card is
  Fight and Cancel. Seats are named by colour.
- **T100 (#254), after this record:** the game is kept per browser over a reload or a restart (each
  `?seed=N` on its own; Pause, speed and an open choice too), and a scoreboard (the menu's trophy)
  records each player game once. Checked by `persistence.spec.ts` and `scoreboard.spec.ts`; the
  moved candidate's runs are on the milestone review (#253).

The acceptance authority is `docs/plans/release-0.2.0-acceptance.md` together with its
[0.2.1 amendments](../../plans/release-0.2.0-acceptance.md#021-amendments-2026-10-22).

## Candidate

| | |
| --- | --- |
| Version | 0.2.1 in `package.json` and both `package-lock.json` entries; no dependency changed |
| Tested source | `4696b0d` (T98: version, amended matrix and plan). This record follows in a docs-only commit, with the same code |
| Playable build | `npm run package:playable` with `VITE_MALPACO_RELEASE=1` (the legacy views are retired) |
| Archive | `malpaco-playable.tar.gz`, SHA-256 `f2cab664d90f6ce15cde74d3909f7299c405e345e2ff5aa5d0ecf8c9ae30a70e`, built from `4696b0d` in the pinned image |
| `BUILD.json` | `{"schemaVersion":1,"sourceCommit":"4696b0d3cfc1c62c69fbf26ab195cde7168ae53a","minimumNode":22}` |
| `SHA256SUMS` | Every packaged file checks OK after extraction |
| Evidence | Logs are in `artifacts/t98-*` in the session that ran them, not in Git. Uploading them to Drive (`tools/artifacts.py`) is optional |

**The final candidate SHA is not `4696b0d`.** It is the merge of this PR on `main`, built by CI.
As with 0.2.0 (`docs/releases/0.2.0/PROVENANCE.md`), the `pull_request` CI run builds GitHub's
test-merge commit, so its archive's `BUILD.json` names that commit, not the PR head. The milestone
issue names the candidate SHA. T99 publishes the CI archive whose `BUILD.json` matches it.

Every browser run used `mcr.microsoft.com/playwright:v1.63.0-noble`, the image CI uses, with
Chromium and two workers.

## Results

| Run | Result |
| --- | --- |
| `npm test` | 69 files, 895 tests passed |
| `npm run build` | Built |
| `npx tsc --noEmit -p .` | Clean |
| `npx playwright test tests/e2e/release020-matrix.spec.ts --workers=2` | 16 passed, 16 skipped (each case runs once, on the 1280×800 project) |
| Full source browser suite (`npx playwright test --workers=2`) | 485 passed, 99 skipped, 0 failed (28.3 min) |
| The extracted artifact's browser suite (`playwright.release.config.ts --workers=2`) | 383 passed, 100 skipped, 1 failed (25.2 min) |
| `release020-matrix.spec.ts` in both full runs | Every case passed in both runs. This includes the release-only check that the legacy views are retired in the artifact |

**The artifact-run failure** is `responsive-shell.spec.ts:209`, "geographic: safe-area insets and
the 240 px fallback…", at 1920×1080. The test's own setup timed out: a geographic match file took
longer than the 5 s poll to replace the old match. No assertion of the test was reached. It is the
same load-timing kind as 0.2.0's one source failure. Evidence that it is not a defect:

- the same test passed in the source run;
- run alone against the same extracted artifact (`--repeat-each=6`, one worker), it passed 6 of 6.

It is recorded here rather than rerun away.

Skipped tests are sizes a spec sets for itself (such a spec runs once, on the 1280×800 project). The
artifact run also skips the legacy-view suites, which run on the source build only.

**Proof that the amended checks fail without their behaviour (rule 11).** The amended cases were
run against older `src/` trees, with this branch's spec:

| Source | Failed | Why |
| --- | --- | --- |
| Before T96 (`b946a71`) | A1 | No map at once: the setup form is there |
| Before T97 (`926e6ec`) | A2, A3, A5 | The untrimmed card controls |
| Before T97, with A2's control check removed | A2 | The viewBox check alone fails: "opening the card reframes the map" |
| Current tree | None | A1 passed 10 of 10 with `--repeat-each=10`, on fresh random seeds |

## What the acceptance matrix covers

`release020-matrix.spec.ts` drives real clicks and keys. Every staged choice is compared with
an exact saved-match snapshot, and every command with the engine's own next state (the
independent action oracle). The engine oracles are unchanged from 0.2.0. The file keeps its name,
since the plan and the task cite it.

| Case | Covered by |
| --- | --- |
| Viewport matrix | Unchanged from 0.2.0: every acceptance size, the seams, 640×240, and 200% and 400% zoom, on both hosts; nothing acts |
| A1 | **Amended:** the root page in portrait shows the map at once. There is no setup form or Start game. The kept record holds one human and three computers, with the seed shown. The menu has no Save or Load. Help & icon names opens and closes. The kept record (`localStorage`) is unchanged |
| A2 | Place 1 by map and list until the pool is empty. Staging by map, list and keyboard changes nothing. **Amended:** the open card's visible controls are exactly Fight and Cancel. There are no odds, Fight on, Stop or stop point. Opening the card leaves the map's viewBox as it was. A stale or paused Fight is refused. One Fight is one exchange, and nothing continues on its own. A set trades once; a skip changes only the phase |
| A3 | **Amended:** the capture card is exactly −, the amount, + and Confirm move-in, with no fold button, preview or range. A draft survives Escape-fold, rotation, history and pause. Counts stay dashed until one Confirm. At 640×360 both badges stay on their own land |
| A4 | **Amended:** the friendly-move card is exactly −, the amount, +, Move and end turn, and Cancel. A draft survives resize; Cancel changes nothing; one move and handoff |
| A5 | Raid folds to its strip. A list pick stages the target, and covered counts reappear. **Amended:** the reopened card is Confirm raid alone. One raid |
| A6 | Unchanged: no draw shown before the discard; Escape, resize and the clock change nothing; one acknowledgment |
| A7 | Unchanged: pause exact; Fast-forward equals the computer-only oracle; complete history; the history marks exactly the computer actions |
| A8 | Unchanged: a tiny region reached by Countries, Inspect and Focus; the tap places there; a drag and a repeated key act on nothing |
| A9 | Unchanged: above a keyboard and inside safe insets, an invalid amount persists and is refused, and a valid one confirms once |
| A10 | Unchanged, on the test route with files: a load with a card open retires old controls; human loss, Watch and a labelled Stop game; result details; New game. The player's give-up flow is in `instant-start.spec.ts` |
| A11 | Unchanged: each country is hit at its own badge at six seams; overlays clear; no duplicate ids |
| A12 | Automated part only, unchanged: at phone Fit in both orientations, on seeds 7 and 1994, every count is at least 14 px and centred on its own country |
| A13 | **Retired.** Save and Load left the player's UI in T96, so a version-1 save has no main file UI to load into. The test is removed from the matrix. The version-1 path survives only on the hidden `?setup` route, where `responsive-utilities.spec.ts` still covers it. It is no longer a release promise |
| A14 | Unchanged: the first Fit picks 0° or 90° and shows every country. A swipe at Fit does not pan. Rotation keeps the zoom and the capture draft |

The T96 and T97 suites (`instant-start.spec.ts`, `minimal-cards.spec.ts`) and every earlier suite
also ran in both full runs.

## Left for the owner

- **The milestone review**, run by hand with `docs/milestone-review.md` on the milestone issue. The
  main session opens that issue after this PR merges, with the candidate SHA. The verdict is
  recorded there.
- **D4:** the owner's judgment of the candidate, on the milestone issue.
- **A12 and the device pass carry over from 0.2.0 (#244 Q12).** This means:
  - the ten-country read on real phones in both orientations;
  - touch, safe areas, the virtual keyboard, a screen reader and real browser zoom.

  Record them in `docs/releases/0.2.0/DEVICE-REPORT.md`. Until then, A12 is not reported as passed.
  Items worth a fresh look on a device, because 0.2.1 changed them:
  - Cards float over the map: does a tap on a card stay on the card, and a tap beside it reach the map?
  - Does a swipe on the history card close it, and not pan the map?
  - Can a card cover the pair you are fighting with, so that you need Escape-fold to see it?
  - Is Fight, one exchange per press, comfortable over a long battle?
  - Does a refresh resume the game, and does New game's give-up confirmation work on a phone?
- **The exact-head CI result** of this PR's final commit, linked on the PR when it completes. This
  document cannot record its own commit's CI.
