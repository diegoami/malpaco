# T76 rework round1

The completed initial Opus review found one runtime defect and two weak acceptance checks. This round addresses only blocking R1/R2/R3 and the parent's same-task release-documentation amendment. R4/R5 remain deferred nonblocking findings; R6's speed-in-Settings arrangement remains owner-approved. No review approval, final CI or publication is claimed by this report.

## Corrections

- R1: `BattleChrome.open()` now remembers the current visible history position before closing or moving any surface. This is the only runtime change in this round. The new case starts with a visible sidebar and hidden topbar, reads two distinct older offsets, opens Details and returns, opens Settings, and checks complete rows plus exact saved state/RNG. It covers both supported hosts and desktop sizes.
- R2: the capture case chooses a legal amount different from pendingCapture.defaultAmount, rather than the former max=default value. Pause/resume redraws the controls; the final captureMove oracle uses the selected amount exactly.
- R3: the friendly case derives a legal strong source through ordinary reinforcement actions and normal match replay. Maximum must be at least2, and the selected amount must be below that maximum. A visible Game speed change triggers the real controller redraw; the old input must disconnect, while the replacement retains its quantity and focus. The confirmed friendlyMove is compared with exact core state/RNG.
- README.md, docs/play.md and tools/release/PLAY.md now identify0.1.1 and briefly describe hide/restore icons, essential rail actions and Cards/Details/Settings, including speed/save/load. The README also links the existing public play site. Package versions and dependencies were unchanged in this round.

## Negative and positive evidence

The first negative attempt exposed the old reference friendly fixture's lack of a source with two movable armies, and native1920 zoom quantization. These failures remain retained. An independently prepared ordinary-reinforcement replay supplies the strong source. The next pre-fix run has four executed R1 failures and eight passing strengthened capture/friendly checks.

The first positive run was10/12: both1920 failures were an initial test scroll write/read of120 returning120.00000762939453, before opening the surface in that iteration. The new history comparison now captures native offsets and bounds physical movement below0.5CSSpx; the parent accepted that measurement correction. Core/save/RNG equality remains exact. The corrected positive batch is12/12.

Each deletion then fails all four host/viewport cases, with zero skips, and restores original source bytes/SHA in finally:

| Deleted behavior | Observed failure |
| --- | --- |
| fresh history snapshot in open | older-reader displacement2606CSSpx in first failure |
| capture draft value | expected1, received default6 |
| friendly draft value | expected4, received default5 |
| friendly focus restoration | replacement quantity input inactive |

Full failure messages are in mutation-assertions.json. These canonical tests were developed independently from the findings; reviewer scratch specs were not adopted.

## Full contract on corrected source

Every command ran in the unchanged pinned nonroot/network-none Playwright container, with private1GiB SHM and existing physical dependencies. Source/test/package identities are identical before/after and across all final commands; frozen hideable-panels SHA equals parent preflight.

- DW1: `npx playwright test tests/e2e/hideable-panels.spec.ts --workers=2` →8/8 passed.
- DW2: all nine specified suites →116/116 passed (the previous112 plus four new R1 history cases).
- DW3: `npm test` →818 Vitest tests in60files and all9 harness tests passed. `npm run build` →0.1.1, TypeScript passes,66modules, Vite131ms.
- Canonical inventory: `npx playwright test --list` →380 tests in38files. This is the measured source count for final CI; it is not a claim that all380 ran locally in this round.

## Preservation and artifact

negative-and-mutations.tar.gz preserves116 verified members, including both original negative attempts, the failed positive measurement, the corrected positive, all four deletion runs, source originals and unit logs. full-validation.tar.gz.part-000..002 reconstruct89686605bytes and316 verified members; full-validation-manifest.json pins part/member byte hashes, sizes and permissions, and its joined hash was verified. All raw directories and unsplit archives remain locally. Initial Opus evidence is copied under ../review-r1/: ten parts,165762373bytes, joined SHA0ddbe32055c41c39bfa11d706436dd5b7d3b16a5ee96b998c2899b58170dc81c; substantive REWORK and harness exit4 evidence-format limitation are preserved without approval claim.

All earlier implementation evidence remains historical and unchanged: pre-feature icon failures18/18 and24/24, focus-edge failures2/2, deliberately stopped focused01 exit137 (CSS diagnosis, not OOM), focused02 hidden-history failures, focused03 hidden-event-dialog failures, focused04 command-layout failures, and initial TS2322 build failure. The prior report/archives retain their complete counts and corrections. The review's surviving capture/friendly mutants remain part of that initial review history; this round's four caught deletions provide the replacement proof.

The final immutable six-file dist copy is `.cache/T76-preview-rework1/` in this worktree. dist-files.json is the new artifact manifest; validation/final-dist-files.json remains historical. JavaScript is assets/index-BEu4Nv8L.js, SHA25687313292303e15a7c98afa06c5026c162bfe86041c49d26a2dadc6a15015a4d7. CSS, SVG appearance, fonts and worker are unchanged. Parent owns authorized review follow-up, one final CI and exact-artifact publication. No new task, review, CI, release or optional runtime work was started by the implementer.
