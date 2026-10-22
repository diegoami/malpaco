import {h} from './dom';
import type {BattleController} from './battleController';
import type {CardController} from './cardController';
/**
 * No game state/hidden data is handed to the view; only the fixed-viewer projection. T97 (owner,
 * #244): only the choice's controls show — a button per legal set (its kind; the cards and
 * effect are its accessible name) and Skip, a button per card to
 * discard, Continue after a reward, and Confirm for a Raid. Your hand and the public counts stay
 * for assistive technology alone.
 */
export class CardView {
 readonly el=h('section',{class:'card-interactions','aria-label':'Cards'});
 constructor(private readonly cards:CardController,_battle:BattleController){}
 dispose():void{}
 render():void {
  const v=this.cards.view;this.el.hidden=v.phase==='hidden';if(this.el.hidden)return;
  const button=(label:string,fn:()=>void,name?:string)=>{const b=h('button',{type:'button',disabled:v.blocked,...(name?{'aria-label':name}:{})},label);b.onclick=()=>{fn();this.render();};return b;};
  const counts=h('p',{class:'card-public-counts visually-hidden'},`Draw: ${v.drawCount} · Discard: ${v.discardCount} · Top: ${v.discardTop??'empty'}. `+Object.entries(v.handCounts).map(([p,n])=>`${p}: ${n}`).join(' · '));
  const hand=h('ul',{class:'own-card-hand visually-hidden','aria-label':'Your hand'},h('li',{},`Your hand: ${v.hand.length} of 5`),...v.hand.map((kind,i)=>h('li',{'data-hand-index':i},h('strong',{},kind))));
  const actions=h('div',{class:'card-choice-controls'});
  if(v.phase==='sets'){
   for(const set of v.sets)actions.append(button(set.kind,()=>this.cards.chooseSet(set.indices,v.revision),`${set.kind}: ${set.indices.map(i=>v.hand[i]).join(' + ')} — ${set.effect}`));
   actions.append(button('Skip',()=>this.cards.skip(v.revision),'Skip cards'));
  }
  if(v.phase==='discard')for(const [i,kind] of v.hand.entries())actions.append(button(kind,()=>this.cards.discard(i,v.revision),`Discard ${kind} (card ${i+1})`));
  if(v.phase==='raid-target'){
   const confirm=button('Confirm',()=>this.cards.confirmRaid(v.revision),'Confirm raid');confirm.disabled=v.blocked||!v.selectedTarget;confirm.hidden=!v.selectedTarget;actions.append(confirm);
   actions.append(h('p',{class:'visually-hidden'},v.preview));
  }
  if(v.phase==='reward')actions.append(h('p',{class:'private-card-reward'},v.notice),button('Continue',()=>this.cards.acknowledge(v.revision)));
  else if(v.notice)actions.append(h('p',{role:'status',class:'visually-hidden'},v.notice));
  const choosing=['sets','raid-target','discard','reward'].includes(v.phase);this.el.dataset['choice']=String(choosing);this.el.dataset['phase']=v.phase;
  this.el.replaceChildren(counts,hand,actions);
 }
}
