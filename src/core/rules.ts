import { attackTargets, resolve, whyNot } from "./combat";
import { DeterministicRng } from "./rng";
import { activePlayer, cloneState, livingPlayers, provincesOf } from "./state";
import type { Action, ApplyResult, GameState, Player } from "./types";

// The engine's one way in: apply(state, action). Total, deterministic, no I/O,
// no ambient randomness. Ported from core/rules/rules.gd, restricted to the
// slice: the attack phase and ending a turn. Reinforcement, redeploy, hazards,
// cards and surrender are not ported.

/** Every attack the active player could declare. */
export function legalAttacks(state: GameState): Action[] {
  const mover = activePlayer(state);
  if (!mover || state.phase !== "attack") return [];
  const found: Action[] = [];
  for (const from of provincesOf(state, mover.id)) {
    for (const to of attackTargets(state, from)) found.push({ kind: "attack", from, to });
  }
  return found;
}

export function apply(state: GameState, action: Action): ApplyResult {
  if (state.phase === "finished") return { ok: false, error: "the game is over" };
  if (!activePlayer(state)) return { ok: false, error: "no player to act" };

  const next = cloneState(state);
  const result = dispatch(next, action);
  if (result.ok) result.state.history.push(action);
  return result;
}

function dispatch(next: GameState, action: Action): ApplyResult {
  switch (action.kind) {
    case "attack":
      return attack(next, action.from, action.to);
    case "endTurn":
      return endTurn(next);
  }
}

function attack(state: GameState, from: string, to: string): ApplyResult {
  if (state.phase !== "attack") return { ok: false, error: "attacks happen in the attack phase" };
  const refusal = whyNot(state, from, to);
  if (refusal !== "") return { ok: false, error: refusal };

  const rng = DeterministicRng.fromSnapshot(state.rng);
  const outcome = resolve(state, from, to, rng);
  state.rng = rng.snapshot();
  state.log.push(outcome);
  if (outcome.captured) {
    state.capturedThisTurn = true;
    checkElimination(state);
    if (checkVictory(state)) return { ok: true, state, outcome };
  }
  if (outcome.endsPhase) state.phase = "redeploy";
  return { ok: true, state, outcome };
}

/**
 * SPIKE STAND-IN: ends the turn and passes play to the next living player. In
 * core/ this is END_PHASE twice (attack -> redeploy -> hazards -> reinforce);
 * with no redeploy, hazards or reinforcement in the slice, the two collapse into
 * one action, accepted from the attack phase as well as from redeploy.
 */
function endTurn(state: GameState): ApplyResult {
  const mover = activePlayer(state) as Player;
  state.log.push({ event: "turn_ended", player: mover.id, turn: state.turnNumber });
  const seats = state.players.length;
  for (let i = 0; i < seats; i++) {
    state.currentPlayer = (state.currentPlayer + 1) % seats;
    if (state.currentPlayer === 0) state.turnNumber += 1;
    if (!activePlayer(state)?.eliminated) break;
  }
  state.phase = "attack";
  state.capturedThisTurn = false;
  return { ok: true, state, outcome: null };
}

function checkElimination(state: GameState): void {
  for (const candidate of state.players) {
    if (!candidate.eliminated && provincesOf(state, candidate.id).length === 0) {
      candidate.eliminated = true;
      state.log.push({ event: "eliminated", player: candidate.id, turn: state.turnNumber });
    }
  }
}

/** Conquest only, as in Classic. */
function checkVictory(state: GameState): boolean {
  if (!state.rules.victory.includes("conquest")) return false;
  const alive = livingPlayers(state);
  if (alive.length > 1) return false;
  state.phase = "finished";
  state.winner = alive[0]?.id ?? "";
  state.log.push({ event: "victory", player: state.winner, turn: state.turnNumber });
  return true;
}
