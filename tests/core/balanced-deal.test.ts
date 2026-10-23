import {expect,test} from 'vitest';
import * as geographic from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {raidCardsRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {computerAction} from '../../src/core/computer';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import type {GameOptions,GameState} from '../../src/core';
import {candidate} from '../../tools/balance/experiment';

type Factory=(options:GameOptions)=>geographic.GeographicGameResult;
const create:Factory=(geographic as typeof geographic & {createBalancedGeographicGame?:Factory}).createBalancedGeographicGame??(o=>geographic.createGeographicGame(o,raidCardsRules(o),{},2));
const identity={boardGenerator:{id:'geographic',version:2},rules:{id:'balanced-cards',version:1},actionSchemaVersion:5} as const;
const options=(seed:number,seats=4):GameOptions=>({...defaultOptions(),seed,seats:Array.from({length:seats},()=>({kind:'computer' as const})),computerStrengths:Array.from({length:seats},()=> 'Normal' as const)});
const made=(o:GameOptions)=>{const r=create(o);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.errors.join('; '));return r.state;};
const gap=(values:number[])=>Math.max(...values)-Math.min(...values);
/** Independent graph witness: a connected BFS prefix and its remaining islands.
 * Cap totals below the smallest share force every seat onto both sides.
 */
function positionWitness(state:GameState){
 const islands=state.map.islands,provinces=new Map(state.map.provinces.map(p=>[p.id,p])),count=state.players.length;
 const shares=state.players.map(p=>Object.values(state.ownerOf).filter(owner=>owner===p.id).length),minimum=Math.min(...shares);
 for(const root of islands.map(i=>i.id).sort()){
  const queue=[root],seen=new Set(queue);
  for(let n=0;n<queue.length;n++){
   const island=islands.find(i=>i.id===queue[n])!;
   const neighbours=new Set(island.provinces.flatMap(id=>[...provinces.get(id)!.borders,...provinces.get(id)!.seaLanes].map(p=>provinces.get(p)!.island)));
   for(const id of [...neighbours].sort())if(!seen.has(id)){seen.add(id);queue.push(id);}
  }
  for(let n=1;n<queue.length;n++){
   const side=new Set(queue.slice(0,n));
   const cap=(on:boolean)=>islands.filter(i=>side.has(i.id)===on).reduce((sum,i)=>sum+Math.ceil(i.provinces.length/count),0);
   if(cap(true)<minimum&&cap(false)<minimum)return side;
  }
 }
 throw Error('No graph partition witness');
}
for(const seats of [2,3,4])test.each(Array.from({length:500},(_,seed)=>seed))(`${seats} seats, seed %i: equal shares/armies, island caps and both graph halves`,seed=>{
 const state=made(options(seed,seats)),halves=positionWitness(state);
 const shares:number[]=[],armies:number[]=[];
 for(const player of state.players){
  const own=state.map.provinces.filter(p=>state.ownerOf[p.id]===player.id);
  shares.push(own.length);armies.push(own.reduce((sum,p)=>sum+state.armies[p.id]!,0));
  const touched=state.map.islands.filter(i=>i.provinces.some(id=>state.ownerOf[id]===player.id));
  expect(touched.length).toBeGreaterThanOrEqual(2);
  expect(touched.some(i=>halves.has(i.id))).toBe(true);expect(touched.some(i=>!halves.has(i.id))).toBe(true);
  for(const island of state.map.islands)expect(island.provinces.filter(id=>state.ownerOf[id]===player.id).length).toBeLessThanOrEqual(Math.ceil(island.provinces.length/seats));
 }
 expect(gap(shares)).toBeLessThanOrEqual(1);expect(gap(armies)).toBeLessThanOrEqual(1);
 expect(Object.values(state.armies).every(n=>Number.isInteger(n)&&n>=1&&n<=3)).toBe(true);
});
for(const seats of [2,3,4])test(`deterministic combined constructor matches the measured experiment at ${seats} seats`,()=>{
 for(const seed of [0,1,7,105,1994]){
  const o=options(seed,seats),old=geographic.createGeographicGame(o,raidCardsRules(o),{},2);if(!old.ok)throw Error(old.errors.join());
  const state=made(o),expected=candidate(old.state,'both');
  expect({...state,rules:old.state.rules}).toEqual(expected);
  expect(state).toEqual(made(o));expect(state.rules.id).toBe('balanced-raid-v1');
  expect(state.rng).toEqual(old.state.rng);expect(state.currentPlayer).toBe(old.state.currentPlayer);
  expect(state.map.islands.map(i=>i.bonus)).toEqual(old.state.map.islands.map(i=>Math.max(1,Math.floor(i.bonus/2))));
 }
},30000);
test('the new identity replays ordinary actions while the old geographic stage stays unchanged',()=>{
 const o=options(7);let state=made(o);
 for(let n=0;n<80&&state.phase!=='finished';n++){
  const action=computerAction(state);if(!action)throw Error('missing action');
  const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }
 const text=serializeVersionedMatch(o,state.history,identity),restored=deserializeVersionedMatch(text);
 expect(restored.identity).toEqual(identity);expect(restored.state).toEqual(state);
 expect(serializeVersionedMatch(o,restored.state.history,identity)).toBe(text);
 const old=geographic.createGeographicGame(o,raidCardsRules(o),{},2);if(!old.ok)throw Error(old.errors.join());
 const oldIdentity={...identity,rules:{id:'cards',version:3}};
 expect(deserializeVersionedMatch(serializeVersionedMatch(o,[],oldIdentity)).state).toEqual(old.state);
 for(const replacement of [{...identity,boardGenerator:{id:'geographic',version:1}},{...identity,rules:{id:'balanced-cards',version:2}},{...identity,actionSchemaVersion:4}]){
  const malformed={...JSON.parse(text),...replacement};expect(()=>deserializeVersionedMatch(JSON.stringify(malformed))).toThrow();
 }
});
