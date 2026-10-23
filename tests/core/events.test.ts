import {expect,test} from 'vitest';
import * as factories from '../../src/core/state';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {computerAction} from '../../src/core/computer';
import {apply} from '../../src/core/rules';
import type {GameOptions,RuleSet} from '../../src/core';
const factory=(factories as typeof factories & {islandRules?:(o:GameOptions)=>RuleSet}).islandRules??factories.raidCardsRules;
test('opted island rules use fixed income, equal starting budgets and generate events through legal turns',()=>{
 const o={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Often' as const,seats:Array.from({length:4},()=>({kind:'computer' as const})),computerStrengths:Array(4).fill('Normal')};
 const g=createGeographicGame(o,factory(o),{},2);if(!g.ok)throw Error(g.errors.join());
 expect(g.state.rules.id).toBe('island-rules-v1');
 const totals=g.state.players.map(p=>g.state.map.provinces.reduce((n,c)=>n+(g.state.ownerOf[c.id]===p.id?g.state.armies[c.id]!:0),0));expect(Math.max(...totals)-Math.min(...totals)).toBeLessThanOrEqual(1);
 let state=g.state;for(let n=0;n<1600&&!state.result&&!state.log.some(e=>e.event as string==='world_event');n++){const action=computerAction(state);if(!action)throw Error('no action');const r=apply(state,action);if(!r.ok)throw Error(r.error);state=r.state;}
 expect(state.log.some(e=>e.event as string==='world_event')).toBe(true);
});

import {applyWorldEvent,connectedEventGroups,processWorldEvents} from '../../src/core/events';
import {DeterministicRng} from '../../src/core/rng';
import {createReferenceGame} from '../../src/core/reference-game';
import {referenceMap} from '../../src/core/reference-map';
import {cloneState,islandRules} from '../../src/core/state';
import type {GameState,GameMap,WorldEventKind} from '../../src/core/types';
class Scripted extends DeterministicRng {
 calls:[number,number][]=[];
 constructor(private draws:number[]=[]){super(7);}
 override nextInt(lo:number,hi:number):number {this.calls.push([lo,hi]);const value=this.draws.shift()??lo;if(value<lo||value>hi)throw Error(`${value} outside ${lo}..${hi}`);return value;}
 override snapshot(){return {seed:7,state:this.calls.length};}
}
function prepared():GameState {
 const o={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Often' as const};const r=createReferenceGame(referenceMap,o,islandRules(o));if(!r.ok)throw Error(r.errors.join());
 const s=r.state;s.turnNumber=3;s.phase='attack';s.map.provinces.forEach((p,i)=>{s.ownerOf[p.id]=s.players[i%4]!.id;s.armies[p.id]=20;});return s;
}
const tiny:GameMap={id:'path',name:'path',bounds:{x:0,y:0,width:50,height:10},islands:[],provinces:['a','b','c','d','e'].map((id,i,ids)=>({id,name:id,island:'i',labelAt:[i*10,5] as const,polygon:[[0,0],[1,0],[1,1]] as const,borders:ids.filter((_,j)=>Math.abs(i-j)===1&&!(i===2&&j===3||i===3&&j===2)),seaLanes:ids.filter((_,j)=>i===2&&j===3||i===3&&j===2)}))};
test('connected storm enumeration is exact, deduplicated, and includes sea adjacency; every group index is selectable',()=>{
 const groups=connectedEventGroups(tiny,'c',3);expect(groups).toEqual([['a','b','c'],['b','c','d'],['c','d','e']]);
 for(let i=0;i<groups.length;i++){
  const s={...prepared(),map:tiny,productionCentres:['a','c','e'],ownerOf:Object.fromEntries(tiny.provinces.map(p=>[p.id,'seat1'])),armies:Object.fromEntries(tiny.provinces.map(p=>[p.id,20]))};
  const e=applyWorldEvent(s,'storm',new Scripted([2,3,i,1,2,3]));expect(e.changes.map(c=>c.id)).toEqual(groups[i]);expect(e.changes.map(c=>c.armiesAfter)).toEqual([1,2,3]);
 }
 expect(connectedEventGroups(tiny,'c',4)).toEqual([['a','b','c','d'],['b','c','d','e']]);
});
test('storm integer boundaries retain positive stacks; harvest caps gain rather than an old stack',()=>{
 const s={...prepared(),map:tiny,productionCentres:['a','c','e'],ownerOf:Object.fromEntries(tiny.provinces.map(p=>[p.id,'seat1'])),armies:{a:1,b:6,c:20,d:20,e:20}};
 applyWorldEvent(s,'storm',new Scripted([0,3,0,1,5,9]));expect(s.armies).toEqual({a:1,b:5,c:9,d:20,e:20});
 const h=prepared();h.productionCentres.forEach((id,i)=>h.armies[id]=[1,20,2000][i]!);const owners={...h.ownerOf};const event=applyWorldEvent(h,'harvest',new Scripted());expect(event.changes.map(c=>c.armiesAfter)).toEqual([2,30,2010]);expect(h.ownerOf).toEqual(owners);
});
test('revolt picks a strong border country and a neighbouring other owner, with armies unchanged and no elimination',()=>{
 const s=prepared();for(const id in s.armies)s.armies[id]=1;const victim=s.players[0]!.id,chosen=s.map.provinces.find(p=>s.ownerOf[p.id]===victim&&[...p.borders,...p.seaLanes].some(id=>s.ownerOf[id]!==victim))!;s.armies[chosen.id]=4;
 const before={...s.armies},count=Object.values(s.ownerOf).filter(o=>o===victim).length,e=applyWorldEvent(s,'revolt',new Scripted([0,0,0]));
 expect(e.changes).toHaveLength(1);expect(e.changes[0]!.id).toBe(chosen.id);expect(s.ownerOf[chosen.id]).not.toBe(victim);expect([...chosen.borders,...chosen.seaLanes].some(id=>s.ownerOf[id]===s.ownerOf[chosen.id])).toBe(true);expect(s.armies).toEqual(before);expect(Object.values(s.ownerOf).filter(o=>o===victim)).toHaveLength(count-1);expect(count-1).toBeGreaterThanOrEqual(2);
});
test('an ineligible revolt is a recorded no-effect event; relocation keeps three distinct sites and all armies/owners',()=>{
 const s=prepared();for(const id in s.ownerOf)s.ownerOf[id]='seat1';s.ownerOf[s.map.provinces[0]!.id]='seat2';const before=cloneState(s),rng=new Scripted();expect(applyWorldEvent(s,'revolt',rng).changes).toEqual([]);expect(rng.calls).toEqual([]);expect(s.ownerOf).toEqual(before.ownerOf);
 const shift=prepared(),old=[...shift.productionCentres],a={...shift.armies},o={...shift.ownerOf},e=applyWorldEvent(shift,'shift',new Scripted());expect(new Set(shift.productionCentres).size).toBe(3);expect(e.centresBefore).toEqual(old);expect(e.centresAfter).toEqual(shift.productionCentres);expect(shift.armies).toEqual(a);expect(shift.ownerOf).toEqual(o);
});
for(const condition of ['off','round1','limit','near-win','finished','cooldown'] as const)test(`${condition} consumes no event draws`,()=>{
 const s=prepared();let next=3;
 if(condition==='off')Object.assign(s,{rules:{...s.rules,events:{frequency:'Off'}}});
 if(condition==='round1')next=1;
 if(condition==='limit'){Object.assign(s,{rules:{...s.rules,victoryOptions:{dominationWin:true,roundLimit:20}}});next=18;}
 if(condition==='near-win')s.map.provinces.forEach((p,i)=>s.ownerOf[p.id]=i<31?'seat1':'seat2');
 if(condition==='finished')s.phase='finished';
 if(condition==='cooldown')s.events={sequence:1,cooldown:true,lastKind:'storm'};
 const before={...s.rng},rng=new Scripted();processWorldEvents(s,next,rng);expect(rng.calls).toEqual([]);expect(s.rng).toEqual(before);expect(s.events?.latest).toBeUndefined();
 if(condition==='cooldown'){expect(s.events?.cooldown).toBe(false);processWorldEvents(s,next,new Scripted([2]));expect(s.rng.state).toBe(1);}
});
test('guard boundaries and frequency denominators are exact; same-kind redraw occurs once and can repeat',()=>{
 for(const [frequency,denominator] of [['Rare',21],['Normal',14],['Often',8]] as const){const s=prepared();Object.assign(s,{rules:{...s.rules,events:{frequency}}});const rng=new Scripted([2]);processWorldEvents(s,2,rng);expect(rng.calls).toEqual([[1,denominator]]);}
 const s=prepared();s.events={sequence:1,cooldown:false,lastKind:'storm'};const rng=new Scripted([1,0,0]);processWorldEvents(s,3,rng);expect(rng.calls.slice(0,3)).toEqual([[1,8],[0,13],[0,13]]);expect(s.events?.latest?.kind).toBe('storm');expect(s.events?.cooldown).toBe(true);expect(s.log.at(-1)?.event).toBe('world_event');
 const allowed=prepared();Object.assign(allowed,{rules:{...allowed.rules,victoryOptions:{dominationWin:true,roundLimit:20}}});allowed.map.provinces.forEach((p,i)=>allowed.ownerOf[p.id]=i<30?'seat1':'seat2');const edge=new Scripted([2]);processWorldEvents(allowed,17,edge);expect(edge.calls).toHaveLength(1);
});
