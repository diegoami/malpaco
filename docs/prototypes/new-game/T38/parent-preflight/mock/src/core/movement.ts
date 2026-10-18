import { neighbours, province } from "./map";
import { activePlayer, armyCount, ownerOf } from "./state";
import type { GameState } from "./types";

/** C-MOV-01..03, pinned core-rules.md Movement (ae298e37).
 * The UI previews this action; committing it ends the ordinary attack phase.
 */
export function whyNotFriendlyMove(state: GameState, from: string, to: string): string {
  if (state.rules.movement !== "adjacent" || state.phase !== "attack" || state.pendingCapture) {
    return "Finish placement and capture choices before moving armies.";
  }
  const source = province(state.map, from);
  if (!source || !province(state.map, to)) return "Choose countries on this board.";
  const player = activePlayer(state)?.id;
  if (ownerOf(state, from) !== player || ownerOf(state, to) !== player) return "Both countries must be yours.";
  if (armyCount(state, from) < 2) return "Leave at least one army at the source.";
  if (from === to || !neighbours(source).includes(to)) return "Move to an owned neighbouring country.";
  return "";
}

export function friendlyTargets(state: GameState, from: string): string[] {
  const source = province(state.map, from);
  return source ? neighbours(source).filter(to => whyNotFriendlyMove(state, from, to) === "") : [];
}

export function friendlySources(state: GameState): string[] {
  return state.map.provinces.filter(p => friendlyTargets(state, p.id).length > 0).map(p => p.id);
}
