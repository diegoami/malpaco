T68 review (Claude backend trial)
rework

Scope: bounded recovery trial. I did not repeat the archival audit, and I do not claim proof for anything I did not run here.

DW1: ran `python3 -I docs/prototypes/new-game/T68/verify.py` → exit 0, "T68 receipts, discovery, output hashes and parent assessments verified". The clause "refuses missing or altered receipts" is not met (R1, R2). DW1 is not met as written.
DW2: ran `git diff --check` → exit 0, and `git diff --check 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03 HEAD` → exit 0.
- I fetched model-trials comments through read-only `gh api -X GET` on `diegoami/malpaco` issue #3: 6233911137, 6233935226 and 6233956425.
- Each comment contains the isle-wars-archaeology#9 URL.
- The exit codes and durations match the receipts: attempt 1 is exit 0 in 8.241s, attempt 2 is exit 0 in 9.141s, attempt 3 is exit 0 in 171.653s.
- The conversation IDs match `assessment.json`.
- I did not re-check whether isle-wars-archaeology#9 links back. The previous review found no T68 entry there.
- I did not read documentation wording in this pass.

Where I worked:
- Worktree HEAD is 6fde4cb2c371bfdc933892f19b2cf7cb9573168b. `git merge-base --is-ancestor` confirms base 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03 is an ancestor.
- `full.diff` sha256 is c06670c21ab4f9220725d7bac35e9751c20ee77d7979aa84ffc2bbb848bb7a6b, the same value the previous review recorded. I did not re-read `inventory.json` or the diff content.
- Outside my scratch, the tree is clean. My scratch is the untracked `.t69-neg-recovery/`, retained.
- Commands I ran:
  - `git rev-parse`, `git merge-base`, `git status`, `git diff --check` (both forms)
  - `sha256sum` on `full.diff` and on the altered scratch prompt
  - `python3 -I verify.py`
  - Three `gh api -X GET` comment fetches
  - Scratch copy, `sed` and verifier runs in `.t69-neg-recovery/`
- I did not run the browser or Playwright suite, because this is a workflow task. I did not run any historical agy runner, touch agy settings, or mutate any tracked source.
- The reviewer guard refused my first attempts, which used shell loops and variables. I reran everything as literal commands.

Negative control: altered-prompt copy, using copies of `assessment.json` and `attempt-1..3` plus a copy of `verify.py`:
- Baseline copy (`ctl`): exit 0.
- `ctlA`: attempt-3 `prompt.txt` altered, receipt not rehashed. Plain `-I` run exits 1 with `AssertionError ('attempt-3','prompt.txt')` at `verify.py:15`. The hash check works against a casual edit.
- `ctlB`: attempt-3 `prompt.txt` altered and `prompt_sha256` in the copied receipt rehashed. The verifier prints "verified" and exits 0. Nothing ties the prompt to the reviewed commit or to the output stream.
- `ctlA` under `python3 -I -O`: prints "verified" and exits 0, although the same fixture is refused without `-O`. The assert-only checks are removed.

Findings (the rework verdict rests on R1 and R2; both were proved in the previous trial and re-proved in the bounded cases above):

**R1 (blocking), `docs/prototypes/new-game/T68/verify.py:6-31`.**
- Every check is a bare `assert`, so `python3 -O` removes all of them.
- The tampered-prompt fixture `ctlA` is refused plain and accepted under `-O`.
- The task protects "refuses missing or altered receipts" and "never claim a failed trial approved code". An environment variable such as `PYTHONOPTIMIZE` defeats both.
- Fix: raise `SystemExit` explicitly, or refuse to run when `__debug__` is false.

**R2 (blocking), `verify.py:11-13, 15, 29-31`.**
- Receipt fields and retained files are bound only to each other, not to the output stream, the reviewed commit or any outside anchor.
- Re-proved here with `ctlB`: an altered prompt plus a rehashed receipt passes.
- By the previous trial's controls on receipt copies, these also pass:
  - `exit_code` 7 on attempt 1
  - `duration_seconds` 0.001
  - `mode` "bypass"
  - a swapped `init.model` with the receipt rehashed
  - a `models.txt` holding only `claude-sonnet-5-5-high-fake`
  - deleting the `settings_restored` key, which skips the cleanup check
- DW1 names exit, duration and the live-discovery claim as validated, and these are self-asserted.
- I did not re-run those other cases in this pass. They are context from the previous trial, not new proof.

Prior non-blocking findings, context only and not re-verified:
- R4: `model_trial_urls`, `review_findings_relayed` and `parent_assessment` are checked only for truthiness.
- R5: `docs/harness-agy.md` describes a memory-capped `run-unit.sh` and `watch.sh` procedure, but `attempt-3/run.py` calls `agy` directly.
- R6: `review-tools/` holds inert modified copies of the review script and reviewer agent, with no label saying they are evidence only.
- R7: the cross-link to isle-wars-archaeology#9 is one-way text.
- R8: `RUN-NOTES.md` has collapsed whitespace in the added entries.

FILE: docs/prototypes/new-game/T68/verify.py
FILE: docs/prototypes/new-game/T68/assessment.json
FILE: docs/prototypes/new-game/T68/attempt-1/receipt.json
FILE: docs/prototypes/new-game/T68/attempt-2/receipt.json
FILE: docs/prototypes/new-game/T68/attempt-3/receipt.json

SCOPE: incomplete
UNCOVERED:
- Every other changed file in the 182-file diff. I opened none of them in this recovery pass, including `RUN-NOTES.md`, `docs/harness-agy.md`, `tests/e2e/reference-complete-game.spec.ts`, `docs/prototypes/new-game/T68/r1-proof-script.py`, `docs/prototypes/new-game/T68/run-browser.py`, `docs/prototypes/new-game/T68/review-tools/`, the `attempt-*/run.py` and `permission.py` helpers, `source-integrity.json`, and the attempt `output.jsonl`, `prompt.txt`, `models.txt`, `settings-cleanup.json` and `permission-grants.json` files. The verifier opened some of those as data, which I do not count as inspection.
- The `preflight-*`, `parent-final-*`, `r1-proof-*` and `evidence/**` generated evidence, including all tarballs, captures and logs.
- The scope check that changes outside T68/**, `docs/harness-agy.md` and `RUN-NOTES.md` are limited to the one-line clock fix, and that `RUN-NOTES.md` is append-only. The previous review reported both, and I did not re-verify them.
- `docs/harness-agy.md` wording against the DW2 requirement for invocation, permissions, retention and limitations.

Final pass done
rework