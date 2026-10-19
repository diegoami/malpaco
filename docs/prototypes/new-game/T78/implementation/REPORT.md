# T78 production implementation evidence

The production boundary is `src/ui/workspaceState.ts`. It creates independent UI
state, applies detached top-level replacement patches, retains draft strings
verbatim, reconciles controller pair/generation identity, and projects only
published controller scalars and public card fields. Confirmation is inert data.
No UI is mounted, and no controller action or engine action is invoked.

## Files and reasons

- `src/ui/workspaceState.ts`: the sole runtime addition; controller-owned game
  state is never retained or cloned into UI state.
- `tests/ui/workspace-state.test.ts`: appends two tests after the unchanged frozen
  17-test prefix, checking detached reconciliation and exact projection/nested
  offered-set allowlisting. The original six legal replay fixtures remain intact.
- `implementation/run-check.py`: captures command output, native exit, elapsed
  seconds and SHA256 values into new files, refusing reused labels.
- `implementation/run-mutations.py`: runs eight production-source negative
  controls, restoring source from saved bytes in `finally` after every mutation.
- `implementation/audit-preservation.py`: checks frozen test/notes prefixes,
  protected task/boundary/preflight bytes, runtime scope and output hashes.
- `implementation/*.txt` and `*.json`: original measured command outputs and
  receipts; `REPORT.md` explains their scope and limits.
- `RUN-NOTES.md`: append-only implementation plan, progress and END handoff.

## Acceptance commands

```text
npx vitest run tests/ui/workspace-state.test.ts
Test Files  1 passed (1)
     Tests  19 passed (19)
native exit: 0 (green-01 and restored-green-01)

npm test && npm run build
harness: 9 passed, 0 failed
Test Files  61 passed (61)
     Tests  837 passed (837)
tsc --noEmit -p src/core && tsc --noEmit && vite build
66 modules transformed; built in 245ms
native exit: 0 (done-when-full-01; successful && chain proves both commands succeeded)
```

The full command took 62.400 seconds on the production source. Its source SHA256
is `01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34`;
test SHA256 is `ad193088539ff97ec2d46c9c3e37a549484151092a922a766392ecaeaa18d5cf`.
The adapter is intentionally unmounted, so the Vite bundle is not an activation
or browser-interaction test. TypeScript checks include the new source.

## Red/green and production controls

`red-01` retains 18 failures/1 pass, including an error in my appended test setup:
its deep freeze traversed the poisoned accessor before the adapter was called.
Only the appended setup was corrected to shallow freeze. `red-02` then failed
18 behavioral checks/1 pass against the inherited no-op adapter, without loader
failures. Both new tests failed on missing behavior. Production `green-01` and
byte-restored `restored-green-01` each passed all 19 checks.

Every negative control ran the complete 19-test file against changed production
source and returned native exit 1 with behavioral failures:

| Production mutation | Failed checks |
| --- | ---: |
| Retain confirmation after pair/match change | 6 |
| Keep UI state on match replacement | 1 |
| Share nested UI histories | 2 |
| Share public hand-count dictionary | 1 |
| Spread unknown nested offered-set fields | 1 |
| Mutate live core history while projecting | 6 |
| Serialize private card state while projecting | 1 |
| Parse capture draft as a number | 13 |

Each control has its own untouched TXT output and JSON native-exit/hash receipt.
The runner asserts behavioral test failures rather than merely a nonzero exit.
Saved source bytes were restored in `finally` after each control and matched the
same baseline SHA256; the restored green run precedes the final full command.
The six legal replay round trips preserve exact complete core state, history,
RNG, controller view, public card view and empty scheduler queue. Private-hand,
deck-access and unknown-field traps remain active.

## Preservation and limits

`preservation-01.json` records comparisons with frozen commit `19f2565c`:
original 17-test bytes remain an exact prefix, original notes remain an exact
prefix, and task/boundary/all preflight files retain their original bytes. The
only runtime source diff is `workspaceState.ts`. No historical preflight runner
was executed, and no preflight output was edited. Whitespace checks cover new
source/tests/notes/scripts/JSON/Markdown; retained raw measured TXT output is
excluded from whitespace rewriting or cleanup.

All implementation/evidence commits use `[skip ci]`. No browser/visual judgment,
independent approval, CI dispatch, dependency/global configuration change,
release, deployment or merge is claimed. Existing controller/input semantics,
CSS, core, save schema and generator source are unchanged. Main owns independent
Opus Medium review and the final exact-head CI dispatch. Inherited untracked
`.cache/` and `node_modules` are retained and unstaged.
