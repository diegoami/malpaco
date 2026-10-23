import {activePlayer,cardView,classifyCardSet} from '../core';
import type {CardKind,GameState,Action,TradeableCardKind} from '../core';
import type {BattleController} from './battleController';
import {seatName} from './palette';
export interface OfferedSet {readonly indices:readonly [number,number,number];readonly kind:TradeableCardKind;readonly effect:string}
export interface CardControllerView {
 readonly revision:number;readonly phase:'hidden'|'hand'|'sets'|'raid-target'|'discard'|'reward';readonly hand:readonly CardKind[];
 readonly handCounts:Readonly<Record<string,number>>;readonly drawCount:number;readonly discardCount:number;readonly discardTop:CardKind|null;
 readonly sets:readonly OfferedSet[];readonly selectedTarget:string|null;readonly preview:string;readonly notice:string;readonly blocked:boolean;
}
/** Public action consequences only. An ordinary draw's kind is deliberately absent. */
export function publicCardNotes(before:GameState,after:GameState,action:Action):string[] {
 if(!before.cards||!after.cards)return [];
 const p=activePlayer(before)!.id,name=seatName(before.players,p),you=name==='You',notes:string[]=[];
 const countryName=(id:string)=>after.map.provinces.find(country=>country.id===id)?.name??id;
 if(action.kind==='tradeCards')notes.push(`${name} ${you?'trade':'trades'} ${action.handIndices.map(i=>before.cards!.hands[p]![i]).join(', ')}. Pool ${before.reinforcementPool} → ${after.reinforcementPool}.`);
 if(action.kind==='discardCard')notes.push(`${name} ${you?'discard':'discards'} ${before.cards.hands[p]![action.handIndex]}.`);
 const drew=before.capturedThisTurn && !after.cards.pendingDiscard && ['endTurn','friendlyMove','discardCard'].includes(action.kind);
 if(drew){
  const squall=after.cards.discardPile.at(-1)==='Squall'&&after.cards.hands[p]!.length===0;
  if(squall){const lost=before.cards.hands[p]!.filter((_,i)=>action.kind!=='discardCard'||i!==action.handIndex);notes.push(`Squall: ${name} ${you?'lose':'loses'} ${lost.length} cards${lost.length?`: ${lost.join(', ')}`:''}.`);}
  else notes.push(`${name} ${you?'draw':'draws'} a card. Hand count: ${after.cards.hands[p]!.length}.`);
 }
 for(const e of after.log.slice(before.log.length))if(e.event==='raid')notes.push(e.shielded?`Shield blocks the raid on ${countryName(e.province)}. Stack stays ${e.after}.`:`Raid on ${countryName(e.province)}: ${e.before} → ${e.after} (lost ${e.before-e.after}).`);
 return notes;
}
/** Disposable T40 proposal: fixed viewer, real BattleController/apply, no policy or RNG. */
export class CardController {
 private generation:number;
 private previous:GameState;private target:string|null=null;private reward:string|null=null;private notice='';private disposed=false;
 constructor(private readonly battle:BattleController,private readonly viewer:string){this.previous=battle.state;this.generation=battle.gameGeneration;}
 /** A spectator (no human seat) has no hand to show. */
 get seated():boolean {return this.viewer!=='';}
 get view():CardControllerView {
  const s=this.battle.state,c=s.cards,own=activePlayer(s)?.id===this.viewer,projection=cardView(s,this.viewer);
  const phase=!c?'hidden':this.reward?'reward':!own?'hand':c.pendingDiscard?'discard':c.pendingRaid?'raid-target':s.phase==='cards'?'sets':'hand';
  const sets:OfferedSet[]=[];const h=projection.hand;
  if(phase==='sets')for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++){
   const kind=classifyCardSet([h[i]!,h[j]!,h[k]!]);if(!kind)continue;
   if(kind==='Raid'&&s.rules.cards!=='raid-v1')continue;
   const effect=kind==='Surge'?`Double pool: ${s.reinforcementPool} → ${s.reinforcementPool*2}`:kind==='Raid'?'Raid any enemy country':`Add ${{Anchor:5,Compass:8,Lantern:15}[kind]} armies`;
   sets.push({indices:[i,j,k],kind,effect});
  }
  const armies=this.target?s.armies[this.target]:undefined;
  return {revision:this.battle.view.revision,phase,hand:projection.hand,handCounts:projection.handCounts,drawCount:projection.drawCount,discardCount:projection.discardCount,discardTop:c?.discardPile.at(-1)??null,sets,selectedTarget:this.target,preview:armies===undefined?'Choose any enemy country.':`${s.map.provinces.find(country=>country.id===this.target)?.name??this.target}: ${armies} → 1 to ${Math.max(1,Math.floor(armies/2))}. A Shield may block the raid.`,notice:this.reward??this.notice,blocked:this.battle.playbackPaused||this.battle.worldEventAcknowledgmentPending||this.battle.computerFeedbackPending||this.disposed};
 }
 update():void {
  if(this.generation!==this.battle.gameGeneration){this.generation=this.battle.gameGeneration;this.reset();this.passNoSet();return;}
  const after=this.battle.state,before=this.previous;if(after===before){this.passNoSet();return;}this.previous=after;this.target=null;
  const action=after.history.at(-1),continued=after.history.length===before.history.length+1&&before.history.every((a,i)=>JSON.stringify(a)===JSON.stringify(after.history[i]));
  if(!continued){this.reward=null;this.notice='';this.battle.setCardRewardPending(false);this.passNoSet();return;}
  if(!action)return;
  this.notice=publicCardNotes(before,after,action).join(' ');
  const p=activePlayer(before)!.id;
  if(p===this.viewer&&before.capturedThisTurn&&after.cards&&!after.cards.pendingDiscard&&['endTurn','friendlyMove','discardCard'].includes(action.kind)){
   const squall=after.cards.discardPile.at(-1)==='Squall'&&after.cards.hands[p]!.length===0;
   if(squall)this.reward=this.notice;
   else {
    const prior=[...(before.cards?.hands[this.viewer]??[])];if(action.kind==='discardCard')prior.splice(action.handIndex,1);
    const now=[...after.cards.hands[this.viewer]!];for(const kind of prior){const i=now.indexOf(kind);if(i>=0)now.splice(i,1);}
    this.reward=now.length===1?`You drew ${now[0]}. ${after.cards.hands[this.viewer]!.length} of 5 cards.`:'Card drawn.';
   }
   this.battle.setCardRewardPending(true);
  }
  this.passNoSet();
 }
 /** Approved UI inventory ui-206: pass a human no-set phase once as an ordinary action. */
 private passNoSet():void {
  const view=this.view;
  if(view.phase==='sets'&&!view.sets.length&&!view.blocked&&!this.reward&&activePlayer(this.battle.state)?.id===this.viewer&&activePlayer(this.battle.state)?.kind!=='computer'){
   if(this.skip(view.revision))this.notice='No set available. Cards phase passed.';
  }
 }
 private accepts(revision:number):boolean {return !this.disposed&&!this.reward&&!this.battle.playbackPaused&&this.battle.view.revision===revision&&activePlayer(this.battle.state)?.id===this.viewer&&activePlayer(this.battle.state)?.kind!=='computer';}
 private send(action:Action,revision:number):boolean {if(!this.accepts(revision))return false;return this.battle.dispatch(action,revision);}
 chooseSet(indices:readonly [number,number,number],revision:number):boolean {return this.send({kind:'tradeCards',handIndices:indices},revision);}
 skip(revision:number):boolean {return this.send({kind:'skipCards'},revision);}
 discard(index:number,revision:number):boolean {return this.send({kind:'discardCard',handIndex:index},revision);}
 selectRaidTarget(province:string,revision:number):boolean {
  const s=this.battle.state;if(!this.accepts(revision)||!s.cards?.pendingRaid||!s.map.provinces.some(p=>p.id===province)||s.ownerOf[province]===this.viewer)return false;
  this.target=province;return true;
 }
 confirmRaid(revision:number):boolean {return this.target!==null&&this.send({kind:'raidTarget',province:this.target},revision);}
 acknowledge(revision:number):boolean {
  if(this.disposed||!this.reward||this.battle.playbackPaused||revision!==this.battle.view.revision)return false;
  this.reward=null;this.notice='';this.battle.setCardRewardPending(false);return true;
 }
 reset():void {this.previous=this.battle.state;this.target=null;this.reward=null;this.notice='';this.battle.setCardRewardPending(false);}
 dispose():void {this.reset();this.disposed=true;}
}
