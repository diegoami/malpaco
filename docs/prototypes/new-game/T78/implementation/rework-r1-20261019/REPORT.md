# T78 R1 confirmation coverage rework

This rework addresses blocking R1 from the independent [Opus Medium review](https://github.com/diegoami/malpaco/pull/210#issuecomment-6274984466).
The complete review was read before editing. The existing production expression
was correct; only test coverage and new evidence are added.

`tests/ui/workspace-state.test.ts` appends one test after the exact existing
19-test bytes. An unchanged, complete staged pair that starts unconfirmed must
remain unconfirmed. The original frozen 17-test prefix and all six legal replay
fixtures are preserved. No assertion was changed or removed.

## Red/green proof

`run-control.py` removes only `&& state.attack.confirmed` from the real production
reconciliation expression. With that mutation, the complete focused file exits
**1**: **1 failed / 19 passed**. The new test observes `confirmed: true` where
`false` was expected. This is the exact mutation that survived the first review.
The original source is saved under `/tmp` and restored byte for byte in `finally`.
`mutation-restoration-01.json` records its unchanged source SHA256:
`01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34`.

After restoration, both exact Done-when commands ran on final source/tests:

```text
npx vitest run tests/ui/workspace-state.test.ts
Test Files  1 passed (1)
     Tests  20 passed (20)
native exit: 0 (focused-green-01.json)

npm test && npm run build
harness: 9 passed, 0 failed
Test Files  61 passed (61)
     Tests  838 passed (838)
tsc --noEmit -p src/core && tsc --noEmit && vite build
66 modules transformed; built in 266ms
native exit: 0 (done-when-full-01.json)
```

The successful `&&` chain proves both commands succeeded. Every command has a
new untouched TXT output and JSON receipt with native exit, elapsed time, source
hash, test hash and output hash. These live only in `rework-r1-20261019/`; no prior
output or receipt was overwritten. The final test SHA256 is
`6f614366061489fda76c72b4366461f158a549005210988ee79be262c4c9b790`.

## Files and preservation

- `tests/ui/workspace-state.test.ts`: one appended confirmation-prerequisite test.
- `RUN-NOTES.md`: append-only rework PLAN, progress and END.
- `run-control.py`: reproducible bounded survived-mutant control with saved-byte
  restoration and assertions on the specific behavioral failure.
- `audit-rework.py` and `preservation-01.json`: unchanged source, original 19-test
  and frozen 17-test prefixes, notes prefix, original task/boundary/all prior
  evidence bytes, owned diff and three new command-output hashes.
- `negative-drop-confirmed-01.{txt,json}`, `focused-green-01.{txt,json}`,
  `done-when-full-01.{txt,json}` and `mutation-restoration-01.json`: original new
  measured outputs/receipts. This report explains their scope and limits.

Whitespace checks cover new test/notes/script/JSON/Markdown content; raw measured
TXT remains untouched. The initial implementation's report and all its evidence
are historical records and remain exact. Existing `.cache/` and `node_modules`
remain untracked and unstaged. No runtime source, controller, input, CSS, core,
save schema, generator, task contract or boundary document changed.

R2 and R3 were nonblocking, unverified findings in the first review; main directed
this rework to leave the frozen API unchanged and carry the patch-ownership
question to T82. No claim of fixing or independently reproducing those findings
is made. No reviewer, browser/visual check, CI, dependency/global configuration,
deployment or merge was run. All rework commits use `[skip ci]`; main owns any
additional correction-review authorization and final exact-head CI.
