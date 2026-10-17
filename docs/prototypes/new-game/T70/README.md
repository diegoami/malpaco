# T70 playback, event log and evidence

The acceptance tests drive the real reference route and exported match data. Playback uses a
frozen Playwright clock and ordinary engine replay as an independent oracle. The default
four-seat owner path is captured at both desktop sizes. The designed Very slow computer pace
is exactly 2 seconds (the task requires at least 2 seconds); existing speed values and defaults
remain unchanged.

Event-log acceptance checks a keyboard-operated modal, the initial deal, one ordered entry per
ordinary action, and complete pinned friendly-move/domination histories. Regional army before,
after and signed net changes come from independent engine replay. Casualty checks pair the
correct player and region with losses, separately from capture/friendly transfers. Save/load,
append, reopen and a fresh match test duplication and reset behavior.

The baseline/mock helper is historical and its patch anchors intentionally target the
immutable parent-acceptance commit `10727dc`. Run the following commands only from a separate
checkout of that commit, never from the implemented tree:

```sh
python3 docs/prototypes/new-game/T70/mock-preflight.py baseline --workers=2
python3 docs/prototypes/new-game/T70/mock-preflight.py mock --workers=2
```

The parent used the following full mock command at that same acceptance commit:

```sh
tools/harness/run-unit.sh t70-parent-preflight docs/prototypes/new-game/T70/parent-preflight-unit.log -- python3 docs/prototypes/new-game/T70/mock-preflight.py mock --full --workers=2
```

`--full` runs `npm test`, `npm run build`, then one Playwright invocation containing both new
specs and the existing computer-turn-flow/battle-controls specs. Ordinary built Vite preview
is used; no watcher or dependencies are installed. Optional Playwright flags pass through.
Each run gets a unique directory, raw command logs and a manifest with timings/exits,
original/tested/restored SHA-256 hashes and exact-restoration result. New runs also contain
one compressed tested-inputs archive and a per-file hash index. Inputs cover source, tests,
data, harness scripts, configuration and referenced prototype fixtures, without historical
evidence directories. The helper restores the five production files in `finally`, including
SIGINT/SIGTERM handling. Source files introduced by the mock live only here; no absent
production path is created. Output `dist/` is rebuilt by every Playwright invocation.

Preserved findings:

- `20261017T201327056320Z-baseline`: all 8 playback cases fail on the absent feature.
- `20261017T201428536100Z-mock`: 4 passed, 4 timed out waiting for downloads. Repeated
  frozen-clock exports hit Chromium's download throttle. The tests now inspect the actual
  exported Blob while continuing to click Save game; existing flows retain download coverage.
- `20261017T201616412567Z-mock`: all 8 playback cases passed, with screenshots.
- `20261017T201727721306Z-mock`: both popup smoke cases passed.
- `20261017T201753693853Z-baseline`: all 6 event-log cases fail on absent controls/log.
- `20261017T201855903020Z-mock`: parent full probe passed all 618 Vitest tests, 6 harness
  tests and build; 29/30 browser cases passed, including all 14 new cases. The existing
  1280x800 loaded-computer-capture screenshot fit check found computer status below the
  viewport after the taller header. The only subsequent mock change places this status
  first in the action flex column (`order:-1; margin:0`), preserving the frozen assertions.
  Parent repeats the 30 browser cases to verify this CSS correction. Original failure,
  tested inputs and restoration proof remain untouched.

The first three runs retained only the five mutated UI/style sources (and their then-current
spec/helper copies where recorded), so their input coverage is limited. Later archives include
the full input set above. All completed runs record exact production-source restoration.

`event-log-mock.ts` is a disposable feasibility prototype. It replays only on construction and
processes appended actions incrementally. Its raw result-object text is a prototype shortcut;
the production module describes winner/rank/reason in readable language. The mock does not establish
production quality or the owner's appearance approval. The production host
guards modal Escape so it cannot also stop/select the battle behind it.

- The next browser-only parent probe again passed 29/30: moving status first exposed
  the same height problem at Confirm move-in. The mock now lets Save/Load share the
  playback row instead of forcing a separate full-width header row. No assertion changed.
- `20261017T202218843844Z-mock`: the focused 1280x800 loaded-computer-capture
  regression passed (1/1). Its retained screenshot shows the two-row header, computer
  status and Confirm move-in fitting inside the viewport. Exact restoration is recorded.
  The popup also has an opaque high-contrast background; production still needs its
  readable result text and modal event handling.

Future runs retain Playwright failure contexts, HTML reports and each spec's screenshots
inside their unique evidence directory; another run cannot overwrite those outputs.

## Production reproduction

The runtime code uses `src/ui/gameEventLog.ts`; it never imports the historical prototype.
The projection reconstructs loaded history once, then processes appended actions. Initial
country details collapse, recent events open in view, and an opaque modal has a sticky Close
control. Global pause retains a pending human exchange, cancels both timers and invalidates
queued callbacks. Shared legacy Panel hosts keep their original score markup.

Current commands (run long jobs through `tools/harness/run-unit.sh`):

```sh
python3 docs/prototypes/new-game/T70/production-checks.py positive
python3 docs/prototypes/new-game/T70/production-checks.py regressions
python3 docs/prototypes/new-game/T70/production-checks.py omissions
```

`positive` runs focused units, all units/build, the four Done-when browser specs and the regular
CI edge spec. `regressions` adds the changed header's existing versioned-match/finished-copy
flows in one 54-case browser run. `omissions` removes eight real protections one at a time,
requires a behavioral failure and restores the original bytes in `finally`. All commands use
project-local temporary files, fresh built previews and per-command Playwright output paths.
Each unique run retains source inputs, raw logs/reports/contexts, screenshots, hashes, timings
and input-restoration checks. `production-evidence.json` indexes these receipts.

Measured production findings:

- `20261017T202822698113Z-production-positive`: 4 focused, 622 Vitest and 6 harness tests,
  build and 30 Done-when browser cases passed. The extra edge invocation failed before Vite
  started because its temporary docs-directory config inherited the wrong working directory.
  Original config/spec bytes remain in this input archive. The edge spec moved into the normal
  e2e directory under the owner's Owns amendment; that temporary config was removed.
- `20261017T203039442477Z-production-regressions`: build and 54 browser cases passed,
  including the existing legacy score and save/load flows. The header gives invalid-load
  feedback a full-width row; the retained 1280 screenshot shows capture confirmation fitting.
- `20261017T203147619221Z-production-edges`: all 6 edge cases passed after disabling only
  the new modal's inherited fade animation. Frozen clocks had captured its opening opacity;
  the new assertion requires opacity 1 and the retained screenshot is fully opaque.
- `20261017T203232801059Z-production-omissions`: eight actual omissions failed at their
  expected assertions: computer timer cancellation, dequeued human callback invalidation,
  paused manual refusal, real totals, complete replay, region/player-paired casualties,
  modal Escape isolation and the local Very slow option. Every source input restored exactly.
- `20261017T203339633857Z-production-final-units`: final restored source passed all 622
  Vitest tests, 6 harness tests and build. No core, save-format or policy changes were made.

The two parent acceptance specs retain their frozen SHA-256 hashes. Browser measurements are
Chromium at 1280×800 and 1920×1080; appearance remains the owner's judgment. No CI, independent
review or merge was performed by the producer.

Manual PNG captures are preserved in per-run `captures.tar.gz` archives because the repository
ignores directories named `screenshots`. The index records both archive and member hashes;
original loose PNGs remain locally. Older source/log receipts are unchanged. Future production
wrapper runs create the capture archive automatically. This packaging change adds no runtime
or assertion changes.
