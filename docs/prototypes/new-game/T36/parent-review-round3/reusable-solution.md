Actual Claude review worktrees must have private dependencies rather than a link to the launcher's installed tree.

## Confirmed failure and diagnosis

In PR162, native Claude Code2.1.292 / exact `claude-sonnet-5-5` Medium ran its tests but was denied a compound command containing `rm node_modules`, where it had made an external dependency symlink. CLI exit0/final `approve` did not count: the harness correctly rejected the run. [Full invalidated final and coverage limits](https://github.com/diegoami/malpaco/pull/162#issuecomment-6247800631).

Actual same-command trials confirmed that an exact narrow Bash allow did not fix the symlink denial. A real owned directory produced an ordinary EISDIR error with zero permission denials; that is a diagnostic result, not successful cleanup. Original grants remained unchanged. [Trial record](https://github.com/diegoami/malpaco/issues/3#issuecomment-6247801134).

## Reusable fix

[Source change78c10ab](https://github.com/diegoami/malpaco/commit/78c10ab339a421f5326aad6d8e5b93081ef073f8), included in PR162:

- [Dependency helper](https://github.com/diegoami/malpaco/blob/78c10ab339a421f5326aad6d8e5b93081ef073f8/tools/harness/lib/review-dependencies.mjs): materialize private real files/directories, preserve contained relative links, reject absolute/broken/escaping dependency links, existing destinations, overlap and destinations outside the owned worktree. No hardlinks and no writes to the source.
- [Trusted launcher](https://github.com/diegoami/malpaco/blob/78c10ab339a421f5326aad6d8e5b93081ef073f8/tools/harness/review.mjs): automatically prepare dependencies after creating a new isolated Claude tree and before starting the actual CLI. Missing launcher dependencies are reported and left absent. OpenCode execution is unchanged; no opt-in wrapper or special model setting is required.
- [Tests](https://github.com/diegoami/malpaco/blob/78c10ab339a421f5326aad6d8e5b93081ef073f8/tools/harness/test/claude.test.mjs): actual launcher entry with fake CLI proves automatic setup precedes launch and copy mutation leaves source unchanged; fixture cases cover `.bin` resolution and refusal boundaries. Existing model/family/denial/posting gates remain enforced.

No permission bypass, global settings change, extra grant, provider remapping or fallback. Adapt these pieces to each repository's own trusted transport rather than copying malpaco's workflow defaults.

## Verification

Eight harness tests and build pass. Main also omitted the automatic preparation call: the real entry test failed because the fake CLI found no private dependencies; exact-byte restoration passed. Both runs and the nested failure evidence are retained under T36/evidence/parent-helper-omission-5vg5timd. [Real installed-tree proof](https://github.com/diegoami/malpaco/blob/feefffb451de8574d5e3da5b032378760da9130d/docs/prototypes/new-game/T36/evidence/reviewer-dependencies-real-copy-20261018/report.json):1636 entries/1454 regular files/8 symlinks copied; full content-tree hashes match; zero shared regular-file inodes; mutating/restoring the copy left the source unchanged. Complete raw inventories and an initial probe import error are retained beside the report.

Actual clean review at `feefffb451de8574d5e3da5b032378760da9130d`: exact `claude-sonnet-5-5` Medium, CLI0/1038.531s/failure:null/**zero permission denials**. [Full final](https://github.com/diegoami/malpaco/pull/162#issuecomment-6248031589), [explicit combined-coverage assessment](https://github.com/diegoami/malpaco/pull/162#issuecomment-6248059091), [retained receipt](https://github.com/diegoami/malpaco/blob/d7c9bee00254dbd2d985aa061d096f61980755a0/docs/prototypes/new-game/T36/claude-review-round3/receipt.json). It passed8harness+645Vitest/build/36source/36fresh-extracted/48affectedreference checks and caught8 helper/integration omissions. The whole-PR parser flags unchanged inherited coverage; main accepted the initial full review plus all current delta coverage under rule6.2, without another paid run or changing gates. All2741 raw-review members/3parts were independently archived and verified. No blocking findings; minor diagnostics/provenance/overridden-selector follow-ups remain separate.

## Adoption reports

- [diegoami/goal2](https://github.com/diegoami/goal2/issues/208) — existing native-Claude backend compatibility follow-up; not reproduced locally
- [diegoami/goal2-archaeology](https://github.com/diegoami/goal2-archaeology/issues/331) — conditional preventive adoption report; current runner is OpenCode
- [diegoami/isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology/issues/264) — conditional preventive adoption report; current runner is OpenCode
- [diegoami/game-archaeologist](https://github.com/diegoami/game-archaeologist/issues/64) — conditional preventive adoption report; current runner is OpenCode
- [diegoami/harness_imperial](https://github.com/diegoami/harness_imperial/issues/173) — conditional preventive adoption report; current runner is OpenCode
- [diegoami/github_landing_page](https://github.com/diegoami/github_landing_page/issues/10) — conditional preventive adoption report; current runner is OpenCode
- Two additional reports were filed in private repositories; their visibility is unchanged.

The audit covered40 recent active repositories. Goal2 already has a native Claude backend, but this trigger was not reproduced there. Seven other relevant runners use OpenCode; their reports are preventive and conditional on adopting native Claude. This is separate from the scheduled OpenCode2 protocol migration (#143). No downstream code, settings or CI was changed.
