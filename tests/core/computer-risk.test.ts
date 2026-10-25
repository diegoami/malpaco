import {expect,test} from 'vitest';
import * as core from '../../src/core';
import type {CaptureRisk} from '../../src/core/computer-risk';
import type {ComputerStrategicView} from '../../src/core/computer-view';

function battleState(attackers=6,bridge=1,interior=1,ties:core.CombatRules['ties']='reroll'){
 const ids=['source','bridge','interior'],edges=[['source','bridge'],['bridge','interior']];
 const map:core.GameMap={id:'risk',name:'Risk',bounds:{x:0,y:0,width:100,height:100},
  islands:[{id:'i',name:'i',bonus:2,provinces:ids}],provinces:ids.map(id=>({id,name:id,island:'i',borders:edges.flatMap(([a,b])=>a===id?[b!]:b===id?[a!]:[]),seaLanes:[],polygon:[],labelAt:[0,0]}))};
 const base=core.newGame(map,core.friendlyMoveRules(),[{id:'own',name:'Own',kind:'computer',eliminated:false},{id:'enemy',name:'Enemy',kind:'computer',eliminated:false}],42);
 const state={...base,rules:{...base.rules,combat:{...base.rules.combat,ties}},ownerOf:{source:'enemy',bridge:'own',interior:'own'},armies:{source:attackers,bridge,interior},currentPlayer:0};
 return state;
}
function position(attackers=6,bridge=1,interior=1,ties:core.CombatRules['ties']='reroll'){
 return core.computerView(battleState(attackers,bridge,interior,ties));
}
function risk(view:ComputerStrategicView,path:readonly string[]=['bridge'],extra=0,from='source'):CaptureRisk {
 expect(core).toHaveProperty('estimateCapturePath',expect.any(Function));
 return (core as unknown as {estimateCapturePath:(v:ComputerStrategicView,from:string,p:readonly string[],extra:number)=>CaptureRisk}).estimateCapturePath(view,from,path,extra);
}
function bounded(result:CaptureRisk){expect(result.kind).toBe('bounded');if(result.kind!=='bounded')throw Error('Unknown model');return result;}

type Q=readonly[bigint,bigint];
const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
const q=(a:bigint,b:bigint):Q=>{const d=gcd(a,b);return [a/d,b/d];};
const add=(a:Q,b:Q)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a:Q,b:Q)=>q(a[0]*b[0],a[1]*b[1]);
/** Exact recursive absorbing process, independent of the interval model's arithmetic. */
function oracle(attackers:number,targets:readonly number[],ties:core.CombatRules['ties']):Q {
 let wins=0,losses=0;
 for(let a=1;a<=6;a++)for(let d=1;d<=6;d++)if(a>d||(a===d&&ties==='attacker'))wins++;else if(a<d||ties!=='reroll')losses++;
 const p=q(BigInt(wins),BigInt(wins+losses)),lose=q(BigInt(losses),BigInt(wins+losses)),memo=new Map<string,Q>();
 function visit(a:number,index:number,d:number):Q {
  if(d===0)return index===targets.length-1?[1n,1n]:visit(a-1,index+1,targets[index+1]!);
  if(a<2)return [0n,1n];
  const key=`${a}/${index}/${d}`;const old=memo.get(key);if(old)return old;
  const result=add(mul(p,visit(a,index,d-1)),mul(lose,visit(a-1,index,d)));memo.set(key,result);return result;
 }
 return visit(attackers,0,targets[0]!);
}
function contains(result:CaptureRisk,exact:Q){
 const r=bounded(result),scale=BigInt(r.scale);
 expect(BigInt(r.lower)*exact[1]).toBeLessThanOrEqual(exact[0]*scale);
 expect(BigInt(r.upper)*exact[1]).toBeGreaterThanOrEqual(exact[0]*scale);
 expect(r.upper-r.lower).toBeLessThanOrEqual(r.cells);
 expect(Number.isInteger(r.lower)&&Number.isInteger(r.upper)).toBe(true);
 expect(r.lower).toBeGreaterThanOrEqual(0);expect(r.upper).toBeLessThanOrEqual(r.scale);
}

for(const [a,d] of [[2,1],[3,3],[4,3],[6,5],[10,10],[16,10]])for(const ties of ['reroll','defender'] as const)test(`research battle ${a} vs ${d}, ${ties}`,()=>{
 contains(risk(position(a!,d!,1,ties)),oracle(a!,[d!],ties));
});

