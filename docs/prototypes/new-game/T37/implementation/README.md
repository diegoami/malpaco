# T37 production evidence

The opt-in deck-v1 implementation preserves the current playable victory preset
and historical save paths. Thirteen frozen deck cases and seven frozen replay
cases pass on production. Full validation passes665Vitest+8harness, build and
28 affected browser cases in Playwright1.63.0 at both pinned viewports.

`validation-20261018T111950127370Z/receipt.json` records exact command arguments,
exit codes, durations, input hashes and unchanged frozen acceptance. Its retained
stdout/stderr are the raw results. The complete sequential validation interval
is139.703539seconds. No duplicate validation jobs ran.

`source-inputs.tar.gz` retains168 tested source/test/data/config files.
`browser-artifacts.tar.gz` retains136 files from the current screenshot, HTML
report and test-results trees, including inherited parent captures. Each archive
member was read back and hashed in `archive-members.json`; `SHA256SUMS` covers
the retained command outputs and archives. Original loose screenshot files and
all inherited evidence remain available. Automated checks establish operation;
this mechanical UI-label change makes no new owner appearance claim.

`mock-runtime-equivalence.json` proves all eight installed source token streams
match the parent-preflighted mock after omitting comments and whitespace only.
The production additions beyond those bytes are provenance comments. Parent's
baseline20fail, pre-discard omission7fail and card-duplication10fail therefore
remain applicable; `parent-controls-reuse.json` indexes original command and
exact-restoration receipts. Formal implementation performed no temporary
mutations. The original parent sources/drafts/failures are preserved, and frozen
acceptance was neither edited nor regenerated.

The scoped implementation commit is efadfa9. The current-main task-only change
96d9f9a was merged as4f45328 after validation; `post-main-merge-verification.json`
proves every tested input and frozen hash remained unchanged. Final evidence and
PR text changes do not alter runtime inputs. Commits use skipci; independent
review and CI timing remain the main session's responsibility.

Files changed and reasons:

- cards.ts defines approved composition, private state/public projection and deterministic draw/Squall behavior with provenance.
- types.ts declares optional capability/state and explicit discard action.
- state.ts supplies frozen cardsRules and deep cloning, including the legacy constructor seam.
- setup.ts initializes the deck after centres on the existing game RNG only for opt-in rules.
- rules.ts gates pending choices, splits reward from victory/handoff, and discards eliminated hands.
- index.ts exposes the frozen API.
- match-save.ts admits exact cards1/schema3 tuples and strictly reconstructs them through ordinary action replay.
- gameEventLog.ts adds only the authorized mechanical discardCard label needed by its exhaustive action-name type.
- docs/spike.md explains API, storage and T40/T41 staging; RUN-NOTES.md is append-only.

No trade/raid effects, card UI controls, computer policy, defaults, generator
algorithms, dependencies, frozen tests, task files or fixtures changed. The task
contract's negative-before/positive-after acceptance was established by the
parent before dispatch and freshly confirmed positive here. No CI, reviewer,
merge, Windows or server operation was performed by the implementer.
