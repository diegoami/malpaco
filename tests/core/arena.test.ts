import {expect,test,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as core from '../../src/core';
import corpus from '../../fixtures/arena/baseline-031.json';
import type * as Arena from '../../tools/arena/model';
import type * as Policies from '../../tools/arena/policies';

const modules=import.meta.glob('../../tools/arena/model.ts',{eager:true});
const policyModules=import.meta.glob('../../tools/arena/policies.ts',{eager:true});
function arena():typeof Arena {const api=Object.values(modules)[0];expect(api).toHaveProperty('scheduleArena',expect.any(Function));return api as typeof Arena;}
function policies():typeof Policies {const api=Object.values(policyModules)[0];expect(api).toHaveProperty('baseline031',expect.any(Function));return api as typeof Policies;}
const config={cohort:'development' as const,seeds:[0],regions:[46 as const],policies:['baseline-031','largest-gap-v1'],ties:['reroll' as const]};

test('frozen comparator reproduces the released public-decision corpus and provenance',()=>{
 const api=policies();expect(api.POLICY_DESCRIPTORS['baseline-031']!.sourceCommit).toBe(corpus.sourceCommit);
 expect(api.POLICY_DESCRIPTORS['baseline-031']!.sourceHashes).toEqual(corpus.sourceHashes);
 for(const row of corpus.cases)expect(api.baseline031(row.view as core.ComputerDecisionView),row.name).toEqual(row.action);
 const digest=createHash('sha256').update(readFileSync('tools/arena/frozen-031.ts')).digest('hex');
 expect(digest).toBe((corpus as unknown as {frozenModuleSha256:string}).frozenModuleSha256);
});
test('frozen policy does not call current decision, reserve or card-classification helpers',async()=>{
 const api=policies(),decision=await import('../../src/core/computer'),movement=await import('../../src/core/computer-movement'),cards=await import('../../src/core/cards');
 const spies=[vi.spyOn(decision,'decideComputerAction'),vi.spyOn(movement,'reserveTransfer'),vi.spyOn(cards,'classifyCardSet')];
 for(const spy of spies)spy.mockImplementation(()=>{throw Error('current policy dependency');});
 try{for(const row of corpus.cases)expect(api.baseline031(row.view as core.ComputerDecisionView)).toEqual(row.action);}finally{for(const spy of spies)spy.mockRestore();}
});
test('independent two-seat rotation example has exactly four unique assignments/first-seat cases',()=>{
 const cases=arena().scheduleArena(config);
 expect(cases.map(c=>[c.policies.join('/'),c.firstOffset])).toEqual([
  ['baseline-031/largest-gap-v1',0],['baseline-031/largest-gap-v1',1],
  ['largest-gap-v1/baseline-031',0],['largest-gap-v1/baseline-031',1],
 ]);
 expect(new Set(cases.map(c=>c.id)).size).toBe(4);
});
test('identical policy rotations are deduplicated and all three-seat first offsets remain',()=>{
 const api=arena();
 expect(api.scheduleArena({...config,policies:['baseline-031','baseline-031']})).toHaveLength(2);
 const cases=api.scheduleArena({...config,policies:['baseline-031','hold-v1','baseline-031']});
 expect(cases).toHaveLength(9);
 expect(new Set(cases.map(c=>c.policies.join('/')))).toEqual(new Set(['baseline-031/hold-v1/baseline-031','hold-v1/baseline-031/baseline-031','baseline-031/baseline-031/hold-v1']));
 for(const offset of [0,1,2])expect(cases.filter(c=>c.firstOffset===offset)).toHaveLength(3);
});
test('seed partitions, unsupported configurations, duplicate axes and excess caps are rejected',()=>{
 const api=arena();
 expect(api.scheduleArena({...config,cohort:'evaluation',seeds:[1000]})).toHaveLength(4);
 for(const change of [{seeds:[1000]},{cohort:'evaluation',seeds:[0]},{seeds:[0,0]},{regions:[46,46]},{regions:[47]},
  {policies:['missing','baseline-031']},{policies:['baseline-031']},{ties:['reroll','reroll']},{ties:['attacker']},{actionCap:20001},{roundCap:101},{actionCap:0},{roundCap:0},{extra:'unknown'}]){
  expect(()=>api.scheduleArena({...config,...change} as unknown as Arena.ArenaConfig)).toThrow();
 }
});
for(const regions of [46,72,96] as const)for(const seats of [2,3,4])test(`research start ${regions}/${seats}: paired core, first-player transform and experimental identity`,()=>{
 const api=arena(),policies=Array(seats).fill('baseline-031') as string[];
 const cases=api.scheduleArena({...config,regions:[regions],policies,ties:['reroll','defender']});
 const start=api.createArenaStart(cases[0]!);expect(start.ok).toBe(true);if(!start.ok)throw Error(start.errors.join(';'));
 const payload=(s:core.GameState)=>({map:s.map,ownerOf:s.ownerOf,armies:s.armies,cards:s.cards,rng:s.rng,computerRngs:s.computerRngs});
 expect(start.state.map.provinces).toHaveLength(regions);expect(start.options.seats).toHaveLength(seats);
 for(const c of [cases[1]!,cases.at(-1)!]){
  const other=api.createArenaStart(c);expect(other.ok).toBe(true);if(!other.ok)throw Error(other.errors.join(';'));
  expect(payload(other.state)).toEqual(payload(start.state));expect(other.state.rules.combat.ties).toBe(c.ties);
  expect(other.state.rules.id).toContain('research-arena');expect(other.state.roundOrigin).toBe(other.state.currentPlayer);
  expect(other.state.reinforcementPool).toBe(core.reinforcementIncome(other.state,core.activePlayer(other.state)!.id).total);
 }
});
test('diagnostic controls make distinct legal choices using public fields only',()=>{
 const api=arena(),p=policies(),start=api.createArenaStart(api.scheduleArena(config)[0]!);if(!start.ok)throw Error('start');
 const view={...core.computerView(start.state),phase:'attack' as const,playerId:'own',pendingRaid:false,pendingDiscard:false,pendingCapture:false,
  countries:[{id:'a',owner:'own',armies:10,neighbours:['b']},{id:'b',owner:'enemy',armies:1,neighbours:['a']},{id:'z',owner:'own',armies:20,neighbours:['d']},{id:'d',owner:'enemy',armies:3,neighbours:['z']}],
  attackPairs:[{kind:'attack' as const,from:'a',to:'b'},{kind:'attack' as const,from:'z',to:'d'}],movePairs:[],attacksThisTurn:0};
 expect(p.decideArenaPolicy('baseline-031',view)).toEqual({kind:'attack',from:'a',to:'b'});
 expect(p.decideArenaPolicy('largest-gap-v1',view)).toEqual({kind:'attack',from:'z',to:'d'});
 expect(p.decideArenaPolicy('hold-v1',view)).toEqual({kind:'endTurn'});
 Object.defineProperty(view,'rng',{get(){throw Error('private stream read');}});
 for(const id of Object.keys(p.POLICY_DESCRIPTORS))expect(p.decideArenaPolicy(id,view)).toBeDefined();
});
test('short budget retains an unfinished accepted prefix with exact replay and repeat',()=>{
 const api=arena(),c=api.scheduleArena({...config,actionCap:1})[0]!;
 const first=api.runArenaCase(c);expect(first.row).toMatchObject({status:'unfinished',actions:1,replayVerified:true,winnerPolicy:null});
 expect(first.row.optionsHash).toBe(createHash('sha256').update(JSON.stringify(first.options)).digest('hex'));
 expect(first.history).toHaveLength(1);expect(api.runArenaCase(c)).toEqual(first);
});
test('directly modified case limits cannot bypass the fixed maximum caps',()=>{
 const api=arena(),c=api.scheduleArena(config)[0]!;
 const result=api.runArenaCase({...c,actionCap:20001});
 expect(result.row).toMatchObject({status:'error',actions:0,replayVerified:null});expect(result.initial).toBeNull();
});
test('round cutoff stops a nonattacking game after the declared completed round',()=>{
 const api=arena(),c=api.scheduleArena({...config,policies:['hold-v1','hold-v1'],roundCap:1})[0]!;
 const result=api.runArenaCase(c);
 expect(result.row).toMatchObject({status:'unfinished',roundAtStop:2,replayVerified:true});
 expect(result.history.filter(a=>a.kind==='endTurn')).toHaveLength(2);
 expect(result.history.some(a=>a.kind==='attack')).toBe(false);
});
test('host passes only copied public facts to a policy and mutations cannot corrupt the engine',()=>{
 const api=arena(),p=policies(),c=api.scheduleArena({...config,actionCap:4})[0]!;
 let calls=0;
 const result=api.runArenaCase(c,{decide:(id,view)=>{
  calls++;for(const hidden of ['rng','computerRngs','history','players','policyRoster','drawPile'])expect(view).not.toHaveProperty(hidden);
  const action=p.decideArenaPolicy(id,view);
  // Exercise the actual copied nested boundary while preserving the chosen action.
  (view.countries[0] as {owner:string}).owner='corrupted';
  (view.strategy.combat.attackerDice as {max:number}).max=99;
  return action;
 }});
 expect(calls).toBe(4);expect(result.row).toMatchObject({status:'unfinished',actions:4,replayVerified:true});
 expect(Object.values(result.initial?.ownerOf??{})).not.toContain('corrupted');
});
test('a real paired game finishes or reaches the declared cap and replays without invoking policy',()=>{
 const api=arena(),c=api.scheduleArena(config)[0]!,first=api.runArenaCase(c);
 expect(['finished','unfinished']).toContain(first.row.status);expect(first.row.replayVerified).toBe(true);
 expect(first.row.actions).toBe(first.history.length);expect(first.row.actions).toBeLessThanOrEqual(20000);
 const reversed=api.scheduleArena(config).reverse().find(x=>x.id===c.id)!;expect(api.runArenaCase(reversed)).toEqual(first);
});
test('generation refusal, policy exception and illegal attempted action all retain scheduled rows and prefixes',()=>{
 const api=arena(),c=api.scheduleArena(config)[0]!;
 const refused=api.runArenaCase(c,{create:()=>({ok:false,errors:['controlled refusal']})});
 expect(refused.row).toMatchObject({status:'refused',actions:0,replayVerified:null});expect(refused.row.error).toContain('controlled refusal');
 const thrown=api.runArenaCase(c,{decide:()=>{throw Error('controlled policy exception');}});
 expect(thrown.row).toMatchObject({status:'error',actions:0,replayVerified:true});expect(thrown.row.error).toContain('controlled policy exception');
 const action={kind:'attack' as const,from:'missing',to:'absent'};
 const illegal=api.runArenaCase(c,{decide:()=>action});
 expect(illegal.row).toMatchObject({status:'error',actions:0,replayVerified:true,failedAction:action});expect(illegal.history).toEqual([]);
});
test('independent summary table keeps unfinished/refused/errors in the denominator and preserves replay failures',()=>{
 const api=arena(),c=api.scheduleArena(config)[0]!;
 const statuses=['finished','finished','unfinished','refused','error'] as const;
 const rows=statuses.map((status,i)=>({case:{...c,id:String(i)},status,winnerPolicy:i===0||i===4?'baseline-031':i===1?'largest-gap-v1':null,replayVerified:i===3?null:i!==4})) as Arena.ArenaRow[];
 expect(api.summarizeArena(rows)).toEqual({scheduled:5,finished:2,unfinished:1,refused:1,error:1,replayFailures:1,
  wins:{'baseline-031':1,'largest-gap-v1':1},seatOpportunities:{'baseline-031':5,'largest-gap-v1':5}});
 expect(()=>api.summarizeArena([rows[0]!,rows[0]!])).toThrow();
});
