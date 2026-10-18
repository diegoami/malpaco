// DISPOSABLE feasibility adapter. Not a production engine or codec.
// All constants: approved designed T23 inventory variety-009..028,040; ae298e37 variety.md.
import { apply as baseApply } from '../../../../../src/core/rules';
import { victoryRules } from '../../../../../src/core/state';
import { DeterministicRng } from '../../../../../src/core/rng';
import { whyNotFriendlyMove } from '../../../../../src/core/movement';
import { createReferenceGame } from '../../../../../src/core/reference-game';
import { referenceMap } from '../../../../../src/core/reference-map';
import type { Action, GameState, RuleSet } from '../../../../../src/core/types';
import type { GameOptions } from '../../../../../src/core/options';

export const composition = {Anchor:11,Compass:7,Lantern:4,Surge:4,Raid:4,Wild:5,Shield:4,Squall:1} as const;
export type CardKind = keyof typeof composition;
export type CardAction = Action | {kind:'discardCard';handIndex:number};
export interface Cards {drawPile:CardKind[];discardPile:CardKind[];hands:Record<string,CardKind[]>;pendingDiscard?:{player:string}}
export type CardState = Omit<GameState,'history'> & {cards:Cards;history:CardAction[]};
export type Result = {ok:true;state:CardState} | {ok:false;error:string};
const core = (s:CardState) => s as unknown as GameState;
export function cardsRules(options?:GameOptions):RuleSet {return {...victoryRules(options),id:'malpaco-cards'};}
export function canonical():CardKind[] {return (Object.entries(composition) as [CardKind,number][]).flatMap(([k,n])=>Array<CardKind>(n).fill(k));}
// Called on the setup result after centres; preserves geography/deal and computer streams.
export function initialize(s:GameState):CardState {
 const rng=DeterministicRng.fromSnapshot(s.rng);
 return {...structuredClone(s),cards:{drawPile:rng.shuffled(canonical()),discardPile:[],hands:Object.fromEntries(s.players.map(p=>[p.id,[]]))},rng:rng.snapshot()};
}
export function create(options:GameOptions):CardState {
 const result=createReferenceGame(referenceMap,options,cardsRules(options));
 if(!result.ok) throw Error(result.errors.join(';'));
 return initialize(result.state);
}
export function view(s:CardState,viewer:string) {
 return {drawCount:s.cards.drawPile.length,discardCount:s.cards.discardPile.length,handCounts:Object.fromEntries(Object.entries(s.cards.hands).map(([p,h])=>[p,h.length])),hand:[...(s.cards.hands[viewer]??[])]};
}
function draw(s:CardState):void {
 const c=s.cards,p=s.players[s.currentPlayer]!.id;
 if(!c.drawPile.length){const rng=DeterministicRng.fromSnapshot(s.rng);c.drawPile=rng.shuffled(c.discardPile);c.discardPile=[];s.rng=rng.snapshot();}
 const card=c.drawPile.shift();if(!card)throw Error('invalid depleted deck');
 if(card==='Squall'){c.discardPile.push(...c.hands[p]!,card);c.hands[p]=[];}else c.hands[p]!.push(card);
}
function finish(s:CardState):Result {
 const result=baseApply(core(s),{kind:'endTurn'});
 if(!result.ok)return result;
 // base cloneState does not know cards; copy adapter extension explicitly.
 return {ok:true,state:{...result.state,cards:s.cards,history:s.history}};
}
export function apply(input:CardState,action:CardAction):Result {
 const s=structuredClone(input),p=s.players[s.currentPlayer]!.id;
 if(s.cards.pendingDiscard){
  if(action.kind!=='discardCard')return {ok:false,error:'choose discard before drawing'};
  if(!Number.isSafeInteger(action.handIndex)||action.handIndex<0||action.handIndex>=s.cards.hands[p]!.length)return {ok:false,error:'invalid hand index'};
  s.cards.discardPile.push(s.cards.hands[p]!.splice(action.handIndex,1)[0]!);delete s.cards.pendingDiscard;
  s.history.push(action);draw(s);return finish(s);
 }
 if(action.kind==='discardCard')return {ok:false,error:'no discard pending'};
 if(action.kind==='endTurn'||action.kind==='friendlyMove'){
  if(s.pendingCapture||!['attack','redeploy'].includes(s.phase))return {ok:false,error:'cannot end turn'};
  if(action.kind==='friendlyMove'){
   const error=whyNotFriendlyMove(core(s),action.from,action.to);if(error)return {ok:false,error};
   const max=s.armies[action.from]!-1,n=action.amount??max;
   if(!Number.isSafeInteger(n)||n<1||n>max)return {ok:false,error:'invalid move'};
   s.armies[action.from]!-=n;s.armies[action.to]!+=n;
  }
  s.history.push(action);
  if(s.capturedThisTurn){
   if(s.cards.hands[p]!.length===5){s.cards.pendingDiscard={player:p};return {ok:true,state:s};}
   draw(s);
  }
  return finish(s);
 }
 const result=baseApply(core(s),action);if(!result.ok)return result;
 const next:CardState={...result.state,cards:s.cards,history:[...s.history,action]};
 for(const player of next.players)if(player.eliminated&&next.cards.hands[player.id]!.length){next.cards.discardPile.push(...next.cards.hands[player.id]!);next.cards.hands[player.id]=[];}
 return {ok:true,state:next};
}
// Disposable action-only reference replay; actual adoption MUST extend match-save.ts's
// exact identity allowlist and schema parser, not trust serialized card snapshots.
export function serialize(options:GameOptions,actions:readonly CardAction[]):string {return JSON.stringify({identity:{boardGenerator:{id:'fixed-reference',version:1},rules:{id:'cards',version:1},actionSchemaVersion:3},options,actions});}
export function deserialize(text:string):CardState {const v=JSON.parse(text);if(v.identity.rules.id!=='cards'||v.identity.actionSchemaVersion!==3)throw Error('unsupported identity');return v.actions.reduce((s:CardState,a:CardAction)=>{const r=apply(s,a);if(!r.ok)throw Error(r.error);return r.state;},create(v.options));}
