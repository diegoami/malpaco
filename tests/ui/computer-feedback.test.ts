import {expect,test} from 'vitest';
import {BattleController} from '../../src/ui/battleController';
import {createReferenceGame} from '../../src/core/reference-game';
import {referenceMap} from '../../src/core/reference-map';
import {defaultOptions} from '../../src/core/options';
test('computer presentation holds input without acknowledging a card or changing game state',()=>{
 const made=createReferenceGame(referenceMap,defaultOptions());if(!made.ok)throw Error(made.errors.join());made.state.currentPlayer=0;made.state.phase='attack';const b=new BattleController(made.state,{schedule:()=>1,cancel:()=>{}}),before=JSON.stringify(b.state);
 (b as BattleController & {setComputerFeedbackPending?:(v:boolean)=>void}).setComputerFeedbackPending?.(true);expect(b.dispatch({kind:'endTurn'})).toBe(false);expect(JSON.stringify(b.state)).toBe(before);expect(b.cardAcknowledgmentPending).toBe(false);
});

import {ComputerFeedbackController,feedbackDuration} from '../../src/ui/computerFeedback';
import {islandRules} from '../../src/core/state';
import {humanGuidance,turnRows} from '../../src/ui/turnTracker';
import {legalAttacks} from '../../src/core/rules';
import type {GameState} from '../../src/core';
class Clock {
 now=0;counter=0;jobs=new Map<number,{at:number;fn:()=>void}>();all:(()=>void)[]=[];
 schedule=(fn:()=>void,ms:number)=>{const id=++this.counter;this.jobs.set(id,{at:this.now+ms,fn});this.all.push(fn);return id;};cancel=(id:number)=>{this.jobs.delete(id);};
 run(ms:number){const end=this.now+ms;for(;;){const next=[...this.jobs].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;this.now=next[1].at;this.jobs.delete(next[0]);next[1].fn();}this.now=end;}
}
function setup(){const o={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Off' as const},made=createReferenceGame(referenceMap,o,islandRules(o));if(!made.ok)throw Error(made.errors.join());const s=made.state;s.currentPlayer=1;s.phase='reinforce';s.reinforcementPool=5;const clock=new Clock(),b=new BattleController(s,clock),fx=new ComputerFeedbackController(b,clock,()=>{});return {s,b,clock,fx};}
const opts={speed:'normal' as const,forward:false,paused:false,ack:false,reduced:false};
test('reinforcement feedback interpolates a public executed action while core state/history/RNG remain final',()=>{
 const {b,fx,clock}=setup(),id=Object.keys(b.state.ownerOf).find(id=>b.state.ownerOf[id]==='seat2')!,before=b.state.armies[id]!;expect(b.dispatchComputer({kind:'reinforce',province:id,amount:3})).toBe(true);const snapshot=JSON.stringify(b.state);fx.update(opts);expect(fx.pending).toBe(true);expect(b.computerFeedbackPending).toBe(true);expect(b.cardAcknowledgmentPending).toBe(false);expect(fx.frame?.changes.find(c=>c.id===id)).toMatchObject({before,after:before+3});
 clock.run(325);expect(fx.frame?.progress).toBe(.5);expect(JSON.stringify(b.state)).toBe(snapshot);clock.run(325);expect(fx.pending).toBe(false);expect(b.computerFeedbackPending).toBe(false);expect(JSON.stringify(b.state)).toBe(snapshot);
});
test('pause/dispose/replacement invalidate every old timer and never replay an already executed action',()=>{
 const {b,fx,clock}=setup(),id=Object.keys(b.state.ownerOf).find(id=>b.state.ownerOf[id]==='seat2')!;b.dispatchComputer({kind:'reinforce',province:id,amount:1});fx.update(opts);clock.run(65);const stale=[...clock.all],snapshot=JSON.stringify(b.state);b.pauseUntilExplicitResume();fx.update({...opts,paused:true});for(const cb of stale)cb();clock.run(2000);expect(fx.frame).toBeNull();expect(b.playbackPaused).toBe(true);expect(JSON.stringify(b.state)).toBe(snapshot);
 fx.dispose();for(const cb of clock.all)cb();expect(fx.frame).toBeNull();expect(b.computerFeedbackPending).toBe(false);
});
test('feedback speed and reduced motion affect only presentation and finish reliably',()=>{
 expect(feedbackDuration('attack','normal',false)).toBe(900);expect(feedbackDuration('attack','slow',false)).toBeGreaterThan(900);expect(feedbackDuration('attack','fast',false)).toBeLessThan(900);expect(feedbackDuration('attack','normal',true)).toBe(40);
 const {b,fx,clock}=setup(),id=Object.keys(b.state.ownerOf).find(id=>b.state.ownerOf[id]==='seat2')!;b.dispatchComputer({kind:'reinforce',province:id,amount:1});fx.update({...opts,reduced:true});expect(fx.frame?.progress).toBe(1);clock.run(650);expect(fx.pending).toBe(false);
});
function smallState():GameState {
 const {s}=setup(),ids=s.map.provinces.slice(0,3).map(p=>p.id),[a,b,c]=ids as [string,string,string];
 return {...s,map:{...s.map,provinces:s.map.provinces.slice(0,3).map((p,i)=>({...p,borders:ids.filter((_,j)=>Math.abs(j-i)===1),seaLanes:[]})),islands:[{id:'i',name:'i',bonus:2,provinces:ids}]},rules:{...s.rules,victoryOptions:{dominationWin:false,roundLimit:null}},ownerOf:{[a]:'seat2',[b]:'seat2',[c]:'seat1'},armies:{[a]:3,[b]:1,[c]:9},productionCentres:ids,currentPlayer:1,phase:'attack',reinforcementPool:0,players:s.players.map((p,i)=>({...p,eliminated:i>1}))};
}
test('movement feedback keeps the outgoing computer indicated and gates the incoming human until arrival',()=>{
 const s=smallState(),clock=new Clock(),b=new BattleController(s,clock),fx=new ComputerFeedbackController(b,clock,()=>{}),[from,to]=s.map.provinces.map(p=>p.id);
 expect(b.dispatchComputer({kind:'friendlyMove',from:from!,to:to!,amount:1})).toBe(true);expect(b.state.currentPlayer).toBe(0);const snapshot=JSON.stringify(b.state);fx.update(opts);expect(fx.frame?.seat).toBe('seat2');expect(b.dispatch({kind:'skipCards'})).toBe(false);clock.run(800);expect(fx.frame).toBeNull();expect(JSON.stringify(b.state)).toBe(snapshot);expect(b.dispatch({kind:'skipCards'})).toBe(true);
});
const context={mode:'battle' as const,cardPhase:'hand',paused:false,worldPending:false,cardReward:false};
test('guidance follows placement, attacks and movement; advice never changes legal attacks',()=>{
 const s=smallState();s.currentPlayer=0;s.ownerOf=Object.fromEntries(s.map.provinces.map((p,i)=>[p.id,i<2?'seat1':'seat2']));const [a,b,c]=s.map.provinces.map(p=>p.id);s.armies={[a!]:2,[b!]:2,[c!]:9};
 const legal=legalAttacks(s);expect(legal.length).toBeGreaterThan(0);expect(humanGuidance(s,context).instruction).toBe('Move armies');expect(legalAttacks(s)).toEqual(legal);
 s.armies[b!]=10;expect(humanGuidance(s,context).instruction).toBe('Execute attacks');expect(humanGuidance(s,{...context,mode:'move'}).instruction).toBe('Move armies');s.phase='reinforce';expect(humanGuidance(s,context).instruction).toBe('Place armies');
 expect(humanGuidance(s,{...context,paused:true}).title).toBe('Paused');expect(humanGuidance(s,{...context,worldPending:true}).instruction).toBe('Review changes');
});
test('the public turn model points to the actual human colour and skips eliminated seats without exposing hands',()=>{
 const s=smallState();s.currentPlayer=0;const rows=turnRows(s);expect(rows[0]).toMatchObject({colour:'Blue',current:true,human:true,next:false});expect(rows[1]!.next).toBe(true);expect(rows[2]!.next).toBe(false);expect(JSON.stringify(rows)).not.toMatch(/Anchor|Lantern|drawPile|rng/);expect(humanGuidance(s,context).title).toBe('Your turn');
});
