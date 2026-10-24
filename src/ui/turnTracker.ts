import type {GameState} from '../core';
import {legalAttacks} from '../core/rules';
import {friendlySources} from '../core/movement';
import {dominationThreshold} from '../core/victory';
import {h,s} from './dom';
import {glyph} from './icons';
import {seatLook} from './palette';
const COLOURS=['Blue','Orange','Green','Purple'];
export interface GuidanceContext {mode:'battle'|'move';cardPhase:string;paused:boolean;worldPending:boolean;cardReward:boolean;feedbackSeat?:string;feedbackKind?:string}
export function humanGuidance(state:GameState,c:GuidanceContext){
 const player=state.players[state.currentPlayer]!;
 if(c.paused)return {title:'Paused',instruction:'Resume when ready',suggested:null};
 if(c.feedbackSeat)return {title:'Turn order',instruction:'',suggested:null};
 if(c.cardReward)return {title:'Your decision',instruction:'Review card',suggested:null};
 if(c.worldPending)return {title:'World event',instruction:'Review changes',suggested:null};
 if(state.result)return {title:state.phase==='human-loss'?'Your game has ended':'Game over',instruction:state.phase==='human-loss'?'Watch computers or stop':'',suggested:null};
 if(player.kind==='computer')return {title:'Turn order',instruction:'',suggested:null};
 if(state.pendingCapture)return {title:'Your turn',instruction:'Confirm capture',suggested:null};
 if(c.cardPhase==='discard')return {title:'Your turn',instruction:'Discard a card',suggested:null};
 if(c.cardPhase==='raid-target')return {title:'Your turn',instruction:'Choose an enemy region',suggested:null};
 if(state.phase==='cards')return {title:'Your turn',instruction:'Choose or skip cards',suggested:null};
 if(state.phase==='reinforce')return {title:'Your turn',instruction:'Place armies',suggested:'place'};
 if(c.mode==='move')return {title:'Your turn',instruction:'Move armies',suggested:'move'};
 const owned=Object.values(state.ownerOf).filter(owner=>owner===player.id).length,threshold=state.rules.victoryOptions?.dominationWin?dominationThreshold(state.map.provinces.length):state.map.provinces.length;
 if(owned>=threshold)return {title:'Your turn',instruction:'End turn',suggested:'end'};
 // [designed] T115 advisory stack comparison; legal attacks are never restricted.
 const favourable=legalAttacks(state).some(a=>a.kind==='attack'&&state.armies[a.from]!>state.armies[a.to]!);
 return favourable?{title:'Your turn',instruction:'Execute attacks',suggested:'attack'}:friendlySources(state).length?{title:'Your turn',instruction:'Move armies',suggested:'move'}:{title:'Your turn',instruction:'End turn',suggested:'end'};
}
export function turnRows(state:GameState,displaySeat?:string){
 const current=displaySeat?state.players.findIndex(p=>p.id===displaySeat):state.currentPlayer;
 let next=-1;for(let n=1;n<=state.players.length;n++){const index=(current+n)%state.players.length;if(!state.players[index]!.eliminated){next=index;break;}}
 return state.players.map((p,i)=>({id:p.id,colour:COLOURS[i]??p.name,current:!state.result&&i===current,next:!state.result&&i===next,eliminated:p.eliminated,countries:Object.values(state.ownerOf).filter(owner=>owner===p.id).length,cards:state.cards?.hands[p.id]?.length??0,hasCards:Boolean(state.cards),human:p.kind!=='computer'}));
}
export class TurnTracker {
 readonly el=h('section',{id:'turn-tracker','aria-label':'Turn order','data-camera-turn-ignore':''});
 private readonly heading=h('strong',{id:'turn-guidance-title'});
 private readonly rows=h('div',{class:'turn-rows',role:'list'});
 private readonly instruction=h('div',{id:'turn-instruction'});
 private readonly resume=h('button',{id:'resume-turn-button',type:'button','aria-label':'Resume game',hidden:true},'Resume');
 private signature='';
 constructor(private readonly onResume?:()=>void){this.resume.onclick=()=>this.onResume?.();this.el.append(h('div',{class:'turn-guidance','aria-live':'polite'},this.heading,this.instruction),this.rows,this.resume);}
 render(state:GameState,context:GuidanceContext){
  const rows=turnRows(state,context.feedbackSeat),guide=humanGuidance(state,context),signature=JSON.stringify({rows,guide,kind:context.feedbackKind});
  if(signature===this.signature)return guide;this.signature=signature;
  this.resume.hidden=!context.paused||!this.onResume;
  this.heading.textContent=guide.title;this.instruction.textContent=guide.instruction;
  this.el.dataset['activeSeat']=rows.find(r=>r.current)?.id??'';this.el.dataset['guidance']=guide.instruction;
  this.rows.replaceChildren(...rows.map((r,i)=>{
   const look=seatLook(i),mark=s('svg',{class:'turn-colour-mark',viewBox:'-24 -24 48 48','aria-hidden':'true'},s('path',{d:look.badge,fill:look.color}));
   const phase=r.current&&context.feedbackKind?h('span',{class:'turn-action',title:context.feedbackKind},glyph(context.feedbackKind==='reinforce'?'plus':context.feedbackKind==='attack'?'attack':context.feedbackKind==='raidTarget'?'cards':'move')):h('span',{class:'turn-action'});
   const row=h('div',{class:'turn-row',role:'listitem','data-turn-player':r.id,'data-current':String(r.current),'data-eliminated':String(r.eliminated),'aria-label':`${r.colour}${r.human?' (you)':''}: ${r.countries} regions${r.hasCards?`, ${r.cards} cards`:''}${r.current?', current':r.next?', next':''}`},h('span',{class:'turn-pointer','aria-hidden':'true'},r.current?'➜':''),mark,h('span',{class:'turn-colour'},r.colour),h('span',{class:'turn-countries',title:'Regions'},String(r.countries)),...(r.hasCards?[h('span',{class:'turn-card-icon',title:'Cards','aria-hidden':'true'},glyph('cards')),h('span',{class:'turn-cards'},String(r.cards))]:[]),phase);
   row.style.setProperty('--seat',look.color);return row;
  }));return guide;
 }
}
