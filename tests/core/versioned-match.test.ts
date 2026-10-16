import { describe, expect, it, vi } from "vitest";
import * as codec from "../../src/core/match-save";
import * as policy from "../../src/core/computer";
import { apply, SaveFormatError } from "../../src/core";
import type { Action, GameOptions, GameState } from "../../src/core";
import { caseNames, envelope, legacyIdentity, logicalState, pinned, referenceIdentity } from "./versioned-match-fixture";
import type { MatchIdentity } from "./versioned-match-fixture";

type Loaded = { formatVersion: 1 | 2; identity: MatchIdentity; options: GameOptions; state: GameState };
const api = codec as typeof codec & {
  serializeVersionedMatch?: (options: GameOptions, actions: readonly Action[], identity: MatchIdentity) => string;
  deserializeVersionedMatch?: (text: string) => Loaded;
};
// Exercise the real old path on baseline rather than fail on a missing import.
const decode = (text: string): Loaded => api.deserializeVersionedMatch?.(text) ?? codec.deserializeMatch(text) as Loaded;
const encode = (options: GameOptions, actions: readonly Action[], identity: MatchIdentity) => api.serializeVersionedMatch?.(options, actions, identity) ?? codec.serializeMatch(options, actions);

describe("versioned deterministic match replay", () => {
  for (const name of caseNames) it(`reconstructs pinned T30 ${name} and its exact next action`, () => {
    const fixture = pinned(name), loaded = decode(fixture.text);
    expect(loaded.formatVersion).toBe(fixture.formatVersion);
    expect(loaded.identity).toEqual(fixture.identity);
    expect(loaded.options).toEqual(fixture.options);
    expect(logicalState(loaded.state)).toEqual(fixture.expected);
    if (fixture.next) {
      const next = apply(loaded.state, fixture.next.action);
      expect(next.ok).toBe(true); if (!next.ok) throw Error(next.error);
      expect(logicalState(next.state)).toEqual(fixture.next.expected);
    }
    if (fixture.formatVersion === 1) {
      expect(codec.serializeMatch(loaded.options, loaded.state.history)).toBe(fixture.text);
      expect(loaded.identity).toEqual(legacyIdentity);
    } else {
      const saved = encode(loaded.options, loaded.state.history, loaded.identity);
      expect(Object.keys(JSON.parse(saved))).toEqual(["format", "version", "boardGenerator", "rules", "actionSchemaVersion", "options", "actions"]);
      expect(JSON.parse(saved)).toEqual(JSON.parse(fixture.text));
      expect(logicalState(decode(saved).state)).toEqual(fixture.expected);
      expect(encode(decode(saved).options, decode(saved).state.history, loaded.identity)).toBe(saved);
    }
  });

  it("replays recorded computer actions without consulting computer policy", () => {
    const fixture = pinned("watch");
    const mock = vi.spyOn(policy, "computerAction").mockImplementation(() => { throw Error("Policy must not run during replay"); });
    try {
      const loaded = decode(fixture.text);
      expect(logicalState(loaded.state)).toEqual(fixture.expected);
      expect(loaded.state.computerRngs).toEqual(fixture.expected["computerRngs"]);
      expect(mock).not.toHaveBeenCalled();
    } finally { mock.mockRestore(); }
  });

  it("preserves omitted capture and movement quantities as ordinary versioned defaults", () => {
    for (const name of ["pending-capture", "move-ready"]) {
      const fixture = pinned(name), before = decode(fixture.text);
      const action = { ...fixture.next!.action }; delete (action as { amount?: number }).amount;
      const result = apply(before.state, action); expect(result.ok).toBe(true); if (!result.ok) throw Error(result.error);
      const saved = encode(fixture.options, [...fixture.actions, action], referenceIdentity);
      expect(JSON.parse(saved).actions.at(-1)).toEqual(action);
      expect(logicalState(decode(saved).state)).toEqual(logicalState(result.state));
    }
  });

  it("rejects malformed files, unsupported identities, snapshots and illegal histories with typed errors", () => {
    const fixture = pinned("placement"), valid = envelope(fixture.options, fixture.actions);
    expect(logicalState(decode(JSON.stringify(valid)).state)).toEqual(fixture.expected);
    const invalid: [unknown, string | undefined][] = [
      [null, undefined], [[], undefined], [{ ...valid, format: "other" }, "format"],
      [{ ...valid, version: 99 }, "version"],
      [{ ...valid, boardGenerator: { id: "fixed-reference", version: 99 } }, "boardGenerator"],
      [{ ...valid, boardGenerator: { id: "generated", version: 1 } }, "boardGenerator"],
      [{ ...valid, rules: { id: "victory", version: 99 } }, "rules"],
      [{ ...valid, rules: { id: "malpaco", version: 1 } }, "rules"],
      [{ ...valid, actionSchemaVersion: 99 }, "actionSchemaVersion"],
      [{ ...valid, options: { ...fixture.options, seed: -1 } }, "options"],
      [{ ...valid, state: fixture.expected }, undefined],
      [{ ...valid, actions: [{ kind: "attack", from: "missing", to: "missing" }] }, "actions[0]"],
      ...[null, {}, { kind: "teleport" }, { kind: "watchComputers", extra: true },
        { kind: "captureMove", amount: null }, { kind: "captureMove", amount: 1.5 },
        { kind: "friendlyMove", from: "a", to: "b", amount: 0 },
        { kind: "reinforce", province: "a", amount: Number.MAX_SAFE_INTEGER + 1 },
        { kind: "endTurn", extra: true }].map(action => [{ ...valid, actions: [action] }, "actions[0]"] as [unknown, string]),
    ];
    for (const [value, field] of invalid) {
      let error: unknown; try { decode(JSON.stringify(value)); } catch (caught) { error = caught; }
      expect(error, JSON.stringify(value)).toBeInstanceOf(SaveFormatError);
      if (field) expect((error as SaveFormatError).field).toBe(field);
    }
    expect(() => decode("{")).toThrow(SaveFormatError);
    for (const name of ["pending-capture", "domination", "human-loss"]) {
      const locked = pinned(name);
      expect(() => decode(JSON.stringify(envelope(locked.options, [...locked.actions, { kind: "endTurn" }])))).toThrow(SaveFormatError);
    }
    expect(() => encode(fixture.options, fixture.actions, { ...referenceIdentity, actionSchemaVersion: 99 })).toThrow(SaveFormatError);
    expect(() => encode(fixture.options, [{ kind: "captureMove", amount: 1 }], referenceIdentity)).toThrow(SaveFormatError);
    expect(logicalState(decode(fixture.text).state)).toEqual(fixture.expected);
  });
});
