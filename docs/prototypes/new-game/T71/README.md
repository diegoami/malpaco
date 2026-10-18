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

The sidebar uses consistent turn, action and battle-history tracks in each mode.
Compact reserves 320 local CSS px for active content and Detailed 380; the
existing large-desktop zoom remains. Required controls use the reserved area;
reinforcement can leave space. Owner judgment of that reserve and information
density is required before merge.

The sidebar retains every described battle entry for the loaded match in chronological
order. Scroll upward to read older events. New events follow the bottom only when
the reader was already there; an older reading position is retained. Loading or
starting a match replaces its history without mixing entries. The list scrolls
inside its bounded card in shared legacy and supported game hosts. Native browser
maximum detection accommodates the existing desktop zoom without a timer or observer.
The event-log popup continues to provide its separate action history.

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
The original implementation directory retains fresh command streams, input snapshots,
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

The owner-requested full-history addition uses the two byte-exact final mirrors
under `parent-preflight/log-retention/mock-src/`. Its baseline, zoom diagnosis,
legacy goldens and cap/order/scroll omission controls are described in
`parent-acceptance/log-retention-PRE-DISPATCH.md` and retained in the dedicated
parent archive. The 19-file acceptance manifest also pins the adapted legacy
slice assertions: full count, unchanged prior prefix and newest chronological
last row. Original test bytes remain preserved.

`implementation-log-20261018/` records the addition's source lineage and fresh
validation. Its affected aggregate includes the original ten suites plus slice,
including unchanged board/panel/dialog goldens. The earlier independent Kimi
approval covers the four-source mode/layout implementation; the history addition
requires its own focused independent review before final CI and delivery.
