import {beforeAll,expect,test} from 'vitest';
import {defaultOptions} from '../../src/core/options';
import {islandRules,raidCardsRules} from '../../src/core/state';
import {createGeographicGame} from '../../src/core/geographic-game';
import {computerAction} from '../../src/core/computer';
import {apply} from '../../src/core/rules';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_EVENT_MATCH_IDENTITY,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import type {GameState,WorldEventKind} from '../../src/core/types';
const found=new Map<WorldEventKind,{options:import('../../src/core/options').GameOptions;state:GameState}>();
beforeAll(()=>{
 for(let seed=0;seed<20&&found.size<4;seed++){
  const o={...defaultOptions(),seed,islandRules:1 as const,eventFrequency:'Often' as const,seats:Array.from({length:4},()=>({kind:'computer' as const})),computerStrengths:Array(4).fill('Normal')};
  const made=createGeographicGame(o,islandRules(o),{},2);if(!made.ok)throw Error(made.errors.join());let s=made.state;
  for(let n=0;n<3500&&!s.result&&found.size<4;n++){
   const a=computerAction(s);if(!a)throw Error('missing action');const next=apply(s,a);if(!next.ok)throw Error(next.error);s=next.state;
   if(s.events?.latest&&!found.has(s.events.latest.kind))found.set(s.events.latest.kind,{options:o,state:s});
  }
 }
 expect(found.size).toBe(4);
},30000);
for(const kind of ['storm','revolt','shift','harvest'] as const)test(`${kind}: ordinary action history resumes exact event/RNG/state under permanent tuple`,()=>{
 const {options,state}=found.get(kind)!,wire=serializeVersionedMatch(options,state.history,GEOGRAPHIC_EVENT_MATCH_IDENTITY),loaded=deserializeVersionedMatch(wire);expect(loaded.state).toEqual(state);
 const a=computerAction(state)!;expect(apply(loaded.state,a)).toEqual(apply(state,a));expect(serializeVersionedMatch(loaded.options,state.history,loaded.identity)).toBe(wire);
},30000);
for(const startingArmiesRange of ['1-2','1-3','1-4'] as const)test(`${startingArmiesRange}: equal seat budget, fixed income and common initial live/card streams`,()=>{
 const snapshots=[];
 for(const range of ['1-2','1-3','1-4'] as const){const o={...defaultOptions(),seed:7,islandRules:1 as const,startingArmiesRange:range,eventFrequency:'Off' as const};const r=createGeographicGame(o,islandRules(o),{},2);if(!r.ok)throw Error(r.errors.join());snapshots.push({rng:r.state.rng,cards:r.state.cards,centres:r.state.productionCentres,owner:r.state.ownerOf});}
 expect(snapshots[1]).toEqual(snapshots[0]);expect(snapshots[2]).toEqual(snapshots[0]);
 const o={...defaultOptions(),seed:7,islandRules:1 as const,startingArmiesRange,eventFrequency:'Off' as const},made=createGeographicGame(o,islandRules(o),{},2);if(!made.ok)throw Error(made.errors.join());
 const max=Number(startingArmiesRange.at(-1)),s=made.state,counts=s.players.map(p=>Object.keys(s.armies).filter(id=>s.ownerOf[id]===p.id).reduce((n,id)=>n+s.armies[id]!,0));
 expect(Object.values(s.armies).every(n=>n>=1&&n<=max)).toBe(true);expect(counts.reduce((a,b)=>a+b)).toBe(Math.floor(46*(1+max)/2));expect(Math.max(...counts)-Math.min(...counts)).toBeLessThanOrEqual(1);
 expect(deserializeVersionedMatch(serializeVersionedMatch(o,[],GEOGRAPHIC_EVENT_MATCH_IDENTITY)).state).toEqual(s);
},30000);
test('old tuples reject the new option and old raid games have no events or new state fields',()=>{
 const old={...defaultOptions(),seed:7},g=createGeographicGame(old,raidCardsRules(old),{},2);if(!g.ok)throw Error(g.errors.join());
 const wire=serializeVersionedMatch(old,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);expect(deserializeVersionedMatch(wire).state).toEqual(g.state);expect(Object.hasOwn(g.state,'events')).toBe(false);
 expect(()=>serializeVersionedMatch({...old,islandRules:1},[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)).toThrow();expect(()=>serializeVersionedMatch(old,[],GEOGRAPHIC_EVENT_MATCH_IDENTITY)).toThrow();
 const base=JSON.parse(serializeVersionedMatch({...old,islandRules:1},[],GEOGRAPHIC_EVENT_MATCH_IDENTITY));
 for(const patch of [{rules:{id:'island',version:2}},{actionSchemaVersion:6},{boardGenerator:{id:'geographic',version:1}},{options:{...old,islandRules:1,reinforcementDivisor:3}}]){
  expect(()=>deserializeVersionedMatch(JSON.stringify({...base,...patch}))).toThrow();
 }
},30000);
