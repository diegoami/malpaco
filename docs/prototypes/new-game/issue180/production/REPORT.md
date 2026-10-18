# T73 formal production adoption

Exact source checkpoint: `1e7ec9446ecb98a33969db48888726a5e65b40e4`, pushed with `[skip ci]` after frozen parent checkpoint `627ba81a`. The sole runtime edit is src/styles.css, copied byte-for-byte from production-candidate; SHA256 `9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64`. The sidebar uses a 64px turn row, an action row capped at 410 CSS pixels, and history with an 88px minimum plus remaining space. All essential battle controls remain together; history retains its independent scroller. No rules, actions, RNG, save, map, controller or acceptance-test edits.

The producer's fresh checks are read-only input/archive proofs, not new gameplay/browser runs. `verification.json` records exact argv, exit, duration and output:

- `python3 docs/prototypes/new-game/issue180/production/verify-adoption.py`: exit 0, 3.55s; source/candidate equal, 18 frozen paths, 222 validated inputs, 28 committed archive parts, all 1,689 member hashes and 1,689 retained loose copies verified; 132 reused unit inputs equal; zero mismatches.
- The same command with `--committed-only`: exit 0, 2.96s; all committed parts/members verified without consulting any loose evidence. The verifier uses Git HEAD blobs and opens the archive in memory; it does not extract files or require an uncommitted helper.

Reused acceptance results remain separate: capped combined run 108/110; original unchanged failed-case retake 0/2; final original-test selection under the inherited acceptance configuration 2/2. The canonical layout case passes at both sizes and modes, with retained geometry/screenshots, physical clicks, core outcome checks and complete readable history behavior. The two earlier native-download timeouts remain preserved; their exact cause is unresolved and no workaround was adopted. There is no claim of one 110/110 green combined run. Final-candidate full build succeeded (1.02s), and prior 784 Vitest plus eight harness tests are reused through 132 unchanged unit inputs and complete validated-input equivalence.

File rationale:

- src/styles.css: exact frozen correction for battle/card/history space allocation.
- docs/spike.md: describe the new allocation and correct the historical fixed-track description; state evidence limits and remaining gates.
- RUN-NOTES.md: append authorized PLAN, source checkpoint progress and END; preserve every earlier entry.
- production/adoption.json: pin source, immutable manifest hashes, original reused command receipts, per-scope rationale and remaining gates.
- production/verify-adoption.py: standalone read-only source/frozen-input/committed-archive/member/unit-reuse verification.
- production/run-proof.py: capture both proof modes, exact command arrays, exits and durations.
- production/verification.json and production/proof.log: retain fresh proof outputs.
- production/REPORT.md: full formal handoff and validation limits.

Acceptance tests, task contract, parent-final files, earlier reports, archives and loose originals are unchanged. No further diagnostics, heavy test runs, package/preview/Windows actions, CI, review, merge or draft-ready transition occurred. Native aggregate telemetry is unavailable; no token total or agent exit code is invented.

Parent owns independent Kimi regular affected-suite validation, owner appearance judgment and one final-head green CI. These gates remain required before merge. The existing draft PR183 body records the scope, requested Done-when commands, reused results and honest remaining gap.
