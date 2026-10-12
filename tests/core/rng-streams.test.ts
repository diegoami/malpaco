import { describe, expect, it } from "vitest";
import { classicRules, DeterministicRng, newGame } from "../../src/core";
import { smallSea, PLAYERS } from "./helpers";

// C-RND-03 (keep): one game stream for the rules' draws, uniform integer
//   draws; each computer seat's choices use a stream of its own from the
//   same seed. The parent's draws must not be perturbed by sub-streams.
//
// Hand-computed reference (R6): the first 100 six-sided dice from
// `DeterministicRng.subStream(1234, 0)`, computed from the same SplitMix
// formula in a fresh Node session (tools/substream-ref at PR creation). A
// 1-bit mutation of the child-seed derivation fails the comparison.

const REFERENCE_SUBSTREAM_1234_0: readonly number[] = [
  5, 6, 5, 4, 2, 5, 1, 1, 3, 5, 1, 4, 5, 2, 3, 4, 4, 3, 5, 2, 6, 2, 4, 6, 6, 4, 4, 3, 2, 6, 1, 6, 4, 3, 2, 2, 5, 6, 6, 1,
  4, 4, 5, 1, 6, 3, 5, 6, 5, 4, 3, 2, 1, 6, 4, 5, 4, 1, 5, 5, 5, 2, 3, 5, 3, 6, 2, 5, 6, 6, 4, 4, 4, 4, 2, 5, 2, 2, 2, 4, 3,
  4, 2, 2, 4, 2, 5, 5, 1, 6, 1, 1, 3, 5, 1, 5, 2, 5, 6, 1,
];

describe("DeterministicRng.subStream (C-RND-03) — hand-computed reference (R6)", () => {
  it("matches a hand-computed 100-draw reference for (parentSeed=1234, childSalt=0)", () => {
    const child = DeterministicRng.subStream(1234, 0);
    const drawn = Array.from({ length: REFERENCE_SUBSTREAM_1234_0.length }, () => child.rollDie(6));
    expect(drawn).toEqual(REFERENCE_SUBSTREAM_1234_0);
  });

  it("is deterministic: the same (parentSeed, childSalt) yields the same reference", () => {
    const a = DeterministicRng.subStream(1234, 0);
    const b = DeterministicRng.subStream(1234, 0);
    const drawnA = Array.from({ length: 100 }, () => a.rollDie(6));
    const drawnB = Array.from({ length: 100 }, () => b.rollDie(6));
    expect(drawnA).toEqual(REFERENCE_SUBSTREAM_1234_0);
    expect(drawnB).toEqual(REFERENCE_SUBSTREAM_1234_0);
  });

  it("different salts give different streams", () => {
    const a = DeterministicRng.subStream(1234, 0);
    const b = DeterministicRng.subStream(1234, 1);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (a.rollDie(6) === b.rollDie(6)) same++;
    }
    // Independent uniform draws should rarely match (5/6 chance of mismatch
    // each draw; over 100 draws the chance of >70 matches is negligible).
    expect(same).toBeLessThan(70);
  });

  it("sub-streams do not perturb the parent: creating sub-streams leaves the parent's draws unchanged", () => {
    // Fresh parent for the reference sequence.
    const fresh = new DeterministicRng(2026);
    const freshDraws = Array.from({ length: 50 }, () => fresh.rollDie(6));
    // Parent with sub-streams created before drawing.
    const parent = new DeterministicRng(2026);
    DeterministicRng.subStream(2026, 0);
    DeterministicRng.subStream(2026, 1);
    DeterministicRng.subStream(2026, 2);
    const afterDraws = Array.from({ length: 50 }, () => parent.rollDie(6));
    expect(afterDraws).toEqual(freshDraws);
  });

  it("a sub-stream can be drawn independently without leaking back to the parent", () => {
    const parent = new DeterministicRng(7);
    const child = DeterministicRng.subStream(7, 0);
    // Draw 1000 from child.
    for (let i = 0; i < 1000; i++) child.rollDie(6);
    // Parent's first 50 draws must be exactly as a fresh parent.
    const parentDrawn = Array.from({ length: 50 }, () => parent.rollDie(6));
    const fresh = new DeterministicRng(7);
    const freshDrawn = Array.from({ length: 50 }, () => fresh.rollDie(6));
    expect(parentDrawn).toEqual(freshDrawn);
  });

  it("sub-streams are uniform: 6000 rolls on each of 6 sides land every face between 900 and 1100", () => {
    const rng = DeterministicRng.subStream(999, 5);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6000; i++) {
      const face = rng.rollDie(6);
      counts[face] = (counts[face] ?? 0) + 1;
    }
    expect(counts[0]).toBe(0);
    for (let face = 1; face <= 6; face++) {
      expect(counts[face]).toBeGreaterThan(900);
      expect(counts[face]).toBeLessThan(1100);
    }
  });
});

describe("newGame populates per-seat computer streams (C-RND-03)", () => {
  it("a 4-seat game with 3 computers has 3 computerRngs snapshots", () => {
    const players = [
      { id: "p1", name: "P1", kind: "human" as const, eliminated: false },
      { id: "p2", name: "P2", kind: "computer" as const, difficulty: "Normal" as const, eliminated: false },
      { id: "p3", name: "P3", kind: "computer" as const, difficulty: "Normal" as const, eliminated: false },
      { id: "p4", name: "P4", kind: "computer" as const, difficulty: "Normal" as const, eliminated: false },
    ];
    const state = newGame(smallSea(), classicRules(), players, 123);
    expect(Object.keys(state.computerRngs).sort()).toEqual(["p2", "p3", "p4"]);
    // Each computer seat has its own seed (different from the game seed and from each other).
    const seeds = new Set(Object.values(state.computerRngs).map((s) => s.seed));
    expect(seeds.size).toBe(3);
    for (const seed of seeds) expect(seed).not.toBe(state.rng.seed);
  });

  it("a 2-human game has no computerRngs", () => {
    const state = newGame(smallSea(), classicRules(), PLAYERS, 7);
    expect(state.computerRngs).toEqual({});
  });
});

describe("newGame with sub-streams: same seed and same seat order → same computerRngs", () => {
  it("two deals of the same seed produce identical computerRngs snapshots", () => {
    const players = [
      { id: "p1", name: "P1", kind: "human" as const, eliminated: false },
      { id: "p2", name: "P2", kind: "computer" as const, difficulty: "Normal" as const, eliminated: false },
      { id: "p3", name: "P3", kind: "computer" as const, difficulty: "Hard" as const, eliminated: false },
    ];
    const a = newGame(smallSea(), classicRules(), players, 4242);
    const b = newGame(smallSea(), classicRules(), players, 4242);
    expect(JSON.stringify(a.computerRngs)).toBe(JSON.stringify(b.computerRngs));
  });
});