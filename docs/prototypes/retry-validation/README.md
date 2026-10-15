# Retry validation acceptance preparation

`tests/e2e/retry-validation.spec.ts` is the focused acceptance for issue45. It starts from the real seed1506 generation refusal at both configured viewports, retries invalid empty, negative, fractional and greater-than-uint32 inputs, checks visible seed feedback and an unchanged refusal route, then checks refusal replay and exact recovery to the seed1994 `createGame` opening for three human seats and four seats with computer opponents. The computer route freezes virtual time before navigation. The run retains refusal and invalid-input captures under its evidence directory and listens for browser errors.

`generatedGame.candidate.ts` contains the disposable retry-feedback candidate. It reuses `parseGameSettings` errors and adds feedback only to the refusal route. `replay.mjs` installs this candidate only for `mock`, then restores the original `src/ui/generatedGame.ts` bytes in `finally` for either mode. Each run stores its command, exit, source hashes, standard output and standard error in a fresh evidence directory. `RETRY_VALIDATION_EVIDENCE_DIR` directs the test screenshots into that directory.

The parent runs the pinned proof with:

```sh
node docs/prototypes/retry-validation/replay.mjs baseline -- npx playwright test tests/e2e/retry-validation.spec.ts --workers=2
node docs/prototypes/retry-validation/replay.mjs mock -- npx playwright test tests/e2e/retry-validation.spec.ts --workers=2
```

The baseline is expected to fail the new feedback assertion. The candidate run must pass both viewport projects. Both preflight replays retain command output, exact source hashes and screenshots under `evidence/`.

After permanent source installation, run `node docs/prototypes/retry-validation/verify-final.mjs` in the pinned environment. It runs focused acceptance, unit tests, build and full browser suite, mutates only the retry feedback assignment and requires focused acceptance to fail at `toBeVisible`, restores source byte-for-byte, then reruns focused acceptance. It retains command output, screenshots, source hashes and SHA-256 sums in a fresh `evidence/final-*` directory. Do not update existing browser goldens.

After those full checks pass, `node docs/prototypes/retry-validation/verify-final.mjs --mutations-only` reruns focused acceptance before and after the actual-source feedback omission mutation, skipping unit/build/full-browser. This mode records a separate evidence directory and restores the exact source bytes.

Stage 1 syntax preflight on 2026-10-15: `node --check docs/prototypes/retry-validation/replay.mjs` exited0; `node_modules/.bin/playwright test tests/e2e/retry-validation.spec.ts --list` exited0 and listed exactly two tests, one for each configured viewport. No browser was launched locally.
