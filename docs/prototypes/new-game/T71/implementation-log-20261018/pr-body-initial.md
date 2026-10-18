Reference and geographic games now provide one Compact/Detailed selector, Compact by default, with stable turn/action/history areas. The sidebar retains the loaded match’s complete chronological battle history: older entries remain available by scrolling, new events follow only an existing bottom reader, and loading a match replaces history cleanly. Native browser maximum detection preserves this behavior under desktop zoom.

Closes #163

Scope:
- `referenceBattleGame.ts`, `panelDetail.ts` and `battleView.ts` provide the shared accessible session preference and focused presentation without changing controller actions or scheduling.
- `panel.ts` retains every described battle event and preserves reading position. `styles.css` provides stable panel tracks and a bounded inner history scroller shared with legacy hosts; mandatory human capture/movement/loss controls remain visible.
- Parent-frozen acceptance covers real computer actions, geometry, replay/timer/pause/speed/log/load continuity, chronological retention and required human choices. Parent adaptations select Detailed for optional dice, hide disabled inactive capture actions, and replace the legacy cap/newest-first assertion with exact full count, prior-prefix continuity and newest chronological last row. Original test bytes are retained.
- T71 documentation/evidence and append-only RUN-NOTES preserve original inputs, behavioral negatives, disposable positives, omission controls and fresh validation. Rules, AI, RNG, save formats and event-log popup behavior are preserved.

Fresh validation on source `3a19364ef1ec9c63e0389e33e80b3b754266e192` (pinned Playwright1.63.0, two workers; actual arguments/raw streams in `implementation-log-20261018/validation.json` and the lossless parts):

```text
npx playwright test tests/e2e/compact-panels.spec.ts
  32 passed (1.4m)
npx vitest run tests/ui/compact-panels.test.ts
  Tests 6 passed (6)
npm test
  harness: tests 8, pass 8, fail 0
  Test Files 51 passed (51); Tests 671 passed (671)
npm run build
  TypeScript checks pass; built in 211ms
npx playwright test tests/e2e/{battle-controls,friendly-move,versioned-match,playback-controls,playback-edge-cases,game-event-log,computer-turn-flow,reference-complete-game,geographic-review-guards,geographic-board,slice}.spec.ts
  134 passed (3.5m), including all six unchanged legacy slice goldens
```

All19frozen acceptance hashes and all runtime/test/data inputs remained unchanged across the five sequential commands. Both added runtime files match the final v3 parent candidate byte-for-byte; the original baseline and cap/reverse/force-bottom/never-follow mutation failures therefore remain applicable without repeating heavy checks. Existing archives and loose originals are preserved; new evidence is member-verified and split into16MiB parts. Hardcoded legacy screenshot output is bound to owned evidence, preserving earlier captures.

Docs changed: T71README, implementation/source/evidence receipts, validation runner/config and RUN-NOTES. Original independent Kimi approval covers the prior mode/layout implementation; the full-history addition requires focused independent approval. Main owns that follow-up, final green CI and preview/Windows delivery. This producer ran no paid review, CI, merge or Windows operations.
