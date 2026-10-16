# Parent pipeline preflight

This is an acceptance-pipeline witness, not the map investigation or a visual
improvement claim. `input/` pins T59's owner-selected 15-link graph and proposed
appearance; provenance identifies the source commit and byte hashes. T59 is
unmerged and its appearance is not approved.

`baseline-only.json` deliberately supplies only the existing reference: verify
rejects missing comparative candidates. `mock-study.json` supplies two distinct
whole-board translations as disposable geometry/capture witnesses; these are
not materially different approaches and cannot satisfy the investigation report.
Duplicate geometry and changed pinned opening state reject separately. The
route metric tests use analytically known lengths, bends, clearance, crossing
and parallel-route separation.

Commands used: `node .../verify.mjs .../preflight/{baseline-only,mock-study,duplicate-study,changed-study}.json`,
`node --test .../measure.test.mjs`, and pinned Playwright v1.63.0-noble
`node .../capture.mjs .../preflight/mock-study.json`.
The actual investigation must replace these witnesses with original approaches
and a real comparative study. Constraint failures are computed and disclosed
per candidate rather than silently weakening T24 or declaring exploratory art
integration-ready. Do not overwrite these preflight inputs or measured outputs.
