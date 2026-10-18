# T74 actual-path parent validation

The bounded parent-validation transaction passed. The actual two new test paths fail before provider installation with the expected missing-module errors. With the exact three frozen candidate providers temporarily present, the single full `npm test` passes806Vitest tests in59files plus8Node harness tests, and `npm run build` passes. Finally removes all three introduced provider files and restores the preexisting worktree. This remains parent preflight: no runtime adoption, Git write, review, CI or playable activation occurred.

The supplied complete parent-validation/T74/process§4 brief governed. The existing PhaseA proposal/evidence and parent's canonical candidates, acceptance freeze and two actual tests were immutable throughout. Outputs/scripts are confined to this new parent-validation directory. No test assertion, fixture, task, configuration, dependency or proposed runtime source was changed. No browser, broader generation, targeted positive rerun, archive job or Windows action was run.

## Commands and actual results

The following command ran with all three actual source provider paths asserted absent:

```sh
npx vitest run tests/ui/generated-geography-presentation.test.ts tests/ui/generated-geography-presentation-service.test.ts
# exit1;0.631s
# 2failed suites; no tests collected
# Cannot find module '../../src/ui/generatedGeographyPresentation'
# Cannot find module '../../src/ui/generatedGeographyPresentationService'
```

This is the expected missing-provider baseline, not an assertion-level failure or positive behavioral proof. [Complete baseline output](baseline.log) and [command result](baseline-result.json) retain both actual import failures.

The transaction copied only the exact three canonical provider files to their originally absent actual `src/ui/` paths, preserving canonical bytes/modes and verifying their hashes. It then ran these commands once, sequentially, in separate systemd units with closed stdin:

```sh
npm test
# node --test tools/harness/test/*.test.mjs && vitest run
# Node harness:8tests passed;0failed/cancelled/skipped/todo
# Vitest:59files passed;806tests passed
# Vitest duration88.62s; complete command elapsed91.520s; exit0

npm run build
# tsc --noEmit -p src/core && tsc --noEmit && vite build
# both TypeScript checks pass
# Vite8.3.2:63modules transformed; built in249ms
# complete command elapsed1.205s; exit0
```

[Complete full-suite output](npm-test.log), [suite command result](npm-test-result.json), [complete build output](build.log) and [build command result](build-result.json) are retained. The unchanged old784Vitest tests plus22new tests total806. The default full-suite reporter emits aggregate counts rather than per-file counts: the immutable drawing test registers15cases (12accepted frozen drawings,398refusal, normal/cards1994 replay, unsupported-input rejection), and the immutable service test registers7cases. Both actual task paths are included in the passing full59file collection. This is their positive result within the full suite; no redundant separate targeted positive command was run.

DW1 is covered by the15actual drawing cases within that full run, using the parent's frozen complete oracle/geometry/input/save/RNG acceptance. DW2 is covered by the7actual service cases within the same run. DW3's full npm test and build commands both pass. Prior independently retained PhaseA safety and five negative-control evidence remain unchanged; they were not rerun in this stage. Formal independent approval and greenCI remain parent responsibilities before merge.

The build did not activate a new renderer path. Its originally absent `dist/` output was moved into [build-output](build-output/) for retained measurement, so no new top-level dist remains after validation.

## Exact restoration and canonical identity

[Input manifest](input-manifest.json) records13,934preexisting files with SHA256and modes, including all tracked files, actual source/tests/data/tools/tasks/config, both newly frozen actual tests, parent's canonical acceptance/candidates and previous PhaseA evidence. Historical evidence was hashed. Saved rollback copies are selective source/test/data/tool/task/config/canonical inputs and private Vite cache; historical tracked evidence was not copied wholesale.

[Temporary provider hashes](temporary-provider-hashes.json) and [final restoration receipt](restoration.json) prove:

- All three actual provider paths were originally absent and are absent again.
- Every one of13,934preexisting protected files has its original bytes and mode. No preexisting protected file required a corrective rewrite: `restoredPreexistingFiles:[]`, `changedPreexistingFiles:[]`.
- Parent's complete acceptance freeze still matches every recorded input. Both actual new test files, all canonical oracles and all PhaseA artifacts remain unchanged.
- HEAD remains`6f2e5fae7564d1dc909558172ec204fd80f206eb`.
- Index SHA256remains`412f4e6de58e5e0cbdf556e163d68fe9a687aae25e0b9d3eb2269b69d99762a4`.
- The originally absent dist remains absent; original private Vite cache was copied back from its saved snapshot.
- No exception or new failure occurred: `error:null`, `restored:true`.

Canonical provider hashes match before installation, while temporarily installed, and after restoration:

```text
generatedGeographyPresentation.ts
ec0bdf8aad3b67b847be19926bf2470738a498f99f6aa762d7a28a944dbe548a

generatedGeographyPresentation.worker.ts
3dc714a7387900f8a0795f0a549859d300b1528b88c8a9db5161862132ca3374

generatedGeographyPresentationService.ts
c5dd8c8f80cb76f1ac5bd95257551fbb92ff58633ec3857a9d4df333d6c8a1df
```

[Transaction source](transaction.py), [command wrapper](run-command.py) and [complete transaction log](transaction.log) retain the sequential execution and finally restoration. A single60second monitor watched the transaction/full-suite/build logs. No failed positive run was retried and no assertion or constraint was relaxed.

Rollback originals under saved-preexisting/saved-vite-cache remain loose and untouched for preservation. They are not new measurement outputs and need not be shipped. The measurement manifest intentionally excludes those saved originals, any saved-dist and itself; it covers scripts, complete logs/results, input/restoration receipts, this report and retained build output. No archive was made or pushed.

Parent may now inspect this full report and choose formal adoption/dispatch. This agent has made no further source changes or production actions.
