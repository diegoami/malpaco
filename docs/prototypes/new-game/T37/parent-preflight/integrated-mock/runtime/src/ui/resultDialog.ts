import { pairResults, province } from "../core";
import type { AttackOutcome, GameState } from "../core";
import { h } from "./dom";

const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function die(face: number, side: "attacker" | "defender"): HTMLElement {
  const el = h("span", { class: `die ${side}`, "data-face": face, role: "img", "aria-label": `${face}` });
  const lit = new Set(PIPS[face] ?? []);
  for (let i = 0; i < 9; i++) el.append(h("i", { class: lit.has(i) ? "pip" : "" }));
  return el;
}

/** The headline, the dice and the tally of one attack. Pure data in, DOM out. */
export function describeAttack(state: GameState, outcome: AttackOutcome): { headline: string; kind: string; detail: string } {
  const from = province(state.map, outcome.from)?.name ?? outcome.from;
  const to = province(state.map, outcome.to)?.name ?? outcome.to;
  const name = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
  const plural = (n: number) => `${n} ${n === 1 ? "army" : "armies"}`;
  if (outcome.captured) {
    return { kind: "captured", headline: `${to} captured!`, detail: `${plural(outcome.moved)} move in from ${from}.` };
  }
  if (outcome.penalty) {
    return {
      kind: "lost",
      headline: `${from} is lost!`,
      detail: `The attack failed. ${name(outcome.defender)} takes ${from} and your attacks end for this turn.`,
    };
  }
  if (outcome.endsPhase) {
    return { kind: "lost", headline: "Attack failed", detail: "Your attacks end for this turn." };
  }
  const detail = `${name(outcome.attacker)} loses ${plural(outcome.attackerLosses)}, ${name(outcome.defender)} loses ${plural(outcome.defenderLosses)}.`;
  const gained = outcome.defenderLosses > outcome.attackerLosses;
  const stalemate = outcome.defenderLosses === outcome.attackerLosses;
  return {
    kind: gained ? "won" : "held",
    headline: gained ? "Attacker gains ground" : stalemate ? "A costly exchange" : "Defence holds",
    detail,
  };
}

export class ResultDialog {
  readonly el: HTMLDialogElement;
  private readonly body = h("div", { class: "result-body" });
  private onClose: () => void = () => {};

  constructor() {
    const button = h("button", { type: "button", id: "result-continue", class: "primary", autofocus: true }, "Continue");
    button.addEventListener("click", () => this.el.close());
    this.el = h("dialog", { id: "result-dialog", "aria-labelledby": "result-title" }, this.body, h("div", { class: "dialog-actions" }, button));
    this.el.addEventListener("close", () => this.onClose());
  }

  show(state: GameState, outcome: AttackOutcome, extra: string, onClose: () => void): void {
    const { headline, kind, detail } = describeAttack(state, outcome);
    const from = province(state.map, outcome.from)?.name ?? outcome.from;
    const to = province(state.map, outcome.to)?.name ?? outcome.to;
    const name = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
    const seat = (id: string) => state.players.findIndex((p) => p.id === id);

    const columns = Math.max(outcome.attackerRolls.length, outcome.defenderRolls.length);
    const grid = h("div", { class: "dice-grid", style: `--cols:${columns}` });
    grid.append(h("div", { class: `side seat-${seat(outcome.attacker)}` }, `${name(outcome.attacker)} · ${from}`));
    // The labels come from the engine's own pairing and tie rule, never from a local comparison.
    const results = pairResults(state.rules.combat.ties, outcome.attackerRolls, outcome.defenderRolls);
    outcome.attackerRolls.forEach((a) => grid.append(h("div", { class: "cell" }, die(a, "attacker"))));
    grid.append(
      h(
        "div",
        { class: "versus" },
        ...Array.from({ length: columns }, (_, i) => {
          const result = results[i];
          const cls = result === undefined ? "none" : result === "attacker" ? "up" : "down";
          const text = result === undefined ? "\u2014" : result === "attacker" ? "\u25b2 wins" : "\u25bc holds";
          return h("span", { class: `verdict ${cls}` }, text);
        }),
      ),
    );
    grid.append(h("div", { class: `side seat-${seat(outcome.defender)}` }, `${name(outcome.defender)} · ${to}`));
    outcome.defenderRolls.forEach((d) => grid.append(h("div", { class: "cell" }, die(d, "defender"))));

    this.body.replaceChildren(
      h("h2", { id: "result-title" }, `${from} attacks ${to}`),
      grid,
      h("p", { class: `headline ${kind}`, "data-outcome": kind }, headline),
      h("p", { class: "detail" }, detail),
      ...(extra ? [h("p", { class: "extra" }, extra)] : []),
    );
    this.el.dataset["outcome"] = kind;
    // What the engine said, for the tests to hold the dice labels against.
    this.el.dataset["attackerLosses"] = String(outcome.attackerLosses);
    this.el.dataset["defenderLosses"] = String(outcome.defenderLosses);
    this.onClose = onClose;
    if (!this.el.open) this.el.showModal();
  }
}
