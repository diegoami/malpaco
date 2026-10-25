# Public-policy research arena

This is host-only research tooling. It changes no player-facing AI, rules, save
factory or default. The registry contains the frozen `baseline-031` comparator
and two deliberately simple diagnostic controls, `hold-v1` and `largest-gap-v1`.
They are not personalities or ranked difficulty levels.

The opt-in `allocation-v1` experiment uses T133's reinforcement/capture planner,
with its named parameters recorded in the policy descriptor. Other phases and
explicit fallback use the frozen baseline. It does not route into the application;
see [candidate semantics](../../docs/plans/allocation-candidate.md).

The opt-in `movement-v1` experiment adds partial/lateral/future-front movement
to allocation-v1, retaining frozen attacks/cards. It remains arena-only; see
[movement semantics](../../docs/plans/movement-candidate.md).

The opt-in `tactical-v1` experiment adds finite-budget campaign objectives and
stopping to allocation/movement; see [attack semantics](../../docs/plans/offensive-candidate.md).

`frozen-031.ts` preserves the released decision/card/reserve logic from
`6e75ad9cff3529b3bb13d1dff31a336a86c64627`; it imports types, not current policy
helpers. Source provenance, a frozen public-decision corpus and the module's
digest live in `fixtures/arena/baseline-031.json`. Add a new version to change a
comparator; do not silently edit this version or reinterpret prior results.

## Run a reproducible cohort

Create a JSON config, for example under ignored `artifacts/T132/smoke.json`:

```json
{
  "cohort": "development",
  "seeds": [0],
  "regions": [46],
  "policies": ["baseline-031", "largest-gap-v1"],
  "ties": ["reroll"]
}
```

```sh
node tools/arena/run.mjs --config artifacts/T132/smoke.json --out artifacts/T132/smoke-proof
```

The output directory must be fresh and inside `artifacts/`. Development seeds
are 0–31; evaluation seeds are 1000–1031. Supported sizes are 46/72/96, policy
rosters have 2–4 seats, and ties are `reroll` or `defender`. Default stopping caps
are 100 completed rounds and 20,000 actions; smaller positive `roundCap` and
`actionCap` values are explicit diagnostics, recorded in every case. Larger caps,
unknown configuration fields/policies and duplicate axes are rejected.

Every distinct cyclic policy assignment runs with every first-player offset on
the same seeded deal. Identical policy rotations are deduplicated. First-player
rotation changes current player/round origin and recomputes the initial income;
the original deal's country-share compensation stays fixed. This is a declared
research transform, not a population sample of independent ordinary starts.

Rules use current geographic island/card/equal-army-budget constructors with
events Off in both arms. Only the selected tie treatment differs. Rules IDs are
explicit `research-arena-*` identities, outside product save factories. Divergent
rules/policies can consume different subsequent RNG draws despite paired starts.

Policies receive only a copied public view and their own hand. The host records
complete initial engine states for reproducibility; it never passes those states,
opponent policy identities, private enemy cards or streams to a policy.

## Evidence and interpretation

The runner retains the complete schedule before play, source/config/policy/bundle
hashes, initial states, accepted action histories and final-state/history hashes.
Policy fingerprints include the full declared source context, so candidate helpers
outside the registry are covered; the frozen comparator's original module digest
separately identifies its immutable decision logic.
Every scheduled refusal, exception, illegal attempt and unfinished outcome remains
in the outcome file. Illegal attempts are separate from accepted replay histories.
Accepted prefixes replay exactly even after a cutoff or policy error. Repeats run
in reverse schedule order, compare deterministic records and are stored separately.
Policy timing and total simulation/replay cost are separate, variable observations.

`summary.json` reports scheduled denominators and raw counts. A verified finished
result alone contributes a win; failures cannot become wins. Seat opportunities
count scheduled policy seats, including games that could not run. Self-play,
unequal policy multiplicities and different rule/map/cohort strata must not be
pooled into a strength percentage. Rotations/repeats are correlated, not additional
independent deals. The tool computes no statistical confidence or adoption target.
Use held-out seeds, multiple credible opponents, tactical counterexamples and
owner playtests before claiming a stronger policy or more interesting ruleset.

Checks: `npx vitest run tests/core/arena.test.ts`, `npx tsc --noEmit -p tools/arena`,
and the repository's build/types/unit/CI gates. T132/#348 is infrastructure for
#341/#340/#95; it does not fulfill their broader strategy/adoption contracts.
