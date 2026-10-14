import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classicRules, newGame, parseMap } from "../../src/core";
import type { DiceSource, GameMap, GameState, Player, RuleSet } from "../../src/core";

/** The shipped map, read as data and unchanged (test code may do I/O; core/ may not). */
export const MAP_PATH = fileURLToPath(new URL("../../data/maps/small_sea.json", import.meta.url));

export function readMapJson(): unknown {
  return JSON.parse(readFileSync(MAP_PATH, "utf8"));
}

export function smallSea(): GameMap {
  const result = parseMap(readMapJson());
  if (!result.ok) throw new Error(`small_sea.json did not load: ${result.errors.join("; ")}`);
  return result.map;
}

export const PLAYERS: Player[] = [
  { id: "blue", name: "Blue", eliminated: false },
  { id: "amber", name: "Amber", eliminated: false },
];

/** A scripted die: yields the given faces in order and fails loudly if the engine asks for more. */
export class ScriptedDice implements DiceSource {
  readonly asked: number[] = [];
  private next = 0;
  constructor(private readonly faces: readonly number[]) {}
  rollDie(sides: number): number {
    this.asked.push(sides);
    const face = this.faces[this.next++];
    if (face === undefined) throw new Error(`the engine rolled more dice than the ${this.faces.length} scripted`);
    return face;
  }
  get unused(): number {
    return this.faces.length - this.next;
  }
}

/**
 * A game in the attack phase with ownership and armies set exactly, on the real
 * map. `holdings` maps province id to [player id, armies]; every other province
 * goes to amber with one army. Blue moves first.
 */
export function position(holdings: Record<string, [string, number]>, rules: RuleSet = classicRules(), seed = 7): GameState {
  const state = newGame(smallSea(), rules, PLAYERS, seed);
  for (const p of state.map.provinces) {
    const held = holdings[p.id] ?? ["amber", 1];
    state.ownerOf[p.id] = held[0];
    state.armies[p.id] = held[1];
  }
  // Combat fixtures start at attack even when they use Malpaco combat values.
  state.phase = "attack";
  state.reinforcementPool = 0;
  return state;
}

export function withCombat(overrides: Partial<RuleSet["combat"]>): RuleSet {
  const base = classicRules();
  return { ...base, combat: { ...base.combat, ...overrides } };
}
