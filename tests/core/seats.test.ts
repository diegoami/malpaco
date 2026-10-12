import { describe, expect, it } from "vitest";
import {
  MAX_SEATS,
  MIN_SEATS,
  SeatsError,
  computerCount,
  hasHuman,
  validateSeats,
  type SeatSpec,
} from "../../src/core";

// C-PLY-01 (change, decision 3): a game has 2 to 4 seats.
// C-PLY-02 (change, decision 3): each seat human or computer; hot-seat and
//   all-computer games are allowed.
// C-PLY-03 (keep): the default is one human and three computers.

describe("validateSeats: the 2..4 band (C-PLY-01, decision 3)", () => {
  const two: SeatSpec[] = [{ kind: "human" }, { kind: "computer", difficulty: "Normal" }];
  const four: SeatSpec[] = [
    { kind: "human" },
    { kind: "computer", difficulty: "Normal" },
    { kind: "computer", difficulty: "Normal" },
    { kind: "computer", difficulty: "Normal" },
  ];

  it("accepts the minimum (2 seats)", () => {
    expect(() => validateSeats(two)).not.toThrow();
  });

  it("accepts the maximum (4 seats)", () => {
    expect(() => validateSeats(four)).not.toThrow();
  });

  it("rejects 1 seat with seats.length field", () => {
    try {
      validateSeats([{ kind: "human" }]);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats.length");
      expect((e as Error).message).toMatch(/seat count must be 2 to 4/);
    }
  });

  it("rejects 5 seats with seats.length field", () => {
    const five: SeatSpec[] = [
      { kind: "human" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
    ];
    try {
      validateSeats(five);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats.length");
    }
  });

  it("rejects 0 seats", () => {
    expect(() => validateSeats([])).toThrow(/seat count must be 2 to 4/);
  });

  it("exports the bounds as constants", () => {
    expect(MIN_SEATS).toBe(2);
    expect(MAX_SEATS).toBe(4);
  });
});

describe("hasHuman and computerCount (C-PLY-02, C-PLY-03)", () => {
  it("hasHuman is true when at least one human seat is present", () => {
    expect(hasHuman([{ kind: "human" }, { kind: "computer", difficulty: "Normal" }])).toBe(true);
  });

  it("hasHuman is false in an all-computer game", () => {
    expect(hasHuman([
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Hard" },
    ])).toBe(false);
  });

  it("computerCount counts only computer seats", () => {
    expect(computerCount([
      { kind: "human" },
      { kind: "human" },
      { kind: "computer", difficulty: "Normal" },
    ])).toBe(1);
    expect(computerCount([
      { kind: "computer", difficulty: "Easy" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Hard" },
    ])).toBe(3);
  });
});