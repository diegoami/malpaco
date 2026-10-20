import {expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as core from '../../src/core';
import {referenceMap} from '../../src/core/reference-map';
import type {Action,GameState,GameOptions,RuleSet,MatchIdentity} from '../../src/core';
import {canonical,COMPOSITION} from './card-deck-fixture';
import type {Kind} from './card-deck-fixture';
export const api=core as typeof core & {
 raidCardsRules?:(o?:Pick<GameOptions,'dominationWin'|'roundLimit'>)=>RuleSet;
 raidStackAfter?:(armies:number,rng:{nextInt:(lo:number,hi:number)=>number})=>number;
 REFERENCE_RAID_CARD_MATCH_IDENTITY?:MatchIdentity;GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY?:MatchIdentity;
};
export type State=GameState & {cards:NonNullable<GameState['cards']>&{pendingRaid?:{player:string}}};
export const options=():GameOptions=>({...core.defaultOptions(),seed:1994,seats:Array.from({length:4},()=>({kind:'human' as const})),computerStrengths:[],dominationWin:false,roundLimit:null});
export const player=(s:GameState)=>s.players[s.currentPlayer]!.id;
export function opening():State {const o=options(),result=core.createReferenceGame(referenceMap,o,api.raidCardsRules?.(o)??core.tradeCardsRules(o));if(!result.ok)throw Error(result.errors.join(';'));return result.state as State;}
export function act(s:GameState,a:unknown):State {const result=core.apply(s,a as Action);if(!result.ok)throw Error(`${JSON.stringify(a)}: ${result.error}`);return result.state as State;}
export function reject(s:GameState,a:unknown){const before=structuredClone(s);expect(core.apply(s,a as Action).ok,JSON.stringify(a)).toBe(false);expect(s).toEqual(before);}
// Structural rule fixture, not a legal replay history: redistribute the real40 cards.
export function setup(hand:Kind[]=['Raid','Wild','Raid','Compass'],defenderHand:Kind[]=[],stack=40){
 const s=opening(),own=core.provincesOf(s,player(s))[0]!,from=core.province(s.map,own)!;
 const target=s.map.provinces.find(p=>s.ownerOf[p.id]!==player(s)&&!core.neighbours(from).includes(p.id)&&core.neighbours(p).every(id=>s.ownerOf[id]!==player(s)))!.id,defender=s.ownerOf[target]!;
 const rest=canonical(),take=(k:Kind)=>{const i=rest.indexOf(k);expect(i).toBeGreaterThanOrEqual(0);rest.splice(i,1);return k;};
 s.cards.hands=Object.fromEntries(s.players.map(p=>[p.id,[]]));s.cards.hands[player(s)]=hand.map(take);s.cards.hands[defender]=defenderHand.map(take);s.cards.drawPile=rest;s.cards.discardPile=[];delete s.cards.pendingDiscard;s.armies[target]=stack;
 return {s,own,target,defender};
}
export function conserved(s:State){const c=s.cards,all=[...c.drawPile,...c.discardPile,...Object.values(c.hands).flat()];expect(all).toHaveLength(40);expect(Object.fromEntries(Object.keys(COMPOSITION).map(k=>[k,all.filter(x=>x===k).length]))).toEqual(COMPOSITION);}
export function saved(name:string){const text=readFileSync(`fixtures/new-game/T39/fixtures/${name}.json`,'utf8');return {text,payload:JSON.parse(text),loaded:core.deserializeVersionedMatch(text)};}
export function identity(geographic=false):MatchIdentity{return (geographic?api.GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:api.REFERENCE_RAID_CARD_MATCH_IDENTITY)??{boardGenerator:{id:geographic?'geographic':'fixed-reference',version:1},rules:{id:'cards',version:3},actionSchemaVersion:5};}
export {core};