test('exact rational small two-hop oracles lie inside the integer bounds for every tie rule',()=>{
 for(const ties of ['reroll','defender','attacker'] as const)for(let a=2;a<=8;a++)for(let d=1;d<=3;d++)for(let next=1;next<=3;next++){
  contains(risk(position(a,d,next,ties),['bridge','interior']),oracle(a,[d,next],ties));
 }
});
test('occupying each capture consumes a garrison and both battles share the original casualty budget',()=>{
 expect(bounded(risk(position(2),['bridge','interior']))).toMatchObject({lower:0,upper:0});
 expect(bounded(risk(position(3),['bridge','interior']))).toMatchObject({lower:250000,upper:250000,scale:1000000});
 expect(bounded(risk(position(4),['bridge','interior']))).toMatchObject({lower:500000,upper:500000});
 // A fresh independent 3v1 in each country would wrongly predict .75*.75=.5625.
 expect(bounded(risk(position(3,2))).lower).toBe(500000);
});
test('actual engine capture and default move-in spend the garrison modeled by a two-hop path',()=>{
 let state:core.GameState={...battleState(3),currentPlayer:1,phase:'attack'};
 const dice={rollDie:()=>[6,1][roll++%2]!};let roll=0;
 const first=core.resolve(state,'source','bridge',dice);expect(first.captured).toBe(true);
 const moved=core.apply(state,{kind:'captureMove'});if(!moved.ok)throw Error(moved.error);state=moved.state;
 expect(state.armies).toEqual({source:1,bridge:2,interior:1});
 const second=core.resolve(state,'bridge','interior',dice);expect(second.captured).toBe(true);
 const finish=core.apply(state,{kind:'captureMove'});if(!finish.ok)throw Error(finish.error);
 expect(finish.state.armies).toEqual({source:1,bridge:1,interior:1});
 // With three original armies, both exchanges must win. A loss first leaves
 // only one at the new source; a loss second exhausts it. Thus exactly p*p.
 expect(bounded(risk(position(3),['bridge','interior']))).toMatchObject({lower:250000,upper:250000});
});
test('attack minimum is honored again after maximum capture transfer',()=>{
 const view=position(3),limited={...view,strategy:{...view.strategy,combat:{...view.strategy.combat,minArmiesToAttack:3}}};
 expect(bounded(risk(limited))).toMatchObject({lower:500000,upper:500000});
 expect(bounded(risk(limited,['bridge','interior']))).toMatchObject({lower:0,upper:0});
});
test('hypothetical reinforcement is explicit, monotone, and leaves the original view unchanged',()=>{
 const view=position(3,2,2),before=structuredClone(view),base=bounded(risk(view,['bridge','interior']));
 const reinforced=bounded(risk(view,['bridge','interior'],4));
 contains(reinforced,oracle(7,[2,2],'reroll'));expect(reinforced.lower).toBeGreaterThan(base.upper);expect(view).toEqual(before);
});
test('probability falls as either defended stack grows and rises with attackers',()=>{
 const original=bounded(risk(position(6,2,2),['bridge','interior']));
 expect(bounded(risk(position(7,2,2),['bridge','interior'])).lower).toBeGreaterThan(original.upper);
 expect(bounded(risk(position(6,3,2),['bridge','interior'])).upper).toBeLessThan(original.lower);
 expect(bounded(risk(position(6,2,3),['bridge','interior'])).upper).toBeLessThan(original.lower);
});
test('sea links, permutations, poisoned card access and unrelated view fields cannot change risk',()=>{
 const view=position(),expected=risk(view,['bridge','interior']);
 const changed={...view,countries:[...view.countries].reverse().map(c=>({...c,neighbours:[...c.neighbours].reverse()}))};
 Object.defineProperty(changed,'ownHand',{get(){throw Error('card contents read');}});
 Object.defineProperty(changed,'rng',{get(){throw Error('private stream read');}});
 expect(risk(changed,['bridge','interior'])).toEqual(expected);
 const state=battleState();
 const sea={...state,map:{...state.map,provinces:state.map.provinces.map(p=>({...p,borders:[],seaLanes:[...p.borders]}))}};
 expect(risk(core.computerView(sea),['bridge','interior'])).toEqual(expected);
});
test('unknown is explicit for invalid/nonadjacent/friendly/repeated or overlong paths',()=>{
 const view=position();
 for(const path of [[],['missing'],['interior'],['bridge','bridge'],['bridge','source'],['bridge','interior','bridge']])expect(risk(view,path)).toMatchObject({kind:'unknown',reason:'path'});
 const friendly={...view,countries:view.countries.map(c=>c.id==='bridge'?{...c,owner:'enemy'}:c)};
 expect(risk(friendly)).toMatchObject({kind:'unknown',reason:'path'});
 expect(risk(view,['bridge'],0,'missing')).toMatchObject({kind:'unknown',reason:'path'});
});
test('unsafe counts and hypothetical reinforcement are rejected before computation',()=>{
 for(const a of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])expect(risk(position(a))).toMatchObject({kind:'unknown',reason:'counts'});
 for(const d of [0,-1,1.5,NaN,Infinity])expect(risk(position(3,d))).toMatchObject({kind:'unknown',reason:'counts'});
 for(const extra of [-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])expect(risk(position(),['bridge'],extra)).toMatchObject({kind:'unknown',reason:'counts'});
 expect(bounded(risk(position(1)))).toMatchObject({lower:0,upper:0,cells:0});
});
test('supported work is bounded and oversized stacks cannot turn into fabricated zero danger',()=>{
 const edge=bounded(risk(position(128,128)));expect(edge.cells).toBeLessThanOrEqual(16384);
 expect(risk(position(129,128))).toMatchObject({kind:'unknown',reason:'budget'});
 expect(risk(position(20000,1))).toMatchObject({kind:'unknown',reason:'budget'});
});
test('unsupported comparison gates, dice and constrained two-hop capture rules return unknown',()=>{
 const view=position();
 for(const patch of [{attackRule:'match' as const},{attackerDice:{max:3,minus:1}},{defenderDice:{max:1,minus:1}},{minArmiesToAttack:1}]){
  expect(risk({...view,strategy:{...view.strategy,combat:{...view.strategy.combat,...patch}}})).toMatchObject({kind:'unknown',reason:'combat'});
 }
 expect(risk({...view,strategy:{...view.strategy,combat:{...view.strategy.combat,capture:'one'}}},['bridge','interior'])).toMatchObject({kind:'unknown',reason:'combat'});
});
