# T75 formal exact adoption report

Exact source/proof checkpoint **7fb3a578703a6499fe489592028d77c6c9d9cb41** is committed and pushed with skipCI. Its single authorized small committed-state proof passed first attempt: exit0 in **1.529seconds**, zero mismatches. No heavy test/build/package/browser, CI, review/model call, preview, Windows, merge, tag or publication ran during formal adoption.

## Behavior and exact scope

The default geographic game now requests the versioned drawing before constructing a battle host; supported loads share that path. Countries/coasts/routes/display anchors paint from the immutable sidecar, and hit paths use those same countries. Logical ids, rules state, ownership/counters, production names, fonts, keyboard/hover/focus handlers and replay/RNG remain unchanged. Root lifetime owns its worker service/cache. Superseded requests, invalid newer files, deferred file.text reads, Start, New game and disposal invalidate stale completions. Failed loads retain the previous live game and show friendly retry text. Existing old-game pacing remains unchanged while a replacement prepares.

The parent-frozen candidates were copied without code/comment/format drift. Only these production files changed:

| File | Reason |
| --- | --- |
| `src/ui/geographicGame.ts` | Await prepared drawings before constructing a host; root lifetime, supersession, cancellation and friendly failures. |
| `src/ui/geographicMapView.ts` | Use the same frozen sidecar paths for paint/hits and display anchors while retaining rules ids/names/handlers. |
| `src/ui/referenceMatchFiles.ts` | Await typed load context and invalidate superseded file reads before decode, preserving prior matches. |
| `package.json` | Set0.1.0 and replace obsolete spike description; dependencies unchanged. |
| `package-lock.json` | Match0.1.0 root package metadata; dependencies unchanged. |
| `README.md` | Describe supported early playable setup/cards/pacing/load behavior. |
| `docs/play.md` | Describe0.1.0 offline/card/play controls and supported desktop scope. |
| `tools/release/PLAY.md` | Ship matching0.1.0 offline play instructions. |
| `docs/spike.md` | Append the exact frozen T75 presentation/release note after the exact prerequisite prefix; preserve every T74 paragraph. |

Three T74 provider modules remain preexisting exact ec0bdf8/3dc714a/c5dd8c8 bytes. The stylesheet remains9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64. Core/save/RNG/AI/card policy, dependencies, host rules, test helpers and every UI readiness deadline are unchanged. docs/spike.md keeps the complete original dd704 prefix and appends only the frozen note. Parent-owned tests/coordinate adaptation/26fixture files were not edited by this adoption.

## Actual formal verification command

```text
python3 docs/prototypes/new-game/T75/production/verify-adoption.py
exit 0; wall 1.529 seconds
15 canonical equalities; 204 current + 3 historical = 207 validated inputs
26 fixture files; 8 committed archive parts; 875 exact members/permissions
818 Vitest + 8 harness, source46, extracted166 evidence authenticated
mismatches 0; freshHeavyRuns 0; looseEvidenceRequired false
```

proof-01/result.json records the exact command, source commit and measured duration; stdout.txt preserves the complete machine-readable proof result and stderr.txt is empty. The proof reads committed HEAD plus working bytes, and the committed archive in memory. It uses only Python standard library/Git, has no override flags and requires no loose phaseA–F files, absolute helper paths, extracted archive tree or old Git objects. Main owns an independent fresh normal Git export check after reading this final report.

The parent’s d051 historical authority supplement resolves exactly the three original-transaction absolute HEAD/index/ref entries. All204 repository-relative inputs still match current committed and working bytes strictly. All three historical hashes match their exact archived phaseEbefore/effective manifests and restoration/integrity receipts; the original207manifest is untouched. There is no generic path skip. Fifteen candidate hashes,26 fixtures, full875-member inventories and original controls/failures/restoration are authenticated. Git executable semantics are distinct from original POSIX modes: every tar permission is checked against both stored permissions and stat.S_IMODE(originalSourceStatMode), retaining the parent’s original pre-freeze type-bit comparison failure without rewriting it.

The old geographic-board raw-coordinate adaptation is audited against its archived and directly committed original; only rows84–89 differ, and reversing those ranges reconstructs every original byte. Frozen current assertions remain exact. proof-01/stable-inputs.json captures250stable canonical/candidate/fixture/proof inputs for the measured-to-final documentation-only handoff. proof-01/loose-originals-preserved.json separately verifies all875 retained loose originals still match parent receipt bytes/permission bits; this handoff check is not required by the portable verifier and creates no repeated archive.

## Done-when evidence reused by exact equality

The following are original retained preflight commands/results, **not fresh formal producer executions**:

```text
npx vitest run tests/ui/geographic-presentation-mount.test.ts tests/ui/geographic-game.test.ts --reporter=dot
15/15 passed; restored candidate also15/15
npm run build
passed in bounded phaseB/final candidate; static packager later also builds
npx playwright test <four canonical geography/layout specs> --workers=2
46/46 passed, single phaseC observation,248.741s
npm test
corrected phaseE:818/818 Vitest in60files +8/8Node passed
node docs/prototypes/playable/acceptance.mjs <fresh outside-checkout parent>
phaseE passed:10files,9checksum entries,4HTTPpaths; its ordinary build passed
npx playwright test --config playwright.release.config.ts <13 affected specs> --workers=2
phaseF:166/166 passed, both desktops, no retries,468.914s
```

