import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {api,core,opening,options,identity,act,cards,conserved,player,endPlacement} from './card-sets-fixture';
import type {State,TradeAction} from './card-sets-fixture';
import type {GameOptions,Action} from '../../src/core';
const text=(name:string)=>readFileSync(new URL('../../docs/prototypes/new-game/T38/fixtures/'+name,import.meta.url),'utf8');
function load(name:string):State{return core.deserializeVersionedMatch(text(name)).state;}
function replay(s:State,o:GameOptions,geographic=false):State{const wire=core.serializeVersionedMatch(o,s.history,identity(geographic)),value=JSON.parse(wire);expect(Object.keys(value).sort()).toEqual(['format','version','boardGenerator','rules','actionSchemaVersion','options','actions'].sort());const loaded=core.deserializeVersionedMatch(wire);expect(loaded.identity).toEqual(identity(geographic));expect(loaded.state).toEqual(s);return loaded.state;}

describe('real trade/skip histories with permanent stage identities',()=>{
 for(const [kind,beforeName,afterName,indices,pool,afterPool] of [
  ['Anchor','legal-reshuffle-match-Anchor-before.json','legal-reshuffle-match-Anchor-after.json',[0,1,3],2,7],
  ['Compass','legal-reshuffle-match-Compass-before.json','legal-reshuffle-match-Compass-after.json',[2,3,4],6,14],
  ['Surge','legal-Surge-before.json','legal-Surge-after.json',[0,1,4],6,12],
 ] as const)it(`${kind} real cards phase saves, trades, reloads and places without recomputing the pool`,()=>{
  expect(api.tradeCardsRules).toBeTypeOf('function');const input=JSON.parse(text(beforeName)),before=load(beforeName),me=player(before);expect(before.phase).toBe('cards');expect(before.reinforcementPool).toBe(pool);conserved(before);
  if(kind==='Surge'){expect(before.history).toHaveLength(294);expect(core.reinforcementIncome(before as never,me)).toMatchObject({base:3,islandBonus:3,total:6});expect(cards(before).hands[me]).toEqual(['Wild','Surge','Compass','Compass','Wild']);}
  const loaded=replay(before,input.options),action={kind:'tradeCards',handIndices:indices} as const,next=act(loaded,action);expect(next).toEqual(load(afterName));expect(next.reinforcementPool).toBe(afterPool);expect(next.rng).toEqual(before.rng);expect(cards(next).hands[me]).toHaveLength(cards(before).hands[me]!.length-3);conserved(next);
  const restored=replay(next,input.options),own=restored.map.provinces.find(p=>restored.ownerOf[p.id]===me)!.id;
  const placed=act(restored,{kind:'reinforce',province:own,amount:1});expect(placed.reinforcementPool).toBe(afterPool-1);expect(replay(placed,input.options)).toEqual(placed);expect(act(next,{kind:'reinforce',province:own,amount:1})).toEqual(placed);
  const attack=endPlacement(placed),ended=act(attack,{kind:'endTurn'});expect(ended.phase).toBe('cards');expect(replay(ended,input.options)).toEqual(ended);
 },30000);
 for(const geographic of [false,true])it(`exact cards2/schema4 identity begins and resumes skip/placement (${geographic})`,()=>{
  const o=options(37),s=opening(37,geographic);expect(s.phase).toBe('cards');expect(s.rules.cards).toBe('trade-v1');
  expect(identity(geographic)).toEqual({boardGenerator:{id:geographic?'geographic':'fixed-reference',version:1},rules:{id:'cards',version:2},actionSchemaVersion:4});
  const skipped=act(replay(s,o,geographic),{kind:'skipCards'});expect(skipped.reinforcementPool).toBe(s.reinforcementPool);expect(skipped.rng).toEqual(s.rng);
  const next=act(endPlacement(replay(skipped,o,geographic)),{kind:'endTurn'});expect(next.phase).toBe('cards');replay(next,o,geographic);conserved(next);
 },30000);
 for(const [current,old,count] of [['legal-reshuffle-match-skips.json','reshuffle-match.json',392],['legal-decisive-match-skips.json','decisive-match.json',214]] as const)it(`ordinary skipped history keeps deck-v1 outcome/RNG exactly: ${current}`,()=>{
  expect(api.tradeCardsRules).toBeTypeOf('function');const s=load(current),baseline=core.deserializeVersionedMatch(readFileSync(new URL('../../docs/prototypes/new-game/T37/fixtures/'+old,import.meta.url),'utf8')).state;
  expect(s.history).toHaveLength(count);expect(s.history.some(a=>(a as TradeAction).kind==='skipCards')).toBe(true);
  const normalized={...s,rules:baseline.rules,phase:s.phase==='cards'?'reinforce':s.phase,history:s.history.filter(a=>(a as TradeAction).kind!=='skipCards')};expect(normalized).toEqual(baseline);conserved(s);
  const oldWire=core.serializeVersionedMatch(JSON.parse(text(current)).options,baseline.history,core.REFERENCE_CARD_MATCH_IDENTITY);expect(core.deserializeVersionedMatch(oldWire).state).toEqual(baseline);
 },30000);
 it('rejects malformed trade wire shapes at a genuinely valid trade point',()=>{
  expect(api.tradeCardsRules).toBeTypeOf('function');const base=JSON.parse(text('legal-Surge-before.json'));
  const actions=[{kind:'tradeCards',handIndices:[0,1,4],extra:1},{kind:'tradeCards',handIndices:[0,1,4],card:'Surge'},...[[0,1],[0,1,4,2],[0,0,1],[-1,1,4],[0,1,1.5],[0,1,'4'],null].map(handIndices=>({kind:'tradeCards',handIndices})),{kind:'skipCards',extra:true}];
  for(const action of actions)expect(()=>core.deserializeVersionedMatch(JSON.stringify({...base,actions:[...base.actions,action]})),JSON.stringify(action)).toThrow();
  expect(()=>core.deserializeVersionedMatch(JSON.stringify({...base,cards:{hands:{}}}))).toThrow();
 },30000);
 it('refuses mismatched/future stage tuples and preserves legacy and victory save paths',()=>{
  expect(api.tradeCardsRules).toBeTypeOf('function');const o=options(),wire=JSON.parse(core.serializeVersionedMatch(o,[],identity()));
  for(const patch of [{rules:{id:'cards',version:1}},{rules:{id:'cards',version:4},actionSchemaVersion:6},{actionSchemaVersion:3},{actionSchemaVersion:5},{boardGenerator:{id:'geographic',version:2}},{rules:{id:'cards',version:2,extra:1}}])expect(()=>core.deserializeVersionedMatch(JSON.stringify({...wire,...patch}))).toThrow();
  for(const old of [core.REFERENCE_CARD_MATCH_IDENTITY,core.GEOGRAPHIC_CARD_MATCH_IDENTITY,core.REFERENCE_MATCH_IDENTITY,core.GEOGRAPHIC_MATCH_IDENTITY]){
   const value=JSON.parse(core.serializeVersionedMatch(o,[],old));expect(core.deserializeVersionedMatch(JSON.stringify(value)).state.phase).toBe('reinforce');
   expect(()=>core.deserializeVersionedMatch(JSON.stringify({...value,actions:[{kind:'skipCards'}]}))).toThrow();expect(()=>core.deserializeVersionedMatch(JSON.stringify({...value,actions:[{kind:'tradeCards',handIndices:[0,1,2]}]}))).toThrow();
  }
  expect(core.deserializeVersionedMatch(core.serializeMatch(o,[])).state).not.toHaveProperty('cards');
 },30000);
});
