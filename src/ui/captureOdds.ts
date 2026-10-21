import {DIE_SIDES, armyCount} from "../core";
import type {GameState} from "../core";

/**
 * T82 (R5): the chance that this attack captures its target if fought to the end —
 * the attacker keeps attacking until the target falls or the source is down to the
 * last army it may not attack with. Exact for the current stacks and the rules'
 * single-die exchanges (ties rerolled or awarded); `null` when the rules roll several
 * dice, which this game never does. Presentation only: the rules never read it.
 */
export function captureOdds(state: GameState, from: string, to: string): number | null {
  const rules = state.rules.combat;
  if (rules.attackerDice.max !== 1 || rules.defenderDice.max !== 1) return null;
  // One exchange: count the 36 die pairs (a tie that rerolls simply drops out).
  let win = 0, lose = 0;
  for (let a = 1; a <= DIE_SIDES; a++) for (let d = 1; d <= DIE_SIDES; d++) {
    if (a > d || (a === d && rules.ties === "attacker")) win++;
    else if (a < d || (a === d && rules.ties !== "reroll")) lose++;
  }
  const p = win / (win + lose), defenders = armyCount(state, to);
  // The attacker may lose this many armies and still be attacking: down to the minimum.
  const spare = armyCount(state, from) - Math.max(1, rules.minArmiesToAttack - 1) - 1;
  if (spare < 0) return 0;
  // Negative binomial: `defenders` wins before `spare + 1` losses.
  let total = 0, ways = 1;
  for (let k = 0; k <= spare; k++) {
    if (k > 0) ways = (ways * (defenders - 1 + k)) / k;
    total += ways * p ** defenders * (1 - p) ** k;
  }
  return Math.min(1, total);
}

/** "91% capture" style: whole percent, but never 0% or 100% unless certain. */
export function oddsLabel(odds: number): string {
  if (odds >= 1) return "100%";
  if (odds <= 0) return "0%";
  return `${Math.min(99, Math.max(1, Math.round(odds * 100)))}%`;
}
