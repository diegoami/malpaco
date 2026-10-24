import {expect,test} from 'vitest';
import {apply} from '../../src/core/rules';
import {computerAction,decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import type {ComputerCountry,ComputerDecisionView} from '../../src/core/computer-view';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import {historicalComputerAction} from './computer-cards-historical';
import {RESERVE_CASES,reserveFixture} from '../helpers/reserve-fixtures';

function freeze(value:unknown):void {if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}}
function projection(countries:readonly ComputerCountry[]):ComputerDecisionView {
 return {playerId:'own',phase:'attack',cardStage:null,pendingCapture:false,pendingDiscard:false,pendingRaid:false,ownHand:[],handCounts:{},drawCount:0,discardCount:0,discardTop:null,reinforcementPool:0,countries,
  attackPairs:countries.filter(c=>c.owner==='own'&&c.armies>1).flatMap(c=>c.neighbours.filter(id=>countries.find(n=>n.id===id)?.owner!=='own').map(to=>({kind:'attack' as const,from:c.id,to}))),
  movePairs:countries.filter(c=>c.owner==='own'&&c.armies>1).flatMap(c=>c.neighbours.filter(id=>countries.find(n=>n.id===id)?.owner==='own').map(to=>({kind:'friendlyMove' as const,from:c.id,to}))),attacksThisTurn:0,attackBudget:countries.length};
}
function graph(armies:Record<string,number>,edges:readonly (readonly[string,string])[],enemies=['e']){
 return Object.entries(armies).map(([id,count])=>({id,owner:enemies.includes(id)?'enemy':'own',armies:count,neighbours:edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[])}));
}

for(const row of RESERVE_CASES)test(`${row.size}: released save stops with an idle reserve; corrected policy makes the exact legal hop`,()=>{
 const f=reserveFixture(row.size),state=f.state,wire=JSON.stringify(state);freeze(state);
 expect(state.map.provinces).toHaveLength(row.size);expect(state.armies[row.from]).toBe(row.armies);
 expect(historicalComputerAction(state)).toEqual({kind:'endTurn'});
 const expected={kind:'friendlyMove' as const,from:row.from,to:row.to};
 expect(computerView(state).movePairs).toContainEqual(expected);
 expect(computerAction(state)).toEqual(expected);expect(JSON.stringify(state)).toBe(wire);
 expect(serializeVersionedMatch(f.options,state.history,f.identity)).toBe(f.text);
 const next=apply(state,computerAction(state)!);const oracle=apply(state,expected);expect(next).toEqual(oracle);if(!next.ok)throw Error(next.error);
 const latest=next.state.events?.latest,event=latest&&latest.sequence>(state.events?.sequence??0)?latest:null;
 const beforeEvent=(id:string)=>event?.changes.find(change=>change.id===id)?.armiesBefore??next.state.armies[id]!;
 expect(beforeEvent(row.from)).toBe(1);expect(beforeEvent(row.to)).toBe(state.armies[row.to]!+row.armies-1);
 const total=(armies:Record<string,number>)=>Object.values(armies).reduce((a,b)=>a+b,0);
 expect(total(next.state.armies)-total(state.armies)).toBe(event?.changes.reduce((n,c)=>n+c.armiesAfter-c.armiesBefore,0)??0);
 expect(deserializeVersionedMatch(serializeVersionedMatch(f.options,next.state.history,f.identity)).state).toEqual(next.state);
});

test('largest reserve advances over successive owned hops instead of being starved by a small nearby reserve',()=>{
 let countries=graph({r:31,a:1,b:1,n:2,f:50,e:100},[['r','a'],['a','b'],['b','f'],['n','f'],['f','e']]);
 const distances:Record<string,number>={r:3,a:2,b:1,n:1,f:0};
 const potential=()=>countries.filter(c=>c.owner==='own').reduce((n,c)=>n+(c.armies-1)*distances[c.id]!,0);
 for(const [from,to] of [['r','a'],['a','b'],['b','f'],['n','f']]){
  const view=projection(countries),before=JSON.stringify(view),cost=potential();freeze(view);
  const action=decideComputerAction(view);expect(action).toEqual({kind:'friendlyMove',from,to});expect(view.movePairs).toContainEqual(action);expect(JSON.stringify(view)).toBe(before);
  const amount=countries.find(c=>c.id===from)!.armies-1;
  countries=countries.map(c=>({...c,armies:c.id===from?1:c.id===to?c.armies+amount:c.armies}));
  expect(potential()).toBeLessThan(cost);expect(countries.find(c=>c.id==='f')!.armies).toBeGreaterThanOrEqual(50);
 }
 expect(potential()).toBe(0);expect(decideComputerAction(projection(countries))).toEqual({kind:'endTurn'});
});

