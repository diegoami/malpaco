# T75 integrated unit/static-package stage

The single authorized integrated `npm test` failed. **8/8 Node harness tests passed; 817/818 Vitest tests passed in60 files**. The sole failure was the preexisting T74 seed398 refusal case timing out at5000ms, reported duration5170ms. Work stopped without a fix, assertion/deadline change or rerun. The gated static packaging acceptance was **not run**.

All205 newly baselined original source/test/config/package/PLAY/HEAD/index/commit-ref inputs and modes were restored exactly. The three now-committed provider modules remain present and exact. All425 files and modes across complete phaseA/B/C file sets, and all preexisting release/dist/cache output trees, remain exact.

## Current prerequisite and exact candidate

Current prerequisite sourceCommit is `eee9986305a2919af69792751a2aa20afd47e5ae`. The parent had merged formal T74 source7ab54604, its22 tests and the corrected T73 native-save helper into this worktree. Preservation was rebased on this current tree; phaseA’s historical195-file baseline was not incorrectly reused.

Authenticated all15 frozen phaseB proposal hashes and phaseC’s executed-input equivalence. Installed only the same three T75 UI proposals, exact geographic-board display-coordinate adaptation, two new tests, package/lock metadata and the already frozen tools/release/PLAY.md. Provider runtime, CSS, old helpers, deadlines, other assertions and remaining docs were untouched. The exact temporary substitutions are listed by SHA-256 below; all-integrated-input-hashes.json covers207 complete effective source/config/metadata/HEAD/index inputs, including the two new tests absent from the205-file baseline.

- `src/ui/geographicGame.ts`: `c4e10b281d1a1abf14ba6a3261fd30a896ca56ffa98f22e7d0c14e11f2de9129`
- `src/ui/geographicMapView.ts`: `43efed85269a5dda500d520c62f8a89e37db63d6966f438dd9f34ae88bff3c02`
- `src/ui/referenceMatchFiles.ts`: `b86aae8f3560f2d84c114916abeb64bdd077a369b4208fd8571af0569f197eb9`
- `tests/e2e/geographic-board.spec.ts`: `27b043120fe1a698fbdd8a5f425403f77c6eea5326a6d2b52dd1da1be672030c`
- `tests/ui/geographic-presentation-mount.test.ts`: `176a1bbeb2c7898f313d4898cf98764d9be79f7749fb35dd953ff1a20263809b`
- `tests/e2e/geographic-presentation.spec.ts`: `e93b62748209d960946ae291f5d0b7422412887a94377bd64b386168459e26c0`
- `package.json`: `7fc0e7691e00b9940f7180b569cc9362863ecbfe43ebe0e59fa368b5653be739`
- `package-lock.json`: `576217ccfbe5370c20a3ceb12ea3c5d8cc132489644375042b034b6459237489`
- `tools/release/PLAY.md`: `7fb011104538eccbf9f1bea3805d9e47fc4f6ba117a50e6a09b95f9f8e2a888d`

The provider hashes remain:

- generatedGeographyPresentation.ts: ec0bdf8aad3b67b847be19926bf2470738a498f99f6aa762d7a28a944dbe548a
- generatedGeographyPresentation.worker.ts: 3dc714a7387900f8a0795f0a549859d300b1528b88c8a9db5161862132ca3374
- generatedGeographyPresentationService.ts: c5dd8c8f80cb76f1ac5bd95257551fbb92ff58633ec3857a9d4df333d6c8a1df

## Sole command and failure

```text
npm test
> node --test tools/harness/test/*.test.mjs && vitest run
Node harness: 8 passed, 0 failed
Vitest: 1 failed | 817 passed (818)
Test files: 1 failed | 59 passed (60)
Vitest duration: 82.73s
command exit 1; wall 85.677s
```

Failure:

```text
FAIL tests/ui/generated-geography-presentation.test.ts:27
retains all original398 refusal attempts and exact final RNG without deriving a replacement
Error: Test timed out in 5000ms.
reported duration: 5170ms
```

No assertion expected/actual mismatch was reported. The log demonstrates a deadline overrun; it does not prove a scheduling/contention cause or a wrong refusal/RNG result. The preexisting test and timeout remain binding. No new product/helper/test fix or retake was attempted. The provider test-file SHA and short source context are preserved in failure.json; complete stdout/stderr is logs/integrated-npm-test.txt. The unique unit was mlp-t75-d-integrated01, with closed stdin and one60-second monitor.

## Static package stage deliberately not reached

The unchanged intended next command was:

```text
node docs/prototypes/playable/acceptance.mjs /tmp/malpaco-t75-phase-d-20261018-01-paqhlo2a
```

Its required predecessor failed, so this command, its ordinary packager/build, HTTP checks and server were never started. No fresh archive, BUILD.json, SHA256SUMS, extracted worker or new package checksum inventory exists from this stage. The new owned extraction parent remains empty; parent may clean it after reviewing this evidence. No inherited /tmp path was touched.

**Temporary-source provenance limitation:** had packaging run, its unchanged BUILD.json would truthfully name prerequisite Git HEAD eee9986305a2919af69792751a2aa20afd47e5ae while proposed T75 runtime/version0.1.0/PLAY bytes were temporarily installed. Such an artifact would be preflight evidence only, never an official release or owner preview. No BUILD.json was created or edited here. generated-outputs/dist is merely the retained inherited build snapshot from before this failed stage, not a new phaseD artifact.

## Output and source restoration

Before running, copied every existing output tree that could be overwritten: dist and node_modules/.vite existed; release, root.cache/.vite, node_modules/.vite-temp and node_modules/.cache were absent. output-before.json records complete file/directory hashes/modes. output-backups/ retains originals; generated-outputs/ retains post-test snapshots. The finally block restores original trees and removes only newly introduced owned output paths. output-after.json compares exactly equal. No inherited release/archive/evidence was deleted.

transaction-originals.json records the nine changed paths at this stage: seven preexisting files and two absent tests. Only those two new tests were removed. The three committed providers were never in the removal list. finally-restore-manifest.json and final-integrity.json confirm205 originals including HEAD/index/branch commit ref, all425 phaseA/B/C files and modes, all output trees and provider3 restored exactly. Final stylesheet SHA is9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64.

## Separate prior evidence and limits

- PhaseB REPORT.md and logs/accept01-affected.txt preserve the distinct four-worker41/46 browser result and all five load-detachment failures.
- PhaseC REPORT.md, report.json and individual-results.json preserve the distinct single two-worker46/46 positive with unchanged candidate/assertions/deadlines.
- PhaseB controls and15/15 mounted-unit/build positives remain preserved; this integrated failure does not overwrite them or create a combined green claim.

No browser command, separate build, packaging check, Git write, CI, review/model call, Windows validation, publication or production adoption ran in phaseD. Broad integrated acceptance is currently not green, and static/offline acceptance remains outstanding. Parent must read this full report and final before any next authorized stage.
