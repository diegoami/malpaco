import { readFileSync } from "node:fs";
import type { Action, GameOptions, GameState } from "../../src/core";

export interface MatchIdentity {
  boardGenerator: { id: string; version: number };
  rules: { id: string; version: number };
  actionSchemaVersion: number;
}
export const referenceIdentity: MatchIdentity = {
  boardGenerator: { id: "fixed-reference", version: 1 },
  rules: { id: "victory", version: 1 }, actionSchemaVersion: 2,
};
export const legacyIdentity: MatchIdentity = {
  boardGenerator: { id: "generated", version: 1 },
  rules: { id: "malpaco", version: 1 }, actionSchemaVersion: 1,
};
export interface PinnedMatch {
  name: string;
  formatVersion: 1 | 2;
  identity: MatchIdentity;
  options: GameOptions;
  actions: Action[];
  text: string;
  expected: ReturnType<typeof logicalState>;
  next: { action: Action; expected: ReturnType<typeof logicalState> } | null;
}

// Geography decoration is presentation-only; include ordered topology because
// setup, income and RNG draw ordering depend on it. Everything else is exact.
export function logicalState(state: GameState) {
  const { map, ...rest } = state;
  return JSON.parse(JSON.stringify({
    ...rest,
    map: {
      id: map.id,
      provinces: map.provinces.map(({ id, island, borders, seaLanes }) => ({ id, island, borders, seaLanes })),
      islands: map.islands,
    },
  })) as Record<string, unknown>;
}
export function envelope(options: GameOptions, actions: readonly Action[], identity = referenceIdentity) {
  return { format: "malpaco-match", version: 2, ...identity, options, actions };
}
export function pinned(name: string): PinnedMatch {
  const base = new URL("../../fixtures/new-game/T31/fixtures/", import.meta.url);
  const payload = JSON.parse(readFileSync(new URL(`${name}.json`, base), "utf8")) as PinnedMatch | { parts: string[] };
  return "parts" in payload ? JSON.parse(payload.parts.map(part => JSON.parse(readFileSync(new URL(part, base), "utf8")) as string).join("")) as PinnedMatch : payload;
}
export const caseNames = ["legacy-opening", "legacy-progress", "placement", "pending-capture", "capture-completed", "move-ready", "move-completed", "domination", "human-loss", "watch", "stop", "round-limit"];
