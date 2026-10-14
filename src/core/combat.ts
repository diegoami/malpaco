import { neighbours, province } from "./map";
import type { DiceSource } from "./rng";
import { activePlayer, armyCount, ownerOf } from "./state";
import type { AttackOutcome, CombatRules, DiceRule, GameState } from "./types";

// One attack, ported from core/rules/combat_resolver.gd. `resolve` mutates the
// state it is given; `apply` (rules.ts) has already cloned it.

export const DIE_SIDES = 6;

/** How many dice a stack of this size rolls. */
export function diceCount(rule: DiceRule, armies: number): number {
  return Math.max(0, Math.min(rule.max, armies - rule.minus));
}

/** Why this attack is not allowed, or "" if it is. Shared by the engine and the UI. */
export function whyNot(state: GameState, fromId: string, toId: string): string {
  const attacker = province(state.map, fromId);
  const defender = province(state.map, toId);
  if (!attacker) return `no such province '${fromId}'`;
  if (!defender) return `no such province '${toId}'`;

  const mover = activePlayer(state);
  if (!mover || ownerOf(state, fromId) !== mover.id) return `you do not hold ${attacker.name}`;
  if (ownerOf(state, toId) === mover.id) return `${defender.name} is already yours`;
  if (!neighbours(attacker).includes(toId)) return `${attacker.name} does not reach ${defender.name}`;

  const rules = state.rules.combat;
  const attacking = armyCount(state, fromId);
  if (attacking < rules.minArmiesToAttack) {
    return `${attacker.name} needs at least ${rules.minArmiesToAttack} armies to attack`;
  }
  const defending = armyCount(state, toId);
  switch (rules.attackRule) {
    case "match":
      if (attacking < defending) {
        return `${attacker.name} has ${attacking} armies and ${defender.name} has ${defending} — an attacker must match the defender`;
      }
      break;
    case "threshold":
      if (attacking < defending * rules.attackRatio) {
        return `${attacker.name} needs ${rules.attackRatio.toFixed(1)} times the defender's armies`;
      }
      break;
    case "classic":
      break;
  }
  return "";
}

/** Every province the active player may attack from `fromId`. What the UI offers; the engine rejects the rest anyway. */
export function attackTargets(state: GameState, fromId: string): string[] {
  const from = province(state.map, fromId);
  if (!from || state.phase !== "attack") return [];
  return neighbours(from).filter((to) => whyNot(state, fromId, to) === "");
}

/** Descending, so the pairing is highest against highest. */
function roll(dice: DiceSource, count: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(dice.rollDie(DIE_SIDES));
  return rolls.sort((a, b) => b - a);
}

/**
 * Who wins each pair of dice, highest against highest; unpaired dice decide
 * nothing. The one place the tie rule is applied: `resolve` takes its losses from
 * this, and the result dialog takes its labels from it, so they cannot disagree.
 */
export function pairResults(
  ties: CombatRules["ties"],
  attackerRolls: readonly number[],
  defenderRolls: readonly number[],
): ("attacker" | "defender" | "tie")[] {
  const pairs = Math.min(attackerRolls.length, defenderRolls.length);
  const results: ("attacker" | "defender" | "tie")[] = [];
  for (let i = 0; i < pairs; i++) {
    const a = attackerRolls[i] as number;
    const d = defenderRolls[i] as number;
    if (a === d && ties === "reroll") results.push("tie");
    else results.push((a === d ? ties === "attacker" : a > d) ? "attacker" : "defender");
  }
  return results;
}

/** Resolves one round. The attacker's dice are rolled first, then the defender's. */
export function resolve(state: GameState, fromId: string, toId: string, dice: DiceSource): AttackOutcome {
  const rules = state.rules.combat;
  const attackerId = ownerOf(state, fromId);
  const defenderId = ownerOf(state, toId);

  let attackerRolls: number[];
  let defenderRolls: number[];
  let results: ("attacker" | "defender" | "tie")[];
  // C-CMB-05: reroll a tied single-die exchange before either side loses an army.
  do {
    attackerRolls = roll(dice, diceCount(rules.attackerDice, armyCount(state, fromId)));
    defenderRolls = roll(dice, diceCount(rules.defenderDice, armyCount(state, toId)));
    results = pairResults(rules.ties, attackerRolls, defenderRolls);
  } while (results.includes("tie"));
  const defenderLosses = results.filter((r) => r === "attacker").length;
  const attackerLosses = results.length - defenderLosses;

  state.armies[fromId] = armyCount(state, fromId) - attackerLosses;
  state.armies[toId] = armyCount(state, toId) - defenderLosses;

  let captured = false;
  let penalty = false;
  let endsPhase = false;
  let moved = 0;

  if (armyCount(state, toId) <= 0) {
    // Capture: the conqueror moves in, leaving at least one army behind.
    const available = armyCount(state, fromId) - 1;
    let wanted = attackerRolls.length;
    if (rules.capture === "all") wanted = available;
    else if (rules.capture === "one") wanted = 1;
    moved = Math.min(Math.max(wanted, 1), Math.max(1, available));
    state.ownerOf[toId] = attackerId;
    state.armies[fromId] = armyCount(state, fromId) - moved;
    state.armies[toId] = moved;
    captured = true;
  } else if (armyCount(state, fromId) <= 1 && rules.failurePenalty !== "none") {
    // The failure penalty: an attack that leaves the attacker on one army,
    // against a defender still standing, is a commitment, not a free roll.
    endsPhase = true;
    if (rules.failurePenalty === "loseProvince") {
      state.ownerOf[fromId] = defenderId;
      state.armies[fromId] = 1;
      penalty = true;
    }
  }

  return {
    event: "attack",
    turn: state.turnNumber,
    from: fromId,
    to: toId,
    attacker: attackerId,
    defender: defenderId,
    attackerRolls,
    defenderRolls,
    attackerLosses,
    defenderLosses,
    captured,
    penalty,
    endsPhase,
    moved,
  };
}
