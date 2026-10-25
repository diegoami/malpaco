import {expect,test} from 'vitest';
import * as core from '../../src/core';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import type {OffensiveDecision} from '../../src/core/computer-offensive';
function plan(v:ComputerStrategicView):OffensiveDecision {
 expect(core).toHaveProperty('planOffensive',expect.any(Function));
 return (core as unknown as {planOffensive:(v:ComputerStrategicView)=>OffensiveDecision}).planOffensive(v);
}
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
 return s;
}
function step(s:core.GameState,a:core.Action){const r=core.apply(s,a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);return r.state;}
function safe(){return state({a:8,b:1,e:1,z:20},[['a','b'],['a','e'],['e','z']],['e','z']);}
function defended(){return state({f:2,r:1,weak:1,danger:4,z:1},[['f','r'],['f','weak'],['f','danger'],['danger','z']],['weak','danger','z'],[
 {id:'home',bonus:6,provinces:['f']},{id:'rear',bonus:0,provinces:['r']},{id:'foes',bonus:0,provinces:['weak','danger','z']},
]);}
test('safe aggression remains legal and is reevaluated after each actual exchange/capture',()=>{
 let s=safe();const before=structuredClone(s),v=core.computerView(s),p=plan(v);expect(p.action).toEqual({kind:'attack',from:'a',to:'e'});expect(s).toEqual(before);
 for(let i=0;i<8&&s.phase==='attack';i++){const a=plan(core.computerView(s)).action;if(!a||a.kind!=='attack')break;s=step(s,a);}
 expect(s.history.length).toBeGreaterThan(0);if(s.phase==='capture')expect(plan(core.computerView(s))).toMatchObject({reason:'phase',action:null});
});
test('values an island-completing objective above the larger army gap',()=>{
 const s=state({a:10,b:7,home:1,weak:1,key:2,z:15},[['a','weak'],['b','key'],['a','home'],['b','home'],['weak','z'],['key','z']],['weak','key','z'],[
 {id:'valuable',bonus:6,provinces:['b','key']},{id:'elsewhere',bonus:0,provinces:['a','home','weak','z']},
 ]),v=core.computerView(s);expect(core.computerAction(s)).toMatchObject({kind:'attack',to:'weak'});
 const a=plan(v).action;expect(a).toEqual({kind:'attack',from:'b',to:'key'});step(s,a!);
});
test('protects a valuable source by stopping and accounts for first-card reward',()=>{
 const s=defended(),v={...core.computerView(s),attackBudget:1};expect(core.decideComputerAction(v)).toMatchObject({kind:'attack',to:'weak'});
 expect(plan(v).action).toEqual({kind:'endTurn'});
 const cards={...v,cardStage:'raid-v1' as const,drawCount:1};expect(plan(cards).action).toEqual({kind:'attack',from:'f',to:'weak'});
 expect(plan({...cards,drawCount:0,discardCount:0}).action).toEqual({kind:'endTurn'});
 expect(plan({...cards,strategy:{...cards.strategy,capturedThisTurn:true}}).action).toEqual({kind:'endTurn'});
});
test('stopping can move reserves forward even while a frozen attack remains available',()=>{
 const s=state({f:5,e:4,r:8,m:1,z:50},[['f','e'],['r','m'],['m','f'],['e','z']],['e','z']),v={...core.computerView(s),attackBudget:1,strategy:{...core.computerView(s).strategy,combat:{...s.rules.combat,ties:'defender' as const}}};
 expect(core.decideComputerAction(v)).toMatchObject({kind:'attack'});const p=plan(v);expect(p.action).toMatchObject({kind:'friendlyMove',from:'r',to:'m'});step(s,p.action!);
});
test('elimination and immediate domination urgency can justify a risky capture',()=>{
 const v={...core.computerView(defended()),attackBudget:1};expect(plan(v).action).toEqual({kind:'endTurn'});
 const elimination={...v,countries:v.countries.map(c=>c.id==='danger'||c.id==='z'?{...c,owner:'third'}:c)};
 expect(plan(elimination).action).toEqual({kind:'attack',from:'f',to:'weak'});
 const dom={...v,strategy:{...v.strategy,dominationTarget:3}};expect(plan(dom).action).toEqual({kind:'attack',from:'f',to:'weak'});expect(plan(dom).winningChance!.lower).toBeGreaterThan(0);
});
test('loss of strict advantage stops the next decision without granting more exchanges',()=>{
 const s=state({a:3,e:2,z:1},[['a','e'],['e','z']],['e','z']),v=core.computerView(s);
 const after={...v,countries:v.countries.map(c=>c.id==='a'?{...c,armies:2}:c),attacksThisTurn:1};
 expect(plan(after)).toMatchObject({reason:'phase',action:null});expect(core.decideComputerAction(after)).toEqual({kind:'endTurn'});
 expect(plan({...v,attacksThisTurn:v.attackBudget})).toMatchObject({reason:'phase',action:null});
});
test('unsupported/over-budget cutoff board explicitly preserves the executable frozen target',async()=>{
 const s=state({big:257,small:107,large:91,weak:1,z:1000},[['big','large'],['small','weak'],['large','z'],['weak','z']],['large','weak','z']),v={...core.computerView(s),attackBudget:96};
 const p=plan(v);expect(p).toMatchObject({action:null,reason:'budget'});
 const {decideArenaPolicy}=await import('../../tools/arena/policies');expect(decideArenaPolicy('tactical-v1',v)).toEqual({kind:'attack',from:'small',to:'weak'});
});
test('privacy, ordering, immutability and named operation limits',()=>{
 const v=core.computerView(safe()),before=structuredClone(v),expected=plan(v);expect(v).toEqual(before);
 const changed={...v,countries:[...v.countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()})),attackPairs:[...v.attackPairs].reverse(),movePairs:[...v.movePairs].reverse(),strategy:{...v.strategy,islands:[...v.strategy.islands].reverse().map(i=>({...i,provinces:[...i.provinces].reverse()}))}};
 Object.defineProperty(changed,'ownHand',{get(){throw Error('cards');}});Object.defineProperty(changed,'rng',{get(){throw Error('private');}});expect(plan(changed)).toEqual(expected);
 expect(expected.modelCells).toBeLessThanOrEqual(1048576);expect(expected.positions).toBeLessThanOrEqual(256);expect(expected.pairs).toBeLessThanOrEqual(6);
 expect(plan({...v,strategy:{...v.strategy,combat:{...v.strategy.combat,attackerDice:{max:2,minus:0}}}})).toMatchObject({action:null,reason:'unsupported'});
 expect(plan({...v,pendingRaid:true})).toMatchObject({action:null,reason:'phase'});
});
test('arena opt-in retains allocation/movement/default profiles and exposes full parameters',async()=>{
 const {decideArenaPolicy,baseline031,POLICY_DESCRIPTORS}=await import('../../tools/arena/policies');const s=safe(),v=core.computerView(s);
 expect(POLICY_DESCRIPTORS).toHaveProperty('tactical-v1');expect(decideArenaPolicy('tactical-v1',v)).toEqual(plan(v).action);
 expect(decideArenaPolicy('movement-v1',v)).toEqual(baseline031(v));expect(core.computerAction(s)).toEqual(core.decideComputerAction(v));
});
test('shortlist and projection admission enforce their bounds on wide and long campaigns',()=>{
 const armies:Record<string,number>={hub:1},edges:[string,string][]=[],enemies:string[]=[];
 for(let i=0;i<10;i++){armies[`a${i}`]=3;armies[`e${i}`]=1;edges.push([`a${i}`,`e${i}`],[`a${i}`,'hub']);enemies.push(`e${i}`);}
 const wide=plan(core.computerView(state(armies,edges,enemies)));expect(wide.pairs).toBe(6);expect(wide.modelCells).toBeLessThanOrEqual(1048576);expect(wide.positions).toBeLessThanOrEqual(256);
 const s=state({a:100,r:1,e:1,z:1},[['a','r'],['a','e'],['e','z']],['e','z']),v={...core.computerView(s),attackBudget:96};
 const long=plan(v);expect(long).toMatchObject({reason:'budget',action:null});expect(long.positions).toBeGreaterThan(200);expect(long.positions).toBeLessThanOrEqual(256);expect(long.modelCells).toBeLessThanOrEqual(1048576);
 const huge={...v,countries:Array.from({length:97},(_,i)=>({id:String(i),owner:i?'own':'enemy',armies:2,neighbours:[]})),attackPairs:[{kind:'attack' as const,from:'1',to:'0'}]};
 // Keep a strict-advantage candidate so setup reaches its map-size guard.
 huge.countries[1]!.armies=3;expect(plan(huge)).toMatchObject({reason:'unsupported',action:null});
});
test('arena applies legal attacks and capture allocation with exact army accounting',async()=>{
 const {decideArenaPolicy}=await import('../../tools/arena/policies');let s=safe(),captures=0;
 for(let i=0;i<24&&s.phase!=='finished';i++){
  const before=s,a=decideArenaPolicy('tactical-v1',core.computerView(s));expect(a).not.toBeNull();s=step(s,a!);
  const sum=(x:core.GameState)=>Object.values(x.armies).reduce((n,k)=>n+k,0);
  if(a!.kind==='attack')expect(sum(s)).toBe(sum(before)-1);
  if(a!.kind==='captureMove'){captures++;expect(sum(s)).toBe(sum(before));}
  expect(Object.values(s.armies).every(n=>n>=1)).toBe(true);
  if(s.currentPlayer!==before.currentPlayer)break;
 }
 expect(captures).toBeGreaterThan(0);
});
test('exact-score attack ties retain the frozen joined-key order for valid prefix IDs',()=>{
 const s=state({a:5,'a-':5,home:1,e:1,z:20},[['a','e'],['a-','e'],['a','home'],['a-','home'],['e','z']],['e','z']),v=core.computerView(s);
 expect(core.decideComputerAction(v)).toEqual({kind:'attack',from:'a-',to:'e'});
 expect(plan(v).action).toEqual(core.decideComputerAction(v));
});
