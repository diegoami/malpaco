# 0.4.0 acceptance protocol

The milestone issue pins the full main candidate SHA, previous tag v0.3.1,
merged PRs, independent verdict and exact CI artifact receipt. This protocol does
not claim that its own commit has passed CI or been approved for publication.

- Build, root/core/arena TypeScript and full units pass. Exact-candidate main-push
  CI must pass the extracted-playable suite. Verify the downloaded archive's
  BUILD.json against the reviewed candidate and every SHA256SUMS entry. Publish
  those CI bytes without a local rebuild.
- Review the entire v0.3.1-to-candidate diff, including public-input privacy,
  integer probability bounds, deterministic operation limits, explicit fallbacks,
  partial/lateral movement and future-front protection, allocation and attack/stop
  ranking. A work limit is not a gameplay rule or a claim of optimal decisions.
- Preserve all historical action witnesses and old rules/options wire tuples.
  Recorded actions replay without current AI; future decisions in resumed games
  use the sole improved policy. Check every supported map size and seat count.
- Defender games use distinct island-defender/1 identities and explicit options;
  Legacy retains old identities. Reject incompatible identity/options pairs.
  Verify options-only format pairing independently of ordinary match saves.
- Browser checks drive both combat choices, preference migration, reload,
  unchanged running saves, actual-rule Help and absence of an AI selector.
  Preserve scoreboard totals/rows/IDs; verify rules grouping, earlier history,
  one-time counting, failed writes and focus. Keep 22px settings labels and
  44px controls reachable across phone/desktop and reduced-height/safe-area cases.
- Preserve complete live conquest, card/raid, pending capture, elimination,
  movement feedback and save/resume coverage. Keep old recorded fixtures separate
  from newly generated live-policy witnesses; do not weaken limits to clear CI.
- Preserve all research outcomes and cutoffs, frozen comparator and development
  manifests. Held-out seeds 1000–1031 stay unused. Do not claim a general win rate,
  guaranteed termination, optimality or increased enjoyment from this sample.
- Owner gameplay and visual assessment of both choices remains distinct from
  automated checks. Draft and production smoke checks must verify entry,
  assets/worker, saves, both settings/rules and retired routes at 390×844,
  844×390, 820×1180 and 1280×800, with every package file byte-matched.
  Retain the v0.3.1 production deployment for rollback.

Main takes only milestone fixes until tagging. No automatic reviewer runs.
Native delivery, personalities and held balance experiments remain separate.
Final provenance/publication records follow actual review and deployment receipts;
never infer approval or published bytes from a development preview.
