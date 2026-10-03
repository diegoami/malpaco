import { describe, expect, it } from "vitest";
import { apply, classicRules, DeterministicRng, legalAttacks, newGame } from "../../src/core";
import type { Action, GameState } from "../../src/core";
import { PLAYERS, smallSea } from "./helpers";

/** A fixed policy, so "the same moves" is literal: take the first legal attack, else end the turn. */
function play(state: GameState, steps: number): GameState {
  let current = state;
  for (let i = 0; i < steps && current.phase !== "finished"; i++) {
    const action: Action = legalAttacks(current)[0] ?? { kind: "endTurn" };
    const result = apply(current, action);
    if (!result.ok) throw new Error(result.error);
    current = result.state;
  }
  return current;
}

const fresh = (seed: number) => newGame(smallSea(), classicRules(), PLAYERS, seed);

describe("determinism: a game is its seed, its rules and its moves", () => {
  it("the same seed and the same moves give the same state, byte for byte", () => {
    const a = play(fresh(1994), 60);
    const b = play(fresh(1994), 60);
    expect(a.history.length).toBeGreaterThan(30); // the game really was played
    expect(a.log.filter((e) => e.event === "attack").length).toBeGreaterThan(5);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("replaying the recorded moves on a fresh deal of the same seed reaches the same state", () => {
    const played = play(fresh(7), 60);
    let replay = fresh(7);
    for (const action of played.history) {
      const r = apply(replay, action);
      if (!r.ok) throw new Error(r.error);
      replay = r.state;
    }
    expect(JSON.stringify(replay)).toBe(JSON.stringify(played));
  });

  it("the seed matters: different seeds deal different boards and roll different games", () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const deals = new Set(seeds.map((s) => JSON.stringify([fresh(s).ownerOf, fresh(s).armies])));
    expect(deals.size).toBe(seeds.length);
    const games = new Set(seeds.map((s) => JSON.stringify(play(fresh(s), 40).armies)));
    expect(games.size).toBeGreaterThan(seeds.length - 2);
  });

  it("the generator is seeded: same seed, same dice; and a restored snapshot continues the sequence", () => {
    const a = new DeterministicRng(42);
    const b = new DeterministicRng(42);
    const run = (r: DeterministicRng) => Array.from({ length: 20 }, () => r.rollDie(6));
    expect(run(a)).toEqual(run(b));
    expect(run(new DeterministicRng(42))).not.toEqual(run(new DeterministicRng(43)));

    const live = new DeterministicRng(5);
    run(live);
    const restored = DeterministicRng.fromSnapshot(live.snapshot());
    expect(run(restored)).toEqual(run(live));
  });

  it("dice are fair-looking: only 1..6, every face appears, none dominates", () => {
    const rng = new DeterministicRng(2026);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6000; i++) {
      const face = rng.rollDie(6);
      counts[face] = (counts[face] ?? 0) + 1;
    }
    expect(counts[0]).toBe(0);
    for (let face = 1; face <= 6; face++) expect(counts[face]).toBeGreaterThan(700);
  });

  it("shuffling is a permutation drawn from the seeded generator only", () => {
    const items = Array.from({ length: 14 }, (_, i) => i);
    const once = new DeterministicRng(3).shuffled(items);
    expect([...once].sort((x, y) => x - y)).toEqual(items);
    expect(new DeterministicRng(3).shuffled(items)).toEqual(once);
    expect(new DeterministicRng(4).shuffled(items)).not.toEqual(once);
    expect(items).toEqual(Array.from({ length: 14 }, (_, i) => i)); // input untouched
  });
});
