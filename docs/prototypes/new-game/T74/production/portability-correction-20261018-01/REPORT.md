# T74 committed-proof portability correction

The corrected proof passes in both the original worktree and a fresh committed Git export. Only proof code, its metadata/documentation and new correction evidence changed. The three runtime providers,99frozen inputs,226validated inputs and all349archive members remain unchanged; no file was chmodded to make the proof pass. No heavy tests, browser, paid review or CI ran.

The parent read the complete7ab54604final/report and verified its original-directory proof before detecting a deterministic fresh-export failure. The standing Sol Medium correction decision is PR186comment6254578041. The full task/process§4/correction brief and complete root failure receipt were read. Correction code checkpoint65a572e548adde17599ac31645d59e73d6519697 was committed/pushed with skipCI before either positive proof.

## Failure and precise correction

[Root failure receipt](root-fresh-checkout-failure.json) records the old7ab54604proof failing in0.07790137399570085s, exit1:

```text
MISMATCH: expected mode docs/prototypes/new-game/T74/acceptance/measurements/seed-4-measurement.json
```

The original file's0664mode becomes0644 in a normal Git export; Git records100644 and cannot preserve the group-write bit. The old verifier correctly checked Git executable semantics initially, but then incorrectly reimposed the archived fullPOSIX mode on fresh tracked files. Its success in the original directory did not establish checkout portability.

The active verifier now checks committed/working bytes and expected Git executable semantics for tracked files. It no longer requires an untracked group-write bit to survive checkout. Every archive part hash/size, every uncompressed archive-member hash/size/exactPOSIX mode, complete member inventory and original inner-manifest mode check remains unchanged. Original exact fullPOSIX preservation is attributed to the authenticated original transaction restoration receipt and separately retained pre/post correction original-directory input manifests. It is not claimed for fresh exported files. No generic override flags or runtime/input changes were introduced.

## Narrow file rationale and preserved history

- production/verify-adoption.py: remove the checkout-only fullPOSIX assumption, retain Git expected executable checks and all strict original archive-mode checks.
- production/adoption.json: update verifierSha256 and modeAuthority explanation only.
- production/README.md, PR-BODY.md and docs/spike.md: distinguish tracked-checkout semantics from exact original-transaction/archive modes.
- RUN-NOTES.md: append the owner decision, plan and final measured results.
- This correction directory: preserve old bytes, root failure, bounded two-proof driver, immutable-input manifests, complete stdout/stderr/results, fresh export inventory, correction report/manifest and PR-update receipt.

The original verifier/adoption/README/REPORT/manifest/PRbody were copied byte-for-byte with their modes to [original-7ab54604](original-7ab54604/) BEFORE edits. Existing production/REPORT.md and manifest.json (historical SHA256`6127b6ef01fca0aa4dfae82f0db17fb71f23fe9dfee4be7c2095274a17c90967`) were not rewritten. All original proof01–03 receipts/logs, T73/T74 archives, loose evidence, caches/backups, worktrees and the parent's failing fresh export remain intact. A new correction manifest is used instead of replacing the historical inventory.

## The two requested committed positives

[run-two-proofs.py](run-two-proofs.py) runs exactly the current original-directory proof and one fresh Git-export proof. It exports only required99/226/proof/manifest/archive paths from committed HEAD using Git archive, then uses standard Python extraction of that trusted Git tar. It creates no Git worktree, extracts no T74 evidence archive, and never revisits the older giant T73 archive.

For the fresh proof only, subprocess environment sets:

```text
GIT_DIR = git rev-parse --absolute-git-dir from the original worktree
GIT_WORK_TREE = /home/diego/projects/malpaco/.cache/t74-proof-portable-20261018-01
```

Thus read-only Git calls use the exact committed branch while the verifier's ROOT resolves against fresh files. The old parent export `.cache/t74-proof-fresh-20261018-01` is untouched. [Fresh export manifest](fresh-export-manifest.json) records all331selected paths' committed/actual hashes and actual normal Git mode, export directory, committed head and Git-tar SHA256.

```text
python3 <original>/docs/prototypes/new-game/T74/production/verify-adoption.py
  exit0;1.5063748710017535s;stderr empty
python3 <fresh-export>/docs/prototypes/new-game/T74/production/verify-adoption.py
  exit0;1.4652426219981862s;stderr empty
```

[Original-directory receipt](original-committed-proof.json) and [fresh-export receipt](fresh-export-committed-proof.json) retain exact commands/cwd/head/durations/stdout/stderr. Each complete stdout/stderr stream is also retained separately. Both outputs are identical and prove:

```text
3exact provider/candidate equalities
99frozen inputs;226validated inputs
3committed archive parts;349complete members
12accepted maps;552connected countries/full40hits;explicit398refusal
35,328primary/1,472supplementary overlay cases
22original proposal tests;5negative controls
806actual Vitest tests/59files plus8harness;build exit0
zero mismatches;zero fresh heavy runs;no loose evidence required
```

The test/build/corpus/overlay/control counts are authenticated ORIGINAL evidence, not rerun measurements in this correction. The proof still validates all original archive modes exactly in both directories. The parent may independently repeat the fresh export once before Kimi; this producer performed only the two requested positives.

## Input preservation and handoff

[Pre-correction manifest](immutable-inputs-before.json) and [post-correction preservation receipt](preservation-after.json) show unchanged bytes AND full original POSIX modes across all327files in the frozen/validated/archive input union. Current runtime, canonical files, tests, fixtures and archive parts were neither edited nor chmodded. Fresh checkout group-write normalization is an intentional Git representation difference, not a source mutation or restoration failure.

Existing draftPR186 is updated with the corrected mode boundary and retained failure/positive evidence. New final receipt/docs commits change none of the proven runtime/test/frozen/archive inputs or active verifier code. Every correction commit skipsCI and is pushed. No review, readiness transition, merge, activation, dependency change, preview, packaging or Windows action occurred. Main owns the independent fresh check, Kimi dispatch and eventual dependency/keycheck/final-greenCI gates after reading this complete report/final.
