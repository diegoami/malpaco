import { attackTargets, resolve, whyNot } from "./combat";
import { DeterministicRng } from "./rng";
import { reinforcementIncome } from "./reinforcement";
import { whyNotFriendlyMove } from "./movement";
import { activePlayer, cloneState, livingPlayers, provincesOf } from "./state";
import type { Action, ApplyResult, GameState, Player } from "./types";

// The engine's one way in: apply(state, action). Total, deterministic, no I/O,
// no ambient randomness. Ported from core/rules/rules.gd, restricted to the
// slice: reinforcement placement, the attack phase and ending a turn.

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
  if ((state.pendingCapture || state.phase === "capture") && action.kind !== "captureMove") {
    return { ok: false, error: "choose the capture move-in before another action" };
  }

  const next = cloneState(state);
  const result = dispatch(next, action);
  if (result.ok) result.state.history.push(action);
  return result;
}

function dispatch(next: GameState, action: Action): ApplyResult {
  switch (action.kind) {
    case "reinforce":
      return reinforce(next, action.province, action.amount);
    case "endReinforcement":
      return endReinforcement(next);
    case "attack":
      return attack(next, action.from, action.to);
    case "endTurn":
      return endTurn(next);
    case "captureMove":
      return captureMove(next, action.amount);
    case "friendlyMove":
      return friendlyMove(next, action.from, action.to, action.amount);
    default:
      return { ok: false, error: "unknown action" };
  }
}

function reinforce(state: GameState, provinceId: string, amount: number): ApplyResult {
  if (state.rules.turnSequence !== "reinforcement" || state.phase !== "reinforce") {
    return { ok: false, error: "reinforcements happen in the reinforcement phase" };
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false, error: "reinforcement amount must be a positive integer" };
  }
  const mover = activePlayer(state)!;
  if (!state.map.provinces.some((province) => province.id === provinceId)) {
    return { ok: false, error: "unknown province" };
  }
  if (state.ownerOf[provinceId] !== mover.id) {
    return { ok: false, error: "you may reinforce only your own provinces" };
  }
  if (amount > state.reinforcementPool) {
    return { ok: false, error: "reinforcement amount exceeds the remaining pool" };
  }
  state.armies[provinceId] = (state.armies[provinceId] ?? 0) + amount;
  state.reinforcementPool -= amount;
  return { ok: true, state, outcome: null };
}

function endReinforcement(state: GameState): ApplyResult {
  if (state.rules.turnSequence !== "reinforcement" || state.phase !== "reinforce") {
    return { ok: false, error: "not in the reinforcement phase" };
  }
  if (state.reinforcementPool !== 0) {
    return { ok: false, error: "place all reinforcements before attacking" };
  }
  state.phase = "attack";
  return { ok: true, state, outcome: null };
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
    if (state.rules.combat.capture !== "choice" && checkVictory(state)) return { ok: true, state, outcome };
  }
  if (outcome.endsPhase) state.phase = "redeploy";
  return { ok: true, state, outcome };
}

function captureMove(state: GameState, requested: number | undefined): ApplyResult {
  const choice = state.pendingCapture;
  if (state.phase !== "capture" || !choice) return { ok: false, error: "no capture move-in is pending" };
  const amount = requested === undefined ? choice.defaultAmount : requested;
  if (!Number.isSafeInteger(amount) || amount < choice.min || amount > choice.max) {
    return { ok: false, error: "capture amount must be an integer within the pending bounds" };
  }
  const additional = amount - choice.min;
  state.armies[choice.from] = state.armies[choice.from]! - additional;
  state.armies[choice.to] = state.armies[choice.to]! + additional;
  delete state.pendingCapture;
  state.phase = "attack";
  return { ok: true, state, outcome: null };
}

function friendlyMove(state: GameState, from: string, to: string, requested: number | undefined): ApplyResult {
  const refusal = whyNotFriendlyMove(state, from, to);
  if (refusal) return { ok: false, error: refusal };
  const maximum = state.armies[from]! - 1;
  const amount = requested ?? maximum;
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > maximum) {
    return { ok: false, error: "Move a whole number of armies and leave at least one behind." };
  }
  state.armies[from] = state.armies[from]! - amount;
  state.armies[to] = state.armies[to]! + amount;
  return endTurn(state);
}

/** Passes play to the next living player after the selected ruleset's turn phases. */
function endTurn(state: GameState): ApplyResult {
  if (state.rules.turnSequence === "reinforcement" && state.phase !== "attack" && state.phase !== "redeploy") {
    return { ok: false, error: "end the turn after the attack phase" };
  }
  // Pinned core-rules.md Victory: after this turn's move, before next income.
  if (state.rules.combat.capture === "choice" && checkVictory(state)) return { ok: true, state, outcome: null };
  const mover = activePlayer(state) as Player;
  state.log.push({ event: "turn_ended", player: mover.id, turn: state.turnNumber });
  const seats = state.players.length;
  for (let i = 0; i < seats; i++) {
    state.currentPlayer = (state.currentPlayer + 1) % seats;
    if (state.currentPlayer === 0) state.turnNumber += 1;
    if (!activePlayer(state)?.eliminated) break;
  }
  const next = activePlayer(state);
  state.phase = state.rules.turnSequence === "reinforcement" ? "reinforce" : "attack";
  state.capturedThisTurn = false;
  state.reinforcementPool = state.rules.turnSequence === "reinforcement" && next && !next.eliminated
    ? reinforcementIncome(state, next.id).total
    : 0;
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
