# T33 reference playable validation

The game behavior is supplied by the merged reference-board, ordinary-turn, victory, save/load and computer slices. This integration/package work adds no game algorithm, rules, RNG, historical save or map change. The new acceptance drives actual human controls and actual scheduled computer actions; pure expected-state replay observes the result, never injects browser engine state.

## Reproduce the contract

```sh
npx playwright test tests/e2e/reference-complete-game.spec.ts
npm run package:playable
npm test
npm run build
git diff --check
```

Pinned evidence wrappers: `python3 docs/prototypes/new-game/T33/run-browser.py <fresh-label>` runs the first command in the established Playwright 1.63.0 image. `python3 docs/prototypes/new-game/T33/run-release.py` packages using the existing release machinery, extracts into a fresh directory outside the checkout, verifies SHA-256/HTTP/launcher isolation, and repeats complete-game plus entry acceptance against the extracted server. Recipients run `node serve.mjs` with Node.js 22+; the package contains no source checkout or npm dependencies.

## Measurements

| Contract | Retained result |
| --- | --- |
| DW1 real human/computer complete game | `evidence/baseline-complete-27oe007b/report.json`: 2/2 desktop cases, 35.1 seconds each |
| DW2 package and extracted smoke | `evidence/release-z6kxqt0f/report.json`: 9 package files / 8 checksum entries, launcher and 4 HTTP paths verified outside checkout; 6/6 browser cases, including full game at both sizes |
| DW3 units/build/affected browser compatibility | `evidence/final-units-1dks6w8f/report.json`: 583 units; `evidence/baseline-build-ngxn3tck/report.json`: build; `evidence/affected-compatibility-9caaf95n/report.json`: 56/56 pinned cases |
| Genuine negative controls | `evidence/controls-5l4jbn86/report.json`: omitted computer dispatch and omitted loaded-session replacement each fail both new desktop cases by behavior; distinct original/mutant bytes and exact restoration retained |

The frozen `fixtures/conquest.json` contains 809 ordinary actions: 579 human and 230 computer. The test uses one human / one Normal computer, seed 7 and domination off to reach elimination and full conquest after 14 rounds. A legal friendly move ends a turn; a real pending-capture download survives browser reload and file upload; exact state/history is checked at each computer handoff and at the winner. Finished input freezes and New game restarts. Untouched `entry.spec.ts` separately checks the default one-human/three-Normal-computer roster and explicit historical routes.

`feasibility.mjs` retained the searched fixture results: the simple human fixture policy loses at seeds 1994, 42 and 0–6, and wins at seed 7. This deliberately selected integration fixture is not a game-balance or all-seed success-rate claim. The earlier `feasibility-TwEDr3` trace used omitted human capture amounts; the frozen `feasibility-X47b9f` trace records actual UI amounts explicitly. Both are preserved; no hidden state or game constraint changed.

The source behavior already passes this milestone integration. Its meaningful negatives are actual source deletions followed by restoration, not a false claim that the inherited game was defective before these docs/tests. The package wrapper's first run (`release-qixknzl8`) failed because the container lacked worktree Git metadata. The correction mounts that existing metadata read-only at its original absolute path; package code is unchanged. Every failed output/source archive remains retained.

## Artifact identity and review

The tested package source commit is `d77bd3126392404a44b8207c8844702872dbe718`; SHA-256 is `af653a9740f5904f3c8687ac730fe20ce28467896a89a607ba6218bbc123dfea`. Its product files are unchanged by subsequent evidence-only commits. The exact package is retained under `evidence/release-z6kxqt0f/malpaco-playable.tar.gz`; source inputs and raw command/browser outputs are archived with member hashes. `artifacts.json` indexes retained evidence/previews.

`previews/` contains opening, battle, friendly move, computer turn, capture choice, save/resume, elimination and winner screens at both desktop sizes. At the owner's request, the tested package, extracted files, saves and screens were copied to Windows at `C:\Users\diego\malpaco-preview`; open `OPEN-REVIEW.html` there. The copy receipt verifies all 31 manifest entries and the exact package hash. Linux originals remain intact.

The owner judges appearance and pacing; automated pass counts do not supply that approval. Readability (#137), direct map attacks (#138), coastline (#111) and shared-border (#117) work remain separate explicit scope decisions. The fixed reference board is a development milestone; generated boards remain final-game work. Nothing here claims to complete those changes or to alter the historical capture-all route.
