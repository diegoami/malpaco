# T29 acceptance and evidence

Pinned movement design: core-rules.md at archaeology commit ae298e37c2f5177039e55767607f9345b6cb0e7a, Movement and The turn. One optional adjacent friendly transfer follows attacks; it leaves one, defaults to all-but-one, and immediately ends the turn. Both land and sea links use the declared graph. Captured countries can participate.

Existing presets/routes/saves retain their behavior. The reference route opts into a staged friendly-move preset. Complete replay-format integration remains T31 and computer policy T32. Parent acceptance is prepared before implementation, including actual-negative/disposable-mock-positive evidence. Raw measured output is archived losslessly under this owned directory, with fresh paths and hashes.

The selected UI contract is pinned ui.md “The move and the end of the turn”:
mark eligible own sources, then own neighbours; default quantity all-but-one;
Confirm says the move ends the turn; Cancel returns to attacks with no engine
state/history/RNG change. The UI draft is transient. The sole new engine action
is `{kind:"friendlyMove",from,to,amount?}` from the attack phase, atomically
transferring then handing off. No extra game-stream draw is allowed.

Parent acceptance contains29 core cases and8 browser cases at both desktop
sizes. Actual-negative evidence is `evidence/negative-core-final-w4it9a_9`,
`evidence/negative-final-unit-cf077e5a` (29 new failures,471 old passes) and
`evidence/negative-final-browser-l8g65zp4` (8 missing-feature failures after
legal setup/capture). Typechecking/build already passes without the feature.
Invalid-action cases begin by proving a valid feature action on a separate
fixture, so absence rejects the flow; deletion controls additionally establish
specific guard sensitivity. No missing-module/import failure is counted.

Disposable mock positives:29 core cases,500 full units/build,8 new browsers
`preflight/mock-browser-fixed-lnaoa4ov`,18 prior battle/reference cases
`preflight/mock-compatibility-gdv2l_vi`; legacy reference conquest stays541
ordinary actions at each size. No assertions or goldens were weakened. The
first mock browser attempt retained hidden controls after handoff, caught by
all8 cases; only the mock was fixed and the original failure is retained.

`preflight/mock-controls-6xwk_cr0` rejects all5 source mutations: quantity,
adjacency (including friendly paths without a direct edge), army conservation,
turn handoff and accidental legacy-preset enablement. Both green baselines pass;
actual mock rule bytes restore in finally. Exact outputs and sources are archived.
`preflight/mock-de7c5yhb` retains original sources, initial/final mock source,
creation tools and the built draft. The7 touched runtime paths restore exactly,
including absence of the temporary UI file. The mock is historical feasibility
evidence, never production. Initial27-case negative input is archived separately.

The preflight index `artifacts.preflight.v1.json` pins this acceptance and restored
runtime. Later revisions need a new immutable index; verify historical source
indices at their pinned commits. `verify-evidence.py` checks files and archived
members, opening each archive once. Raw logs/HTML/screenshots are losslessly
archived; ignored loose raw copies stay untouched.


## Production implementation

The actual engine uses a pure `movement.ts` legality/target helper and one ordinary
`friendlyMove` dispatch, followed by the existing endTurn handler. Legacy presets
remain unchanged; only `friendlyMoveRules` opts in. The controller owns a transient
move mode and a saved battle context, with no intermediate engine action. Cancel
restores that context; confirm/skip/replacement/disposal discard the draft.

First production checks:29 core cases,9 additional controller boundary cases,
509 full unit tests and build pass. Eight parent browser cases pass in
`evidence/implement-friendly-vd3j81v8`; twelve with added sea-route and Escape
checks pass in `evidence/implement-friendly-feedback-nfvq5p2b`. Initial controller
negative9 cases and source bytes are retained in `negative-controller-asgsrqmd`.

Route emphasis needed a reference-host move-only override: the shared renderer
emphasized all source sea links, including enemies. The first added probe's
fixture lacked an enemy sea edge; that failure is retained and is not a behavior
proof. A bounded mixed-ownership-sea fixture then reached the actual mismatch
(`negative-route-feedback-targeted-zkftw774`): one extra enemy route at both sizes.
The same assertions pass after filtering emphasis by legal friendly targets.
Existing battle/legacy rendering and all geometry stay unchanged.


## Final author validation

| Check | Result | Evidence under `evidence/` |
| --- | --- | --- |
| DW1 exact friendly core command |29 passed|`final-dw1-i7vxswh3`|
| DW2 exact friendly browser suite |8 passed, both sizes|`final-dw2-jmuyxh09`|
| Full units after strict omission handling |512 passed,33 files|`final-unit-strict-1bf3qvs1`|
| Build/typechecks after strict handling |pass|`final-build-strict-tzus48q3`|
| Every source browser suite |134 passed|`final-strict-full-source-xka0yiex`|
| Fresh official package/extracted runtime |24 passed; checksums verified|`release-5d0ot5xx`|
| Current actual-source mutants |22/22 caught; green baselines restored|`actual-mutations-6ibxnalv`|
| Protected inputs |74 files byte-exact; old CSS/parent fixture exact prefixes|`protected-9l1bsecl`|

The full browser run includes all original cases/goldens plus the12 new friendly
cases; its input-stability flag is true. Legacy reference conquest remains541
actions at each size. The extracted check includes new friendly12, generated
preview8 and legacy reference4; it builds/typechecks the real current working-tree
source, extracts a fresh official archive and verifies SHA256SUMS. Its commit
metadata predates the final quantity-edge commit; exact source hashes, package
and extracted bytes are retained. This is candidate verification, not a release.

Quantity omission uses strict undefined: explicit null is refused. The original
null counterexample fails in `negative-null-quantity-eivirzyj`; the corrected
41-case focused group passes in `final-null-edges-faov04t_`. Additional edge cases
cover a foreign source with enough armies and final conquest after completing
the transfer, without next-seat income or advancement.

The mutation tool saves all five actual files and restores them in finally.
It tests quantity/leave-one/direct adjacency/ownership/phases/opt-in scope,
turn handoff/conservation/default/null/RNG, revisions/selected pair/hidden
confirmation/running and paused entry/cancel context/replacement/disposal,
and browser route emphasis/Escape/default counter. A hidden-confirm deletion
alone survived the first attempt because selected-pair defense still refused;
that exact attempt/source/runner remains in `actual-mutations-833ibv6h` and is
not an all-killed claim. The current combined deletion proves the protected
invariant without removing either defense from production. Earlier21-case
successful audit `actual-mutations-hijrlgob` predates the null check and remains
historical; only the22-case final audit is authoritative for current source.

The first full run used an existing retry-test fallback outside this task's output
root. Twenty exact captures are losslessly archived in `retained-fallback-captures-*`;
loose originals remain untouched outside the owned tree. The current runner sets
all evidence environments to fresh owned directories. No old task files change.

The current portable index is `artifacts.implementation.v2.json`; verify it with
`python3 docs/prototypes/new-game/T29/verify-evidence.py artifacts.implementation.v2.json`.
Historical preflight v1 stays pinned to acceptance commit `d400f24`. Verification
receipts are committed separately from the index they self-check.
