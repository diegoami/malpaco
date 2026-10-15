# Complete-game acceptance

This is proof of existing conquest behavior, with no production candidate or
rules change. A missing acceptance file before T16 is absent coverage, not a
claim that normal conquest was broken. The tests are expected to pass immediately
on the existing core; independent actual-source mutations prove their protection.

`tests/helpers/complete-game.ts` builds an ordinary generated all-human game.
The starting seat is the favored conqueror. On each reinforcement placement it
chooses its strongest frontier; it attacks the weakest legal target. Passive
opponents place single armies on their weakest holdings, preferring inland, and
end turns without attacks. This is a bounded test fixture, not a shipping AI.
No ownership, army, dice, log, phase or RNG values are injected or altered.

The fixture ends the conqueror's turn after the first elimination while other
opponents remain. The nine measured matches all complete; the three/four-seat
matches all exercise the actual eliminated-seat skip before the final capture.
The 12,000-action fixture budget is [designed], a generous failure bound against
the observed maximum of 1,333 actions, and has no effect on game rules.

| Seed | Human seats | Actions | Turn handoffs | Final round | Dead-seat skips |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | 482 | 18 | 10 | 0 |
| 1 | 3 | 664 | 32 | 12 | 1 |
| 1 | 4 | 1024 | 69 | 19 | 3 |
| 42 | 2 | 495 | 16 | 9 | 0 |
| 42 | 3 | 681 | 28 | 11 | 2 |
| 42 | 4 | 1333 | 101 | 27 | 3 |
| 1994 | 2 | 349 | 12 | 7 | 0 |
| 1994 | 3 | 588 | 29 | 11 | 1 |
| 1994 | 4 | 737 | 43 | 12 | 1 |

The browser uses the 1994/three-seat fixture at both configured viewport sizes,
starting from setup inputs and normal clicks. Its independent core state is
only a test oracle; nothing writes it into the browser. Reduced motion uses the
browser's accessibility preference. Screenshots cover first elimination, the
living-seat handoff and winner. The owner judges their appearance; geometry
assertions check winner/control text stays readable and inside the panel.

Run in the repository's pinned Playwright image:

```sh
node docs/prototypes/complete-game/replay.mjs <fresh-evidence-directory>
```

The replay runs focused and full verification, then changes exactly one source
behavior at a time in `src/core/rules.ts`:

| Mutation | Removed behavior | Failing protection expected |
| --- | --- | --- |
| elimination | Omit `checkElimination(state)` after capture | Every player's elimination flag must agree with their ownership count |
| living-skip | Replace conditional living-player break with unconditional break | Handoff index must be the next living seat |
| victory | Omit `checkVictory(state)` after capture | Full conquest must finish and identify the winner |
| finished-rejection | Replace the finished guard with success returning a cloned state reopened to attack | Every action kind must return `the game is over` without state mutation |

Each mutation starts from saved exact source bytes and restores them in a
`finally` block. The manifest records before/after SHA256 and command exits;
logs retain failing assertions. A restored focused run must pass. Existing
assertions and goldens are untouched.

The initial local guard-deletion experiment changed only refusal wording because
phase checks still rejected every action. Its retained `local-mutations-20261015-a`
log is a reason-only negative check, not proof of an actual frozen-play bypass.
The replay instead explicitly accepts a finished action and reopens attack phase.
