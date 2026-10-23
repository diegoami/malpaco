import {expect,test} from 'vitest';
import * as experiments from '../../tools/balance/experiment';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {configurableRaidCardsRules} from '../../src/core/state';
import type {GameState} from '../../src/core/types';
const make=(experiments as typeof experiments & {startingArmyCandidate?:(s:GameState,max:2|3|4)=>GameState}).startingArmyCandidate??((s:GameState)=>experiments.candidate(s,'both'));
for(const maximum of [2,3,4] as const)for(const seats of [2,3,4])test(`max ${maximum}, ${seats} seats: bounded armies and equal aggregate budget; all other streams unchanged`,()=>{
 const options={...defaultOptions(),seed:7,reinforcementDivisor:3 as const,seats:Array.from({length:seats},()=>({kind:'computer' as const})),computerStrengths:Array(seats).fill('Normal')};
 const made=createGeographicGame(options,configurableRaidCardsRules(options),{},2);if(!made.ok)throw Error(made.errors.join());
 const initial=made.state,snapshot=JSON.stringify(initial),control=experiments.candidate(initial,'both'),s=make(initial,maximum);
 expect(Object.values(s.armies).every(n=>n>=1&&n<=maximum)).toBe(true);
 const totals=s.players.map(p=>s.map.provinces.reduce((n,c)=>n+(s.ownerOf[c.id]===p.id?s.armies[c.id]!:0),0));
 expect(totals.reduce((a,b)=>a+b)).toBe(Math.floor(s.map.provinces.length*(1+maximum)/2));expect(Math.max(...totals)-Math.min(...totals)).toBeLessThanOrEqual(1);
 expect(s.ownerOf).toEqual(control.ownerOf);expect(s.map).toEqual(control.map);expect(s.currentPlayer).toBe(initial.currentPlayer);expect(s.rules.reinforcementDivisor).toBe(3);
 expect(s.rng).toEqual(initial.rng);expect(s.computerRngs).toEqual(initial.computerRngs);expect(s.cards).toEqual(initial.cards);expect(JSON.stringify(initial)).toBe(snapshot);
 expect(make(initial,maximum)).toEqual(s);expect(experiments.dealMetrics(s).every(p=>p.capViolations.length===0)).toBe(true);
});
