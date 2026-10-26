# Malpaco 0.4.0 — tactical AI and combat rules

A browser/offline web update with one improved computer policy and a choice of
combat rules. Release review and artifact provenance live on the milestone issue
linked from [0.4 scope #334](https://github.com/diegoami/malpaco/issues/334).

## Changes

- Computers evaluate reinforcement and capture placement, partial and lateral
  transfers, future fronts, attack objectives and stopping choices. Public threat
  estimates help balance attack and defense instead of always concentrating armies
  or leaving reserves idle. Planning uses deterministic work limits and public
  information plus the computer's own cards.
- **Combat rules** in Settings offers **Defender wins ties**, the default for new
  games, and **Legacy (reroll ties)**. Both use the same improved AI. The defender
  advantage applies symmetrically to every seat; other combat and economy rules
  retain their existing values.
- Settings affects new games. A kept game retains its original combat rules and
  every recorded action, while future computer decisions use the improved policy.
  Help describes the running game's actual tie rule.
- Existing map, opponent, army and event preferences survive migration. Results
  can be filtered by combat rules; old totals, recent rows and duplicate guards
  survive, with unidentified historical results shown as Earlier games.
- Settings retains readable labels and reachable controls on narrow phones and
  short landscape screens, including reduced-height and safe-area checks.

## Research and limits

Decision-space analysis, bounded risk/campaign models and a reproducible AI arena
support the changes. A frozen v0.3.1 comparator, paired deals, seat rotations and
explicit unfinished outcomes keep the evidence reproducible. The development
comparison produced mixed results; it does not establish universal strength,
optimal strategy, greater enjoyment or termination of every game. Held-out
seeds 1000–1031 remain unused. Coverage, opening losses and planning fallbacks
remain tracked in [#362](https://github.com/diegoami/malpaco/issues/362); retained
long-game cutoffs remain in #295 and #353. Local parallel-unit timing sensitivity
is tracked separately in #370.

The defender variant implements the bounded symmetric tie change, not a complete
reproduction of the original game's rules. Personalities and difficulty choices
are deferred. This is a web release with no new physical-device or screen-reader
coverage claim. Android distribution/native persistence (#315) and held balance
experiments (#283/#294) remain separate. Reviewed v0.3.1 source and published
archives remain immutable. Publication requires the independent milestone review
and the exact candidate's verified CI archive.
