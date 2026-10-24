# Web 0.3.0 acceptance protocol

The milestone issue linked from #271 pins the immutable candidate SHA, full check
receipts, owner decision and independent review verdict or explicit waiver. This
file defines the release scope and evidence to verify; it does not assert that its
own commit's CI has already passed.

## Scope

Publish the browser/offline Node web game with 46/72/96 maps, the accepted starting-
army/event options, current action/notice/card presentation and Min/Max transfers.
The owner accepted the tested preview for this web release. The separate balanced-
deal/halved-island-bonus experiment #283 and unfinished Android persistence/delivery
are excluded. Keep old match/replay factories and next-game-only settings.

## Candidate checks

- Version 0.3.0 in package.json and both package-lock root entries; no dependency
  change. Release notes and packaged PLAY.md describe the actual controls.
- `npm run build`, `npx tsc --noEmit -p .`, `npm test` and `git diff --check` pass.
- The exact main-push CI completes the extracted playable suite. Publication uses
  its archive with matching BUILD.json sourceCommit and verified SHA256SUMS.
- Focused pinned checks cover entry/options, 46/72/96 maps, pending-choice rotation,
  readable controls, numeric card notices and their exact unpaused three-second
  boundary, native-pause protection, transfer limits/Confirm and old saves/scores.
- The milestone review covers every change since v0.2.1, including PRs without an
  individual review. Review claims refer to the source files and task contracts.

## Preliminary owner-playtest evidence

The pre-versioned preview source f06175793fb8e642a81760c0c5611df3fd95b082 was accepted
for scope, not substituted for the final candidate artifact. Its local Min/Max
checks passed 6 new cases, 61 affected cases and 1013 units; the extracted combined
package passed 8 final transfer/draft cases. Earlier combined source 14cd15c passed
1027 units, 19 source cases, 13 packaged map/timer/badge cases and 51 packaged fold/
touch/responsive-card cases. Task issue/PR receipts retain all failures and fixes.

The preliminary Netlify draft 6adc9227238029724935f3cd matches all 12 packaged files
byte-for-byte and passes Chromium smoke at 390×844,844×390,820×1180 and1280×800.
That smoke checks explicit entry, loaded map/worker/assets, next-game map settings
without mutating the current record, retired routes and console/page errors.
Repeat these deployment checks for the versioned candidate and production bytes.

## Limits and rollout

This web release has no production Android APK or native-persistence claim. The
old physical-device report does not certify the changed 0.3 controls. Larger-map
long-game and combined-economy work remains tracked in #295/#299 without importing
frozen no-event pilot rates as claims about the new runtime.

Record the accepted source/tag, archive/hash, draft and production deploy ids,
per-file checks and browser results in PROVENANCE.md/PUBLICATION.md. Keep production
deploy 6adb010c9a01a624d43b6c43 as the rollback reference. No live site or tag is
published before the declared milestone gates.
