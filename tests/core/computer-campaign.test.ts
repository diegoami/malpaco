import {expect,test} from 'vitest';
import * as core from '../../src/core';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import type {AttackCampaign} from '../../src/core/computer-campaign';
function model(v:ComputerStrategicView):AttackCampaign {
 expect(core).toHaveProperty('estimateAttackCampaign',expect.any(Function));
 return (core as unknown as {estimateAttackCampaign:(v:ComputerStrategicView,from:string,to:string)=>AttackCampaign}).estimateAttackCampaign(v,'a','d');
}
function view(a:number,d:number,remaining:number,ties:'reroll'|'attacker'|'defender'='reroll'):ComputerStrategicView {
 const s=core.newGame({id:'campaign',name:'Campaign',bounds:{x:0,y:0,width:100,height:100},islands:[],provinces:[]},core.victoryRules(),[{id:'own',name:'Own',kind:'computer',eliminated:false},{id:'enemy',name:'Enemy',kind:'computer',eliminated:false}],42);
 const base=core.computerView(s);
 return {...base,playerId:'own',phase:'attack',pendingCapture:false,pendingDiscard:false,pendingRaid:false,attackBudget:remaining,attacksThisTurn:0,
  countries:[{id:'a',owner:'own',armies:a,neighbours:['d']},{id:'d',owner:'enemy',armies:d,neighbours:['a']}],
  attackPairs:a>=2?[{kind:'attack',from:'a',to:'d'}]:[],movePairs:[],
  strategy:{...base.strategy,islands:[],combat:{...base.strategy.combat,ties,minArmiesToAttack:2,attackerDice:{max:1,minus:1},defenderDice:{max:1,minus:0}}}};
}
type Q=readonly[bigint,bigint];
const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
const q=(n:bigint,d:bigint):Q=>{const g=gcd(n,d);return [n/g,d/g];};
const add=(a:Q,b:Q)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a:Q,b:Q)=>q(a[0]*b[0],a[1]*b[1]);
const encloses=(lo:number,hi:number,value:Q,scale:number)=>{
 expect(BigInt(lo)*value[1]).toBeLessThanOrEqual(value[0]*BigInt(scale));expect(BigInt(hi)*value[1]).toBeGreaterThanOrEqual(value[0]*BigInt(scale));
};
// Independent exact forward path enumeration on small boards. Fraction arithmetic
// and terminal aggregation share no fixed-point/model code with the implementation.
function oracle(a:number,d:number,r:number,ties:'reroll'|'attacker'|'defender',minimum=2){
 const p:Q=ties==='reroll'?[1n,2n]:ties==='attacker'?[7n,12n]:[5n,12n],failure:Q=[p[1]-p[0],p[1]],out=new Map<string,Q>();
 function visit(w:number,l:number,mass:Q){
  const captured=w===d;
  if(captured||w+l===r||a-l<=d-w||a-l<minimum){const key=JSON.stringify([l,w,captured]);out.set(key,add(out.get(key)??[0n,1n],mass));return;}
  visit(w+1,l,mul(mass,p));visit(w,l+1,mul(mass,failure));
 }
 visit(0,0,[1n,1n]);return out;
}
test('terminal distributions, capture and casualty bounds contain independent exact oracles',()=>{
 for(const ties of ['reroll','attacker','defender'] as const)for(let a=2;a<=7;a++)for(let d=1;d<=4;d++)for(let r=0;r<=6;r++){
  const result=model(view(a,d,r,ties));expect(result.kind).toBe('bounded');if(result.kind!=='bounded')throw Error(result.reason);
  const exact=oracle(a,d,r,ties),actual=new Map(result.terminals.map(t=>[JSON.stringify([t.ownLosses,t.enemyLosses,t.captured]),t]));
  for(const [key,value] of exact){const t=actual.get(key);expect(t,key).toBeDefined();encloses(t!.lower,t!.upper,value,result.scale);}
  for(const [key,t] of actual)encloses(t.lower,t.upper,exact.get(key)??[0n,1n],result.scale);
  const weighted=(f:(key:[number,number,boolean])=>number)=>[...exact].reduce((n,[key,mass])=>add(n,mul(mass,[BigInt(f(JSON.parse(key))),1n])),[0n,1n] as Q);
  encloses(result.capture.lower,result.capture.upper,weighted(k=>Number(k[2])),result.scale);
  encloses(result.ownLosses.lower,result.ownLosses.upper,weighted(k=>k[0]),result.scale);
  encloses(result.enemyLosses.lower,result.enemyLosses.upper,weighted(k=>k[1]),result.scale);
  expect(result.terminals.reduce((n,t)=>n+t.lower,0)).toBeLessThanOrEqual(result.scale);expect(result.terminals.reduce((n,t)=>n+t.upper,0)).toBeGreaterThanOrEqual(result.scale);
  expect(result.cells).toBeLessThanOrEqual(16384);
 }
});
test('strict advantage/minimum and finite resolved-exchange budgets stop the campaign',()=>{
 for(const v of [view(4,4,10),view(9,1,0)]){
  expect(model(v)).toMatchObject({kind:'bounded',cells:0,capture:{lower:0,upper:0},ownLosses:{lower:0,upper:0},enemyLosses:{lower:0,upper:0},terminals:[{ownLosses:0,enemyLosses:0,captured:false,lower:1000000,upper:1000000}]});
 }
 const v=view(5,2,6);const changed={...v,strategy:{...v.strategy,combat:{...v.strategy.combat,minArmiesToAttack:4}}};
 const result=model(changed);expect(result.kind).toBe('bounded');if(result.kind!=='bounded')throw Error(result.reason);
 for(const [key,mass] of oracle(5,2,6,'reroll',4)){const [ownLosses,enemyLosses,captured]=JSON.parse(key),t=result.terminals.find(x=>x.ownLosses===ownLosses&&x.enemyLosses===enemyLosses&&x.captured===captured)!;encloses(t.lower,t.upper,mass,result.scale);}
 const used=view(5,2,10);expect(model({...used,attacksThisTurn:7})).toEqual(model(view(5,2,3)));
});
test('T134 cutoff witness distinguishes executable capture from a large nominal gap',()=>{
 const large=model(view(257,91,96,'defender')),weak=model(view(107,1,96,'defender'));
 expect(large.kind).toBe('bounded');expect(weak.kind).toBe('bounded');if(large.kind!=='bounded'||weak.kind!=='bounded')throw Error('bounded expected');
 expect(large.capture.upper).toBeLessThan(10000);expect(weak.capture.lower).toBeGreaterThan(990000);
 expect(large.capture.upper).toBeLessThan(weak.capture.lower);expect(large.cells).toBeLessThanOrEqual(16384);
});
test('invalid, unsafe, unsupported and over-budget models are explicit unknowns',()=>{
 const v=view(5,2,10);
 expect(model({...v,countries:v.countries.map(c=>({...c,neighbours:[]}))})).toMatchObject({kind:'unknown',reason:'path'});
 expect(model({...v,playerId:'enemy'})).toMatchObject({kind:'unknown',reason:'path'});
 for(const n of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1])expect(model(view(n,2,10))).toMatchObject({kind:'unknown',reason:'counts'});
 expect(model({...v,attackBudget:-1})).toMatchObject({kind:'unknown',reason:'counts'});
 expect(model({...v,strategy:{...v.strategy,combat:{...v.strategy.combat,attackerDice:{max:3,minus:1}}}})).toMatchObject({kind:'unknown',reason:'combat'});
 expect(model({...v,strategy:{...v.strategy,combat:{...v.strategy.combat,failurePenalty:'loseProvince'}}})).toMatchObject({kind:'unknown',reason:'combat'});
 expect(model(view(2000,1000,2000))).toMatchObject({kind:'unknown',reason:'budget'});
});
test('public view is immutable and private fields/order cannot affect the model, including sea adjacency',()=>{
 const v=view(6,3,6),before=structuredClone(v),expected=model(v);expect(v).toEqual(before);
 const changed={...v,countries:[...v.countries].reverse(),strategy:{...v.strategy,islands:[{id:'across-sea',bonus:2,provinces:['d']}]}};
 Object.defineProperty(changed,'ownHand',{get(){throw Error('cards');}});Object.defineProperty(changed,'rng',{get(){throw Error('stream');}});
 expect(model(changed)).toEqual(expected);
});
