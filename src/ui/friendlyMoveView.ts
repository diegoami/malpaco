import {armyCount, province, friendlyTargets} from "../core";
import {h,s} from "./dom";
import {iconButton} from "./icons";
import type {BattleController, BattleView} from "./battleController";

/**
 * Only the confirmed action enters history; bound shortcuts and +/− edit the draft.
 */
export class FriendlyMoveView {
  readonly el = h("section", {class:"battle-controls friendly-move-controls", role:"region", "aria-label":"Friendly move"});
  private draftKey: string | null = null;
  constructor(private readonly controller: BattleController, private readonly player=false) {}

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
    const direction = this.player && from && to ? [h('div',{id:'friendly-move-direction'},
      h('div',{},h('span',{class:'move-direction-label'},'From'),h('strong',{id:'friendly-move-from'},`${province(state.map,from)!.name} · ${armyCount(state,from)}`)),
      h('span',{class:'move-direction-arrow','aria-hidden':'true'},'→'),
      h('div',{},h('span',{class:'move-direction-label'},'To'),h('strong',{id:'friendly-move-to'},`${province(state.map,to)!.name} · ${armyCount(state,to)}`)),
      iconButton('swap-friendly-move-button','Swap move direction',null,'move',!friendlyTargets(state,to).includes(from),()=>this.controller.select(to,from,revision)),
    )] : [];
    this.el.append(
      ...direction,
      h("h2", {class:"battle-title visually-hidden"}, "Friendly move"),
      h("p", {class:"visually-hidden battle-context"}, from ? `${name(from)}${to ? ` → ${name(to)}` : ""}` : "Marked countries can supply armies."),
      h("div", {class:"card-icons capture-adjust",hidden:!selected},
        h('div', {class:'amount-adjust'},
        limit('min',1),
        iconButton("friendly-move-less-button", "Move one fewer army", null, "minus", !selected, () => choose(current() - 1)),
        amount,
        iconButton("friendly-move-more-button", "Move one more army", null, "plus", !selected, () => choose(current() + 1)),
        limit('max',maximum)),
        iconButton("confirm-friendly-move-button", "Move and end turn", null, "confirm", !selected, () => {
          if (from && to && !this.controller.dispatch({kind:"friendlyMove", from, to, amount:amount.valueAsNumber}, revision)) amount.reportValidity();
        }, true)),
      h('div', {class:'transfer-cancel'}, iconButton("cancel-friendly-move-button", "Cancel · back to attacks", null, "close", false, () => { this.controller.cancelFriendlyMove(revision); })),
      h("p", {id:"friendly-move-help", class:"visually-hidden"}, from ? `Move 1–${maximum} armies. Leave at least one behind. This ends your turn.` : "Marked countries can supply armies. Choose one, then an owned neighbour."),
    );
    // Before a pair is chosen only Cancel shows; the disabled amount controls wait hidden.
    for (const button of this.el.querySelectorAll<HTMLButtonElement>("button:disabled")) if(button.id!=="swap-friendly-move-button")button.hidden = true;
    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({preventScroll:true});
  }
  paintMap(svg:SVGSVGElement,from:string|null,to:string|null,shown:boolean):void {
    if(!this.player)return;
    svg.querySelector('.friendly-move-preview')?.remove();
    for(const node of svg.querySelectorAll('[data-move-role]'))node.removeAttribute('data-move-role');
    if(!shown||!from||!to)return;
    const country=(id:string)=>svg.querySelector<SVGElement>(`[data-country="${CSS.escape(id)}"]`);
    const point=(id:string)=>{const n=country(id)?.querySelector('.count');return n?{x:Number(n.getAttribute('x')),y:Number(n.getAttribute('y'))-5}:null;};
    const a=point(from),b=point(to);if(!a||!b)return;
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)return;
    const trim=Math.min(32,length/3),ux=dx/length,uy=dy/length;
    const layer=s('g',{class:'friendly-move-preview','data-from':from,'data-to':to,'aria-hidden':'true'},
      s('defs',{},s('marker',{id:'friendly-move-arrowhead',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:4,markerHeight:4,orient:'auto'},s('path',{d:'M0 0L10 5L0 10Z'}))),
      s('path',{d:`M${a.x+ux*trim} ${a.y+uy*trim}L${b.x-ux*trim} ${b.y-uy*trim}`,'marker-end':'url(#friendly-move-arrowhead)'}));
    (svg.querySelector('.map-camera-content')??svg).append(layer);
    country(from)?.setAttribute('data-move-role','from');country(to)?.setAttribute('data-move-role','to');
  }

}
