import { describe, expect, it } from "vitest";
import { defaultOptions, OptionsError, validateGameOptions } from "../../src/core";

// C-SET-01: every option open to every player, no locked option (the dropped
// claims C-SET-02 and C-SET-04). The defaults below are the canonical values
// from design/core-rules.md § Setup → Options (the owner 2026-10-12). The
// 11 fields: seats, board, startingArmiesRange, humanShare, computerStrengths,
// eventFrequency, dominationWin, roundLimit, seed, animationSpeed, sound.

describe("GameOptions defaults", () => {
  it("defaultOptions() returns the canonical 11-field record", () => {
    const options = defaultOptions();
    expect(options.seats).toEqual([
      { kind: "human" },
      { kind: "computer" },
      { kind: "computer" },
      { kind: "computer" },
    ]);
    expect(options.board).toBe("generated");
    expect(options.startingArmiesRange).toBe("1-3");
    expect(options.humanShare).toBe(0);
    expect(options.computerStrengths).toEqual(["Normal", "Normal", "Normal"]);
    expect(options.eventFrequency).toBe("Normal");
    expect(options.dominationWin).toBe(true);
    expect(options.roundLimit).toBeNull();
    expect(options.seed).toBe(0);
    expect(options.animationSpeed).toBe("normal");
    expect(options.sound).toBe(true);
  });

  it("defaultOptions returns a fresh object each call (no shared state)", () => {
    const a = defaultOptions();
    const b = defaultOptions();
    expect(a).not.toBe(b);
    expect(a.seats).not.toBe(b.seats);
    expect(a.computerStrengths).not.toBe(b.computerStrengths);
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
        { kind: "computer" },
        { kind: "computer" },
        { kind: "computer" },
        { kind: "computer" },
      ],
      computerStrengths: ["Normal", "Normal", "Normal", "Normal"],
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
    const bad = {
      ...defaultOptions(),
      seats: [{ kind: "human" }],
      computerStrengths: [],
    };
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

  it("rejects a humanShare outside -4..+4 when at least one human seat is present", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: 5 })).toThrow(OptionsError);
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: -5 })).toThrow(OptionsError);
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: 1.5 })).toThrow(/humanShare must be an integer/);
  });

  it("IGNORES humanShare out-of-range in an all-computer game (no human seat)", () => {
    const allComputers = {
      ...defaultOptions(),
      seats: [{ kind: "computer" }, { kind: "computer" }],
      computerStrengths: ["Normal", "Normal"],
      humanShare: 99, // out of range; ignored because no human seat
    };
    expect(() => validateGameOptions(allComputers)).not.toThrow();
    const restored = validateGameOptions(allComputers);
    expect(restored.humanShare).toBe(99);
  });

  it("still rejects a non-integer humanShare", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), humanShare: 1.5 })).toThrow(/integer/);
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

  it("rejects an animationSpeed outside slow/normal/fast", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), animationSpeed: "instant" as unknown as "normal" })).toThrow(/animationSpeed must be/);
  });

  it("rejects a non-boolean sound", () => {
    expect(() => validateGameOptions({ ...defaultOptions(), sound: "yes" as unknown as boolean })).toThrow(/sound must be a boolean/);
  });

  it("rejects computerStrengths whose length does not match the computer-seat count", () => {
    const bad = {
      ...defaultOptions(),
      computerStrengths: ["Normal", "Normal"], // 3 computer seats but only 2 strengths
    };
    try {
      validateGameOptions(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("computerStrengths");
    }
  });

  it("rejects a computerStrengths entry that is not Easy/Normal/Hard", () => {
    const bad = {
      ...defaultOptions(),
      computerStrengths: ["Normal", "Casual" as unknown as "Normal", "Normal"],
    };
    try {
      validateGameOptions(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OptionsError);
      expect((e as OptionsError).field).toBe("computerStrengths[1]");
    }
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

describe("newGame(map, rules, options) overload (R2)", () => {
  it("uses options.seed when the options overload is called", async () => {
    const { newGame, defaultOptions, classicRules } = await import("../../src/core");
    const { smallSea } = await import("./helpers");
    const options = { ...defaultOptions(), seed: 4242 };
    const viaOptions = newGame(smallSea(), classicRules(), options);
    const viaFourArg = (await import("../../src/core")).newGame(
      smallSea(),
      classicRules(),
      viaOptions.players,
      4242,
    );
    expect(viaOptions.rng.seed).toBe(4242);
    expect(JSON.stringify(viaOptions.ownerOf)).toBe(JSON.stringify(viaFourArg.ownerOf));
    expect(JSON.stringify(viaOptions.armies)).toBe(JSON.stringify(viaFourArg.armies));
  });

  it("the options overload constructs players from options.computerStrengths", async () => {
    const { newGame, defaultOptions, classicRules } = await import("../../src/core");
    const { smallSea } = await import("./helpers");
    const options = {
      ...defaultOptions(),
      computerStrengths: ["Hard", "Easy", "Normal"] as const,
    };
    const state = newGame(smallSea(), classicRules(), options);
    expect(state.players.find((p) => p.id === "seat2")?.difficulty).toBe("Hard");
    expect(state.players.find((p) => p.id === "seat3")?.difficulty).toBe("Easy");
    expect(state.players.find((p) => p.id === "seat4")?.difficulty).toBe("Normal");
  });
});

describe("humanShare and computer-only games", () => {
  it("accepts a 2-human, 2-computer game", () => {
    const options = {
      ...defaultOptions(),
      seats: [{ kind: "human" }, { kind: "human" }, { kind: "computer" }, { kind: "computer" }],
      computerStrengths: ["Easy", "Hard"],
    };
    expect(() => validateGameOptions(options)).not.toThrow();
  });

  it("accepts an all-computer game (no humans; watching)", () => {
    const options = {
      ...defaultOptions(),
      seats: [{ kind: "computer" }, { kind: "computer" }],
      computerStrengths: ["Normal", "Normal"],
    };
    expect(() => validateGameOptions(options)).not.toThrow();
  });

  it("rejects computerStrengths that does not match a single-seat config", () => {
    const options = {
      ...defaultOptions(),
      seats: [{ kind: "computer" }],
      computerStrengths: ["Normal", "Normal"],
    };
    expect(() => validateGameOptions(options)).toThrow(OptionsError);
  });
});