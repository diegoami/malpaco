# T70 acceptance preflight

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

From this worktree, reproduce the negative baseline or the disposable positive mock:

```sh
python3 docs/prototypes/new-game/T70/mock-preflight.py baseline --workers=2
python3 docs/prototypes/new-game/T70/mock-preflight.py mock --workers=2
```

For all four Done-when commands, the main session runs one full mock preflight:

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
production must describe winner/rank/reason in readable language. The mock does not establish
production quality or the owner's appearance approval. In particular, the production host
must keep Escape used to dismiss a modal from also stopping/selecting the battle behind it.

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
