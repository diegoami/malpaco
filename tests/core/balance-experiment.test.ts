import {expect, test} from 'vitest';
import {candidate, dealMetrics, distribution, incomes, summarize} from '../../tools/balance/experiment';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {raidCardsRules} from '../../src/core/state';
import type {Incomes, Outcome} from '../../tools/balance/experiment';
function initial(seed: number) {
  const options = {...defaultOptions(), seed, seats: Array.from({length: 4}, () => ({kind: 'computer' as const})), computerStrengths: ['Normal', 'Normal', 'Normal', 'Normal'] as const};
  const created = createGeographicGame(options, raidCardsRules(options), {}, 2);
  if (!created.ok) throw Error(created.errors.join('; '));
  return created.state;
}
const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
test('metric table keeps errors, refusals and unfinished games in scheduled denominator', () => {
  const round5: Incomes = [
    {seat:'seat1',eliminated:false,base:3,islandBonus:7,total:10,provinceCount:11},
    {seat:'seat2',eliminated:false,base:3,islandBonus:1,total:4,provinceCount:11},
    {seat:'seat3',eliminated:false,base:2,islandBonus:0,total:2,provinceCount:8},
    {seat:'seat4',eliminated:true,base:0,islandBonus:0,total:0,provinceCount:0},
  ];
  const rows: Outcome[] = [
    {seed:0,variant:'current',status:'finished',firstSeat:'seat1',winner:'seat1',round:8,round5},
    {seed:1,variant:'current',status:'finished',firstSeat:'seat2',winner:'seat1',round:4,round5:null},
    {seed:2,variant:'current',status:'unfinished',firstSeat:'seat3',round:101,round5},
    {seed:3,variant:'current',status:'refused',error:'generation refused'},
    {seed:4,variant:'current',status:'error',error:'illegal action'},
  ];
  const result=summarize(rows);
  expect([result.scheduled,result.finished,result.unfinished,result.refused,result.errors]).toEqual([5,2,1,1,1]);
  expect(result.firstMoverWins).toBe(1); expect(result.firstMoverWinRateAllScheduled).toBe(.2);
  expect(result.winsBySeat).toEqual({seat1:2,seat2:0,seat3:0,seat4:0});
  expect(result.round5Samples).toBe(2);expect(result.finishedBeforeRound5).toBe(1);expect(result.round5MissingOther).toBe(2);
  expect(result.round5SpreadAllSeats?.median).toBe(10);expect(result.round5SpreadLiving?.median).toBe(8);
  expect(result.round5MaxIslandBonus?.median).toBe(7);
  expect(result.finishingRounds).toEqual({count:2,min:4,p10:4,median:6,p90:8,max:8,mean:6});
});
test('empty data stays visibly empty rather than claiming a zero spread or win rate', () => {
  expect(distribution([])).toBeNull();expect(summarize([]).firstMoverWinRateAllScheduled).toBeNull();
  expect(summarize([{seed:0,variant:'current',status:'refused'}]).round5SpreadAllSeats).toBeNull();
});
test('current transform is identical; other transforms preserve pairing and input', () => {
  const state=initial(7), before=structuredClone(state);
  expect(candidate(state,'current')).toEqual(state);
  for(const variant of ['deal','bonus','both'] as const){
    const a=candidate(state,variant);
    expect(a.rng).toEqual(state.rng);expect(a.currentPlayer).toBe(state.currentPlayer);
    expect(a.cards).toEqual(state.cards);expect(a.productionCentres).toEqual(state.productionCentres);
    expect(a.map.provinces).toEqual(state.map.provinces);
    expect(a).toEqual(candidate(state,variant));
  }
  expect(state).toEqual(before);
});
test('bonus transform halves each original value with a minimum of one and keeps the deal', () => {
  const original=initial(0);
  const state={...original,map:{...original.map,islands:original.map.islands.map((i,n)=>({...i,bonus:[1,2,3,7,8][n%5]!}))}};
  const reduced=candidate(state,'bonus');
  expect(reduced.map.islands.map(i=>i.bonus)).toEqual(state.map.islands.map((_,n)=>[1,1,1,3,4][n%5]));
  expect(reduced.ownerOf).toEqual(state.ownerOf);expect(reduced.armies).toEqual(state.armies);
  expect(candidate(state,'both').map.islands).toEqual(reduced.map.islands);
});
test.each(Array.from({length:20},(_,seed)=>seed))('constructive deal obeys caps and equal army totals: seed %i', (seed) => {
    const state=initial(seed), old=dealMetrics(state), deal=candidate(state,'deal'), metrics=dealMetrics(deal);
    expect(old.some(p=>p.capViolations.length>0)).toBe(true);
    expect(metrics.map(p=>p.countries)).toEqual(old.map(p=>p.countries));
    expect(spread(metrics.map(p=>p.countries))).toBeLessThanOrEqual(1);
    expect(spread(metrics.map(p=>p.armies))).toBeLessThanOrEqual(1);
    expect(metrics.flatMap(p=>p.capViolations)).toEqual([]);
    expect(metrics.every(p=>p.islandsTouched>=2)).toBe(true);
    expect(Object.values(deal.armies).every(a=>Number.isInteger(a)&&a>=1&&a<=3)).toBe(true);
    expect(Object.values(deal.armies).reduce((a,b)=>a+b,0)).toBe(Object.values(state.armies).reduce((a,b)=>a+b,0));
    expect(deal.map).toEqual(state.map);
});
test('eliminated seats contribute zero income rather than the theoretical base minimum', () => {
  const state=initial(0);state.players[0]!.eliminated=true;
  expect(incomes(state)[0]).toEqual({seat:'seat1',eliminated:true,base:0,islandBonus:0,total:0,provinceCount:0});
});