The independent mounted/file tests exercise actual form/file handlers and accepted identities with deferred workers/readers. The negative original UI baseline failed12/12; removing await failed5/12. Raw paint, stale hits, endpoint and worker bypass each fail the intended focused browser detector and restore exactly. The five earlier four-worker browser failures remain a separate41/46result, without invented causal certainty. The integrated817/818 refusal5000ms failure5170ms also remains separate; parent contracte0fae018/checkpoint9a46 added only the explicit120000ms corpus-test budget, with exact one-argument reversal preserved and UI five-second assertions untouched. Corrected phaseE’s818+8positive is a different input, not an unchanged retry.

Full source/config/test/version identities against corrected phaseE and phaseF’s executed Node oracle/spec/config inputs justify reuse. The proof also verifies the exact inner10-file package/member inventory, all9checksum entries, truthful BUILD fields and actual worker HTTP200/hash. Parent archive SHA is8e283ff34c8fc864b8501ed6a9603008029ef3429c3a5f6e3455c1cd6c824c34,127017730bytes/eight parts/875members. All original loose reports, failed results, screenshots, cache/output backups, /tmp copies and worktrees remain preserved. No new aggregate token/agent telemetry is invented.

## Package provenance and remaining gates

The archived package SHA2fd6dad3abdc2896725288d0b82bd11d1177cd2fbae8f37cd07fe3fb6ecd1ef3 is **temporary-source preflight evidence only**. BUILD.json truthfully names prerequisite75c8e5eba9ca48ab24ce82c264cd51a4f0f082b7 while T75 source/version files were temporarily installed. Worker asset SHA31ec2b83bc75618f758d3357e156faceff73c27446d2d4b82b453fb884deb7a2 was served withHTTP200 and exercised by the real frozen Worker tests. Runtime equality does not turn that package into an adopted-head official release or owner preview.

Main owns the committed-head release candidate/build/preview, owner playable appearance and pacing judgment, independent Kimi review, actual prerequisite approval/integration, one final-head greenCI and exact tested artifact/tag publication after acceptance. DraftPR188 stays draft. This producer does not claim full release completion, owner approval, review approval or CI green. The final commit contains only documentation/measurement receipts and append-only notes; canonical runtime/test/config/version bytes remain unchanged from measured7fb3a578.


## Exact performance correction

The original adoption results above are historical. Parent corrections/20261019/FROZEN.json authenticates exactly three replacements: the pure-provider exact-output performance candidate, reviewed dev-watch configuration, and its README paragraph. Original manifests/canonical candidates/prior proof and failed CI remain immutable. The updated verifier checks both complete archives and all unchanged inputs; current validation is separately recorded in ../corrections/20261019/adoption/validation.json. Candidate unit console text was lost to a disclosed log collision; only its exit0/77.1s survives. Fresh integrated validation must provide current unit output. The new provider does not inherit the old source review approval; independent correction review, owner acceptance and green final CI remain main-owned gates.


### Current adopted-source validation

Checkpoint cb8e320b: small proof passed; fresh npm test818Vitest/60files+9harness and static package10files/9checksums/4HTTP passed. The one extracted166-case run at two workers ended165passed/1failed (compact-panels geographic computer-phase1280x800: original5000ms old Load-widget detach poll). No rerun/fix occurred;0.1.0 is not ready. Full report, all statuses/raw logs/failure video/context, truthful cb8e BUILD/package hashes, strict15,071-input/inventoried-output restoration and disclosed ignored fallback screenshot-routing limitation are in ../corrections/20261019/adoption/REPORT.md and validation.json. Earlier results remain historical. Review, owner acceptance and finalCI/release are deferred main-owned gates.


## Saturated-label correction checkpoint

The latest corrections/20261019-label-gap/FROZEN.json separately authorizes exactly provider80a79b8, preserving the original204/15 authorities, historical591 canonical, both complete archives and all prior proof copies. The verifier authenticates every file in three pinned phase manifests and recomputes actual27.491% successful/9.208% failed gates from raw events. Current contract and parent saturation proof are pinned explicitly. Fact correction: T75.md is NOT in original204; the prior saturated candidate report's task-hash verifier-failure assumption was inaccurate, and no such verifier run occurred. That old report and manifest remain immutable. Current validation has not run at this checkpoint; results will be recorded separately. Prior165/166 failure, historical screenshot gap and release/review/CI limitations remain binding.


### Saturated-label validation stop

Checkpointc0f4435d's single proof exited1 in4.136s on a new baseline precision guard: exact raw median1921.699951171875 differs from displayed1921.7 by0.000048828125ms, exceeding the mistaken1e-6 identity tolerance. No retry or npm/package/controls/browser run followed. Source80 remains committed, with16,082protected inputs/output inventories unchanged. Full current failed result is ../corrections/20261019-label-gap/adoption/REPORT.md; formal validation/review/CI/release remain incomplete. No historical report or manifest was edited.


### Exact baseline precision continuation checkpoint

The failedc0proof/adoption result remains immutable. The mechanical guard now authenticates exact raw pair[1959.5,1883.89990234375] and median1921.699951171875, separately checks its one-decimal display1921.7, and retains1921.7 as the original useful-benefit denominator with unchanged>=10% gate. No tolerance widening/runtime change occurred. Four prior active files and failed driver/report/receipts are copied and strictly pinned through existing manifestHashes. New adoption02 outputs will record the one corrected proof and previously unstarted validation; nothing has run at this checkpoint.
