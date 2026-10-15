# T18 disposable computer candidate

Stage 1 keeps production unchanged. `src__*.txt` are candidate complete source
files; `replay.mjs` saves exact original bytes, runs baseline/candidate checks and
mutations, and restores in `finally`, recording before/after SHA256 values.
Run in the pinned Playwright container from this worktree:

```
node docs/prototypes/computer/replay.mjs docs/prototypes/computer/preflight-20261015-a
```

The output directory must not exist. `unit` as a third argument runs only the
focused unit baseline, candidate policy tests and build. Full mode first probes
one absent setup control per viewport (temporarily supplying the missing policy
module only to let the test bundle load), then runs candidate acceptance, affected
setup/generated goldens, all existing tests and three source mutations. The only
changed prior assertion replaces T17's obsolete rejection of valid computer saves
with a genuinely invalid action kind. Other authored/prototype goldens and prior
assertions are preserved. Evidence directories are append-only.

Policy and pacing are [designed] after searching src/core/options.ts, seats.ts,
types.ts, rules.ts, setup.ts, src/ui controllers and docs/spike.md. Existing
C-PLY-01..03 and computer A2 supply seat/Normal metadata; no opponent policy or
strength implementation exists to reproduce. This implements one basic policy;
Normal remains save metadata, with no selector claiming other strengths.

The pure policy reads state only. It puts all income on the strongest frontier
(or strongest holding if no frontier), then selects the weakest legal defender
whose attacking stack is larger, preferring the stronger attacker and lexical
province IDs. At most one attack per map province is attempted in a turn. That
budget is reconstructed from ordinary action history since the last endTurn, so
loading has the same decisions without policy state or RNG consumption. A turn
has at most one reinforce, one endReinforcement, N attacks and one endTurn: N+3
ordinary actions. Failed combat, redeploy and exhausted opportunities end the
turn immediately. Humans, eliminated/missing players and finished games yield
no action. Rules apply remains the only RNG consumer.

The UI schedules one action every 350ms to make automated moves readable and
allow saving during play. Automated combat never opens the battle dialog. Map
and action inputs are gated while file/new-game controls stay usable. Disposal
clears the timer and guards callbacks; replacement disposes before mounting.

Local smoke a exposed a TypeScript signature mismatch in test timer
instrumentation. It was fixed before smoke b/c. Smoke c records the focused
missing-module failure, candidate unit success and build success with direct
file descriptors for complete subprocess logs. Earlier a/b logs and manifests
are retained; b's piped unit logs were unexpectedly empty, so c is authoritative.
Pinned browser and mutation claims await the parent run.

Pinned candidate preflight c passes 11 focused core tests, 10 browser checks,
429 total unit tests, build and all 88 browser checks. Scheduling, input gating
and cancellation source mutants fail respectively 6, 6 and 2 browser checks;
the restored suite passes all 10. Its manifest confirms exact production and
T17 assertion restoration. `preflight-c-sha256.txt` hashes the immutable outputs.

After parent authorization, the same verified fixtures were installed as
production. Final verification never installs fixtures or updates snapshots:

```
node docs/prototypes/computer/verify-final.mjs docs/prototypes/computer/implementation-20261015-a
```

It checks all Done-when commands against actual source and repeats the three
mutations, writing the exact saved app bytes back in every mutation's finally
and the outer finally, then records matching hashes. Pinned final evidence is
required before the implementation is reported complete.

Permanent implementation verification a passes all 11 focused core tests, 10
focused browser checks, 429 unit tests, build and 88 browser checks. All three
actual-source mutants fail for their intended behavior (6 scheduling, 6 map
gating, 2 timer cancellation failures); the restored browser suite passes all
10 checks. The manifest records equal App before/after hashes, and
`implementation-a-sha256.txt` indexes all immutable final logs and screenshots.
