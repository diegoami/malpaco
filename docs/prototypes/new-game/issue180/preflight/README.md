# Issue180 acceptance preflight evidence

Proposal only, isolated worktree based on 3898cba8. No production adoption, review, CI, Git mutation, or Windows action was performed here. Parent owns freezing and adoption.

The complete finding and commands are in REPORT.md, commands.json and per-run logs. Tests and fixtures under this directory are executable proposals. Candidate source is source/styles.proposed.css; source/cards.proposed.ts replaces only the obsolete absolute-track assertion in cards.spec.ts. source/battle-panel-fit.proposed.ts is the installable regression (its import differs from visibility.spec.ts only to match tests/e2e location).

Baseline-1 and baseline-2 are setup/instrumentation failures, not claimed application evidence. Baseline-3 is the first complete reproduction. Baseline-4 is the unchanged application with the final, strengthened regression; candidates2/3/4 use the same final regression bytes. Candidate-1 fixes active controls but fails readable history; candidate-2 enlarges history but fails the 1280 Detailed running state. Candidate-3 passes geometry but hides a reused human-loss heading; candidate-4 narrows the selector and rechecks focused geometry plus computer cards. All original run outputs remain here. Metrics for both modes are collected before soft assertions.

Fixtures are legal recorded-action prefixes, not edited state snapshots. discovery.json names their source, action count, next recorded action, hand and log length. The discovery spec replays every action through apply and validates every output with deserializeVersionedMatch. frozen-input-sha256.json hashes relevant source/tests/inputs. Candidate restoration records hash and file mode before/after; restoration uses saved bytes in finally.
