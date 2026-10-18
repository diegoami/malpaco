# T73 native-save correction: formal adoption

Exact test-source checkpoint: `ff9661d6` (pushed with `[skip ci]`). Contract integration: `7603d5c0`, a clean merge of main `5b424c46` changing only the task index and T73/T74/T75 task documents; no map or product code was adopted. Frozen correction evidence remains at `4872447b`/`e8997af1`.

The actual `tests/e2e/computer-cards.spec.ts` is byte-exact to the frozen proposal, SHA256 `c29e6902face86cdbaaaaae99ca310c54705a881625699c3240a830408c689f0`. The only test delta adds two Node imports and a per-Page WeakMap to pace native Save calls until 120ms after the previous completed download. Real clicks, download events, file reads, every oracle assertion, fixture, deadline and page.clock call remain intact. The reversal proof reconstructs the complete original spec exactly outside this helper/import delta. All product/runtime files remain unchanged, including approved CSS SHA256 `9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64`.

The fresh producer check was the bounded standalone committed-state proof, not another browser or unit run:

```text
python3 docs/prototypes/new-game/issue180/download-rate-correction/production/verify-correction.py
exit 0; 0.574351787s
226 expected inputs: HEAD + working bytes and modes exact
28 frozen evidence files: HEAD + working hashes exact
240 historical 18/222 entries: exact except two explicit expected replacements
replacements: docs/tasks/T73.md; tests/e2e/computer-cards.spec.ts
exact proposal; helper-only reversal; runtime CSS unchanged; zero mismatches
```

`production/verification.json` retains exact argv, exit, duration, stdout and stderr; proof.log retains the direct result. The verifier checks the new frozen manifest's committed bytes and pinned hash, its payload, and each expected file against both HEAD and working bytes. It has no generic override or bypass flags. The old issue180/production/verify-adoption.py and old frozen manifests remain unchanged historical proof for their original contract/helper identities. All other old 18/222 inputs remain exact; only the two named, separately frozen hashes are replaced. The already verified 470MB archive was not recomputed.

The retained parent preflight ran the two consecutive-computer cases at both supported sizes under the regular root config: 4/4 passed, command elapsed 23.233s. It is reused through exact proposal and input equivalence. Original CI39157702142 remains failed evidence: Save clicks completed in 46/47ms while eleven downloads within 969/972ms hit Chromium's native ten-download burst gate. Primary-source excerpts and full original analysis remain frozen. This correction adds real Node timing margin and does not advance the paused game clock.

Historical combined108/110, exact retake0/2, final selected2/2, and later independent Kimi regular110 positives remain separate records. No new corrected full-CI green result is claimed. Existing Kimi approval6253951143 and owner appearance acceptance6253953904 cover the unchanged production CSS. Parent mechanical scope judgment for this test-only correction, fresh keycases and a new final-head green CI remain required.

Changed-file rationale:

- docs/tasks/README.md and docs/tasks/T73.md/T74.md/T75.md: exact authorized main contract/index integration; T74/T75 remain task documents, not feature implementation.
- tests/e2e/computer-cards.spec.ts: exact frozen native-save pacing correction for the browser burst gate; all assertions and game time unchanged.
- docs/spike.md: explain the CI cause, narrow helper correction, positive evidence and historical/current proof boundary.
- RUN-NOTES.md: append the authorized plan, merge/source progress and END without rewriting prior notes.
- production/adoption.json: pin the frozen manifest, two explicit replacements, historical artifact hashes, exact positive receipts and remaining gates.
- production/verify-correction.py: strict standalone read-only HEAD/working/mode/reversal proof.
- production/run-proof.py, verification.json and proof.log: retain the fresh command and exact outputs/duration.
- production/REPORT.md: complete formal handoff and limits.

All frozen evidence and historical proofs are preserved. PR183 body is updated without changing its readiness state. No heavy tests/build, additional diagnostic run, CI/review dispatch, preview/package/Windows action, new feature or PR merge was performed. Native aggregate telemetry is unavailable; no aggregate token count or agent exit code is invented. Parent must read this full report before the remaining mechanical check/keycases/final CI.
