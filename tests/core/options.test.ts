import { describe, expect, it } from "vitest";
import { defaultOptions, OptionsError, validateGameOptions } from "../../src/core";

// C-SET-01: every option open to every player, no locked option (the dropped
// claims C-SET-02 and C-SET-04). The defaults below are the canonical values
// from design/core-rules.md § Setup → Options (the owner 2026-10-12).

describe("GameOptions defaults", () => {
  it("defaultOptions() returns the canonical 11-field record", () => {
    const options = defaultOptions();
    expect(options.seats).toEqual([
      { kind: "human" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
    ]);
    expect(options.startingArmiesRange).toBe("1-3");
    expect(options.humanShare).toBe(0);
    expect(options.eventFrequency).toBe("Normal");
    expect(options.dominationWin).toBe(true);
    expect(options.roundLimit).toBeNull();
    expect(options.seed).toBe(0);
    expect(options.board).toBe("generated");
  });

  it("defaultOptions returns a fresh object each call (no shared state)", () => {
    const a = defaultOptions();
    const b = defaultOptions();
    expect(a).not.toBe(b);
    expect(a.seats).not.toBe(b.seats);
  });
});

describe("GameOptions validation", () => {
  it("accepts the canonical defaults", () => {
    expect(() => validateGameOptions(defaultOptions())).not.toThrow();
  });

  it("rejects a non-object with a typed OptionsError", () => {
    expect(() => validateGameOptions(null)).toThrow(OptionsError);
    expect(() => validateGameOptions("nope")).toThrow(OptionsError);
    expect(() => validateGameOptions([1, 2, 3])).toThrow(OptionsError);
  });

  it("rejects a 5-seat list with the seats.length field", () => {
    const bad = {
      ...defaultOptions(),
      seats: [
        { kind: "human" },
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
      ],
    };
    try {
      validateGameOptions(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("seats.length");
      expect((e as Error).message).toMatch(/seat count must be 2 to 4/);
    }
  });

  it("rejects a 1-seat list", () => {
    const bad = { ...defaultOptions(), seats: [{ kind: "human" }] };
    expect(() => validateGameOptions(bad)).toThrow(/seat count must be 2 to 4/);
  });

  it("rejects a round limit outside 20/30/40", () => {
    const bad = { ...defaultOptions(), roundLimit: 25 };
    try {
      validateGameOptions(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("roundLimit");
    }
  });

  it("rejects a starting-armies range other than 1-2/1-3/1-4", () => {
    const bad = { ...defaultOptions(), startingArmiesRange: "1-5" as unknown as "1-3" };
    expect(() => validateGameOptions(bad)).toThrow(/startingArmiesRange must be/);
  });

  it("rejects a humanShare outside -4..+4", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: 5 })).toThrow(OptionsError);
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: -5 })).toThrow(OptionsError);
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: 1.5 })).toThrow(/humanShare must be an integer/);
  });

  it("rejects a non-boolean dominationWin", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), dominationWin: "yes" })).toThrow(/dominationWin must be a boolean/);
  });

  it("rejects an eventFrequency outside the four values", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), eventFrequency: "Always" })).toThrow(/eventFrequency must be/);
  });

  it("rejects a board other than 'generated'", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), board: "static" as unknown as "generated" })).toThrow(/board must be "generated"/);
  });

  it("rejects a seed outside 0..2^32-1", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), seed: -1 })).toThrow(/seed must be a 32-bit unsigned integer/);
    expect(() => validateGameOptions({ ...defaultOptions(), seed: 1.5 })).toThrow(/seed must be an integer/);
    expect(() => validateGameOptions({ ...defaultOptions(), seed: 0x1_0000_0000 })).toThrow(/seed must be a 32-bit unsigned integer/);
  });

  it("rejects a missing field with the field name", () => {
    const bad = { ...defaultOptions() } as Record<string, unknown>;
    delete bad.humanShare;
    try {
      validateGameOptions(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("humanShare");
    }
  });
});

describe("humanShare and computer-only games", () => {
  it("accepts a 2-human, 2-computer game", () => {
    const options = {
      ...defaultOptions(),
      seats: [
        { kind: "human" },
        { kind: "human" },
        { kind: "computer", difficulty: "Easy" },
        { kind: "computer", difficulty: "Hard" },
      ],
    };
    expect(() => validateGameOptions(options)).not.toThrow();
  });

  it("accepts an all-computer game (no humans; watching)", () => {
    const options = {
      ...defaultOptions(),
      seats: [
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
      ],
    };
    expect(() => validateGameOptions(options)).not.toThrow();
  });

  it("rejects a computer seat without a difficulty", () => {
    const options = {
      ...defaultOptions(),
      seats: [{ kind: "computer" }, { kind: "computer", difficulty: "Normal" }],
    };
    try {
      validateGameOptions(options);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("seats[0].difficulty");
    }
  });

  it("rejects a human seat with a difficulty", () => {
    const options = {
      ...defaultOptions(),
      seats: [{ kind: "human", difficulty: "Easy" as const }, { kind: "computer", difficulty: "Normal" }],
    };
    try {
      validateGameOptions(options);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("seats[0].difficulty");
    }
  });
});