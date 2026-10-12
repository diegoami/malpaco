import { describe, expect, it } from "vitest";
import {
  defaultOptions,
  deserializeOptions,
  OptionsError,
  SaveFormatError,
  serializeOptions,
  validateGameOptions,
  type GameOptions,
} from "../../src/core";

// C-SET-05 (change, decision 2): one save slot, restored by replaying
//   settings, seed and the action list.
// C-SET-07 (change): every stored file carries a format version, and a file
//   that fails validation (wrong version, missing field, value out of range)
//   is ignored and the defaults are used; plain, readable storage; no
//   obfuscation.
//
// The tests hard-code the expected version as 1 (the canonical SAVE_FORMAT_VERSION
// at the time of writing) so changing the constant fails the suite (R5).

const EXPECTED_VERSION = 1;

describe("serializeOptions / deserializeOptions round-trip", () => {
  it("the defaults round-trip exactly", () => {
    const text = serializeOptions(defaultOptions());
    const restored = deserializeOptions(text);
    expect(restored).toEqual(defaultOptions());
  });

  it("a non-default options record round-trips", () => {
    const options: GameOptions = {
      ...defaultOptions(),
      seats: [{ kind: "human" }, { kind: "computer" }],
      computerStrengths: ["Hard"],
      startingArmiesRange: "1-4",
      humanShare: 2,
      eventFrequency: "Often",
      dominationWin: false,
      roundLimit: 30,
      seed: 0xdeadbeef,
      animationSpeed: "fast",
      sound: false,
    };
    const restored = deserializeOptions(serializeOptions(options));
    expect(restored).toEqual(options);
  });

  it("the file format is plain readable JSON, not base64 or ciphered", () => {
    const text = serializeOptions(defaultOptions());
    expect(text).toContain('"version":');
    expect(text).toContain('"options"');
    // The file is parseable as JSON directly, no wrapping or cipher.
    const parsed = JSON.parse(text) as { version: number; options: unknown };
    expect(parsed.version).toBe(EXPECTED_VERSION);
    expect(parsed.options).toBeDefined();
  });
});

describe("SaveFormatError: the typed guard (C-SET-07)", () => {
  it("rejects a non-JSON payload", () => {
    try {
      deserializeOptions("not json {");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as Error).message).toMatch(/not valid JSON/);
    }
  });

  it("rejects a JSON non-object", () => {
    expect(() => deserializeOptions("null")).toThrow(/not an object/);
    expect(() => deserializeOptions("[]")).toThrow(/not an object/);
    expect(() => deserializeOptions('"a string"')).toThrow(/not an object/);
  });

  it("rejects a missing version field with field='version'", () => {
    const payload = JSON.stringify({ options: defaultOptions() });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as SaveFormatError).field).toBe("version");
    }
  });

  it("rejects a wrong version with a message naming the got and expected versions (R5: hard-coded 1)", () => {
    const payload = JSON.stringify({ version: 99, options: defaultOptions() });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as SaveFormatError).field).toBe("version");
      expect((e as Error).message).toMatch(/got 99/);
      expect((e as Error).message).toMatch(new RegExp(`expected ${EXPECTED_VERSION}`));
    }
  });

  it("rejects a missing options field with field='options'", () => {
    const payload = JSON.stringify({ version: EXPECTED_VERSION });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as SaveFormatError).field).toBe("options");
    }
  });

  it("rejects options that fail validation, surfacing the field name", () => {
    const bad = {
      ...defaultOptions(),
      seats: [{ kind: "human" }],
      computerStrengths: [],
    };
    const payload = JSON.stringify({ version: EXPECTED_VERSION, options: bad });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as Error).message).toMatch(/seats:/);
      expect((e as Error).message).toMatch(/seat count/);
    }
  });

  it("rejects a 5-seat options payload", () => {
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
    const payload = JSON.stringify({ version: EXPECTED_VERSION, options: bad });
    expect(() => deserializeOptions(payload)).toThrow(SaveFormatError);
  });

  it("rejects a malformed save payload with seats: null (R4 — null safety)", () => {
    const bad = { ...defaultOptions(), seats: null };
    const payload = JSON.stringify({ version: EXPECTED_VERSION, options: bad });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      // Must be SaveFormatError (not a raw TypeError that escapes).
      expect(e).toBeInstanceOf(SaveFormatError);
    }
  });

  it("the typed error wraps OptionsError as SaveFormatError", () => {
    // Sanity check: validateGameOptions throws OptionsError on the same bad input.
    const bad = {
      ...defaultOptions(),
      seats: [{ kind: "human" }],
      computerStrengths: [],
    };
    expect(() => validateGameOptions(bad)).toThrow(OptionsError);
    // And the deserializer's SaveFormatError mentions the underlying message.
    const payload = JSON.stringify({ version: EXPECTED_VERSION, options: bad });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as Error).message).toMatch(/seat count/);
    }
  });
});