import {expect,test} from 'vitest';
import * as core from '../../src/core';
import type {ComputerPosition} from '../../src/core/computer-position';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import {createGeographicGame} from '../../src/core/geographic-game';
import {configurableRaidCardsRules} from '../../src/core/state';

function evaluate(view:ComputerStrategicView):ComputerPosition {
 expect(core).toHaveProperty('evaluateComputerPosition',expect.any(Function));
 return (core as unknown as {evaluateComputerPosition:(v:ComputerStrategicView)=>ComputerPosition}).evaluateComputerPosition(view);
}
function position(){
 const armies={a:5,b:2,c:1,d:4,e:8,x:6,r:7};
 const edges=[['a','b'],['b','c'],['c','d'],['d','e'],['d','x'],['b','e']];
 const islands=[{id:'north',bonus:4,provinces:['a','b','c']},{id:'south',bonus:3,provinces:['d','e','x']},{id:'remote',bonus:2,provinces:['r']}];
 const map:core.GameMap={id:'research',name:'Research',bounds:{x:0,y:0,width:100,height:100},
  islands:islands.map(i=>({...i,name:i.id})),provinces:Object.keys(armies).map(id=>({id,name:id,island:islands.find(i=>i.provinces.includes(id))!.id,
   borders:edges.flatMap(([a,b])=>a===id?[b!]:b===id?[a!]:[]),seaLanes:[],polygon:[],labelAt:[0,0]}))};
 const state=core.newGame(map,core.victoryRules(),[{id:'own',name:'Own',kind:'computer',eliminated:false},{id:'enemy',name:'Enemy',kind:'computer',eliminated:false},{id:'third',name:'Third',kind:'computer',eliminated:false}],42);
 state.ownerOf={a:'own',b:'own',c:'own',d:'own',r:'own',e:'enemy',x:'third'};state.armies=armies;state.currentPlayer=0;
 return state;
}

test('hand-calculated income, island progress and entrances distinguish complete islands from partial control',()=>{
 const result=evaluate(core.computerView(position()) as ComputerStrategicView);
 expect(result.seats.find(s=>s.playerId==='own')).toMatchObject({countries:5,armies:19,baseIncome:2,islandIncome:6,income:8,frontierCount:2,interiorMovableArmies:10});
 expect(result.seats.find(s=>s.playerId==='own')!.islands).toEqual([
  {id:'north',owned:3,total:3,bonus:4,complete:true,entrances:['b','c']},
  {id:'remote',owned:1,total:1,bonus:2,complete:true,entrances:[]},
  {id:'south',owned:1,total:3,bonus:3,complete:false,entrances:['d','e']},
 ]);
 expect(result.seats.find(s=>s.playerId==='enemy')).toMatchObject({countries:1,armies:8,baseIncome:2,islandIncome:0,income:2});
});

test('frontier distance follows only owned routes and preserves disconnected reserve information',()=>{
 const result=evaluate(core.computerView(position()) as ComputerStrategicView);
 expect(result.countries.filter(c=>c.owner==='own').map(c=>[c.id,c.frontier,c.frontDistance,c.movableArmies])).toEqual([
  ['a',false,1,4],['b',true,0,1],['c',false,1,0],['d',true,0,3],['r',false,null,6],
 ]);
});

test('pressure keeps opponents separate and counts a source touching two friendly countries only once',()=>{
 const result=evaluate(core.computerView(position()) as ComputerStrategicView);
 expect(result.seats.find(s=>s.playerId==='own')!.adjacentOpponents).toEqual([
  {playerId:'enemy',sources:['e'],armies:8},{playerId:'third',sources:['x'],armies:6},
 ]);
 expect(result.countries.find(c=>c.id==='b')!.adjacentOpponents).toEqual([{playerId:'enemy',sources:['e'],armies:8}]);
 expect(result.countries.find(c=>c.id==='d')!.adjacentOpponents).toEqual([
  {playerId:'enemy',sources:['e'],armies:8},{playerId:'third',sources:['x'],armies:6},
 ]);
});

test('sea adjacency has the same strategic meaning as land and source duplication adds no pressure',()=>{
 const state=position(),original=evaluate(core.computerView(state) as ComputerStrategicView);
 const sea={...state,map:{...state.map,provinces:state.map.provinces.map(p=>({...p,borders:[],seaLanes:[...p.borders,...p.borders]}))}};
 expect(evaluate(core.computerView(sea) as ComputerStrategicView)).toEqual(original);
});

test('divisor and turn-sequence semantics change income without changing island progress',()=>{
 const initial=position();let state={...initial,rules:{...initial.rules,reinforcementDivisor:1 as const}};
 expect(evaluate(core.computerView(state) as ComputerStrategicView).seats.find(s=>s.playerId==='own')).toMatchObject({baseIncome:5,islandIncome:6,income:11});
 state={...state,rules:{...state.rules,turnSequence:'classic'}};
 expect(evaluate(core.computerView(state) as ComputerStrategicView).seats.find(s=>s.playerId==='own')).toMatchObject({baseIncome:5,islandIncome:6,income:0});
});

test('evaluation is immutable and canonical under input permutations and eliminated seats are not credited income',()=>{
 const state=position();state.players[2]!.eliminated=true;
 const view=core.computerView(state) as ComputerStrategicView,before=structuredClone(view);
 const result=evaluate(view);expect(view).toEqual(before);
 expect(result.seats.map(s=>s.playerId)).toEqual(['enemy','own']);
 const permuted={...view,countries:[...view.countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()})),strategy:{...view.strategy,islands:[...view.strategy.islands].reverse().map(i=>({...i,provinces:[...i.provinces].reverse()}))}};
 expect(evaluate(permuted)).toEqual(result);
});

for(const divisor of [1,3,5,7] as const)test(`ordinary generated-state income agrees with the engine for divisor ${divisor}`,()=>{
 const options={...core.defaultOptions(),seed:42,reinforcementDivisor:divisor};
 const created=createGeographicGame(options,configurableRaidCardsRules(options),{},2);if(!created.ok)throw Error(created.errors.join(';'));
 const result=evaluate(core.computerView(created.state) as ComputerStrategicView);
 for(const seat of result.seats){const expected=core.reinforcementIncome(created.state,seat.playerId);expect(seat).toMatchObject({countries:expected.provinceCount,baseIncome:expected.base,islandIncome:expected.islandBonus,income:expected.total});}
});
