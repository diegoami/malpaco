import {readFileSync} from 'node:fs';
import * as c from '../../src/core';
import type {Action,CardKind,GameState,Phase,RuleSet} from '../../src/core';

export interface View {
 playerId:string|null;phase:Phase;cardStage:NonNullable<RuleSet['cards']>|null;
 pendingCapture:boolean;pendingDiscard:boolean;pendingRaid:boolean;
 ownHand:readonly CardKind[];handCounts:Readonly<Record<string,number>>;
 drawCount:number;discardCount:number;discardTop:CardKind|null;reinforcementPool:number;
 countries:readonly {id:string;owner:string;armies:number;neighbours:readonly string[]}[];
 attackPairs:readonly Extract<Action,{kind:'attack'}>[];movePairs:readonly Extract<Action,{kind:'friendlyMove'}>[];
 attacksThisTurn:number;attackBudget:number;
}
export interface Policy {computerView:(s:GameState)=>View;decideComputerAction:(v:View)=>Action|null;computerAction:(s:GameState)=>Action|null}
export const fixtureRoot='fixtures/new-game/T41/parent-acceptance/proposed-tests/fixtures';
export function fixture(name:string){return c.deserializeVersionedMatch(readFileSync(`${fixtureRoot}/${name}.json`,'utf8'));}
export function opening(seed=1){
 const envelope=JSON.parse(readFileSync(`${fixtureRoot}/mixed-tradeCards-232.json`,'utf8'));
 envelope.options.seed=seed;envelope.actions=[];
 return c.deserializeVersionedMatch(JSON.stringify(envelope));
}
export function step(s:GameState,a:Action):GameState{const r=c.apply(s,a);if(!r.ok)throw Error(`${JSON.stringify(a)}: ${r.error}`);return r.state;}
export function passive(s:GameState):Action{
 const p=c.activePlayer(s)!.id;
 if(s.cards?.pendingDiscard)return {kind:'discardCard',handIndex:0};
 if(s.cards?.pendingRaid)return {kind:'raidTarget',province:s.map.provinces.find(x=>s.ownerOf[x.id]!==p)!.id};
 if(s.phase==='cards')return {kind:'skipCards'};
 if(s.phase==='capture')return {kind:'captureMove'};
 if(s.phase==='reinforce')return s.reinforcementPool?{kind:'reinforce',province:c.provincesOf(s,p)[0]!,amount:s.reinforcementPool}:{kind:'endReinforcement'};
 return {kind:'endTurn'};
}
/** Synthetic unit arrangement, NOT a serialized/legal replay checkpoint.
 * Rebuild the complete composition before calling apply; no card is invented. */
export function synthetic(hand:CardKind[],pool=10):GameState{
 const s=opening().state;s.players.splice(0,s.players.length,...s.players.map(p=>({...p,kind:'computer' as const}))); 
 const own=c.activePlayer(s)!.id;
 const deck=(Object.entries(c.CARD_COMPOSITION) as [CardKind,number][]).flatMap(([k,n])=>Array<CardKind>(n).fill(k));
 for(const k of hand){const i=deck.indexOf(k);if(i<0)throw Error(`Impossible composition ${k}`);deck.splice(i,1);}
 s.cards={hands:Object.fromEntries(s.players.map(p=>[p.id,p.id===own?[...hand]:[]])),drawPile:deck,discardPile:[]};
 s.reinforcementPool=pool;return s;
}
/** Literal public topology: remote z99 is stronger than adjacent a2/a10. */
export function view(hand:CardKind[]=[],pool=10):View{return {
 playerId:'self',phase:'cards',cardStage:'raid-v1',pendingCapture:false,pendingDiscard:false,pendingRaid:false,
 ownHand:hand,handCounts:{self:hand.length,enemy:0},drawCount:20,discardCount:0,discardTop:null,reinforcementPool:pool,
 countries:[{id:'home',owner:'self',armies:2,neighbours:['a2','a10']},{id:'a2',owner:'enemy',armies:20,neighbours:['home']},{id:'a10',owner:'enemy',armies:20,neighbours:['home']},{id:'z99',owner:'enemy',armies:1000,neighbours:[]}],
 attackPairs:[],movePairs:[],attacksThisTurn:0,attackBudget:4};}
