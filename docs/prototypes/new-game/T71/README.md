# Compact and Detailed turn panels

The shared reference/geographic game header offers **Panel detail** with Compact
and Detailed options. Compact is the session default. The selection stays with
the existing presentation preferences through loading a supported match or
starting another game; it is not written into match saves or browser storage.
Changing it updates presentation without a controller action or timer restart.

Both modes retain army totals, round/status, pause, game speed, event-log access,
file controls and required human decisions. Compact hides optional dice and
duplicate battle explanations. Detailed exposes dice in a bounded scrollable
area. Disabled battle/capture actions are omitted during automatic play;
human capture, movement and loss choices remain visible and operable.

The sidebar uses consistent turn, action and recent-log tracks in each mode.
Compact reserves 320 local CSS px for active content and Detailed 380; the
existing large-desktop zoom remains. Required controls use the reserved area;
reinforcement can leave space. Owner judgment of that reserve and information
density is required before merge.

## Evidence and reproduction

`fixtures/` contains legal seeded reference/geographic action prefixes and the
complete discovery trace. `parent-acceptance/FROZEN-ACCEPTANCE.json` pins the
independently authored acceptance, fixtures and adapted existing battle suite.
`parent-acceptance/PRE-DISPATCH.md` explains baseline failures, disposable
positives, real omission controls and the corrected parent test typo. Original
optional-detail assertions and all prior raw outputs remain in the lossless
`archives/` evidence; loose local originals are preserved as well.

`parent-preflight/mock-src/` is the proven four-file candidate. Formal adoption
changes its CSS provenance comment only; `implementation-20261018/adoption.json`
records original/candidate/production hashes and exact normalized equivalence.
The implementation directory retains fresh command streams, input snapshots,
phase-labelled screenshots/videos, source stability and frozen-acceptance hashes.
This preserves the applicability of the parent's negative and omission evidence.

The task commands are:

```sh
npx playwright test tests/e2e/compact-panels.spec.ts
npx vitest run tests/ui/compact-panels.test.ts
npm test
npm run build
```

The retained validation runner executes browser commands inside the pinned
Playwright 1.63.0 image with two workers and an isolated port/output directory.
It also runs the ten affected browser suites together: battle controls, friendly
movement, versioned matches, playback controls/edges, event log, computer flow,
reference complete game and geographic board/review guards. The task amendment
allows dice assertions to select Detailed and disabled inactive capture actions
to hide; rules, replay, timing, stale-input and mandatory-choice checks are
preserved. Independent review, owner appearance judgment and final CI are
separate merge requirements.
