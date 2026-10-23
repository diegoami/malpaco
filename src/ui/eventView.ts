import {h} from './dom';
import {glyph} from './icons';
import type {GameState} from '../core';
import type {WorldEventController} from './eventController';
import {seatName} from './palette';
const titles={storm:'Storm',revolt:'Revolt',shift:'Production centres moved',harvest:'Production harvest'};
export class WorldEventView {
 readonly el=h('section',{id:'world-event-card',class:'world-event-card','aria-label':'World event',hidden:true});
 private key='';
 constructor(private readonly controller:WorldEventController,private readonly changed:()=>void){}
 render(state:GameState):void {
  const view=this.controller.view,event=view.event,key=`${event?.sequence??0}/${view.folded}/${view.requiresAck}`;
  this.el.hidden=!event;if(!event||key===this.key)return;this.key=key;
  if(view.folded){const open=h('button',{id:'open-world-event',type:'button'},titles[event.kind]);open.onclick=()=>{this.controller.unfold();this.changed();};this.el.replaceChildren(open);this.el.dataset['folded']='true';if(view.requiresAck&&!document.querySelector('dialog[open]'))open.focus({preventScroll:true});return;}
  this.el.dataset['folded']='false';
  const fold=h('button',{id:'fold-world-event',class:'card-icon',type:'button','aria-label':'Close event and continue',title:'Close and continue'},glyph('fold'));fold.onclick=()=>{if(this.controller.dismiss(event.sequence))this.changed();};
  const heading=h('h2',{id:'world-event-title','aria-live':'polite'},titles[event.kind]);
  const rows=h('ul',{class:'world-event-changes'});
  for(const change of event.changes){
   const name=state.map.provinces.find(p=>p.id===change.id)?.name??change.id;
   const text=event.kind==='shift'?(change.centreBefore&&change.centreAfter?'Centre retained':change.centreAfter?'New centre':'Centre moved away'):change.ownerBefore!==change.ownerAfter?`${seatName(state.players,change.ownerBefore)} → ${seatName(state.players,change.ownerAfter)}; ${change.armiesAfter} armies`:`${change.armiesBefore} → ${change.armiesAfter} armies`;
   rows.append(h('li',{'data-event-country':change.id},h('strong',{},name),h('span',{},text)));
  }
  const proceed=h('button',{id:'acknowledge-world-event',type:'button',class:'primary'},'Continue');proceed.hidden=!view.requiresAck;proceed.onclick=()=>{if(this.controller.acknowledge(event.sequence)){this.changed();document.querySelector<HTMLButtonElement>('#game-pause-button')?.focus({preventScroll:true});}};
  this.el.replaceChildren(h('header',{},heading,fold),h('p',{class:'world-event-context'},`Round ${event.round} · after ${seatName(state.players,event.afterSeat)}`),rows,...(!event.changes.length?[h('p',{},'No eligible country; no change.')]:[]),proceed);
  if(view.requiresAck&&!document.querySelector('dialog[open]'))fold.focus({preventScroll:true});
 }
 dispose():void {this.el.remove();}
}
