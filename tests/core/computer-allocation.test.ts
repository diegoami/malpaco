import {expect,test,vi} from 'vitest';
import * as core from '../../src/core';
import type {AllocationDecision} from '../../src/core/computer-allocation';
import type {ComputerStrategicView} from '../../src/core/computer-view';

function plan(view:ComputerStrategicView):AllocationDecision {
 expect(core).toHaveProperty('planAllocation',expect.any(Function));
 return (core as unknown as {planAllocation:(v:ComputerStrategicView)=>AllocationDecision}).planAllocation(view);
}
/** Hand-built engine positions, not ordinary saved-match/reachability claims. */
function state(armies:Record<string,number>,edges:[string,string][],enemies:string[],islands?:{id:string;bonus:number;provinces:string[]}[]):core.GameState {
 const ids=Object.keys(armies),groups=islands??[{id:'all',bonus:2,provinces:ids}];
 const island=(id:string)=>groups.find(i=>i.provinces.includes(id))!.id;
 const map:core.GameMap={id:'allocation',name:'Allocation graph',bounds:{x:0,y:0,width:100,height:100},
  islands:groups.map(i=>({...i,name:i.id})),provinces:ids.map(id=>{
   const ns=edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
   return {id,name:id,island:island(id),borders:ns.filter(n=>island(n)===island(id)),seaLanes:ns.filter(n=>island(n)!==island(id)),polygon:[],labelAt:[0,0]};
  })};
 const s=core.newGame(map,core.victoryRules(),[{id:'own',name:'Own',kind:'computer',eliminated:false},{id:'enemy',name:'Enemy',kind:'computer',eliminated:false}],42);
 s.ownerOf=Object.fromEntries(ids.map(id=>[id,enemies.includes(id)?'enemy':'own']));s.armies={...armies};s.currentPlayer=0;s.history=[];s.phase='reinforce';s.reinforcementPool=6;return s;
}
function step(s:core.GameState,a:core.Action){const result=core.apply(s,a);expect(result.ok).toBe(true);if(!result.ok)throw Error(result.error);return result.state;}
function place(s:core.GameState){let count=0;while(s.reinforcementPool>0){const p=plan(core.computerView(s)),a=p.action??core.computerAction(s);expect(a?.kind).toBe('reinforce');s=step(s,a!);expect(++count).toBeLessThanOrEqual(6);}return s;}
function balanced(){return state({a:1,b:1,eA:4,eB:4,remote:100},[['a','b'],['a','eA'],['b','eB'],['eA','remote'],['eB','remote']],['eA','eB','remote']);}
function protectedSource(){
 const s=state({source:9,target:1,b:1,c:1,danger:8,other:4,z:1},[['source','target'],['source','b'],['b','c'],['source','danger'],['target','other'],['danger','z']],['danger','other','z'],[
  {id:'home',bonus:6,provinces:['source','b','c']},{id:'front',bonus:2,provinces:['target','other']},{id:'hostile',bonus:2,provinces:['danger','z']},
 ]);s.phase='capture';s.reinforcementPool=0;s.pendingCapture={from:'source',to:'target',min:1,max:9,defaultAmount:9};return s;
}
function capture(s:core.GameState){const p=plan(core.computerView(s));return step(s,p.action??core.computerAction(s)!);}
function upper(s:core.GameState,from:string,to:string){const r=core.estimateCapturePath(core.computerView(s),from,[to],core.reinforcementIncome(s,'enemy').total);expect(r.kind).toBe('bounded');if(r.kind!=='bounded')throw Error(r.reason);return r.upper;}

