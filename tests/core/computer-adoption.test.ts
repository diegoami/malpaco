import {expect,test} from 'vitest';
import * as core from '../../src/core';
import wire from '../../fixtures/new-game/T141/tactical-resume.json';
import allocationCorpus from '../../fixtures/arena/allocation-v1-regression.json';
import {decideArenaPolicy,baseline031} from '../../tools/arena/policies';
import type {ComputerStrategicView} from '../../src/core/computer-view';
const load=()=>core.deserializeVersionedMatch(JSON.stringify(wire));
function improved(v:ComputerStrategicView){expect(core).toHaveProperty('decideTacticalAction',expect.any(Function));return (core as unknown as {decideTacticalAction:(v:ComputerStrategicView)=>core.Action|null}).decideTacticalAction(v);}
test('resumed recorded history stays exact and its next computer command uses improved movement',()=>{
 const {state:s,options,identity}=load(),before=structuredClone(s),view=core.computerView(s),expected=decideArenaPolicy('tactical-v1',view);
 expect(expected).toEqual({kind:'friendlyMove',from:'province_27',to:'province_26',amount:1});expect(expected).not.toEqual(baseline031(view));
 expect(core.computerAction(s)).toEqual(expected);expect(s).toEqual(before);
 const next=core.apply(s,expected!);expect(next.ok).toBe(true);if(!next.ok)throw Error(next.error);
 expect(next.state.history.slice(0,-1)).toEqual(s.history);const saved=core.serializeVersionedMatch(options,next.state.history,identity),restored=core.deserializeVersionedMatch(saved);
 expect(restored.state).toEqual(next.state);expect(s.rules.combat.ties).toBe('reroll');expect(restored.state.rules).toEqual(s.rules);
});
test('public production composition matches measured allocation/capture choices and explicit fallback',()=>{
 for(const row of allocationCorpus.cases){const v=row.view as ComputerStrategicView;expect(improved(v),row.name).toEqual(decideArenaPolicy('tactical-v1',v));}
 const v=core.computerView(load().state);for(const extra of [{},{pendingRaid:true},{pendingDiscard:true},{phase:'finished' as const},{phase:'human-loss' as const}])expect(improved({...v,...extra})).toEqual(decideArenaPolicy('tactical-v1',{...v,...extra}));
});
test('all future computer choices remain legal,private-stream independent and within the unchanged exchange cap',()=>{
 let s=load().state;const initial=s.currentPlayer,N=s.map.provinces.length;let attacks=0,captures=0,placements=0,count=0,pool=s.reinforcementPool;
 while(s.phase!=='finished'&&s.currentPlayer===initial){
  const before=structuredClone(s),v=core.computerView(s),a=core.computerAction(s);expect(a).toEqual(decideArenaPolicy('tactical-v1',v));expect(s).toEqual(before);expect(a).not.toBeNull();
  if(a!.kind==='attack')expect(++attacks).toBeLessThanOrEqual(N);
  if(a!.kind==='captureMove')expect(++captures).toBeLessThanOrEqual(attacks+Number(!!before.pendingCapture));
  if(a!.kind==='reinforce'){placements++;expect(a!.amount??1).toBeGreaterThan(0);pool=Math.max(pool,s.reinforcementPool);expect(placements).toBeLessThanOrEqual(pool);}
  const r=core.apply(s,a!);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);s=r.state;expect(++count).toBeLessThanOrEqual(pool+2*N+3);
 }
 const old=load().state,human={...old,players:old.players.map((p,i)=>i===old.currentPlayer?{...p,kind:'human' as const}:p)};expect(core.computerAction(human)).toBeNull();
});
for(const [label,start] of [['raid',415],['return',576]] as const)test(`new ${label} continuation retains its historical prefix and uses real adopted choices`,async()=>{
 const {readFileSync}=await import('node:fs');const text=readFileSync(`fixtures/new-game/T141/${label}-continuation.json`,'utf8'),f=core.deserializeVersionedMatch(text);let s=f.initialState!;
 for(let i=0;i<f.state.history.length;i++){
  const a=f.state.history[i]!;if(i>=start)expect(core.computerAction(s)).toEqual(a);
  const r=core.apply(s,a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);s=r.state;
 }
 expect(s).toEqual(f.state);expect(core.deserializeVersionedMatch(core.serializeVersionedMatch(f.options,s.history,f.identity)).state).toEqual(s);
});
test('preserved released Raid-loss checkpoint remains an exact recorded human-loss state',async()=>{
 const {readFileSync}=await import('node:fs');const text=readFileSync('fixtures/new-game/T141/historical-raid-loss.json','utf8'),f=core.deserializeVersionedMatch(text);
 expect(f.state.phase).toBe('human-loss');expect(f.state.history).toHaveLength(450);expect(core.computerAction(f.state)).toBeNull();
 const original=JSON.parse(readFileSync('fixtures/new-game/T41/parent-acceptance/proposed-browser/fixtures/policy-raid-after.json','utf8'));
 expect(f.state.history.slice(0,431)).toEqual(original.actions);
});
