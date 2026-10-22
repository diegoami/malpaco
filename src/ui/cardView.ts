import {h} from './dom';
import type {BattleController} from './battleController';
import type {CardController} from './cardController';
import {glyph} from './icons';
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
  const hand=!this.cards.seated?null:h('ul',{class:'own-card-hand visually-hidden','aria-label':'Your hand'},h('li',{},`Your hand: ${v.hand.length} of 5`),...v.hand.map((kind,i)=>h('li',{'data-hand-index':i},h('strong',{},kind))));
  const actions=h('div',{class:'card-choice-controls'});
  // The instructions stay for assistive technology; the screen shows only the buttons.
  const say=(text:string)=>actions.append(h('p',{class:'visually-hidden'},text));
  if(v.phase==='sets'){
   say(v.sets.length?'Choose at most one set, or skip.':'No set available. Skip to placement.');
   // Two sets of the same cards are one choice to the player: one button each, named by its Wilds.
   const offered=new Set<string>();
   for(const set of v.sets){
    const cards=set.indices.map(i=>v.hand[i]!),key=[...cards].sort().join('+');if(offered.has(key))continue;offered.add(key);
    const wild=cards.filter(kind=>kind==='Wild').length;
    actions.append(button(wild?`${set.kind} + ${wild>1?`${wild} `:''}Wild`:set.kind,()=>this.cards.chooseSet(set.indices,v.revision),`${set.kind}: ${cards.join(' + ')} — ${set.effect}`));
   }
   actions.append(button('Skip',()=>this.cards.skip(v.revision),'Skip cards'));
  }
  if(v.phase==='discard')say('Your hand is full. Discard one card before drawing. The new card is not shown first.');
  if(v.phase==='discard')for(const [i,kind] of v.hand.entries())actions.append(button(kind,()=>this.cards.discard(i,v.revision),`Discard ${kind} (card ${i+1})`));
  if(v.phase==='raid-target'){
   say('Raid: choose an enemy country on the board.');
   const confirm=button('Confirm',()=>this.cards.confirmRaid(v.revision),'Confirm raid');confirm.disabled=v.blocked||!v.selectedTarget;actions.append(confirm);
   actions.append(h('p',{class:'visually-hidden'},v.preview));
  }
  if(v.phase==='reward'){
   // T104 (owner): after the draw, your whole hand, the card just drawn marked (the last of its kind).
   const drawn=/^You drew (\w+)\./.exec(v.notice??'')?.[1],at=drawn?v.hand.lastIndexOf(drawn as typeof v.hand[number]):-1;
   const list=this.cards.seated&&v.hand.length?h('ol',{id:'reward-hand',class:'hand-list','aria-label':'Your cards'},...v.hand.map((kind,i)=>h('li',{'data-hand-index':i,...(i===at?{'data-new':'true'}:{})},kind,...(i===at?[h('span',{class:'hand-new'},' · new')]:[])))):null;
   actions.append(h('p',{class:'private-card-reward'},v.notice),...(list?[list]:[]),button('Continue',()=>this.cards.acknowledge(v.revision)));
  }
  else if(v.notice)actions.append(h('p',{role:'status',class:'visually-hidden'},v.notice));
  const choosing=['sets','raid-target','discard','reward'].includes(v.phase);this.el.dataset['choice']=String(choosing);this.el.dataset['phase']=v.phase;
  this.el.replaceChildren(counts,...(hand?[hand]:[]),actions);
 }
}

/**
 * T104 (owner, 2026-10-22): your hand on request. A corner button carries the number of cards you
 * hold and opens the list, in hand order; at the start of your turn a playable set is played from
 * it as from the sets card. Only the viewer's own projection is read, never another seat's hand.
 */
export class HandDialog {
 readonly button=h('button',{id:'open-hand',type:'button',class:'game-icon hand-button','aria-haspopup':'dialog',hidden:true});
 readonly dialog=h('dialog',{id:'hand-dialog',class:'game-help hand-dialog','aria-labelledby':'hand-title'});
 private readonly close=h('button',{type:'button',id:'close-hand',class:'card-icon','aria-label':'Close your cards',title:'Close'},glyph('close'));
 private readonly body=h('div',{class:'hand-body'});
 constructor(private readonly cards:CardController,onOpen?:()=>void){
  this.close.onclick=()=>this.dialog.close();
  this.dialog.append(h('header',{class:'game-help-head'},h('h2',{id:'hand-title'},'Your cards'),this.close),this.body);
  // Not modal: the button stays live, so a second tap closes the list; Escape closes it too.
  this.button.onclick=()=>{if(this.dialog.open){this.dialog.close();return;}onOpen?.();this.render();this.dialog.show();this.close.focus();};
  this.dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.dialog.close();}});
  this.dialog.addEventListener('close',()=>{this.button.setAttribute('aria-expanded','false');if(this.button.isConnected&&!this.button.hidden)this.button.focus({preventScroll:true});});
 }
 /** Shows the count on the button; hidden while you hold no card. Re-renders an open list. */
 update():void{
  const v=this.cards.view,n=this.cards.seated&&v.phase!=='hidden'?v.hand.length:0;
  this.button.hidden=n===0;
  const name=`Your cards: ${n}`;this.button.setAttribute('aria-label',name);this.button.title=name;this.button.setAttribute('aria-expanded',String(this.dialog.open));
  this.button.replaceChildren(glyph('cards'),h('span',{class:'hand-count','aria-hidden':'true'},String(n)));
  if(this.dialog.open){if(n===0)this.dialog.close();else this.render();}
 }
 private render():void{
  const v=this.cards.view;
  const list=h('ol',{id:'hand-list',class:'hand-list'},...v.hand.map((kind,i)=>h('li',{'data-hand-index':i},kind)));
  const offered=new Set<string>(),plays=h('div',{class:'hand-plays'});
  if(v.phase==='sets')for(const set of v.sets){
   const cards=set.indices.map(i=>v.hand[i]!),key=[...cards].sort().join('+');if(offered.has(key))continue;offered.add(key);
   const play=h('button',{type:'button',class:'primary','data-set':set.kind,disabled:v.blocked,'aria-label':`Play ${set.kind}: ${cards.join(' + ')} — ${set.effect}`},`Play ${set.kind}`);
   play.onclick=()=>{if(this.cards.chooseSet(set.indices,v.revision))this.dialog.close();};plays.append(play);
  }
  const note=h('p',{class:'card-note'},v.phase==='sets'?(plays.childElementCount?'Play a set now, or close this and place your armies.':'No set to play now.'):'Three cards that make a set are played at the start of your turn.');
  this.body.replaceChildren(list,note,...(plays.childElementCount?[plays]:[]));
 }
 dispose():void{if(this.dialog.open)this.dialog.close();this.dialog.remove();}
}
