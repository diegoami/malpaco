import { describe, expect, it } from "vitest";
import {
  defaultOptions,
  deserializeOptions,
  OptionsError,
  SAVE_FORMAT_VERSION,
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

describe("serializeOptions / deserializeOptions round-trip", () => {
  it("the defaults round-trip exactly", () => {
    const text = serializeOptions(defaultOptions());
    const restored = deserializeOptions(text);
    expect(restored).toEqual(defaultOptions());
  });

  it("a non-default options record round-trips", () => {
    const options: GameOptions = {
      ...defaultOptions(),
      seats: [{ kind: "human" }, { kind: "computer", difficulty: "Hard" }],
      startingArmiesRange: "1-4",
      humanShare: 2,
      eventFrequency: "Often",
      dominationWin: false,
      roundLimit: 30,
      seed: 0xdeadbeef,
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
    expect(parsed.version).toBe(SAVE_FORMAT_VERSION);
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

  it("rejects a wrong version with a message naming the got and expected versions", () => {
    const payload = JSON.stringify({ version: 99, options: defaultOptions() });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as SaveFormatError).field).toBe("version");
      expect((e as Error).message).toMatch(/got 99/);
      expect((e as Error).message).toMatch(new RegExp(`expected ${SAVE_FORMAT_VERSION}`));
    }
  });

  it("rejects a missing options field with field='options'", () => {
    const payload = JSON.stringify({ version: SAVE_FORMAT_VERSION });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as SaveFormatError).field).toBe("options");
    }
  });

  it("rejects options that fail validation, surfacing the field name", () => {
    const bad = { ...defaultOptions(), seats: [{ kind: "human" }] };
    const payload = JSON.stringify({ version: SAVE_FORMAT_VERSION, options: bad });
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
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
        { kind: "computer", difficulty: "Normal" },
      ],
    };
    const payload = JSON.stringify({ version: SAVE_FORMAT_VERSION, options: bad });
    expect(() => deserializeOptions(payload)).toThrow(SaveFormatError);
  });

  it("the typed error wraps OptionsError as SaveFormatError", () => {
    // Sanity check: validateGameOptions throws OptionsError on the same bad input.
    const bad = { ...defaultOptions(), seats: [{ kind: "human" }] };
    expect(() => validateGameOptions(bad)).toThrow(OptionsError);
    // And the deserializer's SaveFormatError mentions the underlying message.
    const payload = JSON.stringify({ version: SAVE_FORMAT_VERSION, options: bad });
    try {
      deserializeOptions(payload);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SaveFormatError);
      expect((e as Error).message).toMatch(/seat count/);
    }
  });
});