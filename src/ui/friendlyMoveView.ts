import {armyCount, province} from "../core";
import {h} from "./dom";
import {iconButton} from "./icons";
import type {BattleController, BattleView} from "./battleController";

/**
 * Only the confirmed action enters history; bound shortcuts and +/− edit the draft.
 */
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
    const amount = h("input", {id:"friendly-move-amount", type:"number", min:1, max:maximum, step:1, value:draft ?? String(maximum), disabled:!selected, hidden:!selected, "aria-label":"Armies to move", "aria-describedby":"friendly-move-help", inputmode:"numeric"});
    const choose = (n: number) => { amount.value = String(Math.max(1, Math.min(maximum, n))); };
    const current = () => Number.isSafeInteger(amount.valueAsNumber) ? amount.valueAsNumber : maximum;
    const limit = (which:'min'|'max',value:number) => {
      const button=h('button',{id:`friendly-move-${which}-button`,type:'button',class:'amount-limit',disabled:!selected,'aria-label':which==='min'?'Minimum armies':'Maximum armies'},which==='min'?'Min':'Max');
      button.onclick=()=>{if(!button.disabled)choose(value);};return button;
    };
    const name = (id: string | null) => id ? `${province(state.map, id)!.name} ${armyCount(state, id)}` : "";
    this.el.append(
      h("h2", {class:"battle-title visually-hidden"}, "Friendly move"),
      h("p", {class:"visually-hidden battle-context"}, from ? `${name(from)}${to ? ` → ${name(to)}` : ""}` : "Marked countries can supply armies."),
      h("div", {class:"card-icons capture-adjust"},
        limit('min',1),
        iconButton("friendly-move-less-button", "Move one fewer army", null, "minus", !selected, () => choose(current() - 1)),
        amount,
        iconButton("friendly-move-more-button", "Move one more army", null, "plus", !selected, () => choose(current() + 1)),
        limit('max',maximum),
        iconButton("confirm-friendly-move-button", "Move and end turn", null, "confirm", !selected, () => {
          if (from && to && !this.controller.dispatch({kind:"friendlyMove", from, to, amount:amount.valueAsNumber}, revision)) amount.reportValidity();
        }, true),
        iconButton("cancel-friendly-move-button", "Cancel · back to attacks", null, "close", false, () => { this.controller.cancelFriendlyMove(revision); })),
      h("p", {id:"friendly-move-help", class:"visually-hidden"}, from ? `Move 1–${maximum} armies. Leave at least one behind. This ends your turn.` : "Marked countries can supply armies. Choose one, then an owned neighbour."),
    );
    // Before a pair is chosen only Cancel shows; the disabled amount controls wait hidden.
    for (const button of this.el.querySelectorAll<HTMLButtonElement>("button:disabled")) button.hidden = true;
    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({preventScroll:true});
  }
}
