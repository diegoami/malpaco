# T75 exact performance adoption — bounded validation failure

**0.1.0 is not ready.** Exact frozen provider591 was adopted and pushed, committed-state proof/fresh integrated tests/static packaging passed, but the single authorized extracted browser run ended165passed/1failed. No diagnosis, fix, retry, further test/proof/build, review, CI, model, Windows, merge/tag or publication followed. Parent/owner requested wind-down; only evidence/report/result commit is completed here.

Parent froze and authorized exact performance source591 plus the already integrated reviewed watch configuration4cae/README paragraph under8acb2a69. The first source/proof checkpoint is cb8e320b73b0f134ac8c73ba210b554211b0a0ad [skip ci], pushed successfully after explicitly setting the previously absent upstream. No algorithm revision occurred after the accepted temporary candidate.

The updated committed-state verifier pins FROZEN SHA aab9d8472aefc646662af0f51f8e636b210470d45d8e4863b5095699c26b8f03. It requires the exact three replacement paths, authenticates every before hash against the unchanged original manifests, authenticates all frozen after/canonical bytes, and retains original historical input mappings for old extracted receipts. Only two of204 current inputs and two of15 canonical runtime equalities differ; all15 archived canonical candidates still authenticate unchanged. The unchanged204-plus-three-historical authority,26fixtures, original875members/eight archive parts, all old restoration/source/package outcomes, prior-proof copies and three reviewed watch-guard hashes remain checked. The new834-member/nine-part archive also authenticates every member/hash/size/POSIX mode, and its small actual trace records prove full Worker input/output equality, three original-five-second positive controls and warm identity. It preserves/discloses the candidate unit console collision (only actual exit0/77.1s survives) and all earlier preflight/CI failures. No generic path skip or original authority overwrite exists. freshHeavyRuns0 remains explicitly historical; current results are a separate validation receipt.

This proof ran exactly once after source/proof commit, exit0 in5.057s. It required no loose phase directory. No original raw phase/archive, canonical test/fixture/oracle/guard, source worker/service/host/core/save/RNG, CSS, dependency, CI policy, task contract or deadline was edited. No broad source-browser run or standalone repeated build/test was performed. Static acceptance's existing package command already typechecks/builds exactly once; no separate build was added.

Old results remain historical: phaseB four-worker five timeouts, phaseC46passes, phaseD refusal398 implicit-budget failure, phaseE818+8/static positive, phaseF166extracted positive, later finalCI39168930877 source289passes/55failures/package skipped, native/paused/throttled original diagnostic failures and false initial mock-clock label. This correction has new source and does not inherit the old provider review approval. This stage provides fresh local committed-source validation, not green finalCI, owner look/pacing approval or publication.


## Source and proof checkpoint

Checkpoint cb8e320b73b0f134ac8c73ba210b554211b0a0ad (`fix: adopt exact T75 presentation performance correction [skip ci]`) was committed/pushed before any validation. The initial plain push exited128 because no upstream existed; explicit `git push --set-upstream origin task/T75-playable-border-release` succeeded, updating8acb2a69..cb8e320b. `checkpoint-push-receipt.json` records both attempts. No force push or main merge was used.

Source provider SHA256 is59137044a36f65ae303d80e4d5e90861cdbfdb66aa7ef04621152d71b89e1883, exactly parent-frozen candidate.ts. No algorithm revision was made. Worker/service/host/core/save/RNG/test/helper/fixture/deadline/CSS/dependency/CI-policy bytes remain unchanged. Changed files at checkpoint are only provider, production verifier/adoption metadata/README/report, append-only RUN-NOTES and new current validation placeholder. The full current contract and process4 were read from the dispatched brief; no worktree task contract was edited.

## Commands, exact exits and durations

`run-validation.py` retains execution code; `commands.json` has every argv/return/duration. Unit mlp-t75-corrected-acceptance01 used closed stdin and one60-second monitor. All command log names are unique and distinct from `00-systemd-overall-stdout-stderr.txt`; current npm console output is complete. Both owned unit and monitor have ended, and server4175 is closed.

| Command | Actual result | Duration |
| --- | --- | ---: |
| `python3 docs/prototypes/new-game/T75/production/verify-adoption.py` | exit0; original and correction mismatches0 | 5.057s |
| `npm test` | exit0;818/818 Vitest across60files;9 harness passes,0fail | 91.277s |
| `node docs/prototypes/playable/acceptance.mjs /tmp/malpaco-t75-corrected-fc33zzrh` | exit0;10files,9checksums,4HTTP paths | 5.739s |
| `npx playwright test --config playwright.release.config.ts <13specs> --workers=2 --reporter=list,html,json` | exit1;165passed/1failed,166total,0retries | 639.940s |

The13 unchanged specs are geographic-presentation, geographic-board, geographic-review-guards, battle-panel-fit, cards, computer-cards, cards-result-layout, match-save, versioned-match, playback-controls, playback-edge-cases, compact-panels and game-event-log. Full argv appears in commands.json. No `--list`, pipeline, source344-case run or second browser attempt occurred. Both1280x800 and1920x1080 projects ran with the existing extracted release configuration. Per-case actual status/errors/duration/retry are retained in `individual-results.json`; the complete Playwright JSON is `browser-report.json`, with full console, HTML report, video, contexts and produced screenshots. All165 passes remain recorded, including the corresponding1920x1080 geographic computer-panel case. No observed failure is relabeled a pass.

Fresh npm log contains `Test Files 60 passed (60)`, `Tests 818 passed (818)` and harness `pass 9`/`fail 0`; current integrated evidence resolves the prior temporary-candidate console-retention gap without changing that historical gap or inventing its test count. The old77.1-second unit console collision remains honestly preserved inside the authenticated correction archive.

