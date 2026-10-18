import { islandIncome } from "./bonuses";
import { provincesOf } from "./state";
import type { GameState } from "./types";

export interface ReinforcementIncome {
  readonly base: number;
  readonly islandBonus: number;
  readonly total: number;
  readonly provinceCount: number;
}

/**
 * Ownership-based income (C-REI-01..03, isle-wars-archaeology spec/reinforcement.md).
 * Divisor 3 and minimum 2 are [designed] Risk-style values: T10 consulted
 * T09's spec/island-bonuses.md corpus citation, with no independent search.
 * Eliminated seats use the same formula: zero provinces gives base 2 and
 * island bonus 0. The turn sequence decides which seats receive income.
 */
export function reinforcementIncome(state: GameState, seatId: string): ReinforcementIncome {
  const provinceCount = provincesOf(state, seatId).length;
  const base = Math.max(Math.floor(provinceCount / 3), 2);
  const islandBonus = islandIncome(state, seatId).total;
  return { base, islandBonus, total: base + islandBonus, provinceCount };
}
