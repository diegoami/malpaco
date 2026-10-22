import { armyCount, province, whyNot } from "../core";
import { h } from "./dom";
import { iconButton } from "./icons";
import type { BattleController, BattleView as Snapshot } from "./battleController";

/**
 * Disposable controls capture a revision. Detached controls cannot act on a later state.
 * The card is icon controls only (T92, trimmed by T97); full explanations stay available
 * to assistive technology.
 */
export class BattleView {
  readonly el = h("section", { class: "battle-controls", role: "region", "aria-label": "Battle controls" });
  private captureDraftKey: string | null = null;

  constructor(private readonly controller: BattleController, private readonly onCancel: () => void = () => controller.select(null, null)) {}

  render(view: Snapshot): void {
    const { state, from, to, revision } = view;
    const focused = this.el.contains(document.activeElement) ? document.activeElement?.id : undefined;
    const pending = state.pendingCapture;
    const captureKey = pending ? `${state.history.length}:${pending.from}:${pending.to}` : null;
    const captureDraft = captureKey === this.captureDraftKey ? this.el.querySelector<HTMLInputElement>("#capture-amount")?.value : undefined;
    this.captureDraftKey = captureKey;
    const inBattlePhase = state.phase === "attack" || state.phase === "capture";
    this.el.hidden = !inBattlePhase && view.lastOutcome === null;
    this.el.dataset["historyCount"] = String(state.history.length);
    this.el.dataset["running"] = String(view.running);
    this.el.dataset["paused"] = String(view.paused);
    this.el.dataset["revision"] = String(revision);
    this.el.dataset["speed"] = view.speed;
    this.el.dataset["pendingCapture"] = String(!!pending);

    const name = (id: string) => province(state.map, id)!.name;
    const context = h("p", { class: "card-line battle-context" },
      h("strong", { id: "battle-source-name", class: from ? "" : "visually-hidden" }, from ? name(from) : "Choose your country"),
      h("span", { id: "battle-source-armies", class: from ? "battle-count" : "visually-hidden", "aria-label": "Source armies" }, from ? String(armyCount(state, from)) : "—"),
      h("span", { class: from && to ? "battle-arrow" : "visually-hidden", "aria-hidden": "true" }, "→"),
      h("strong", { id: "battle-target-name", class: to ? "" : "visually-hidden" }, to ? name(to) : "Choose an enemy neighbour"),
      h("span", { id: "battle-target-armies", class: to ? "battle-count" : "visually-hidden", "aria-label": "Target armies" }, to ? String(armyCount(state, to)) : "—"),
      ...(from && to ? [] : [h("span", { class: "card-prompt" }, from ? "Choose an enemy neighbour" : "Choose your country, then an enemy")]));
    // T97 (owner, #244): the card holds Fight and Cancel only; the map shows the pair, so the
    // pair line, counts, dice and messages stay for assistive technology alone.
    context.classList.add("visually-hidden");
    const canExchange = !pending && inBattlePhase && from !== null && to !== null && whyNot(state, from, to) === "";
    // One press is one exchange; the pause gate and this render's revision guard it.
    const controls = h("div", { class: "battle-actions card-icons" },
      iconButton("single-exchange-button", "Fight", "Fight", "attack", !canExchange || view.running || view.paused || this.controller.playbackPaused, () => this.controller.singleExchange(revision), true),
      iconButton("cancel-battle-button", "Cancel", "Cancel", "close", view.running || !from || !!pending, () => this.onCancel()),
    );
    const last = view.lastOutcome;
    const resultText = last ? last.captured ? "Target captured" : last.attackerLosses > 0 ? "Defender wins · source loses 1" : "Attacker wins · target loses 1" : "Ready";
    const status = this.controller.playbackPaused ? "Game paused. Resume to continue this battle." : view.message || (pending ? "Confirm the army transfer below." : canExchange ? "Fight rolls one exchange." : "Choose your country, then click an enemy to attack. Shift-click or Shift-Enter selects only.");
    const result = h("div", { class: "battle-feedback visually-hidden", "aria-live": "polite", "aria-atomic": "true" },
      h("strong", { class: `battle-result${last?.captured ? " captured" : ""}` }, resultText),
      h("span", { class: "battle-tally", "aria-label": "Battle tally" }, ` · Won ${view.attackerWins} · Lost ${view.defenderWins} · Ties `, h("strong", { id: "battle-ties" }, String(view.ties))),
      h("p", { id: "battle-status" }, status));
    const rolls = h("ol", { class: "battle-rolls visually-hidden", "aria-label": "Latest exchange dice" }, ...view.rolls.map(roll => {
      const result = roll.results[0]!;
      return h("li", { "data-battle-roll": "", "data-a": roll.attackerRolls[0], "data-d": roll.defenderRolls[0], "data-result": result },
        h("span", { class: "battle-die attacker-die", role: "img", "aria-label": `Attacker rolled ${roll.attackerRolls.join(", ")}` }, roll.attackerRolls.join(" · ")),
        h("span", { class: "battle-dice-verdict" }, result === "tie" ? "Tie · rerolled" : result === "attacker" ? "Attacker wins" : "Defender wins"),
        h("span", { class: "battle-die defender-die", role: "img", "aria-label": `Defender rolled ${roll.defenderRolls.join(", ")}` }, roll.defenderRolls.join(" · ")));
    }));
    const children: HTMLElement[] = [h("h2", { class: "battle-title visually-hidden" }, "Battle"), context, controls, result];
    if (view.rolls.length) children.push(rolls);
    if (pending) children.push(this.capture(pending, captureDraft, revision));
    this.el.replaceChildren(...children);
    // Native focus survives an automatic redraw; detached controls retain their
    // old revision. Browser acceptance exercises detached attack/confirm clicks.
    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({ preventScroll: true });
  }

  /** −, the amount, + and Confirm (T97); the map's dashed counts are the preview. */
  private capture(pending: NonNullable<Snapshot["state"]["pendingCapture"]>, draft: string | undefined, revision: number): HTMLElement {
    const amount = h("input", { id: "capture-amount", type: "number", min: pending.min, max: pending.max, step: 1, value: draft ?? String(pending.defaultAmount), "aria-label": "Armies to move", "aria-describedby": "capture-help", inputmode: "numeric" });
    const choose = (value: number) => { amount.value = String(Math.max(pending.min, Math.min(pending.max, value))); };
    const current = () => Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : pending.defaultAmount;
    return h("section", { class: "capture-choice", "aria-label": "Capture move-in" },
      h("h3", { class: "visually-hidden" }, "Move armies into the capture"),
      h("div", { class: "card-icons capture-adjust" },
        iconButton("capture-less-button", "Move one fewer army", null, "minus", false, () => choose(current() - 1)),
        amount,
        iconButton("capture-more-button", "Move one more army", null, "plus", false, () => choose(current() + 1)),
        iconButton("confirm-capture-button", "Confirm move-in", null, "confirm", false, () => {
          if (!this.controller.confirmCapture(amount.valueAsNumber, revision)) amount.reportValidity();
        }, true)),
      h("p", { id: "capture-help", class: "visually-hidden" }, `Choose ${pending.min}–${pending.max} total armies. Leave at least one behind.`));
  }
}