## Complete failing case and callsite

`[1280x800] tests/e2e/compact-panels.spec.ts:40:2` — `geographic: computer phase changes keep actual card bounds stable`; expectedStatus passed, actual failed, retry0, reported duration4672ms. The failing call is test line43 (`await load(page,input(host,label))`); helper line21 polls the previous Load-game file widget:

```ts
const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'panels.json',mimeType:'application/json',buffer:Buffer.from(text)});
await expect.poll(()=>previous!.evaluate(el=>el.isConnected)).toBe(false);
```

Exact error (ANSI removed here only; raw preserved):

```text
Error: expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
at load (.../tests/e2e/compact-panels.spec.ts:21:64)
at .../tests/e2e/compact-panels.spec.ts:43:4
```

The failure occurs in load before the card-bounds assertions. The actual error-context snapshot shows New geographic game, seed1994, Load game and Loading game…; the alert node has no text. No causal diagnosis or new profiling was undertaken. The unchanged original5000ms wait remains binding; the narrow three-control feasibility success is not a universal timing guarantee and does not waive this failure.

Actual retained failure artifacts are:
- `test-results/compact-panels-geographic--6f5ea-p-actual-card-bounds-stable-1280x800/video.webm`
- the adjacent `error-context.md`, containing complete callsite/source/snapshot
- `failure.json`, `individual-results.json`, complete browser-report.json and full04 console log

There was **no automatic Playwright failure PNG** under the unchanged configuration. Before parent advised no frame rendering was needed, a single last frame was already extracted from the retained video using ffmpeg; `failure-final-video-frame.png` is explicitly derived video evidence, not an automatic failure screenshot or a new browser observation. It is preserved, and no further rendering occurred.

## Exact package, real Worker and outside extraction

The unchanged package acceptance built once and extracted to the new owned `/tmp/malpaco-t75-corrected-fc33zzrh/malpaco-playable`. No inherited temporary path was removed or moved. The exact extracted-package copy and package-member hashes are retained under this directory; fresh dist/release/cache outputs are saved under fresh-outputs before restoration.

Archive SHA256 d97ff5f92c055ed06186d53da6c2fd12d71dbc9d8c5b28ce6b1d1095a553d99f,449919bytes. BUILD.schemaVersion1/minimumNode22/sourceCommit cb8e320b73b0f134ac8c73ba210b554211b0a0ad names the actual committed source used. Unlike the historical temporary package, this package has truthful adopted-source provenance; it is still not an accepted official release/owner preview.

The bundled real Worker `assets/generatedGeographyPresentation.worker-DGiQULpt.js` was independently fetched during the browser run from the unchanged launcher: HTTP200,text/javascript,6023bytes,SHA2568aa6884eafe24bffc4eae3a784a1c4178680077a30aaa6c5649d6587b0ac2ce7, exactly equal to the extracted asset. Full HTTP receipt is worker-http.json. Package CSS/index/fonts/serve/PLAY/BUILD/SHA256SUMS hashes are all retained in artifact.json; the actual tests exercised the extracted runtime, with Node-side source tests/oracles at the same committed inputs.

## Preservation receipt and explicit output-routing limitation

`transaction-validation.json` preserves the generated finally receipt; validation.json adds the current counts/failure/remaining-gate summary. All15,071 protected source/test/task/config/guard/canonical/fixture/archive/prior-report files and actual Git HEAD/index/ref hashes/modes match their pre-validation values. All inventoried output trees (`dist`, `release`, `.cache`, `.vite`, node_modules/.vite, .vite-temp and .cache) were saved before, fresh results copied separately, and original existence/byte/mode inventories restored exactly. No runtime source restoration was needed because validation used the committed candidate. Original phase directories, archives and all loose evidence remain intact. `before-manifest.json`, output-before/output-after and finally receipt retain the exact scope of this proof; no broader preservation claim is made.

**Routing gap:** this driver inherited the prior phaseF screenshot environment list, which omits COMPACT_PANEL_EVIDENCE_DIR and VERSIONED_MATCH_EVIDENCE_DIR. Consequently compact tests wrote fixed filenames to ignored `screenshots/compact-panels`, and versioned tests wrote unique mkdtemp `screenshots/versioned-*` directories, outside the new owned evidence directory. Those ignored fallback paths were not inventoried/backed up before this run. Their resulting known files were copied into fallback-screenshots; no original fallback files were deleted, moved or overwritten afterward. Preexisting ignored compact filenames may have been replaced during tests, and their earlier bytes cannot be proven preserved. This is a limitation of evidence routing/preservation, not a claimed clean output receipt for those paths. Versioned current files were copied by mtime after the before-manifest creation; their test uses unique mkdtemp directories. output-routing-limitation.json records every copied file/hash/mtime and exact limitation. Parent will record the gap in existing189; no new task or fix was started.

No long job/server/monitor remains. Parent owns rehoming the retained outside extraction later; this agent left it present. Current hashes/receipts and all raw results are retained under this newly owned adoption directory and included in the result commit; old loose raw phases are not separately staged.

## Stop and remaining release gates

The single authorized browser failure blocks acceptance. 0.1.0 is not ready. No retry, source revision, deadline/assertion relaxation or further diagnosis was performed, including after the owner's wind-down message. The final result commit changes only owned evidence/current metadata/production result documentation and append-only notes; it introduces no runtime/test/config changes after cb8e320b. Main must read this FULL report/final before any later decision. Failure triage, any separately authorized correction, independent correction review, owner appearance/pacing acceptance, fresh finalCI and exact artifact/tag publication remain deferred main-owned work. No new task dispatch is requested.
