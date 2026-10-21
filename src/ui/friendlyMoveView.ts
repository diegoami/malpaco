import {armyCount, province} from "../core";
import {h} from "./dom";
import {iconButton} from "./icons";
import type {BattleController, BattleView} from "./battleController";

/** Only the confirmed action enters history; every control captures its revision. One line plus icons (T92). */
export class FriendlyMoveView {
  readonly el = h("section", {class:"battle-controls friendly-move-controls", role:"region", "aria-label":"Friendly move"});
  private draftKey: string | null = null;
  constructor(private readonly controller: BattleController) {}

  render(view: BattleView): void {
    const draftKey = view.mode === "move" ? `${view.state.history.length}:${view.from}:${view.to}` : null;
    const draft = draftKey === this.draftKey ? this.el.querySelector<HTMLInputElement>("#friendly-move-amount")?.value : undefined;
    const focused = this.el.contains(document.activeElement) ? document.activeElement?.id : undefined;
    this.draftKey = draftKey;
    this.el.hidden = view.mode !== "move";
    this.el.replaceChildren();
    if (view.mode !== "move") return;
    const {state, from, to, revision} = view;
    const selected = from !== null && to !== null;
    const maximum = from ? armyCount(state, from) - 1 : 1;
    const amount = h("input", {id:"friendly-move-amount", type:"number", min:1, max:maximum, step:1, value:draft ?? String(maximum), disabled:!selected, "aria-label":"Armies to move", "aria-describedby":"friendly-move-help", inputmode:"numeric"});
    const preview = h("p", {id:"friendly-move-preview", class:"card-line", "aria-live":"polite"});
    const show = () => {
      if (!from || !to) { preview.textContent = from ? "Choose an own neighbour" : "Choose a country to move from"; return; }
      const n = Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : NaN;
      preview.textContent = Number.isNaN(n) ? "Preview · enter an amount" : `Preview · ${armyCount(state, from) - n} stay / ${armyCount(state, to) + n} arrive`;
    };
    const choose = (n: number) => { amount.value = String(Math.max(1, Math.min(maximum, n))); show(); };
    const current = () => Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : maximum;
    amount.addEventListener("input", show);
    show();
    const name = (id: string | null) => id ? `${province(state.map, id)!.name} ${armyCount(state, id)}` : "";
    this.el.append(
      h("h2", {class:"battle-title visually-hidden"}, "Friendly move"),
      preview,
      h("p", {class:"visually-hidden battle-context"}, from ? `${name(from)}${to ? ` → ${name(to)}` : ""}` : "Marked countries can supply armies."),
      h("div", {class:"card-icons capture-adjust"},
        iconButton("friendly-move-less-button", "Move one fewer army", null, "minus", !selected, () => choose(current() - 1)),
        amount,
        iconButton("friendly-move-more-button", "Move one more army", null, "plus", !selected, () => choose(current() + 1)),
        iconButton("confirm-friendly-move-button", "Move and end turn", "Move & end turn", "confirm", !selected, () => {
          if (from && to && !this.controller.dispatch({kind:"friendlyMove", from, to, amount:amount.valueAsNumber}, revision)) amount.reportValidity();
        }, true),
        iconButton("cancel-friendly-move-button", "Cancel · back to attacks", null, "close", false, () => { this.controller.cancelFriendlyMove(revision); })),
      h("p", {id:"friendly-move-help", class:"card-note"}, selected ? `Tap amount to type · range 1–${maximum}` : "Then choose an own neighbour",
        h("span", {class:"visually-hidden"}, from ? `. Move 1–${maximum} armies. Leave at least one behind. This ends your turn.` : ". Marked countries can supply armies. Choose one, then an owned neighbour.")),
    );
    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({preventScroll:true});
  }
}
