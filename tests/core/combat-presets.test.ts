import {expect,test} from 'vitest';
import {createHash} from 'node:crypto';
import * as core from '../../src/core';
import {islandRules} from '../../src/core/state';
import {reserveFixture} from '../helpers/reserve-fixtures';
import {decideArenaPolicy} from '../../tools/arena/policies';
import golden from '../../fixtures/new-game/T142/legacy-compatibility.json';
function api(){expect(core).toHaveProperty('defenderIslandRules',expect.any(Function));return core as typeof core&{defenderIslandRules:(o:core.GameOptions)=>core.RuleSet;defenderMatchIdentity:(v:2|3)=>core.MatchIdentity};}
const hash=(x:string)=>createHash('sha256').update(x).digest('hex');
function canonical(v:unknown):unknown{return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,canonical(x)])):v;}
for(const size of [46,72,96] as const)test(`${size}: paired starts,new preset actions/options/history roundtrip and old tuples stay exact`,()=>{
 const c=api(),legacy={...core.defaultOptions(),seed:11,islandRules:1 as const,humanShare:0,eventFrequency:'Off' as const,names:'numbered' as const,...(size===46?{}:{regionCount:size})},o={...legacy,combatPreset:'defender-v1' as const},version=size===46?2:3;
 const base=core.createGeographicGame(legacy,islandRules(legacy),{},version),made=core.createGeographicGame(o,c.defenderIslandRules(o),{},version);expect(base.ok&&made.ok).toBe(true);if(!base.ok||!made.ok)throw Error('factory');
 const neutral=(s:core.GameState)=>({...s,rules:{...s.rules,id:'neutral',combat:{...s.rules.combat,ties:'reroll' as const}}});expect(neutral(made.state)).toEqual(neutral(base.state));expect(made.state.rules.combat.ties).toBe('defender');
 for(let i=0;i<made.state.players.length;i++){
  const s=structuredClone(made.state),p=s.players[i]!.id,from=s.map.provinces.find(x=>s.ownerOf[x.id]===p&&[...x.borders,...x.seaLanes].some(id=>s.ownerOf[id]!==p))!,to=[...from.borders,...from.seaLanes].find(id=>s.ownerOf[id]!==p)!;s.currentPlayer=i;s.phase='attack';s.armies[from.id]=2;s.armies[to]=1;let rolls=0;
  const result=core.resolve(s,from.id,to,{rollDie:()=>{rolls++;return 6;}});expect([rolls,result.attackerLosses,result.defenderLosses,s.armies[from.id],s.armies[to]]).toEqual([2,1,0,1,1]);
 }
 let s=made.state;for(let i=0;i<12&&!s.result;i++){const a=decideArenaPolicy('tactical-v1',core.computerView(s))!,r=core.apply(s,a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);s=r.state;}
 const identity=c.defenderMatchIdentity(version),wire=core.serializeVersionedMatch(o,s.history,identity),loaded=core.deserializeVersionedMatch(wire);expect(loaded.state).toEqual(s);expect(loaded.options).toEqual(o);
 const options=core.serializeOptions(o);expect(JSON.parse(options).version).toBe(2);expect(core.deserializeOptions(options)).toEqual(o);
 const old=reserveFixture(size),g=golden.cases.find(x=>x.size===size)!;expect(hash(core.serializeVersionedMatch(old.options,old.state.history,old.identity))).toBe(g.wireSha256);expect(hash(core.serializeOptions(old.options))).toBe(g.optionsSha256);expect(hash(JSON.stringify(canonical(old.state)))).toBe(g.canonicalStateSha256);
});
test('new and legacy factories/options/identities reject mismatches instead of reinterpreting combat',()=>{
 const c=api(),o={...core.defaultOptions(),islandRules:1 as const,combatPreset:'defender-v1' as const},identity=c.defenderMatchIdentity(2),wire=JSON.parse(core.serializeVersionedMatch(o,[],identity));
 for(const change of [(x:any)=>x.rules.version=2,(x:any)=>x.rules.extra=true,(x:any)=>x.boardGenerator.version=4,(x:any)=>x.actionSchemaVersion=4,(x:any)=>delete x.options.combatPreset,(x:any)=>delete x.options.islandRules,(x:any)=>x.options.humanShare=1,(x:any)=>x.rules.id='island']){const x=structuredClone(wire);change(x);expect(()=>core.deserializeVersionedMatch(JSON.stringify(x))).toThrow();}
 expect(()=>islandRules(o)).toThrow();expect(()=>c.defenderIslandRules({...core.defaultOptions(),islandRules:1})).toThrow();
 for(const value of ['legacy','defender-v2',1,null,undefined])expect(()=>core.validateGameOptions({...o,combatPreset:value})).toThrow();
 expect(()=>core.deserializeOptions(JSON.stringify({version:1,options:o}))).toThrow();expect(()=>core.deserializeOptions(JSON.stringify({version:2,options:core.defaultOptions()}))).toThrow();
});
