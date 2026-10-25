import {expect,test} from 'vitest';
import * as core from '../../src/core';
import {reserveFixture,RESERVE_CASES} from '../helpers/reserve-fixtures';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import type {MovementDecision} from '../../src/core/computer-positioning';
function plan(v:ComputerStrategicView):MovementDecision {
 expect(core).toHaveProperty('planMovement',expect.any(Function));
 return (core as unknown as {planMovement:(v:ComputerStrategicView)=>MovementDecision}).planMovement(v);
}
// Designed graphs isolate decisions; the T128 saves below cover real generated maps.
function state(armies:Record<string,number>,edges:[string,string][],enemies:string[],islands?:{id:string;bonus:number;provinces:string[]}[]):core.GameState {
 const ids=Object.keys(armies),groups=islands??[{id:'all',bonus:2,provinces:ids}];
 const island=(id:string)=>groups.find(i=>i.provinces.includes(id))!.id;
 const map:core.GameMap={id:'positioning',name:'Positioning graph',bounds:{x:0,y:0,width:100,height:100},
  islands:groups.map(i=>({...i,name:i.id})),provinces:ids.map(id=>{
   const ns=edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
   return {id,name:id,island:island(id),borders:ns.filter(n=>island(n)===island(id)),seaLanes:ns.filter(n=>island(n)!==island(id)),polygon:[],labelAt:[0,0]};
  })};
 const s=core.newGame(map,{...core.victoryRules(),victoryOptions:{...core.victoryRules().victoryOptions!,dominationWin:false}},[{id:'own',name:'Own',kind:'computer',eliminated:false},{id:'enemy',name:'Enemy',kind:'computer',eliminated:false}],42);
 s.ownerOf=Object.fromEntries(ids.map(id=>[id,enemies.includes(id)?'enemy':'own']));s.armies={...armies};s.currentPlayer=0;s.history=[];s.phase='attack';s.reinforcementPool=0;
 // These tests isolate movement after the existing attack budget is exhausted.
 s.history=Array.from({length:ids.length},()=>({kind:'attack',from:edges[0]![0],to:edges[0]![1]}));return s;
}
function step(s:core.GameState,a:core.Action){const r=core.apply(s,a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);return r.state;}
function lateral(){return state({f:20,g:1,eF:15,eG:5},[['f','g'],['f','eF'],['g','eG']],['eF','eG']);}
function chosen(s:core.GameState){return plan(core.computerView(s)).action??core.computerAction(s)!;}
function total(s:core.GameState){return Object.values(s.armies).reduce((a,b)=>a+b,0);}
test('lateral transfer splits a stack, protects both ends and hands off exactly once',()=>{
 const s=lateral(),before=structuredClone(s),a=chosen(s);expect(a.kind).toBe('friendlyMove');
 if(a.kind!=='friendlyMove')throw Error('move required');
 expect(a.from).toBe('f');expect(a.to).toBe('g');expect(a.amount).toBeGreaterThan(0);expect(a.amount).toBeLessThan(19);
 const next=step(s,a);expect(next.armies.f).toBeGreaterThan(1);expect(next.armies.g).toBeGreaterThan(1);expect(total(next)).toBe(total(s));
 expect(next.currentPlayer).not.toBe(s.currentPlayer);expect(s).toEqual(before);
});
test('retains reserve behind two future fronts instead of draining it into one',()=>{
 const s=state({r:10,b:1,c:1,eB:8,eC:8},[['r','b'],['r','c'],['b','eB'],['c','eC']],['eB','eC'],[
  {id:'home',bonus:8,provinces:['r']},{id:'west',bonus:0,provinces:['b','eB']},{id:'east',bonus:0,provinces:['c','eC']},
 ]),baseline=core.decideComputerAction(core.computerView(s))!;expect(baseline.kind).toBe('friendlyMove');
 const result=step(s,chosen(s));expect(result.armies.r).toBeGreaterThan(1);
});
test('keeps a valuable exposed source instead of stripping it for attack readiness',()=>{
 const s=state({f:12,g:1,eF:10,eG:1,z:100},[['f','g'],['f','eF'],['g','eG'],['eF','z']],['eF','eG','z'],[
  {id:'home',bonus:8,provinces:['f']},{id:'front',bonus:0,provinces:['g','eG']},{id:'enemy',bonus:0,provinces:['eF','z']},
 ]);expect(step(s,chosen(s)).armies.f).toBeGreaterThan(1);
});
for(const {size,from,to,armies} of RESERVE_CASES)test(`T128 ${size} saved reserve makes legal full forward progress`,()=>{
 const {state:s}=reserveFixture(size),v=core.computerView(s),a=chosen(s);expect(a).toMatchObject({kind:'friendlyMove',from,to});
 const next=step(s,a);expect(next.armies[from]).toBe(1);expect(next.armies[to]).toBe(s.armies[to]!+armies-1);expect(total(next)).toBe(total(s));
 expect(plan(v).modelCells).toBeLessThanOrEqual(524288);
});
test('static-board reserve follows decreasing owned distance without reversal',()=>{
 let s=state({a:7,b:1,c:1,f:1,e:100},[['a','b'],['b','c'],['c','f'],['f','e']],['e']);
 for(const [from,to] of [['a','b'],['b','c'],['c','f']]){
  const a=chosen(s);expect(a).toMatchObject({kind:'friendlyMove',from,to});s=step(s,a);
  // Hold opponent position fixed and start the next own movement decision.
  s.currentPlayer=0;s.phase='attack';s.history=Array.from({length:5},()=>({kind:'attack',from:'f',to:'e'}));s.reinforcementPool=0;
 }
 expect(chosen(s)).toEqual({kind:'endTurn'});
});
test('no owned route to a front does not invent movement',()=>{
 const s=state({a:7,b:1,e:3},[['a','b']],['e']);expect(chosen(s)).toEqual({kind:'endTurn'});
});
test('safe full concentration remains correct, including a sea-lane transfer',()=>{
 const s=state({r:7,f:1,e:1},[['r','f'],['f','e']],['e'],[{id:'rear',bonus:0,provinces:['r']},{id:'front',bonus:0,provinces:['f','e']}]);
 const a=chosen(s);expect(a).toMatchObject({kind:'friendlyMove',from:'r',to:'f'});expect(step(s,a).armies.r).toBe(1);
});
test('public-only input, immutability and ordering independence',()=>{
 const v=core.computerView(lateral()),before=structuredClone(v),expected=plan(v);expect(v).toEqual(before);
 const changed={...v,countries:[...v.countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()})),movePairs:[...v.movePairs].reverse(),strategy:{...v.strategy,islands:[...v.strategy.islands].reverse().map(i=>({...i,provinces:[...i.provinces].reverse()}))}};
 Object.defineProperty(changed,'ownHand',{get(){throw Error('card read');}});Object.defineProperty(changed,'rng',{get(){throw Error('private RNG');}});
 expect(plan(changed)).toEqual(expected);
});
test('phase, attack, mandatory choices, unsupported model and work-budget fallbacks are explicit',()=>{
 const v=core.computerView(lateral());
 for(const extra of [{phase:'reinforce' as const},{pendingRaid:true},{pendingDiscard:true},{pendingCapture:true},{attacksThisTurn:0}])expect(plan({...v,...extra})).toMatchObject({action:null,reason:'phase'});
 expect(plan({...v,strategy:{...v.strategy,combat:{...v.strategy.combat,attackerDice:{max:2,minus:0}}}})).toMatchObject({action:null,reason:'unsupported'});
 expect(plan({...v,countries:v.countries.map(c=>({...c,armies:2000}))})).toMatchObject({action:null,reason:'budget'});
 expect(plan({...v,countries:Array.from({length:97},(_,i)=>({id:String(i),owner:'own',armies:1,neighbours:[]}))})).toMatchObject({action:null,reason:'unsupported'});
 expect(plan({...v,movePairs:[{kind:'friendlyMove',from:'f',to:'eF'}]})).toMatchObject({action:null,reason:'unsupported'});
});
test('pair, amount and work enumeration are bounded and canonical',()=>{
 const armies:Record<string,number>={e:1},edges:[string,string][]=[];
 for(let i=0;i<10;i++){armies[`a${i}`]=10;edges.push([`a${i}`,'e']);if(i)edges.push([`a${i-1}`,`a${i}`]);}
 const v=core.computerView(state(armies,edges,['e'])),p=plan(v);expect(p.reason).not.toBe('phase');expect(p.pairs).toBe(5);expect(p.candidates).toBeGreaterThan(8);
 expect(p.candidates).toBeLessThanOrEqual(48);expect(p.modelCells).toBeLessThanOrEqual(524288);
 expect(plan({...v,movePairs:[...v.movePairs].reverse()})).toEqual(p);
});
test('arena controls stay fixed while the host adopts tactical decisions',async()=>{
 const {decideArenaPolicy,baseline031,POLICY_DESCRIPTORS}=await import('../../tools/arena/policies'),s=lateral(),v=core.computerView(s);
 expect(POLICY_DESCRIPTORS).toHaveProperty('movement-v1');expect(decideArenaPolicy('movement-v1',v)).toEqual(chosen(s));
 expect(decideArenaPolicy('allocation-v1',v)).toEqual(baseline031(v));expect(core.computerAction(s)).toEqual(core.decideTacticalAction(v));
});
