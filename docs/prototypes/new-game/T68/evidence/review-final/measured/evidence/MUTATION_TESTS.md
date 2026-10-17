# T68 receipt verifier mutation tests (review session 2026-10-17)

Tests run by the MiniMax-M3 reviewer against a fresh fixture copied from
docs/prototypes/new-game/T68/ to docs/prototypes/new-game/T68/evidence/base-fixture/.
All mutations were applied only to copies inside `evidence/`; originals in
attempt-1/, attempt-2/, attempt-3/, assessment.json were not modified.

| Test | Mutation | Expected | Actual exit | First failure site |
|------|----------|----------|-------------|---------------------|
| positive | none | pass | 0 | (none) |
| missing-output | delete attempt-1/output.jsonl | fail | 1 | FileNotFoundError at hash read (verify.py:15) |
| changed-prompt | append "PROMPT CHANGED" to attempt-3/prompt.txt | fail | 1 | AssertionError ('attempt-3', 'prompt.txt') at verify.py:15 |
| missing-attempt | remove attempt-2 entry from assessment.json | fail | 1 | AssertionError on attempts-set at verify.py:6 |
| accept-denied | flip attempt-1/accepted_review to true while output.jsonl still has denied_actions | fail | 1 | AssertionError on denied_actions vs accepted_review at verify.py:24 |
| cleanup-incomplete | flip attempt-3/settings-cleanup.json temporary_grants_removed to false | fail | 1 | AssertionError on cleanup invariants at verify.py:31 |
| wrong-head | set attempt-1/receipt.json reviewed_commit to a wrong value | fail | 1 | AssertionError on reviewed_commit at verify.py:12 |
| forged-hash | set attempt-3/receipt.json output_sha256 to all-ff without changing the file | fail | 1 | AssertionError ('attempt-3', 'output.jsonl') at verify.py:15 |
| restored-positive | re-run after restoring copies | pass | 0 | (none) |

All five required checks (changed prompt, missing output, missing attempt,
accepting denied result, false cleanup receipt) plus two extra checks
(wrong-head, forged-hash) pass and exit non-zero with tracebacks that name
the offending file or invariant.

Originals' SHA-256 unchanged before and after the mutation run:
- attempt-1/receipt.json: 68cf3aa8...f2e5d
- attempt-2/receipt.json: e38533fe...0928
- attempt-3/receipt.json: c5346d94...b9f28
- attempt-3/settings-cleanup.json: bb7f1fd1...cc00a
- assessment.json: 624d90a2...c0983
