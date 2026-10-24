# Malpaco 0.3.1 preview

This is a playtest candidate; production and the published v0.3.0 archive stay unchanged.
The exact preview source and URL are recorded on [AI issue #320](https://github.com/diegoami/malpaco/issues/320).

## Changes

- Computer reserves can travel toward a front across multiple friendly regions, one
  legal adjacent hop per turn. The largest reserve takes priority; nearer destinations
  and stable region IDs settle equal choices. Exposed border stacks stay in place.
- Card, capture, placement and favourable-attack priorities remain. No difficulty level,
  game rule, balance value, map factory or random stream changes. Saved actions still
  replay exactly; future AI choices can improve when an old game resumes.
- Eight source-only legacy screenshots now reflect the already accepted solid sea lanes.
  Fixed per-seat starting totals guard the existing leftover-army allocation. The unread
  player-speed preference write and its stale comment are removed.

## Reproductions and limits

Frozen legal v0.3.0 histories reproduce idle 5/7/6-army stacks on 46/72/96 maps at
front distances 2/3/5. The old policy ends its turn; this candidate advances a reserve.
Tests cover progress, legal land/sea routes, deterministic ties, frontier protection,
old saves and real rendered transfer feedback. Bounded seeded runs retain unfinished
outcomes; they do not establish a win rate or guarantee that every AI game terminates.

This preview has no Android APK or native-storage claim. Balance #283 and native #315
remain separate work. It is prepared for owner playtesting and independent PR review;
no reviewer is started automatically and no production deployment is implied.
