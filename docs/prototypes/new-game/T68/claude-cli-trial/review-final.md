# Supplemental review of PR #153 (Claude CLI, read-only)

**Verdict: no blocking findings.** Four non-blocking findings remain, and the receipt verifier could not be re-run (see "Checks not run").

This is not a merge gate. Existing MiniMax and CI approvals are context only, not proof.

## Tree proof
- `git rev-parse HEAD` returned `6fde4cb2c371bfdc933892f19b2cf7cb9573168b`, which matches the requested head.
- `gh pr view 153` shows state MERGED, `headRefOid` 6fde4cb, `baseRefOid` 50a2dcbf8eee240872e82199fb3cb2b3c45e6c03, and merge commit da7c2a5.
- The full PR diff is too large for the GitHub API (HTTP 406, over 20,000 lines). I used the PR file list and a local `git diff 50a2dcb 6fde4cb` for the one test file instead.
- I did not diff against current `origin/main`.

## Findings

**R1 (non-blocking, low-medium): the verifier is self-attesting and does not check what the docs say it does.** See `docs/prototypes/new-game/T68/verify.py:7-32` and `docs/harness-agy.md` ("Assessment and reuse").
- The docs say it "rejects missing or changed prompt/output evidence". In practice it only catches a changed `prompt.txt` or `output.jsonl` when `receipt.json` is left unchanged. The hashes sit next to the files they cover, so anyone who edits both also passes.
- Done-when 1 says "validates live discovery". The verifier never runs `agy models`; it only checks that the model id appears in the retained `models.txt` (line 16).
- `reviewed_commit` is a hardcoded constant (line 12), the same for all three attempts. That fits this one trial, but the script is not reusable.
- `model_trial_urls`, `review_findings_relayed` and `parent_assessment` are only checked for truthiness (lines 7, 32). Nothing ties them to the real model-trials comments.
- `duration_seconds` is only checked to be above 0. Nothing compares it with the events in `output.jsonl`.
- I rate this non-blocking. It is a bounded trial, and the docs do say "retained receipts". The wording "live discovery" and "rejects altered receipts" should be softened, or a note added that the checks are internal consistency only.

**R2 (non-blocking, low): the settings-restore path in `attempt-3/run.py:24-30` is weaker than the docs imply.**
- The docs say "A `finally`/error path must restore them on failures". The code uses `except BaseException` and restores only if `settings.read_bytes()==replacement`.
- If agy rewrites the settings file, as it did in the pilot, restoration is silently skipped. On an exception the temporary allow-list grants then stay in global agy settings with no signal. The success path records `restored=False`, but the exception path re-raises with no receipt.
- Both `settings.write_bytes` calls are non-atomic. The lock file only guards runs of this script against each other, not other agy processes.
- The docs already warn "Do not copy this measurement runner", so I rate this non-blocking.

**R3 (non-blocking, informational): the "read-only" claim rests on agy's permission rules.**
- It depends on `deny: write_file(*)` plus five exact-match allow regexes (`permission-grants.json`). The docs correctly say plan mode is not a sandbox. I did not test whether any other tool path (for example a shell command outside the allow-list) can write, so the read-only property is unproven.
- The doc's "File writes are denied" describes the configuration, not a tested guarantee.

**R4 (non-blocking, informational): the clock fix is correct.** The change at `tests/e2e/reference-complete-game.spec.ts:32` is:
```
-  await page.clock.install(); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
+  await page.clock.install({time: new Date("2026-10-17T00:00:00Z")}); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
```
- It starts the fake clock before the pause target, so `pauseAt` no longer fast-forwards into the past.
- It is exactly one line, and no assertion was weakened.
- Rule 12's scope exception was declared on the PR (the "Required CI … failed" comment).
- Nothing in the code handles the "past" case any other way, so the old failure mode is gone.

## Done-when
- **DW1:** `python3 -I docs/prototypes/new-game/T68/verify.py` could not be run. Bash was denied in this session after my first calls. I read the verifier and its inputs statically instead (R1). A MiniMax review comment on the PR reports it passing, but I did not confirm that.
- **DW2:** `git diff --check` was not run (same denial). The docs in `docs/harness-agy.md` give the invocation, permissions, progress and retention procedure, and limitations. The trial is recorded in the PR comments, but I did not open model-trials #3 or isle-wars-archaeology#9 to confirm.

## Checks not run and coverage limits
- Not run: the verifier, `git diff --check`, any negative controls on the verifier, browser or CI suites, and `agy`.
- Not read: `docs/process.md` and the repository `CLAUDE.md`, beyond the copy supplied in context. I also did not read `RUN-NOTES.md`, `assessment.json`, the attempt `output.jsonl` and `cli.log.gz` files, `attempt-3/review.txt`, `prompt.txt`, or the `evidence/` archives.
- Read: `docs/harness-agy.md` in full, `verify.py`, `attempt-3/run.py`, `attempt-3/permission-grants.json`, the one-file test diff, the PR metadata and file list, and the PR comments.
- Not covered: the content of the T34 Sonnet review, the claims in `attempt-3/settings-cleanup.json`, and the claim that all other test bytes are unchanged. I checked that last one only for the single spec file named above.
- Because the verifier was not re-run and several artifacts were not read, this is not a full approval of the evidence set. I found no substantiated blocking defect in what I did read.

Final pass done. Verdict: no blocking findings; R1–R3 are non-blocking follow-ups.
