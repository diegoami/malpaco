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

`preflight-mock.py` reproduces fresh mock outputs and restores actual source
in finally. It is acceptance-pipeline evidence, never the implementation.
`run-command.py` and `run-browser.py` retain fresh exact logs/archives/hashes.
Only task-owned files and append-only run notes may change during implementation.

The quantity-deletion mock source contains intentional whitespace left by the
mutation. Its exact bytes are retained in adjacent raw-mutation-source.tar.gz;
the untouched loose original is ignored. The initial preflight hashes include
that member path and can be checked after extracting it.
