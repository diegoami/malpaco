import {expect,test} from 'vitest';
import {defaultOptions} from '../../src/core/options';
import {islandRules} from '../../src/core/state';
import {createGeographicGame} from '../../src/core/geographic-game';

// Literal vectors captured from accepted v0.3.0 (414bea0), before any setup change.
// Seat order is seat1..seat4; the rotating first player gets the first remainder.
const cases=[
 {range:'1-2',seed:1,first:3,totals:[17,17,17,18]},
 {range:'1-2',seed:7,first:1,totals:[17,18,17,17]},
 {range:'1-2',seed:42,first:0,totals:[18,17,17,17]},
 {range:'1-4',seed:1,first:3,totals:[29,29,28,29]},
 {range:'1-4',seed:7,first:1,totals:[28,29,29,29]},
 {range:'1-4',seed:42,first:0,totals:[29,29,29,28]},
] as const;
for(const row of cases)test(`0.3 starting-army compatibility: ${row.range}, seed ${row.seed}`,()=>{
 const options={...defaultOptions(),seed:row.seed,islandRules:1 as const,startingArmiesRange:row.range,eventFrequency:'Off' as const,
  seats:[{kind:'human' as const},{kind:'computer' as const},{kind:'computer' as const},{kind:'computer' as const}],computerStrengths:['Normal' as const,'Normal' as const,'Normal' as const]};
 const made=createGeographicGame(options,islandRules(options),{},2);if(!made.ok)throw Error(made.errors.join());
 const state=made.state;
 expect(state.players.map(player=>player.id)).toEqual(['seat1','seat2','seat3','seat4']);
 expect(state.currentPlayer).toBe(row.first);
 expect(state.players.map(player=>Object.entries(state.ownerOf).reduce((total,[id,owner])=>total+(owner===player.id?state.armies[id]!:0),0))).toEqual(row.totals);
});
