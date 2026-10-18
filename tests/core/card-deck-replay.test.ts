import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {api,core,cards,opening,settings,identity,conserved,act,player,arrange,example,capture,canonical,frozen} from './card-deck-fixture';
import type {State,CardAction} from './card-deck-fixture';
import type {Action,GameOptions} from '../../src/core';

function ordinary(s:State,finish=false):CardAction {
 if(cards(s).pendingDiscard)return {kind:'discardCard',handIndex:0};
 if(s.pendingCapture)return {kind:'captureMove',amount:1};
 if(s.phase==='reinforce'){
  if(!s.reinforcementPool)return {kind:'endReinforcement'};
  const own=s.map.provinces.filter(p=>s.ownerOf[p.id]===player(s));
  const border=own.filter(p=>[...p.borders,...p.seaLanes].some(id=>s.ownerOf[id]!==player(s)));
  const from=(border.length?border:own).sort((a,b)=>s.armies[b.id]!-s.armies[a.id]!||a.id.localeCompare(b.id))[0]!;
  return {kind:'reinforce',province:from.id,amount:s.reinforcementPool};
 }
 const attacks=core.legalAttacks(s).filter((a):a is Extract<Action,{kind:'attack'}>=>a.kind==='attack'&&s.armies[a.from]!>s.armies[a.to]!+1).sort((a,b)=>s.armies[a.to]!-s.armies[b.to]!||s.armies[b.from]!-s.armies[a.from]!||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 return (!s.capturedThisTurn||finish)&&attacks[0]?attacks[0]:{kind:'endTurn'};
}
function replay(s:State,options:GameOptions,geographic=false):State {
 const text=core.serializeVersionedMatch(options,s.history,identity(geographic)),payload=JSON.parse(text);
 expect(Object.keys(payload).sort()).toEqual(['format','version','boardGenerator','rules','actionSchemaVersion','options','actions'].sort());
 expect(payload).not.toHaveProperty('cards');expect(payload).not.toHaveProperty('rng');
 const loaded=core.deserializeVersionedMatch(text);expect(loaded.identity).toEqual(identity(geographic));expect(loaded.state).toEqual(s);conserved(loaded.state);return loaded.state;
}

describe('deck replay and same-stream continuation',()=>{
 it('reshuffles the actual discard pile deterministically, preserving pending input and computer streams',()=>{
  const x=example();arrange(x.s,['Anchor','Compass','Lantern','Raid','Shield'],['Wild']);let s=capture(x.s,x.from,x.to),c=cards(s),me=player(s);
  c.discardPile=c.drawPile;c.drawPile=[];const input=structuredClone(s),rng=core.DeterministicRng.fromSnapshot(s.rng);
  const pending=act(frozen(s),{kind:'endTurn'});expect(pending.rng).toEqual(input.rng);expect(cards(pending).drawPile).toEqual([]);
  const chosen=cards(pending).hands[me]![2]!,shuffled=rng.shuffled([...cards(pending).discardPile,chosen]);
  const next=act(frozen(pending),{kind:'discardCard',handIndex:2});
  expect(next.rng).toEqual(rng.snapshot());expect(next.computerRngs).toEqual(input.computerRngs);expect(cards(next).drawPile).toEqual(shuffled.slice(1));
  const expected=cards(input).hands[me]!.filter((_,i)=>i!==2);if(shuffled[0]==='Squall'){expect(cards(next).hands[me]).toEqual([]);expect(cards(next).discardPile.slice().sort()).toEqual([...expected,'Squall'].sort());}else {expect(cards(next).hands[me]).toEqual([...expected,shuffled[0]]);expect(cards(next).discardPile).toEqual([]);}
  expect(s).toEqual(input);conserved(next);expect(act(pending,{kind:'discardCard',handIndex:2})).toEqual(next);
 });
 for(const geographic of [false,true])it(`real production codec reconstructs card rules and legal action/RNG continuation (${geographic})`,()=>{
  const options=settings(37);let s=opening(37,geographic);cards(s);
  for(let i=0;i<100&&s.phase!=='finished';i++)s=act(s,ordinary(s));
  expect(s.history.some(a=>a.kind==='attack')).toBe(true);expect(s.history.some(a=>a.kind==='captureMove')).toBe(true);
  let loaded=replay(s,options,geographic);
  for(let n=0;n<30&&s.phase!=='finished';n++){const a=ordinary(s);s=act(s,a);loaded=act(loaded,a);expect(loaded).toEqual(s);}
  expect(loaded.computerRngs).toEqual(opening(37,geographic).computerRngs);
 },30000);
 it('reconstructs a reached full-hand choice and actual reshuffle from options and ordinary actions',()=>{
  cards(opening());
  const read=(name:string)=>readFileSync(new URL('../../docs/prototypes/new-game/T37/fixtures/'+name,import.meta.url),'utf8');
  const beforePayload=JSON.parse(read('reshuffle-before-match.json')),afterPayload=JSON.parse(read('reshuffle-match.json'));
  expect(beforePayload.actions).toHaveLength(328);expect(afterPayload.actions).toHaveLength(329);
  const before=core.deserializeVersionedMatch(JSON.stringify(beforePayload)).state as State;
  expect(cards(before).pendingDiscard).toEqual({player:player(before)});expect(cards(before).drawPile).toEqual([]);expect(before.rng).toEqual({seed:2,state:2233696394});conserved(before);
  const saved=replay(before,beforePayload.options);const next=act(saved,{kind:'discardCard',handIndex:0});
  const after=core.deserializeVersionedMatch(JSON.stringify(afterPayload)).state as State;
  expect(next).toEqual(after);expect(cards(after).drawPile).toHaveLength(25);expect(after.rng).toEqual({seed:2,state:778201463});conserved(after);
  // Continue through ordinary turn preparation and the next actual dice draw.
  let left=after,right=next,attackSeen=false;
  for(let i=0;i<100&&left.phase!=='finished';i++){const a=ordinary(left);left=act(left,a);right=act(right,a);expect(right).toEqual(left);if(a.kind==='attack'){attackSeen=true;break;}}
  expect(attackSeen).toBe(true);expect(left.computerRngs).toEqual(before.computerRngs);
 },30000);
 it('the real decisive capturing turn waits for discard and rewards before replayed victory',()=>{
  cards(opening());
  const read=(name:string)=>readFileSync(new URL('../../docs/prototypes/new-game/T37/fixtures/'+name,import.meta.url),'utf8');
  const beforePayload=JSON.parse(read('decisive-before-match.json')),afterPayload=JSON.parse(read('decisive-match.json'));
  expect(beforePayload.actions).toHaveLength(194);expect(afterPayload.actions).toHaveLength(195);
  const before=core.deserializeVersionedMatch(JSON.stringify(beforePayload)).state as State,me=player(before);
  expect(before.capturedThisTurn).toBe(true);expect(before.result).toBeUndefined();expect(before.winner).toBe('');expect(cards(before).pendingDiscard).toEqual({player:me});
  expect(cards(before).hands[me]).toEqual(['Anchor','Raid','Lantern','Compass','Compass']);expect(cards(before).drawPile[0]).toBe('Anchor');expect(cards(before).drawPile).toHaveLength(34);
  const next=act(frozen(before),{kind:'discardCard',handIndex:0});const after=core.deserializeVersionedMatch(JSON.stringify(afterPayload)).state as State;
  expect(next).toEqual(after);expect(after.phase).toBe('finished');expect(after.result?.reason).toBe('domination');expect(after.winner).toBe(me);expect(cards(after).drawPile).toHaveLength(33);expect(cards(after).hands[me]).toHaveLength(5);expect(after.rng).toEqual({seed:37,state:1970355341});
  expect(after.log.filter(e=>e.event==='turn_ended')).toHaveLength(before.log.filter(e=>e.event==='turn_ended').length+1);conserved(after);replay(after,afterPayload.options);
 },30000);
 it('keeps historical victory and legacy codecs distinct and rejects unsupported card identity tuples',()=>{
  const options=settings(37);cards(opening(37));
  for(const old of [core.REFERENCE_MATCH_IDENTITY,core.GEOGRAPHIC_MATCH_IDENTITY]){
   const text=core.serializeVersionedMatch(options,[],old),loaded=core.deserializeVersionedMatch(text);expect(loaded.state).not.toHaveProperty('cards');expect(loaded.identity).toEqual(old);
   expect(()=>core.deserializeVersionedMatch(JSON.stringify({...JSON.parse(text),actions:[{kind:'discardCard',handIndex:0}]}))).toThrow();
  }
  const old=core.serializeMatch(options,[]);expect(core.deserializeVersionedMatch(old).state).not.toHaveProperty('cards');
  const value=JSON.parse(core.serializeVersionedMatch(options,[],identity()));
  for(const patch of [{rules:{id:'cards',version:2}},{rules:{id:'cards',version:3}},{actionSchemaVersion:2},{actionSchemaVersion:4},{boardGenerator:{id:'geographic',version:2}},{boardGenerator:{id:'unknown',version:1}}])expect(()=>core.deserializeVersionedMatch(JSON.stringify({...value,...patch}))).toThrow();
 },30000);
 it('rejects malformed discard shapes and forged snapshots through the real decoder',()=>{
  cards(opening());const base=JSON.parse(core.serializeVersionedMatch(settings(),[],identity()));
  for(const action of [{kind:'discardCard'},{kind:'discardCard',handIndex:-1},{kind:'discardCard',handIndex:0.5},{kind:'discardCard',handIndex:'0'},{kind:'discardCard',handIndex:0,card:'Anchor'},{kind:'discardCard',handIndex:0,extra:true}])expect(()=>core.deserializeVersionedMatch(JSON.stringify({...base,actions:[action]}))).toThrow();
  expect(()=>core.deserializeVersionedMatch(JSON.stringify({...base,cards:{drawPile:canonical()}}))).toThrow();
  expect(()=>core.deserializeVersionedMatch(JSON.stringify({...base,rules:{...base.rules,extra:1}}))).toThrow();
 });
});