test('full placement splits between two threatened fronts and lowers maximum conditional capture risk',()=>{
 const s=balanced(),baseline=step(s,core.computerAction(s)!),result=place(s);
 expect([result.armies.a,result.armies.b]).toEqual([4,4]);
 expect(Math.max(upper(result,'eA','a'),upper(result,'eB','b'))).toBeLessThan(Math.max(upper(baseline,'eA','a'),upper(baseline,'eB','b')));
 expect(Object.values(result.armies).reduce((a,b)=>a+b,0)).toBe(Object.values(s.armies).reduce((a,b)=>a+b,0)+6);
 expect(result.rng).toEqual(s.rng);expect(result.computerRngs).toEqual(s.computerRngs);
});
test('reinforcement protects a valuable island entrance instead of the largest unrelated stack',()=>{
 const s=state({a:2,b:1,c:1,x:10,f:6,w:1,z:100},[['a','b'],['b','c'],['c','x'],['a','f'],['x','w'],['w','z'],['f','z']],['f','w','z'],[
  {id:'home',bonus:6,provinces:['a','b','c']},{id:'front',bonus:2,provinces:['x','w']},{id:'hostile',bonus:2,provinces:['f','z']},
 ]);
 const baseline=step(s,core.computerAction(s)!),result=place(s);
 expect(result.armies.a).toBeGreaterThan(s.armies.a!);expect(result.armies.x).toBeLessThan(baseline.armies.x!);
 expect(upper(result,'f','a')).toBeLessThan(upper(baseline,'f','a'));
});
test('an immediate one-capture win can correctly justify concentrated placement',()=>{
 const s=state({a:2,b:1,e:3},[['a','b'],['a','e'],['b','e']],['e']);s.reinforcementPool=4;
 const result=place(s),baseline=step(s,core.computerAction(s)!);
 expect(result.armies).toEqual(baseline.armies);expect(result.armies.a).toBe(6);expect(result.armies.b).toBe(1);
});
test('capture retains an exposed valuable source while the baseline transfers its maximum',()=>{
 const s=protectedSource(),before=structuredClone(s),baseline=step(s,core.computerAction(s)!),result=capture(s);
 expect(result.armies.source).toBeGreaterThan(1);expect(result.armies.target).toBeLessThan(baseline.armies.target!);
 expect(upper(result,'danger','source')).toBeLessThan(upper(baseline,'danger','source'));
 expect(Object.values(result.armies).reduce((a,b)=>a+b,0)).toBe(Object.values(s.armies).reduce((a,b)=>a+b,0));expect(s).toEqual(before);
});
test('maximum capture remains correct for a safe source and an immediate winning front',()=>{
 const s=state({source:9,target:1,e:1},[['source','target'],['target','e']],['e']);
 s.phase='capture';s.reinforcementPool=0;s.pendingCapture={from:'source',to:'target',min:1,max:9,defaultAmount:9};
 expect(capture(s).armies).toEqual({source:1,target:9,e:1});
});
test('exhausted attack budget cannot justify draining a valuable source for a phantom immediate win',()=>{
 const s=protectedSource();s.ownerOf.z='own';
 const view=core.computerView(s);expect(Object.values(s.ownerOf).filter(x=>x==='own')).toHaveLength(5);expect(view.strategy.dominationTarget).toBe(6);
 const normal=plan(view),ordinary=step(s,normal.action??core.computerAction(s)!);expect(ordinary.armies.target).toBe(9);
 const limited=plan({...view,attacksThisTurn:view.attackBudget});expect(limited.action?.kind).toBe('captureMove');
 const protectedState=step(s,limited.action!);expect(protectedState.armies.source).toBeGreaterThan(1);
});
for(const ties of ['reroll','defender'] as const)test(`legal balanced capture split under ${ties} ties`,()=>{
 const initial=state({source:9,target:1,eA:5,eB:5,remote:100},[['source','target'],['source','eA'],['target','eB'],['eA','remote'],['eB','remote']],['eA','eB','remote']);
 const s={...initial,rules:{...initial.rules,combat:{...initial.rules.combat,ties}}};s.phase='capture';s.reinforcementPool=0;s.pendingCapture={from:'source',to:'target',min:1,max:9,defaultAmount:9};
 const baseline=step(s,core.computerAction(s)!),result=capture(s);
 expect(result.armies.source).toBeGreaterThan(1);expect(result.armies.target).toBeGreaterThan(1);
 expect(Math.max(upper(result,'eA','source'),upper(result,'eB','target'))).toBeLessThan(Math.max(upper(baseline,'eA','source'),upper(baseline,'eB','target')));
});
test('private fields, card contents and input permutations cannot change the planner',()=>{
 const view=core.computerView(balanced()),before=structuredClone(view),expected=plan(view);expect(view).toEqual(before);
 const changed={...view,countries:[...view.countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()})),strategy:{...view.strategy,islands:[...view.strategy.islands].reverse().map(i=>({...i,provinces:[...i.provinces].reverse()}))}};
 Object.defineProperty(changed,'ownHand',{get(){throw Error('unneeded card contents read');}});
 Object.defineProperty(changed,'rng',{get(){throw Error('private stream read');}});
 expect(plan(changed)).toEqual(expected);
});
test('large capture ranges use finite legal candidates and unsupported map sizes fall back',()=>{
 const s=state({source:100,target:1,eA:5,eB:5,remote:100},[['source','target'],['source','eA'],['target','eB'],['eA','remote'],['eB','remote']],['eA','eB','remote']);
 s.phase='capture';s.reinforcementPool=0;s.pendingCapture={from:'source',to:'target',min:1,max:100,defaultAmount:100};
 const view=core.computerView(s),choice=plan(view);expect(choice.candidates).toBeLessThanOrEqual(24);expect(choice.modelCells).toBeLessThanOrEqual(262144);
 const next=step(s,choice.action??core.computerAction(s)!);expect(next.armies.source).toBeGreaterThanOrEqual(1);expect(next.armies.target).toBeGreaterThanOrEqual(1);
 expect(next.armies.source!+next.armies.target!).toBe(101);
 const tooLarge={...view,countries:Array.from({length:97},(_,i)=>({id:String(i),owner:'own',armies:1,neighbours:[]}))};
 expect(plan(tooLarge)).toMatchObject({action:null,reason:'unsupported'});
});
test('capture range at the candidate limit evaluates all 24 legal amounts',()=>{
 const s=state({source:24,target:1,eA:5,eB:5,remote:100},[['source','target'],['source','eA'],['target','eB'],['eA','remote'],['eB','remote']],['eA','eB','remote']);
 s.phase='capture';s.reinforcementPool=0;s.pendingCapture={from:'source',to:'target',min:1,max:24,defaultAmount:24};
 const choice=plan(core.computerView(s));expect(choice.candidates).toBe(24);expect(choice.modelCells).toBeLessThanOrEqual(262144);
 step(s,choice.action??core.computerAction(s)!);
});
test('source enumeration is capped at eight distinct strongest adjacent sources',async()=>{
 const armies:Record<string,number>={},edges:[string,string][]=[],enemies:string[]=[];
 for(let i=0;i<12;i++){armies[`a${i}`]=1;armies[`e${i}`]=i+2;edges.push([`a${i}`,`e${i}`]);enemies.push(`e${i}`);if(i)edges.push([`a${i-1}`,`a${i}`]);}
 const view=core.computerView(state(armies,edges,enemies)),module=await import('../../src/core/computer-risk'),actual=module.estimateCapturePath,seen=new Set<string>();
 const spy=vi.spyOn(module,'estimateCapturePath').mockImplementation((v,from,targets,extra)=>{
  if(v.countries.find(c=>c.id===from)!.owner==='enemy')seen.add(from);return actual(v,from,targets,extra);
 });
 try{const choice=plan(view);expect(choice.modelCells).toBeLessThanOrEqual(262144);expect(choice.candidates).toBeLessThanOrEqual(24);
  expect(seen).toEqual(new Set(Array.from({length:8},(_,i)=>`e${i+4}`)));
 }finally{spy.mockRestore();}
});
test('unsupported or oversized assessments return explicit bounded fallback, not zero danger',()=>{
 const view=core.computerView(balanced());
 const unsupported={...view,strategy:{...view.strategy,combat:{...view.strategy.combat,attackerDice:{max:3,minus:1}}}};
 expect(plan(unsupported)).toMatchObject({action:null,reason:'unsupported'});
 const big={...view,countries:view.countries.map(c=>({...c,armies:2000}))};
 expect(plan(big)).toMatchObject({action:null,reason:'budget'});
 for(const v of [view,big,unsupported]){const result=plan(v);expect(result.modelCells).toBeLessThanOrEqual(262144);expect(result.candidates).toBeLessThanOrEqual(24);}
});
test('other phases, mandatory card choices and empty pools preserve baseline routing',()=>{
 const s=balanced(),view=core.computerView(s);
 for(const v of [{...view,phase:'attack' as const},{...view,phase:'cards' as const},{...view,reinforcementPool:0},{...view,pendingRaid:true},{...view,pendingDiscard:true},{...view,pendingCapture:true}])expect(plan(v).action).toBeNull();
 expect(core.computerAction(s)).toEqual(core.decideComputerAction(view));
});
test('arena opt-in uses allocation/capture overrides while the default policy stays unchanged',async()=>{
 const arena=await import('../../tools/arena/policies');
 expect(arena.POLICY_DESCRIPTORS['allocation-v1']!.parameters).toHaveProperty('riskTolerance',500000);
 for(const s of [balanced(),protectedSource()]){
  const view=core.computerView(s),expected=plan(view).action;
  expect(expected).not.toBeNull();expect(arena.decideArenaPolicy('allocation-v1',view)).toEqual(expected);
  expect(core.computerAction(s)).toEqual(core.decideComputerAction(view));
 }
 const view={...core.computerView(balanced()),phase:'attack' as const};
 expect(arena.decideArenaPolicy('allocation-v1',view)).toEqual(arena.baseline031(view));
});
