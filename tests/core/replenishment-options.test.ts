import {expect,test} from 'vitest';
import {apply} from '../../src/core/rules';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {defaultOptions,validateGameOptions} from '../../src/core/options';
import {reinforcementIncome} from '../../src/core/reinforcement';
import {createGeographicGame} from '../../src/core/geographic-game';
import * as factories from '../../src/core/state';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import type {GameOptions,RuleSet} from '../../src/core';
const rates=[1,3,5,7] as const;
const identity={boardGenerator:{id:'geographic',version:2},rules:{id:'configurable-cards',version:1},actionSchemaVersion:5};
const factory=(factories as typeof factories & {configurableRaidCardsRules?:(o:GameOptions)=>RuleSet}).configurableRaidCardsRules??factories.raidCardsRules;
for(const rate of rates)test(`divisor ${rate}: minimum/floor boundaries and island bonus added once`,()=>{
 const options={...defaultOptions(),seed:7,reinforcementDivisor:rate};const made=createGeographicGame(options,factory(options),{},2);if(!made.ok)throw Error(made.errors.join());
 const s=made.state,me=s.players[0]!.id,other=s.players[1]!.id;
 for(const count of [0,1,2,3,6,7,14,20,21,22]){
  s.map.provinces.forEach((p,i)=>s.ownerOf[p.id]=i<count?me:other);
  const income=reinforcementIncome(s,me),bonus=s.map.islands.filter(i=>i.provinces.every(id=>s.ownerOf[id]===me)).reduce((n,i)=>n+i.bonus,0);
  expect(income.base).toBe(Math.max(2,Math.floor(count/rate)));expect(income.islandBonus).toBe(bonus);expect(income.total).toBe(Math.max(2,Math.floor(count/rate))+bonus);
 }
});
test('old option shape stays byte-for-byte normalized while explicit invalid divisors are refused',()=>{
 const old=defaultOptions();expect(validateGameOptions(old)).toEqual(old);expect(Object.hasOwn(validateGameOptions(old),'reinforcementDivisor')).toBe(false);
 for(const value of [0,2,4,6,8,'3',null,1.5])expect(()=>validateGameOptions({...old,reinforcementDivisor:value})).toThrow();
 for(const rate of rates)expect(validateGameOptions({...old,reinforcementDivisor:rate})).toMatchObject({reinforcementDivisor:rate});
});
for(const rate of rates)test(`configured divisor ${rate} replays exactly and old identities reject it`,()=>{
  const options={...defaultOptions(),seed:7,reinforcementDivisor:rate},made=createGeographicGame(options,factory(options),{},2);if(!made.ok)throw Error(made.errors.join());
  let state=made.state;for(let n=0;n<40&&!state.result;n++){const action=decideComputerAction(computerView(state));if(!action)throw Error('missing action');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;}
  const saved=serializeVersionedMatch(options,state.history,identity),loaded=deserializeVersionedMatch(saved);
  expect(loaded.options).toEqual(options);expect(loaded.state).toEqual(state);expect(serializeVersionedMatch(loaded.options,state.history,identity)).toBe(saved);
  expect(()=>serializeVersionedMatch(options,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)).toThrow();
});
test('old identity stays exact and new identity requires an explicit rate',()=>{
 const options=defaultOptions(),old=createGeographicGame(options,factories.raidCardsRules(options),{},2);if(!old.ok)throw Error(old.errors.join());
 expect(deserializeVersionedMatch(serializeVersionedMatch(options,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)).state).toEqual(old.state);
 expect(()=>serializeVersionedMatch(options,[],identity)).toThrow();
});

test('a match keeps its chosen divisor when the caller changes a later options object',()=>{
 const input={...defaultOptions(),seed:7,reinforcementDivisor:1 as 1|3|5|7};const made=createGeographicGame(input,factory(input),{},2);if(!made.ok)throw Error(made.errors.join());
 input.reinforcementDivisor=7;expect(made.state.rules.reinforcementDivisor).toBe(1);
 const me=made.state.players[0]!.id;const income=reinforcementIncome(made.state,me);expect(income.base).toBe(Math.max(2,income.provinceCount));
});
