import {expect,test} from 'vitest';
import {defaultOptions,validateGameOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {configurableRaidCardsRules} from '../../src/core/state';
import {reinforcementIncome} from '../../src/core/reinforcement';
import {resolveTurnVictory} from '../../src/core/victory';
import {apply} from '../../src/core/rules';
import {computerView} from '../../src/core/computer-view';
import {decideComputerAction} from '../../src/core/computer';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import type {GameOptions} from '../../src/core/options';
import type {GeographicGenerator} from '../../src/core/geographic-board';
const identity={boardGenerator:{id:'geographic',version:3},rules:{id:'configurable-cards',version:1},actionSchemaVersion:5};
for(const size of [72,96] as const)for(const seats of [2,3,4])test(`${size} regions / ${seats} seats: complete deterministic connected deal, income and replay`,()=>{
 const options:GameOptions={...defaultOptions(),seed:7,names:'numbered',regionCount:size,reinforcementDivisor:7,seats:Array.from({length:seats},(_,i)=>({kind:i?'computer':'human'})),computerStrengths:Array(seats-1).fill('Normal')};
 const made=createGeographicGame(options,configurableRaidCardsRules(options),{},3 as GeographicGenerator);if(!made.ok)throw Error(made.errors.join());
 const s=made.state;expect(s.map.provinces).toHaveLength(size);expect(s.map.islands.length).toBeGreaterThan(10);
 expect(s.map.id).toContain(`geographic-3-${size}-`);expect(Object.keys(s.ownerOf)).toHaveLength(size);
 const holdings=s.players.map(p=>Object.values(s.ownerOf).filter(owner=>owner===p.id).length);
 expect(Math.max(...holdings)-Math.min(...holdings)).toBeLessThanOrEqual(1);expect(holdings.reduce((a,b)=>a+b)).toBe(size);
 const seen=new Set<string>(),todo=[s.map.provinces[0]!.id];while(todo.length){const id=todo.pop()!;if(seen.has(id))continue;seen.add(id);const p=s.map.provinces.find(p=>p.id===id)!;todo.push(...p.borders,...p.seaLanes);}
 expect(seen.size).toBe(size);
 for(const p of s.players){const income=reinforcementIncome(s,p.id);expect(income.base).toBe(Math.max(2,Math.floor(income.provinceCount/7)));}
 expect(createGeographicGame(options,configurableRaidCardsRules(options),{},3 as GeographicGenerator)).toEqual(made);
 let state=s;for(let n=0;n<20&&!state.result;n++){const action=decideComputerAction(computerView(state));if(!action)throw Error('missing policy action');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;}
 const text=serializeVersionedMatch(options,state.history,identity);expect(deserializeVersionedMatch(text).state).toEqual(state);
 expect(()=>serializeVersionedMatch(options,[],GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY)).toThrow();
});
test('standard options and old configurable identity retain their exact shape; new size is strictly validated',()=>{
 const old={...defaultOptions(),seed:7,reinforcementDivisor:3 as const};expect(validateGameOptions(old)).toEqual(old);
 const text=serializeVersionedMatch(old,[],GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY);expect(deserializeVersionedMatch(text).options).toEqual(old);expect(deserializeVersionedMatch(text).state.map.provinces).toHaveLength(46);
 for(const size of [46,0,73,'72',null,undefined])expect(()=>validateGameOptions({...old,regionCount:size})).toThrow();
 expect(()=>serializeVersionedMatch(old,[],identity)).toThrow();
});

for(const size of [72,96] as const)test(`${size}: domination resolves at three quarters of the actual board`,()=>{
 const o={...defaultOptions(),seed:7,regionCount:size,names:'numbered' as const,reinforcementDivisor:3 as const};const r=createGeographicGame(o,configurableRaidCardsRules(o),{},3);if(!r.ok)throw Error(r.errors.join());
 const s=r.state,me=s.players[s.currentPlayer]!.id,other=s.players.find(p=>p.id!==me)!.id;
 const assign=(count:number)=>s.map.provinces.forEach((p,i)=>{s.ownerOf[p.id]=i<count?me:other;});
 assign(size*3/4-1);expect(resolveTurnVictory(s,false)).toBe(false);expect(s.result).toBeUndefined();
 assign(size*3/4);expect(resolveTurnVictory(s,false)).toBe(true);expect(s.result?.reason).toBe('domination');expect(s.winner).toBe(me);
});