test('equal reserves prefer nearer fronts, then stable IDs despite input permutations',()=>{
 const nearer=projection(graph({'a-deep':7,mid:1,close:1,'z-near':7,f:50,e:100},[['a-deep','mid'],['mid','close'],['close','f'],['z-near','f'],['f','e']]));
 expect(decideComputerAction(nearer)).toEqual({kind:'friendlyMove',from:'z-near',to:'f'});
 const countries=graph({'z-reserve':10,'a-reserve':10,'z-hop':1,'a-hop':1,f:1,e:100},[['z-reserve','z-hop'],['a-reserve','z-hop'],['a-reserve','a-hop'],['z-hop','f'],['a-hop','f'],['f','e']]);
 const view=projection(countries),expected={kind:'friendlyMove',from:'a-reserve',to:'a-hop'};
 for(const input of [view,{...view,countries:[...countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()})),movePairs:[...view.movePairs].reverse()}]){
  freeze(input);expect(decideComputerAction(input)).toEqual(expected);
 }
});

test('a shortest owned route can begin with a sea link before reaching a frontier',()=>{
 // Hand-built public position on the frozen 96-region map, not an edited replay.
 // province_1 -> province_72 is a sea edge; the frontier around enemy_10 is farther on.
 const map=reserveFixture(96).state.map;
 expect(map.provinces.find(p=>p.id==='province_1')!.seaLanes).toContain('province_72');
 const view=projection(map.provinces.map(p=>({id:p.id,owner:p.id==='province_10'?'enemy':'own',armies:p.id==='province_1'?12:p.id==='province_10'?100:1,neighbours:[...p.borders,...p.seaLanes]})));
 const expected={kind:'friendlyMove',from:'province_1',to:'province_72'};
 expect(view.movePairs).toContainEqual(expected);expect(decideComputerAction(view)).toEqual(expected);
});

test('routing cannot cross an enemy, invent a legal pair or drain an exposed frontier',()=>{
 const blocked=projection(graph({r:12,a:1,e:100,f:50},[['r','a'],['a','e'],['e','f']]));
 expect(decideComputerAction(blocked)).toEqual({kind:'friendlyMove',from:'r',to:'a'});
 expect(decideComputerAction({...blocked,movePairs:[]})).toEqual({kind:'endTurn'});
 const exposed=projection(graph({f:50,back:1,e:100},[['f','back'],['f','e']]));
 expect(decideComputerAction(exposed)).toEqual({kind:'endTurn'});
 const noFront=projection(graph({r:12,a:1,e:100},[['r','a']]));
 expect(decideComputerAction(noFront)).toEqual({kind:'endTurn'});
});

test('available reserve routing stays below cards, capture, placement and favourable attacks',()=>{
 const view=projection(graph({r:31,a:1,f:20,e:10},[['r','a'],['a','f'],['f','e']]));
 expect(decideComputerAction(view)).toEqual({kind:'attack',from:'f',to:'e'});
 expect(decideComputerAction({...view,attacksThisTurn:view.attackBudget})).toEqual({kind:'friendlyMove',from:'r',to:'a'});
 expect(decideComputerAction({...view,pendingCapture:true})).toEqual({kind:'captureMove'});
 expect(decideComputerAction({...view,phase:'reinforce',reinforcementPool:4})).toEqual({kind:'reinforce',province:'f',amount:4});
 expect(decideComputerAction({...view,phase:'cards',cardStage:'raid-v1',ownHand:['Compass','Compass','Compass']})).toEqual({kind:'tradeCards',handIndices:[0,1,2]});
});
