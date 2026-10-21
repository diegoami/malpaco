import {h} from './dom';
import {activePlayer} from '../core';
import type {BattleController} from './battleController';
import type {CardController} from './cardController';
const EFFECTS:Record<string,string>={Anchor:'Three add 5 armies',Compass:'Three add 8 armies',Lantern:'Three add 15 armies',Surge:'Three double turn income',Raid:'Three raid an enemy country',Wild:'Replaces up to two missing set cards',Shield:'Automatically blocks one incoming raid'};
const SYMBOLS:Record<string,string>={Anchor:'⚓',Compass:'⌖',Lantern:'◈',Surge:'↟',Raid:'➶',Wild:'✦',Shield:'⬡'};
/** No game state/hidden data is handed to the view; only the fixed-viewer projection. */
export class CardView {
 private readonly handDialog=h('dialog',{'aria-label':'Your cards'});
 readonly el=h('section',{class:'card-interactions','aria-label':'Cards'});
 constructor(private readonly cards:CardController,private readonly battle:BattleController){document.body.append(this.handDialog);}
 dispose():void{this.handDialog.close();this.handDialog.remove();}
 render():void {
  const v=this.cards.view;this.el.hidden=v.phase==='hidden';if(this.el.hidden)return;
  const button=(label:string,fn:()=>void)=>{const b=h('button',{type:'button',disabled:v.blocked},label);b.onclick=()=>{fn();this.render();};return b;};
  const counts=h('p',{class:'card-public-counts'},`Draw: ${v.drawCount} · Discard: ${v.discardCount} · Top: ${v.discardTop??'empty'}. `+Object.entries(v.handCounts).map(([p,n])=>`${p}: ${n}`).join(' · '));
  const hand=h('div',{class:'own-card-hand','aria-label':'Your hand'},h('strong',{},`Your hand: ${v.hand.length} of 5`));
  for(const [i,kind] of v.hand.entries())hand.append(h('div',{class:'own-card','data-hand-index':i},h('span',{'aria-hidden':'true'},SYMBOLS[kind]??'•'),h('strong',{},kind),h('small',{},EFFECTS[kind]??'')));
  const actions=h('div',{class:'card-choice-controls'});
  if(v.phase==='sets'){
   actions.append(h('p',{},v.sets.length?'Choose at most one set, or skip.':'No set available. Skip to placement.'));
   const setList=h('div',{class:'card-set-list'});
   for(const set of v.sets)setList.append(button(`${set.kind}: ${set.indices.map(i=>v.hand[i]).join(' + ')} — ${set.effect}`,()=>this.cards.chooseSet(set.indices,v.revision)));
   actions.append(setList);
   actions.append(button('Skip cards',()=>this.cards.skip(v.revision)));
  }
  if(v.phase==='discard'){
   actions.append(h('strong',{},'Your hand is full. Discard one card before drawing. The new card is not shown first.'));
   for(const [i,kind] of v.hand.entries())actions.append(button(`Discard ${kind} (card ${i+1})`,()=>this.cards.discard(i,v.revision)));
  }
  if(v.phase==='raid-target'){
   actions.append(h('strong',{},'Raid: choose an enemy country on the board.'),h('p',{},v.preview));
   const confirm=button('Confirm raid',()=>this.cards.confirmRaid(v.revision));confirm.disabled=v.blocked||!v.selectedTarget;actions.append(confirm);
  }
  if(v.phase==='reward')actions.append(h('strong',{class:'private-card-reward'},v.notice),button('Continue',()=>this.cards.acknowledge(v.revision)));
  else if(v.notice)actions.append(h('p',{role:'status'},v.notice));
  const choosing=['sets','raid-target','discard','reward'].includes(v.phase);this.el.dataset['choice']=String(choosing);this.el.dataset['phase']=v.phase;
  const inspect=button(`View your hand: ${v.hand.length} of 5`,()=>{
   const close=h('button',{type:'button'},'Close your hand');close.onclick=()=>this.handDialog.close();
   this.handDialog.replaceChildren(h('h2',{},'Your cards'),hand.cloneNode(true),close);this.handDialog.showModal();
  });
  this.el.replaceChildren(counts,choosing?hand:inspect,actions);
 }
}
