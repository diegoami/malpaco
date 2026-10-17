T68 review (Claude backend trial)
rework

DW1: ran `python3 -I docs/prototypes/new-game/T68/verify.py` → exit 0 and "T68 receipts, discovery, output hashes and parent assessments verified". The clause "refuses missing or altered receipts" fails in my negative controls (R1–R3), so DW1 is not met as written.
DW2: ran `git diff --check` → exit 0, and `git diff --check 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03 HEAD` → exit 0.
- I read `docs/harness-agy.md`. It gives the invocation, the permissions and the retention procedure.
- Through read-only `gh api`, I fetched model-trials comments 6233911137, 6233935226 and 6233956425 on `diegoami/malpaco` issue #3. Their exit codes, durations and conversation IDs match the three receipts. Each comment contains the isle-wars-archaeology#9 URL.
- I also fetched PR #150 comment 6233951448. It contains `attempt-3/review.txt` in full, and `review.txt` equals the `result.response` in `output.jsonl`.
- `isle-wars-archaeology#9` has no T68 entry. I searched all of its comments and the newest is from 2026-10-16. The link runs one way only (see R7).
- The wording passes. Whether the cross-link is satisfied depends on how "cross-linked" is read.

Where I worked:
- Worktree HEAD is 6fde4cb2c371bfdc933892f19b2cf7cb9573168b. It descends from base 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03, and the tree is clean apart from my untracked `.t69-neg/`.
- `full.diff` sha256 is c06670c2…a7b6b, matching `inventory.json`.
- The diff is 182 files. Outside `docs/prototypes/new-game/T68/**`, `docs/harness-agy.md` and `RUN-NOTES.md`, the only change is the one-line `tests/e2e/reference-complete-game.spec.ts` clock fix.
- `RUN-NOTES.md` is append-only: one hunk, 9 added lines, 0 removed.
- Browser limit: I did not rerun the browser or Playwright suite, and I did not run `run-browser.py`. I did not execute the historical agy runners or touch agy settings.
- The clock fix was checked by evidence only:
  - The retained failed-CI log shows `clock.pauseAt: Cannot fast-forward to the past` at spec line 32.
  - The original test hash 6270941… matches base, and the corrected hash 9642aad… matches HEAD.
  - The change adds only `{time: new Date("2026-10-17T00:00:00Z")}` to `install()`. No assertion changed.
- Scratch is retained at `.t69-neg/`: `base/` (a copy of the T68 receipt fixtures plus `verify.py`), 22 `case-*` copies, `tools/neg.py`, `tools/neg2.py` and `review.base.mjs`. The real `verify.py` was run against those copies. No source file was mutated.
- Other commands I ran:
  - `git diff --name-status`
  - `sha256sum` on the tarballs, `verify.py`, the spec and `full.diff`
  - A tripwire-in-prompt check against `docs/models.md`
  - `gh api` GETs of the comments

Negative-control results (22 cases, each run plain and with `-O`):
- Refused without `-O`:
  - output edited without rehash
  - prompt edited without rehash
  - `reviewed_commit` changed
  - attempt-3 `exit_code` set to 1 (refused only because it is the accepted attempt)
  - duplicate result event
  - `models.txt` without the model
  - `accepted_review` set true on a denied attempt
  - a removed attempt directory
  - a removed receipt
- Accepted with exit 0:
  - attempt-1 `exit_code` 7
  - attempt-3 `duration_seconds` 0.001
  - `started_epoch` 0
  - `mode` "bypass"
  - `settings_restored` key deleted
  - `settings_restored` key deleted plus `settings-cleanup.json` deleted
  - a `settings-cleanup.json` containing only the two true booleans
  - output edited and receipt rehashed
  - prompt edited and receipt rehashed
  - `init.model` swapped to `gemini-4-argon-low` and receipt rehashed
  - `models.txt` holding only `claude-sonnet-5-5-high-fake`
  - attempt-3 `accepted_review` set false
  - `parent_assessment` set to "x"
- Under `python3 -O`, every case except the two missing-file cases exits 0. This includes output-only, prompt-only, commit-edit, attempt-3 exit 1, duplicate result, missing model and denied-then-accepted.

Findings:

**R1 (blocking), `docs/prototypes/new-game/T68/verify.py:6-31`.**
- Every check is a bare `assert`, so `python3 -O` (or `PYTHONOPTIMIZE=1`) removes them all.
- The verifier then prints "verified" and exits 0 on tampered prompt, output, commit, exit code, duplicate-result and denied-then-accepted fixtures.
- Proved with `neg.py`: for example `output-only` exits 1 plain and 0 under `-O`.
- The task protects "refuses missing or altered receipts" and "never claim a failed trial approved code". Both can be defeated by an environment variable.
- The earlier sweep (`preflight-*/report.json`) never ran `-O`.
- Fix: raise `SystemExit` or `AssertionError` explicitly, or check for `-O` at the top.

