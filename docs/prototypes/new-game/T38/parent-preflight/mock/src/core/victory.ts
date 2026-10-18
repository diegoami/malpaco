import { armyTotal, provincesOf } from "./state";
import type { FinalStanding, GameResult, GameState } from "./types";

/** Pinned core-rules.md Victory, decision 9: ceil(75% of the board), 35 of 46. */
export function dominationThreshold(countries: number): number {
  return Math.floor((3 * countries + 3) / 4);
}

function turnPosition(state: GameState, seat: number): number {
  return (seat - (state.roundOrigin ?? 0) + state.players.length) % state.players.length;
}

/** Pinned Victory, decision 10: countries, armies, then the later rotated seat. */
export function finalStandings(state: GameState): FinalStanding[] {
  return state.players.map((player, seat) => ({
    player: player.id, countries: provincesOf(state, player.id).length,
    armies: armyTotal(state, player.id), seat,
  })).sort((a, b) => b.countries - a.countries || b.armies - a.armies
    || turnPosition(state, b.seat) - turnPosition(state, a.seat))
    .map(({ player, countries, armies }) => ({ player, countries, armies }));
}

/** A round wraps across its fixed origin even when that seat is skipped. */
export function nextLivingTurn(state: GameState): { seat: number; completedRound: boolean } {
  for (let step = 1; step <= state.players.length; step++) {
    const seat = (state.currentPlayer + step) % state.players.length;
    if (!state.players[seat]!.eliminated) {
      return { seat, completedRound: turnPosition(state, seat) <= turnPosition(state, state.currentPlayer) };
    }
  }
  return { seat: state.currentPlayer, completedRound: true };
}

/** Resolve only a completed turn: after movement/effects and before next income. */
export function resolveTurnVictory(state: GameState, completedRound: boolean): boolean {
  const options = state.rules.victoryOptions!;
  const standings = finalStandings(state);
  const mover = state.players[state.currentPlayer]!;
  const alive = state.players.filter(player => !player.eliminated);
  let reason: GameResult["reason"] | undefined;
  let winner = "";
  if (standings[0]?.countries === state.map.provinces.length) {
    reason = "conquest";
    winner = standings[0].player;
  } else if (alive.length === 1) {
    // Equivalent to conquest for a valid, completely owned board (pinned Victory §2).
    reason = "last-seat";
    winner = alive[0]!.id;
  } else if (options.dominationWin && provincesOf(state, mover.id).length >= dominationThreshold(state.map.provinces.length)) {
    reason = "domination";
    winner = mover.id;
  } else if (options.roundLimit !== null && completedRound && state.turnNumber >= options.roundLimit) {
    reason = "round-limit";
    winner = standings[0]!.player;
  } else if (!state.watchingComputers && state.players.some(player => player.kind !== "computer")
    && !alive.some(player => player.kind !== "computer")) {
    reason = "no-human-left";
  }
  if (!reason) return false;
  state.result = { reason, standings };
  state.winner = winner;
  state.phase = reason === "no-human-left" ? "human-loss" : "finished";
  state.reinforcementPool = 0;
  if (winner) state.log.push({ event: "victory", player: winner, turn: state.turnNumber });
  return true;
}
