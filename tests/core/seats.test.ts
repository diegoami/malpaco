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

describe("validateSeats: malformed input (R4 — null safety)", () => {
  it("rejects null with a typed SeatsError on the 'seats' field", () => {
    try {
      validateSeats(null);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats");
      expect((e as Error).message).toMatch(/seats is missing/);
    }
  });

  it("rejects undefined with a typed SeatsError on the 'seats' field", () => {
    try {
      validateSeats(undefined);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats");
    }
  });

  it("rejects a non-array with a typed SeatsError on the 'seats' field", () => {
    try {
      validateSeats("not an array");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats");
      expect((e as Error).message).toMatch(/seats must be an array/);
    }
    try {
      validateSeats(42);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats");
    }
  });

  it("rejects a null seat entry", () => {
    try {
      validateSeats([null, { kind: "computer" }]);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats[0]");
    }
  });

  it("rejects a seat with no kind field", () => {
    try {
      validateSeats([{}, { kind: "computer" }]);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats[0].kind");
    }
  });

  it("rejects a seat with a bad kind value", () => {
    try {
      validateSeats([{ kind: "ai" }, { kind: "computer" }]);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SeatsError);
      expect((e as SeatsError).field).toBe("seats[0].kind");
    }
  });
});

describe("validateSeats: the 2..4 band (C-PLY-01, decision 3)", () => {
  const two: SeatSpec[] = [{ kind: "human" }, { kind: "computer" }];
  const four: SeatSpec[] = [
    { kind: "human" },
    { kind: "computer" },
    { kind: "computer" },
    { kind: "computer" },
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
      { kind: "computer" },
      { kind: "computer" },
      { kind: "computer" },
      { kind: "computer" },
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
    expect(hasHuman([{ kind: "human" }, { kind: "computer" }])).toBe(true);
  });

  it("hasHuman is false in an all-computer game", () => {
    expect(hasHuman([
      { kind: "computer" },
      { kind: "computer" },
    ])).toBe(false);
  });

  it("computerCount counts only computer seats", () => {
    expect(computerCount([
      { kind: "human" },
      { kind: "human" },
      { kind: "computer" },
    ])).toBe(1);
    expect(computerCount([
      { kind: "computer" },
      { kind: "computer" },
      { kind: "computer" },
    ])).toBe(3);
  });
});