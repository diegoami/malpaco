# Fix #45 Invalid seed feedback on Retry

- **Kind**: fix; follow-up to T15/PR44.
- **Issue**: #45 · **Branch**: `fix/45-retry-validation` · **Merge after**: fix48.
- **Implementer**: native GPT-6 Luna high; owner selected.
- **Reviewer**: MiniMax M3 (`minimax/MiniMax-M3`), thinking; owner selected.
- **Evidence**: generatedGame.ts retry parses the edited seed but silently
  returns on invalid settings; issue45 records this path. Existing generator
  refusal at seed1506 and accepted settings are unchanged. Error copy is
  [designed] using parseGameSettings errors and the current refusal panel.
- **Owns**: src/ui/generatedGame.ts, tests/e2e/retry-validation.spec.ts,
  docs/prototypes/retry-validation/**, affected docs/spike.md.
- **Scope**: Clicking Retry on the generation-refusal panel with an invalid
  edited seed shows visible actionable validation feedback, keeps the entered
  value editable and stays on the refusal route. Reuse existing validation,
  preserve seed/seat/opponent settings on successful retry and keep genuine
  generation refusal/recovery functional. No generator, rules, palette or
  unrelated file-control cleanup changes.
- **Done when**:
  1. `npx playwright test tests/e2e/retry-validation.spec.ts --workers=2`
     passes at both pinned sizes from real seed1506 refusal: empty, negative,
     fractional and greater-than-uint32 inputs followed by Retry show actionable
     visible validation rather than silently returning. No navigation or new
     board occurs; the edited value remains available for correction.
  2. The same suite proves correcting to1994 starts an exact createGame opening
     with preserved seat count/mode for humans and computers; retrying the
     genuinely refused seed still shows refusal, then valid recovery works.
     Error/form/retry controls fit text and viewport, screenshots retained,
     no browser errors. Keep Generate keyboard-submit behavior compatible.
  3. Focused checks fail on original code and pass on disposable candidate;
     actual-source omission of invalid-Retry feedback fails acceptance. Restore
     exact bytes and retain command results/source hashes.
  4. `npm test`, `npm run build`, full pinned `npx playwright test --workers=2`
     pass with all prior assertions and goldens unchanged. Generated outcomes,
     refusal seeds, successful-game and authored routes remain compatible.
- **Hazards**: Native input validity on the Generate submit path does not cover
  a type=button Retry handler. Do not broaden accepted seed values or hide the
  real generation error. No change for issue45's unverified neutral-badge note.
