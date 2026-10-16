# T27 explicit capture-choice engine

The parent acceptance uses `captureChoiceRules()`, phase `capture`,
`pendingCapture {from,to,min,max,defaultAmount}`, and ordinary action
`{kind:"captureMove",amount?:number}`. Quantity means total moved; omitted
quantity defaults to max. The provisional one-army transfer is a designed
interaction protocol that preserves occupied countries without committing
the optional quantity. Ownership and elimination happen at capture; conquest
is evaluated at endTurn after the pending choice. No extra dice are drawn.
Pinned source: core-rules.md at ae298e37c2f5177039e55767607f9345b6cb0e7a,
sections Ownership change and Victory.

This is an opt-in compatibility seam; T28 enables it with controls. Existing
malpaco/Classic presets, reference route and generated v1 match saves retain
their current behavior. A third optional rules argument to createReferenceGame
lets T28 select the new preset. New JSON action replay is tested independently
from the legacy match-save format, whose extension belongs to T31.

Parent preflight:17 capture tests and4 replay tests fail against actual
inherited behavior, rather than a missing import (the test helper falls back
to malpacoRules until the new export exists). A disposable wrapper mock passes
all21,454 total unit tests and typecheck/build. Deleting quantity validation
fails8 tests including the tampered-action replay; deleting source subtraction
fails the hand-calculated chained replay. Original index.ts restored exactly
and mock removed after each run; mock sources and mutants retained. First
mock build failed from an inferred return type and is retained; subsequent
mock runs annotate the existing ApplyResult contract and pass.

`preflight-mock.py` reproduces fresh mock outputs at historical parent acceptance
commit `8f20f56` and restores source in finally. Run it from that revision in
a disposable worktree: the current implementation already exports the preset
that the historical mock supplies. It is acceptance-pipeline evidence, never the implementation.
`run-command.py` and `run-browser.py` retain fresh exact logs/archives/hashes.
Only task-owned files and append-only run notes may change during implementation.

The quantity-deletion mock source contains intentional whitespace left by the
mutation. Its exact bytes are retained in adjacent raw-mutation-source.tar.gz;
the untouched loose original is ignored. The initial preflight hashes include
that member path and can be checked after extracting it.


The actual implementation adds the choice capture policy to the existing combat
resolver, clones the pending record in `cloneState`, and handles total-quantity
movement through `apply`. It adds no log variant and does not rewrite the prior
attack outcome. The explicit reference factory rules argument consumes no setup
draws; the old default remains byte-for-byte equivalent in the new seam test.

Actual-source verification:17 capture tests,4 replay tests and2 additional
factory/clone tests pass; the full suite has456 passing cases. A first real
Action-union build found11 TypeScript property errors in3 existing browser
specs, retained in `implementation-build-elbmlm6z`. Main amended the scope in
commit5e14bf3; explicit attack narrowing and unexpected-action throws preserve
every prior assertion. The build passes in
`implementation-build-after-narrowing-4ae64mea`.

`mutate-source.py` starts from a green23-case baseline, archives each actual
mutated source, and restores saved bytes in finally. All8 mutants fail:
quantity validation8 cases, source conservation6, pending-record cloning1,
reference opt-in1, premature victory2, premature all-transfer9, default
minimum3, and combined pending attack gates1. Exact restored hashes for all4
mutated source files are in `source-mutations-22cmoa5i/report.json`. The new
factory and clone tests each fail with their behavior removed. The quantity
and conservation mutants both fail replay checks as required.

Historical `preflight/hashes.json` predates later README and runner additions.
Its exact historical README is retained in `preflight/initial-readme.tar.gz`;
its initial runner is in `preflight/initial-runner.tar.gz`. Together with the
raw quantity archive described above, `verify-preflight.py` verifies all48
original files and every indexed archive member without rewriting history.

`index.py` creates a fresh sharded portable index of current source, tests,
documentation and task evidence, including every archived member, using Git's
ignore rules to exclude untouched loose raw originals. `verify-evidence.py`
checks it. Each part stays below the repository's file-size reading limit.
The browser runner mounts legacy screenshot output into a fresh owned raw
directory and archives it exactly; reference captures remain ordinary tracked
PNG files. This avoids overwriting any earlier measurement.


Pinned browser verification in `implementation-browsers-wz_1ci6r`:80 cases
pass in the official `mcr.microsoft.com/playwright:v1.63.0-noble` image at
1280×800 and1920×1080. The batch includes reference, generated, setup,
match-save, computer, complete-game and legacy slice suites, including all
existing goldens in those suites. Assertions and snapshot PNGs are unchanged.
The ordinary reference game reaches conquest after541 actions at each size
(163 attacks,20 handoffs,337 placements). The report pins the exact selected
tests and core bytes; raw output, HTML report and legacy screenshots are in
its archive, with reference captures stored beside it.

Current portable index: `artifacts.v2.sha256.json` plus its referenced shards.
Run `python3 docs/prototypes/new-game/T27/verify-evidence.py` and
`python3 docs/prototypes/new-game/T27/verify-preflight.py` from any checkout.
The index excludes itself and the subsequent verification command's own
receipt to avoid a recursive checksum; the receipt is separately committed.

The immutable v1 index verifies implementation revision `92cc02c`; v2 adds
this historical reproduction clarification and the preceding verification receipt.