**R2 (blocking), `verify.py:11-13, 29-31`.**
- The receipt fields `exit_code`, `duration_seconds`, `started_epoch` and `mode` are checked only as "is an int" or "> 0". They are not tied to the output event stream (`result.duration_seconds` is 168.43 against a receipt value of 171.65) or to anything else.
- Accepted in my controls: an attempt-1 `exit_code` of 7, a `duration_seconds` of 0.001, and a `mode` of "bypass". DW1 names exit and duration as validated.
- The cleanup guard at lines 29-31 runs only `if 'settings_restored' in receipt`. Deleting that key skips the check, and deleting the key plus `settings-cleanup.json` still passes.
- A `settings-cleanup.json` holding just the two true booleans passes. Those flags are self-asserted and there is no check against `before_sha256` or `after_sha256`.
- This is a receipt-field bypass on the exact thing the task protects. It does not share a cause with R1.

**R3 (blocking, same root cause as R2: nothing binds receipt and retained files to the output stream), `verify.py:11-12, 16`.**
- `init.model` in `output.jsonl` is never read. Swapping it to another model and rehashing passes, so the verifier cannot show that Sonnet actually ran.
- `models.txt` is not hashed. Line 16 is a substring test, so a file containing only `claude-sonnet-5-5-high-fake` passes. The "live discovery" claim is therefore a self-retained string.
- `reviewed_commit` is compared only to a literal in the receipt. It is not checked against the prompt text, the `init` cwd or git.
- Rated likely: it needs a coordinated edit of receipt and file, but the verifier is the only in-tree guard and has no outside anchor.
- Proved with `neg2.py` (init model swap) and the `models-substring` case.

**R4 (not blocking), `assessment.json` and `verify.py:5-7, 21-32`.**
- `model_trial_urls`, `review_findings_relayed` and `parent_assessment` are only tested for truthiness.
- Setting attempt-3 `accepted_review` to false, or `parent_assessment` to "x", passes.
- Only my `gh api` pass above actually validated the URLs and the relay.
- `docs/harness-agy.md:59-61` says the checker "rejects missing or changed prompt/output evidence", and that is true. It never states that the other fields are unverified.

**R5 (not blocking), `docs/harness-agy.md:26-30` against `attempt-3/run.py:14-25`.**
- The doc says to run through `tools/harness/run-unit.sh` with a memory cap and `watch.sh`. It presents `attempt-3/run.py` as showing "the actual invocation".
- `run.py` calls `agy` directly through `subprocess.run(..., timeout=900)`, with no memory cap and no `watch.sh`. Both helper scripts exist but were not used.
- Doc and measurement disagree. The doc should say which parts were recommended rather than measured.
- `harness-agy.md` is also not linked from any other doc (my grep found only the file itself).

**R6 (not blocking), `docs/prototypes/new-game/T68/review-tools/`.**
- `review153-retain-local.mjs` is a modified copy of `tools/harness/review.mjs` as of 50a2dcb. It points at a `reviewer153` agent, adds evidence retention, and drops `git worktree prune`.
- `reviewer153.md` widens `external_directory` to `/tmp/*` and `/home/diego/projects/malpaco/*`.
- Nothing references them (grep). The relative `./lib/...` imports cannot resolve from this folder, so they are inert. They carry no label saying they are retained evidence and not runnable or reusable.

**R7 (not blocking), DW2 cross-link.**
- The cross-link is only text in malpaco#3 comments pointing at isle-wars-archaeology#9.
- No T68 or agy entry exists on isle-wars-archaeology#9.
- Other comments on #3 follow the same one-way pattern (108 of 121 mention isle-wars-archaeology). That is a convention I observed, not one I verified.

**R8 (not blocking), `RUN-NOTES.md:716-724`.**
- The added entries have collapsed whitespace ("hashindexed", "Freshpinned2/2completegames"). The adjacent T33 entries show the same style, so this is a readability issue only.
- Their content matches the receipts, the comments and the CI report.

Checks that passed:
- Each attempt prompt contains Sonnet's tripwire in full.
- The permission grants file matches the five commands in `run.py`.
- The attempt-3 `denied_actions` list is empty. Attempts 1 and 2 recorded denied actions and are correctly marked not accepted.
- The archive hashes I recomputed match the manifests for the r1-proof raw-logs and fixture-inputs tarballs.
- The `verifier_sha256` in `preflight-z3xjbl1z` equals the current `verify.py` hash.
- The clock fix is the exact one-liner and weakens no assertion.

