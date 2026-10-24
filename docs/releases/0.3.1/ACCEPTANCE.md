# 0.3.1 acceptance protocol

The milestone issue pins the complete main candidate SHA, previous tagv0.3.0,
merged PRs, independent review verdict and exact CI archive. This file defines
release checks; it does not claim that its own commit has already passed CI.

- Build, full TypeScript and units pass; exact-candidate main-push CI must pass the
  extracted playable suite. BUILD.json must match the reviewed/tagged source and
  all SHA256SUMS entries must pass. Publish those CI bytes without a local rebuild.
- Preserve the accepted v0.3.0 initial allocation, rules, RNG mechanics and save
  identities. Old action histories replay exactly without invoking current AI.
  Future AI choices may differ when a saved game resumes.
- Frozen legal46/72/96 reserve saves, static graph progress/ties/privacy guards,
  land/sea links and the bounded seeded legality/replay matrix pass. Retain every
  unfinished/budget outcome; no win-rate or universal-termination claim.
- Live reference-game acceptance retains a real human/computer setup, every saved
  state, human friendly move, pending-capture reload, elimination and conquest at
  both desktop sizes. The old recorded witness remains separately hash-pinned.
- Scoreboard checks cover both explicit winning End turn and winning friendly
  transfer, exact one-time totals/rows and no duplicate after reload.
- Standard draft and production checks compare all package files byte-for-byte and
  smoke entry, assets/worker, next-game settings preservation and retired routes at
  390×844,844×390,820×1180 and1280×800. Keep the previous production deploy for rollback.

No new optimization weights, personality/profile system, game-rule experiment,
Android storage or APK delivery belongs to0.3.1. Those decisions remain separate;
AI experimentation/personality scope is tracked for0.4 in #334. The milestone
verdict and publication receipts remain authoritative; no automatic reviewer runs.
