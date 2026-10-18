import type { GameState, Island } from "./types";

// Island income, as pure functions (C-BON-01, C-BON-02; issue #23, task T09).
//
// C-BON-01: a seat earns an island's `bonus` only when it owns every province
// of that island; partial control earns nothing; several complete islands sum
// with no diminishing and no set-of-islands extra; and the on-board message
// reports the count of islands held, not their values.
//
// C-BON-02: the bonus values live on the map, as `Island.bonus`: the authored
// board's data and the generator's [designed] formula. This module adds no
// constant and recomputes no value (the size formula belongs to board-gen).
//
// Rule 18: no DOM, no I/O, no wall clock, no unseeded random; the same
// `state` and `seatId` always give the same answer.

/** A seat's island income: the completely-held islands, their summed bonuses, and their count. */
export interface IslandIncome {
  /** The islands whose every province `seatId` owns, in the map's island order. */
  readonly islands: readonly Island[];
  /** The sum of those islands' `bonus` values; 0 when none is held. */
  readonly total: number;
  /** The number of held islands — what the message reports (C-BON-01). */
  readonly count: number;
}

/**
 * The islands `seatId` completely holds, their summed bonus, and their count.
 *
 * An island pays only when `seatId` owns every one of its provinces; a single
 * province held by another seat (or by nobody) makes the island pay nothing to
 * anyone (C-BON-01). An island with no provinces is never held, so it never
 * pays. Pure and order-independent: the map's island order fixes the result.
 */
export function islandIncome(state: GameState, seatId: string): IslandIncome {
  const islands: Island[] = [];
  let total = 0;
  for (const island of state.map.islands) {
    const complete =
      island.provinces.length > 0 && island.provinces.every((pid) => state.ownerOf[pid] === seatId);
    if (!complete) continue;
    islands.push(island);
    total += island.bonus;
  }
  return { islands, total, count: islands.length };
}
