import {expect} from 'vitest';
import * as core from '../../src/core';
import {referenceMap} from '../../src/core/reference-map';
import type {Action,GameOptions,GameState,RuleSet,MatchIdentity} from '../../src/core';
export const COMPOSITION={Anchor:11,Compass:7,Lantern:4,Surge:4,Raid:4,Wild:5,Shield:4,Squall:1} as const;
export type Kind=keyof typeof COMPOSITION;
export interface Deck {drawPile:Kind[];discardPile:Kind[];hands:Record<string,Kind[]>;pendingDiscard?:{player:string}}
export type State=GameState & {cards?:Deck};
export type CardAction=Action|{kind:'discardCard';handIndex:number};
export const api=core as typeof core & {
 cardsRules?:(options?:Pick<GameOptions,'dominationWin'|'roundLimit'>)=>RuleSet;
 CARD_COMPOSITION?:typeof COMPOSITION;HAND_LIMIT?:number;
 cardView?:(state:GameState,viewer:string)=>{drawCount:number;discardCount:number;handCounts:Record<string,number>;hand:readonly Kind[]};
 REFERENCE_CARD_MATCH_IDENTITY?:MatchIdentity;GEOGRAPHIC_CARD_MATCH_IDENTITY?:MatchIdentity;
};
export const settings=(seed=1994):GameOptions=>({...core.defaultOptions(),seed,seats:[{kind:'human'},{kind:'human'},{kind:'human'}],computerStrengths:[],dominationWin:false});
export function opening(seed=1994,geographic=false):State {
 const options=settings(seed),rules=api.cardsRules?.(options)??core.victoryRules(options);
 const r=geographic?core.createGeographicGame(options,rules):core.createReferenceGame(referenceMap,options,rules);
 if(!r.ok)throw Error(r.errors.join(';'));return r.state;
}
export function cards(s:State):Deck {expect(s.cards,'opt-in rules initialize the real deck').toBeDefined();return s.cards!;}
export function act(s:State,a:CardAction):State {const r=core.apply(s,a as Action);if(!r.ok)throw Error(`${JSON.stringify(a)}: ${r.error}`);return r.state;}
export function ready(s:State):State {
 if(s.phase!=='reinforce')return s;
 const id=s.map.provinces.find(p=>s.ownerOf[p.id]===s.players[s.currentPlayer]!.id)!.id;
 if(s.reinforcementPool)s=act(s,{kind:'reinforce',province:id,amount:s.reinforcementPool});
 return act(s,{kind:'endReinforcement'});
}
export const player=(s:State)=>s.players[s.currentPlayer]!.id;
export const canonical=():Kind[]=>Object.entries(COMPOSITION).flatMap(([k,n])=>Array<Kind>(n).fill(k as Kind));
export function conserved(s:State){const c=cards(s),all=[...c.drawPile,...c.discardPile,...Object.values(c.hands).flat()];expect(all.length).toBe(40);expect(Object.fromEntries(Object.keys(COMPOSITION).map(k=>[k,all.filter(x=>x===k).length]))).toEqual(COMPOSITION);}
// Explicit deck fixtures always redistribute the canonical inventory, never duplicate it.
export function arrange(s:State,hand:Kind[]=[],top:Kind[]=['Anchor']):State {
 const c=cards(s),rest=canonical();
 for(const kind of [...hand,...top]){const i=rest.indexOf(kind);if(i<0)throw Error('fixture overdraw');rest.splice(i,1);}
 c.hands=Object.fromEntries(s.players.map(p=>[p.id,[]]));c.hands[player(s)]=[...hand];c.drawPile=[...top,...rest];c.discardPile=[];delete c.pendingDiscard;conserved(s);return s;
}
export function example(decisive=false):{s:State;from:string;to:string;other:string} {
 const s=ready(opening()),me=player(s),enemy=s.players.find(p=>p.id!==me)!.id,third=s.players.find(p=>p.id!==me&&p.id!==enemy)!.id;
 const from=s.map.provinces.find(p=>p.borders.length>=2)!;const [to,other]=from.borders as readonly [string,string,...string[]];
 for(const p of s.map.provinces){s.ownerOf[p.id]=decisive?me:third;s.armies[p.id]=1;}
 s.ownerOf[from.id]=me;s.ownerOf[to]=enemy;s.ownerOf[other]=decisive?me:enemy;s.armies[from.id]=80;
 for(const p of s.players)p.eliminated=!Object.values(s.ownerOf).includes(p.id);
 s.phase='attack';s.reinforcementPool=0;s.capturedThisTurn=false;s.rng=new core.DeterministicRng(0).snapshot();return {s,from:from.id,to,other};
}
export function capture(s:State,from:string,to:string):State {
 for(let n=0;n<128&&s.phase==='attack'&&s.ownerOf[to]!==player(s);n++)s=act(s,{kind:'attack',from,to});
 expect(s.phase).toBe('capture');return act(s,{kind:'captureMove',amount:1});
}
export function frozen<T>(x:T):T{if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(frozen);}return x;}
export function identity(geographic=false):MatchIdentity {return (geographic?api.GEOGRAPHIC_CARD_MATCH_IDENTITY:api.REFERENCE_CARD_MATCH_IDENTITY)??{boardGenerator:{id:geographic?'geographic':'fixed-reference',version:1},rules:{id:'cards',version:1},actionSchemaVersion:3};}
export {core,referenceMap};
