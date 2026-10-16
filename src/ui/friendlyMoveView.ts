import {armyCount, province} from "../core";
import {h} from "./dom";
import type {BattleController, BattleView} from "./battleController";

/** Only the confirmed action enters history; every control captures its revision. */
export class FriendlyMoveView {
  readonly el = h("section", {class:"battle-controls friendly-move-controls", role:"region", "aria-label":"Friendly move"});
  constructor(private readonly controller: BattleController) {}

  render(view: BattleView): void {
    this.el.hidden = view.mode !== "move";
    this.el.replaceChildren();
    if (view.mode !== "move") return;
    const {state, from, to, revision} = view;
    const selected = from !== null && to !== null;
    const maximum = from ? armyCount(state, from) - 1 : 1;
    const amount = h("input", {id:"friendly-move-amount", type:"number", min:1, max:maximum, step:1, value:String(maximum), disabled:!selected, "aria-describedby":"friendly-move-help"});
    const button = (id: string, label: string, disabled: boolean, action: () => void, primary = false) => {
      const b = h("button", {id, type:"button", disabled, class:primary ? "primary" : ""}, label);
      b.addEventListener("click", action);
      return b;
    };
    const choose = (n: number) => { amount.value = String(Math.max(1, Math.min(maximum, n))); };
    const current = () => Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : maximum;
    const context = (label: string, id: string | null) => h("div", {class:"battle-country"},
      h("span", {class:"battle-label"}, label),
      h("strong", {}, id ? province(state.map, id)!.name : label === "From" ? "Choose a marked country" : "Choose an owned neighbour"),
      h("span", {class:"battle-count"}, id ? String(armyCount(state, id)) : "—"));
    this.el.append(
      h("h2", {class:"battle-title"}, "Friendly move"),
      h("div", {class:"battle-context"}, context("From", from), context("To", to)),
      h("p", {id:"friendly-move-help", class:"battle-help"}, from ? `Move 1–${maximum} armies. Leave at least one behind. This ends your turn.` : "Marked countries can supply armies. Choose one, then an owned neighbour."),
      h("label", {for:"friendly-move-amount", class:"friendly-quantity"}, "Armies to move", amount),
      h("div", {class:"capture-adjust"},
        button("friendly-move-minimum-button", "Minimum", !selected, () => choose(1)),
        button("friendly-move-less-button", "−", !selected, () => choose(current() - 1)),
        button("friendly-move-more-button", "+", !selected, () => choose(current() + 1)),
        button("friendly-move-maximum-button", "Maximum", !selected, () => choose(maximum))),
      button("confirm-friendly-move-button", "Move and end turn", !selected, () => {
        if (from && to && !this.controller.dispatch({kind:"friendlyMove", from, to, amount:amount.valueAsNumber}, revision)) amount.reportValidity();
      }, true),
      h("div", {class:"friendly-draft-actions"},
        button("cancel-friendly-move-button", "Cancel · back to attacks", false, () => { this.controller.cancelFriendlyMove(revision); }),
        button("skip-friendly-move-button", "Skip move · end turn", false, () => { this.controller.dispatch({kind:"endTurn"}, revision); })),
    );
    this.el.querySelector("#friendly-move-less-button")!.setAttribute("aria-label", "Move one fewer army");
    this.el.querySelector("#friendly-move-more-button")!.setAttribute("aria-label", "Move one more army");
  }
}