FILE: RUN-NOTES.md
FILE: docs/harness-agy.md
FILE: docs/prototypes/new-game/T68/.gitignore
FILE: docs/prototypes/new-game/T68/assessment.json
FILE: docs/prototypes/new-game/T68/verify.py
FILE: docs/prototypes/new-game/T68/source-integrity.json
FILE: docs/prototypes/new-game/T68/r1-proof-script.py
FILE: docs/prototypes/new-game/T68/run-browser.py
FILE: docs/prototypes/new-game/T68/review-tools/review153-retain-local.mjs
FILE: docs/prototypes/new-game/T68/review-tools/reviewer153.md
FILE: docs/prototypes/new-game/T68/attempt-1/.gitignore
FILE: docs/prototypes/new-game/T68/attempt-1/receipt.json
FILE: docs/prototypes/new-game/T68/attempt-1/run.py
FILE: docs/prototypes/new-game/T68/attempt-1/output.jsonl
FILE: docs/prototypes/new-game/T68/attempt-2/.gitignore
FILE: docs/prototypes/new-game/T68/attempt-2/hooks.json
FILE: docs/prototypes/new-game/T68/attempt-2/permission.py
FILE: docs/prototypes/new-game/T68/attempt-2/receipt.json
FILE: docs/prototypes/new-game/T68/attempt-2/run.py
FILE: docs/prototypes/new-game/T68/attempt-2/output.jsonl
FILE: docs/prototypes/new-game/T68/attempt-3/.gitignore
FILE: docs/prototypes/new-game/T68/attempt-3/models.txt
FILE: docs/prototypes/new-game/T68/attempt-3/output.jsonl
FILE: docs/prototypes/new-game/T68/attempt-3/permission-grants.json
FILE: docs/prototypes/new-game/T68/attempt-3/receipt.json
FILE: docs/prototypes/new-game/T68/attempt-3/review.txt
FILE: docs/prototypes/new-game/T68/attempt-3/run.py
FILE: docs/prototypes/new-game/T68/attempt-3/settings-cleanup.json
FILE: docs/prototypes/new-game/T68/parent-final-mwpph4_y/report.json
FILE: docs/prototypes/new-game/T68/preflight-hwba792m/report.json
FILE: docs/prototypes/new-game/T68/r1-proof-jwnmcnpm/report.json
FILE: docs/prototypes/new-game/T68/r1-proof-jwnmcnpm/raw-manifest.json
FILE: docs/prototypes/new-game/T68/r1-proof-z_earjil/report.json
FILE: docs/prototypes/new-game/T68/r1-proof-z_earjil/raw-manifest.json
FILE: docs/prototypes/new-game/T68/evidence/clock-correction/report.json
FILE: docs/prototypes/new-game/T68/evidence/clock-corrected-55fbu5yo/parent-integrity.json
FILE: tests/e2e/reference-complete-game.spec.ts
EVIDENCE: docs/prototypes/new-game/T68/evidence/clock-correction/ (report, failed-CI log and original test checked by grep and hash; `independent-review.txt` not read)

I read the prompts for attempts 1–3 only through the tripwire check, and `preflight-ur3c07gw/report.json`, `preflight-z3xjbl1z/report.json` and `r1-proof-jwnmcnpm/archive-manifest.json` only in part. I name them under UNCOVERED rather than as FILE.

SCOPE: incomplete
UNCOVERED:
- Unread cli.log.gz files: `docs/prototypes/new-game/T68/attempt-1/cli.log.gz`, `docs/prototypes/new-game/T68/attempt-2/cli.log.gz` and `docs/prototypes/new-game/T68/attempt-3/cli.log.gz`.
- `docs/prototypes/new-game/T68/attempt-1/models.txt` and `docs/prototypes/new-game/T68/attempt-2/models.txt` (read only by the verifier).
- `docs/prototypes/new-game/T68/attempt-*/prompt.txt`, for attempts 1–3 (only the tripwire check).
- The `preflight-*/fixture/**` copies in all three preflight folders, and the tails of `docs/prototypes/new-game/T68/preflight-ur3c07gw/report.json` and `docs/prototypes/new-game/T68/preflight-z3xjbl1z/report.json`.
- The contents of the tarballs `docs/prototypes/new-game/T68/parent-final-mwpph4_y/fixture.tar.gz`, `docs/prototypes/new-game/T68/r1-proof-*/fixture-inputs.tar.gz`, `docs/prototypes/new-game/T68/r1-proof-*/raw-logs.tar.gz` and the `evidence/clock-corrected-55fbu5yo/` tarballs (hashes compared only for some).
- The remaining parts of `docs/prototypes/new-game/T68/r1-proof-jwnmcnpm/` (`archive-manifest.json` beyond its start, and `.gitignore`) and `docs/prototypes/new-game/T68/r1-proof-z_earjil/` (`archive-manifest.json`, `.gitignore`).
- `docs/prototypes/new-game/T68/evidence/clock-corrected-55fbu5yo/captures/**` (50 screenshots and handoff JSON files), `report.json` and `.gitignore` in that folder.
- `docs/prototypes/new-game/T68/evidence/clock-correction/independent-review.txt`.
- `docs/prototypes/new-game/T68/evidence/review-final/`: `measured/**` (25 files), `brief.md`, `run-output.txt` and `session.json`. I read only the head of `report.json` and the ends of `review.txt`.
- The `.gitignore` files inside the evidence and r1-proof folders.

Final pass done
rework