import type { RngSnapshot } from "./types";

/** Anything that can roll a die. The engine's own generator is one; a test may supply a scripted one. */
export interface DiceSource {
  rollDie(sides: number): number;
}

/**
 * Seeded randomness, carried as data (mulberry32 over uint32, integers only).
 *
 * The seed and the current state are plain integers, so a game can be
 * serialised, replayed and compared exactly. This is NOT bit-compatible with
 * Godot's RandomNumberGenerator (PCG32): a game replayed here rolls different
 * dice than the same seed in the Godot build.
 *
 * `% span` carries a bias of at most 2^-32 * span; with a span of 6 that is
 * about 1.4e-9, immaterial for a spike.
 */
export class DeterministicRng implements DiceSource {
  readonly seed: number;
  private state: number;

  constructor(seed: number, state?: number) {
    this.seed = seed >>> 0;
    this.state = (state ?? seed) >>> 0;
  }

  static fromSnapshot(snapshot: RngSnapshot): DeterministicRng {
    return new DeterministicRng(snapshot.seed, snapshot.state);
  }

  snapshot(): RngSnapshot {
    return { seed: this.seed, state: this.state };
  }

  private nextU32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Inclusive on both ends. */
  nextInt(from: number, to: number): number {
    return from + (this.nextU32() % (to - from + 1));
  }

  rollDie(sides: number): number {
    return this.nextInt(1, sides);
  }

  /** Fisher-Yates, drawing only from this generator. Returns a new array. */
  shuffled<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const held = out[i] as T;
      out[i] = out[j] as T;
      out[j] = held;
    }
    return out;
  }

  /**
   * Derive a child stream from a parent seed and a per-child salt. The
   * parent's own state is never read or modified, so the parent's draws
   * are not perturbed by sub-streams (C-RND-03, design/core-rules.md §
   * Setup → Randomness): each computer seat's choices come from a separate
   * stream, seeded from the game seed and the seat number. Pure.
   */
  static subStream(parentSeed: number, childSalt: number): DeterministicRng {
    // SplitMix-style mixing: parent seed XOR a salted mixer. Math.imul is
    // used here intentionally (Math.random is forbidden; Math.imul is just
    // integer multiplication).
    const mixed = (parentSeed ^ Math.imul(childSalt | 0, 0x9e3779b1)) >>> 0;
    // Spread bits once more so the child seed never equals the parent.
    const child = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b) >>> 0;
    return new DeterministicRng(child);
  }
}
