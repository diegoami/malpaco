// Proposed install target: tests/e2e/cards-fixtures.ts. Main owns adoption/freeze.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {apply,deserializeVersionedMatch} from '../../src/core';
import type {Action,CardKind,GameState,LoadedVersionedMatch} from '../../src/core';
export const FIXTURES='fixtures/new-game/T40/fixtures';
export const KINDS=['Anchor','Compass','Lantern','Surge','Raid','Wild','Shield','Squall'] as const;
export const TRADE_CASES=[
 {kind:'Anchor',file:'T38-legal-reshuffle-match-Anchor-before.json',pool:2,after:7,indices:[0,1,3]},
 {kind:'Compass',file:'T38-legal-reshuffle-match-Compass-before.json',pool:6,after:14,indices:[2,3,4]},
 {kind:'Lantern',file:'T40-Lantern-before.json',pool:2,after:17,indices:[0,1,4]},
 {kind:'Surge',file:'T38-legal-Surge-before.json',pool:6,after:12,indices:[0,1,4]},
] as const;
export function input(file:string):string{return readFileSync(join(FIXTURES,file),'utf8');}
export function fixture(file:string):LoadedVersionedMatch{return deserializeVersionedMatch(input(file));}
export function human(state:GameState):string {const humans=state.players.filter(p=>p.kind==='human');if(humans.length!==1)throw Error('Required one-human browser fixture');return humans[0]!.id;}
export function next(state:GameState,action:Action):GameState {const result=apply(state,action);if(!result.ok)throw Error(`Independent engine oracle refused ${JSON.stringify(action)}: ${result.error}`);return result.state;}
export function selectedNames(state:GameState,indices:readonly[number,number,number]):string[]{const h=state.cards!.hands[human(state)]!;return indices.map(i=>h[i]!);}
export function publicKinds(loaded:LoadedVersionedMatch):Set<CardKind>{
 const known=new Set<CardKind>();let state=loaded.initialState;
 if(!state)throw Error('Browser oracle needs actual replay origin');
 const remember=(s:GameState)=>{for(const k of s.cards?.discardPile??[])known.add(k);};remember(state);
 for(const action of loaded.state.history){const after=next(state,action);remember(after);state=after;}
 return known;
}
/** Honest options-only controller variants, reconstructed by the ordinary codec. */
export function withHumanCount(text:string,count:number):string {
 const value=JSON.parse(text),loaded=deserializeVersionedMatch(text),viewer=loaded.options.seats.findIndex(p=>p.kind==='human'),order=[viewer,...loaded.options.seats.map((_,i)=>i).filter(i=>i!==viewer)];
 const humans=new Set(order.slice(0,count));value.options.seats=value.options.seats.map((_:unknown,i:number)=>({kind:humans.has(i)?'human':'computer'}));value.options.computerStrengths=value.options.seats.filter((p:{kind:string})=>p.kind==='computer').map(()=>'Normal');
 const variant=JSON.stringify(value);deserializeVersionedMatch(variant);return variant;
}
