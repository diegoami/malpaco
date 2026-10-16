Closes #113

The reference's sea routes were geometrically valid but visually hard to trace. This investigation constructs two original exact-graph alternatives, compares paired shore gates, and isolates port choice with a control that preserves every baseline land polygon and label.

Coast-first construction cuts total route length from1332px to671px, removes bends and merged route contacts, keeps every route at least24px long and fits all rendered labels. The ports-only control reaches584px but leaves a5px crossing. The contact-dual replacement preserves actual adjacency but fails label usability. These are research results requiring owner judgment and a midpoint-contract decision; no production integration is proposed.

## Scope

- `docs/prototypes/new-game/T60/`: immutable pinned graph/input, original source/parameters, two construction candidates, gate variant, ports-only ablation, matched comparison page, measurements and complete failed drafts/screenshots/hash indices. Parent-authored verify/capture/measure checks remain unchanged.
- `RUN-NOTES.md`: appended investigation plan, measured outcome and END handoff.
- No production code, graph, T24 contract or CI workflow changes.

## Validation

```text
node docs/prototypes/new-game/T60/verify.mjs
accepted:true; failures:[]; evidence/verify-JThtcV/report.json

node docs/prototypes/new-game/T60/capture.mjs
accepted:true; failures:[]; evidence/capture-B8t5Cx/report.json
Executed in pinned Playwright v1.63.0-noble; all four maps at1280x800 and800x540 plus required close-ups.

node docs/prototypes/new-game/T60/diagnose.mjs
Full unchanged T24 failures, directness/clearance, continuation and boundary-residual diagnostics saved in evidence/diagnose-PqnTcb/report.json.

node docs/prototypes/new-game/T60/browser-diagnostics.mjs
accepted:true; failures:[]; evidence/browser-wxpTZ0/report.json
Actual rendered label diagnostics disclosed; all five comparison views load and show46 countries/15 routes.

node --test docs/prototypes/new-game/T60/measure.test.mjs
tests2; pass2; fail0

git diff --check origin/main
exit0
```

Exploratory constraints are explicitly unmet: A has30 midpoint conflicts plus8 zero-length projected-boundary diagnostics; B has30 midpoint conflicts,24 microscopic boundary diagnostics and28 label/hit errors; D has29 midpoint conflicts. No constraint was waived. All graph/fairness/shared-land-border checks remain exact. Baseline and A/D have zero actual rendered label escapes; B has23. A fresh build reproduced all four board JSON files byte for byte.

## Docs changed

T60 README contains the diagnosis, primary algorithm references and archaeology limits, complete measurements, tradeoffs, recommendation, estimated implementation task sequence and reproducible commands. The owner chooses appearance before subsequent work; T59 merge/CI stays held. Implementer: owner-selected Sol High; main handles independent Kimi review.
