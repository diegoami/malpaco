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
    const range = h("input", {id:"friendly-move-range", type:"range", min:1, max:maximum, step:1, value:amount.value, disabled:!selected, "aria-label":"Armies to move, slider"});
    const preview = h("p", {id:"friendly-move-preview", class:"card-line", "aria-live":"polite"});
    const show = () => {
      if (!from || !to) { preview.textContent = from ? "Choose an own neighbour" : "Choose a country to move from"; return; }
      const n = Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : NaN;
      preview.textContent = Number.isNaN(n) ? "Preview · enter an amount" : `Preview · ${armyCount(state, from) - n} stay / ${armyCount(state, to) + n} arrive`;
      if (!Number.isNaN(n)) range.value = String(Math.max(1, Math.min(maximum, n)));
    };
    const choose = (n: number) => { amount.value = String(Math.max(1, Math.min(maximum, n))); show(); };
    const current = () => Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : maximum;
    amount.addEventListener("input", show);
    range.addEventListener("input", () => choose(range.valueAsNumber));
    show();
    const bound = (id: string, name: string, value: number) => {
      const b = h("button", {id, type:"button", class:"card-bound", disabled:!selected, "aria-label":name, title:name}, String(value));
      b.addEventListener("click", () => choose(value));
      return b;
    };
    const name = (id: string | null) => id ? `${province(state.map, id)!.name} ${armyCount(state, id)}` : "";
    this.el.append(
      h("h2", {class:"battle-title visually-hidden"}, "Friendly move"),
      preview,
      h("p", {class:"card-note battle-context"}, from ? `${name(from)}${to ? ` → ${name(to)}` : ""}` : "Marked countries can supply armies."),
      h("div", {class:"card-icons capture-adjust"},
        iconButton("friendly-move-less-button", "Move one fewer army", null, "minus", !selected, () => choose(current() - 1)),
        amount,
        iconButton("friendly-move-more-button", "Move one more army", null, "plus", !selected, () => choose(current() + 1)),
        iconButton("confirm-friendly-move-button", "Move and end turn", null, "confirm", !selected, () => {
          if (from && to && !this.controller.dispatch({kind:"friendlyMove", from, to, amount:amount.valueAsNumber}, revision)) amount.reportValidity();
        }, true),
        iconButton("cancel-friendly-move-button", "Cancel · back to attacks", null, "close", false, () => { this.controller.cancelFriendlyMove(revision); })),
      h("p", {id:"friendly-move-help", class:"card-note"}, selected ? `Move & end turn · range 1–${maximum}` : "Then choose an own neighbour",
        h("span", {class:"visually-hidden"}, from ? `. Move 1–${maximum} armies. Leave at least one behind. This ends your turn.` : ". Marked countries can supply armies. Choose one, then an owned neighbour.")),
      h("div", {class:"card-range"}, bound("friendly-move-minimum-button", "Minimum", 1), range, bound("friendly-move-maximum-button", "Maximum", maximum)),
      h("button", {id:"skip-friendly-move-button", type:"button", class:"card-text-button"}, "Skip move · end turn"),
    );
    this.el.querySelector<HTMLButtonElement>("#skip-friendly-move-button")!.addEventListener("click", () => { this.controller.dispatch({kind:"endTurn"}, revision); });
    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({preventScroll:true});
  }
}
