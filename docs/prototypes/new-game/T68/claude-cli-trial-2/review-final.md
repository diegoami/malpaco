# T68 PR #153 supplemental review (claude-sonnet-5-5, Claude CLI trial 2)

I reviewed PR #153 at 6fde4cb, base 50a2dcb. This is a supplemental trial of a merged PR, not a merge gate.

**Verdict: approve after named fixes.** The two Done-when lines pass as run. One literal gap against "refuses … altered receipts" (R1) is code-derived, not demonstrated by execution.

## Tree proof
- `git rev-parse HEAD` returned 6fde4cb2c371bfdc933892f19b2cf7cb9573168b.
- `gh pr view 153` reports MERGED, base 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03, head 6fde4cb, 182 files, +74840/−1.
- Outside `docs/prototypes/new-game/T68/**`, the PR changes only `RUN-NOTES.md` (append-only), `docs/harness-agy.md`, and one line of `tests/e2e/reference-complete-game.spec.ts`. That matches the task's Owns list and the rule-12 exception.

## Done-when
- **DW1:** I ran `python3 docs/prototypes/new-game/T68/verify.py` and got "T68 receipts, discovery, output hashes and parent assessments verified", exit 0.
  - I also ran `checks.py` (read first). The positive verifier, the whitespace check and the five negative controls all passed: altered prompt, missing receipt, false accepted denial, missing cleanup, and duplicate result with a matching updated hash.
  - The duplicate-result case is caught by the exactly-one-result assertion at `verify.py:19`, not by the hash.
- **DW2 (part 1):** I ran `git diff --check 50a2dcb 6fde4cb` and got exit 0 with no output.
- **DW2 (part 2):**
  - `docs/harness-agy.md` gives the invocation, which matches `attempt-3/run.py:5` exactly.
  - It also covers permissions, the headless soft-denial behaviour, retention and the observed limitations.
  - The attempt-3 prompt contains the full Sonnet tripwire (`prompt.txt:93-96`).
  - model-trials #3 has the three comment URLs listed in `assessment.json`, and `RUN-NOTES.md` cross-links isle-wars-archaeology#9. I did not fetch those comments, so I did not check their contents.

## Findings

**R1 (blocking by the letter of Done-when 1; derived from code, not demonstrated by execution)** — `verify.py:13,29`.
- Receipt fields are only loosely validated:
  - `exit_code` only has to be an int and `duration_seconds` only has to be greater than 0. `exit_code` is pinned to 0 only for the accepted attempt 3.
  - `started_epoch` and `mode` are never read.
  - The cleanup check runs only `if 'settings_restored' in receipt`. Deleting that key from the attempt-3 receipt skips it.
- So editing attempts 1 and 2's `exit_code` or `duration_seconds`, or dropping `settings_restored`, passes the verifier. I did not run these mutations, because arbitrary mutation is outside the read-only grant. The code path is unambiguous.
- Likelihood is high that this gets past the stated guard, though the realistic threat is accidental editing.
- Fix: pin the expected `exit_code`, `duration_seconds` and `started_epoch` in a parent-authored file, or at least require every receipt key. Require `settings_restored` for attempt 3.

**R2 (non-blocking, likely)** — evidence not bound by hash.
- `models.txt`, `permission-grants.json`, `settings-cleanup.json`, `review.txt` and `cli.log.gz` have no hash in the receipt.
- "Live discovery" is only a substring test (`verify.py:16`).
- Cleanup is checked by two booleans. `before_sha256` and `after_sha256` are never compared.
- A coordinated edit of receipt and files passes. There is no external anchor such as a pinned receipt hash in `assessment.json` or the PR.

**R3 (non-blocking, likely)** — `verify.py` relies on bare `assert`, so `python3 -O` (or `PYTHONOPTIMIZE`) would make it print success without checking anything. I did not run this. The doc and the controls use `-I` and the plain form only. Replace the asserts with explicit `raise SystemExit` or `raise` statements.

**R4 (non-blocking)** — the controls in `checks.py` miss R1 and R2. There is no control for an altered receipt field, a deleted `settings_restored` key, a tampered `models.txt`, or `denied_actions` stripped from the output. The controls mostly mutate the files the receipt already hashes.

**R5 (non-blocking)** — `attempt-3/run.py`.
- The settings file is rewritten at line 17, but the guarded `try` starts at line 20. A failure opening `output.jsonl` between them leaves the grants installed. The doc says a `finally`/error path "must restore" them, but that gap is uncovered.
- Only `write_file(*)` is denied. This is acceptable given the five anchored allow regexes and plan mode, and the doc says plan mode is not a sandbox.
- `npx vitest` executes code from the reviewed checkout, which is trusted here.
- The restore guard refused after agy rewrote the settings file's serialization. That is documented, and `settings-cleanup.json` records the semantic restoration.

**R6 (style, non-blocking)**
- The appended `RUN-NOTES.md` entries lost their spaces ("exacthead7f1860d", "Scopeexception authorizedmain50a2dcb"), which makes them hard to read. The file is append-only, so correct it in a later note.
- The prompt tells a read-only reviewer "Push your branch first" in the tripwire paragraph.
- `verify.py` uses one-space indentation and has no assertion messages.

**Clock fix** (`reference-complete-game.spec.ts:32`): `install({time: 2026-10-17T00:00:00Z})` before `pauseAt` 12:00Z. It is one line and weakens no assertion. It matches the rule-12 exception and the `RUN-NOTES.md` account. I did not rerun the browser suite, so the pre-existing browser evidence is not independently confirmed.

## Coverage statement
- **Read in full:** `verify.py`, `checks.py`, `docs/harness-agy.md`, `assessment.json`, the `attempt-1/2/3` receipts, the `attempt-3` `run.py`, `permission-grants.json` and `settings-cleanup.json`, the RUN-NOTES diff, the test-line diff, and the attempt-1 and attempt-3 result events.
- **Spot-checked:** `attempt-3/prompt.txt` (SHA anchoring and the tripwire) and `models.txt` (the Sonnet IDs).
- **Not inspected:**
  - `attempt-2/hooks.json` and `permission.py`, and the attempt-1/2 `run.py` files.
  - `cli.log.gz` in every attempt.
  - The `evidence/` tree (90 files, including screenshots, handoff JSON and raw-log archives).
  - `preflight-*`, `r1-proof-*`, `parent-final-*`, `review-tools/*`, `run-browser.py`, `source-integrity.json` and the other helper scripts.
  - The 718-line attempt-3 event stream apart from its result line.
  - The current state of agy's global settings file.
- **Not run:** browser and CI suites, `agy`, vitest, the archive hash re-verification, and mutations of `verify.py`.
- **Tool denials:** several compound Bash commands (such as `ls` with `git ls-tree`) were denied. I redid them with Glob, Read, Grep and single granted git commands. No required check was denied.

Final pass done.

**Verdict: approve after named fixes** (R1 required; R2 to R5 follow-ups).
