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
