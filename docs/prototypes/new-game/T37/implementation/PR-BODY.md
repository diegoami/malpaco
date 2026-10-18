Closes #82.

Capturing turns can now earn one card under the explicit deck-v1 rules preset. A full five-card hand requires a chosen discard before any draw, reshuffle or victory check. Squall and elimination discard precisely, and strict options/actions replay preserves pending choices and RNG continuation.

Scope: `src/core/cards.ts` defines approved composition, hidden hands/public projection and deterministic piles; `types.ts`/`index.ts` expose the API; `state.ts`/`setup.ts` initialize and clone optional cards; `rules.ts` integrates capture rewards, pending discard and elimination; `match-save.ts` adds frozen reference/geographic cards1/schema3 tuples. The one adjacent `src/ui/gameEventLog.ts` change is the blocking mechanical discardCard label authorized by the amended task and rule12. Current T36 defaults and all historical identities remain unchanged. Trade/raid effects, card UI and computer policy stay in later tasks.

Validation on the actual adopted source, with frozen acceptance unchanged:

```text
npx vitest run tests/core/card-deck.test.ts
  Test Files 1 passed (1)
  Tests 13 passed (13)

npx vitest run tests/core/card-deck-replay.test.ts
  Test Files 1 passed (1)
  Tests 7 passed (7)

npm test
  harness: 8 passed, 0 failed
  Test Files 50 passed (50)
  Tests 665 passed (665)

npm run build
  core and full TypeScript checks passed
  58 modules transformed; built in 287ms

docker run --rm --init --ipc=host --user 1000:1000 \
  -v /home/diego/projects/malpaco/.cache/t37-work:/work -w /work -e HOME=/tmp \
  mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test \
  tests/e2e/versioned-match.spec.ts tests/e2e/reference-complete-game.spec.ts \
  tests/e2e/game-event-log.spec.ts tests/e2e/geographic-review-guards.spec.ts --workers=2
  28 passed (1.2m)
```

Parent independently froze20behavior cases before dispatch: baseline20fail, integrated mock20pass, pre-discard omission7fail and duplicate-card omission10fail, with exact source restoration. All eight production token streams equal that mock except comments/whitespace, so these negative controls remain applicable. The fresh production run retains raw outputs,168source-input files,136browser-artifact files, per-member archive hashes and unchanged-input receipts under `docs/prototypes/new-game/T37/implementation/`. All frozen tests/fixtures remain byte-exact. No implementation-time temporary mutations were performed.

Docs changed: `docs/spike.md` explains API/provenance and stable save stages; append-only `RUN-NOTES.md` records the run; owned implementation evidence explains scope, commands, hashes and limitations. Existing preflight sources/drafts/failures are preserved.

Owner-selected native Sol Medium implemented; independent Kimi K3 review remains main-owned. No CI or review was dispatched by the implementer.
