import {describe,it,expect} from 'vitest';
import {api,core,COMPOSITION,opening,cards,canonical,conserved,arrange,ready,act,player,example,capture,frozen,settings,referenceMap} from './card-deck-fixture';
import type {CardAction,State} from './card-deck-fixture';

describe('approved deck and private hands',()=>{
 it('has exactly the approved eight kinds and five-card cap, empty opening hands',()=>{
  const s=opening();expect(api.CARD_COMPOSITION).toEqual(COMPOSITION);expect(api.HAND_LIMIT).toBe(5);
  expect(cards(s).drawPile).toHaveLength(40);expect(cards(s).discardPile).toEqual([]);
  expect(cards(s).hands).toEqual(Object.fromEntries(s.players.map(p=>[p.id,[]])));conserved(s);
 });
 for(const geographic of [false,true])it(`shuffles after the deal and centres on the same rules stream (${geographic})`,()=>{
  const options=settings(),r=geographic?core.createGeographicGame(options,core.victoryRules(options)):core.createReferenceGame(referenceMap,options,core.victoryRules(options));
  if(!r.ok)throw Error(r.errors.join(';'));const old=r.state,s=opening(1994,geographic),rng=core.DeterministicRng.fromSnapshot(old.rng);
  expect(cards(s).drawPile).toEqual(rng.shuffled(canonical()));expect(s.rng).toEqual(rng.snapshot());
  for(const key of ['ownerOf','armies','productionCentres','currentPlayer','computerRngs'] as const)expect(s[key]).toEqual(old[key]);
  expect(old).not.toHaveProperty('cards');expect(opening(1994,geographic)).toEqual(s);expect(cards(opening(1995,geographic)).drawPile).not.toEqual(cards(s).drawPile);
 });
 it('does not reward a non-capturing turn or consume any rules/computer RNG',()=>{
  const s=ready(opening()),before=structuredClone(s),next=act(frozen(s),{kind:'endTurn'});
  expect(cards(next)).toEqual(cards(s));expect(next.rng).toEqual(s.rng);expect(next.computerRngs).toEqual(s.computerRngs);expect(s).toEqual(before);
 });
 it('awards one top card for multiple real captures and never at capture confirmation',()=>{
  const x=example();arrange(x.s,[],['Compass']);const me=player(x.s),n=cards(x.s).drawPile.length;
  let s=capture(frozen(x.s),x.from,x.to);expect(cards(s).hands[me]).toEqual([]);
  s.rng=new core.DeterministicRng(0).snapshot();s=capture(s,x.from,x.other);
  expect(cards(s).drawPile).toHaveLength(n);const done=act(s,{kind:'endTurn'});
  expect(cards(done).hands[me]).toEqual(['Compass']);expect(cards(done).drawPile).toHaveLength(n-1);conserved(done);
 });
 it('a captured turn still earns after a later failed attack exhausts its source',()=>{
  const x=example();arrange(x.s,[],['Lantern']);let s=capture(x.s,x.from,x.to);const me=player(s);
  s.armies[x.from]=2;s.armies[x.other]=50;
  for(let n=0;n<128&&s.armies[x.from]!>1;n++)s=act(s,{kind:'attack',from:x.from,to:x.other});
  expect(s.armies[x.from]).toBe(1);expect(s.ownerOf[x.from]).toBe(me);expect(s.capturedThisTurn).toBe(true);
  s=act(s,{kind:'endTurn'});expect(cards(s).hands[me]).toEqual(['Lantern']);conserved(s);
 });
 it('waits for a chosen discard before drawing, victory or handoff; refuses every other action atomically',()=>{
  const x=example(true);arrange(x.s,['Anchor','Compass','Lantern','Raid','Shield'],['Wild']);let s=capture(x.s,x.from,x.to);const me=player(s);
  const beforeEnd=structuredClone(s);s=act(frozen(s),{kind:'endTurn'});const c=cards(s);
  expect(c.pendingDiscard).toEqual({player:me});expect(c.drawPile).toEqual(cards(beforeEnd).drawPile);expect(s.rng).toEqual(beforeEnd.rng);expect(s.currentPlayer).toBe(beforeEnd.currentPlayer);expect(s.result).toBeUndefined();expect(s.winner).toBe('');expect(s.log).toEqual(beforeEnd.log);
  const snapshot=structuredClone(s);
  const blocked:CardAction[]=[{kind:'endTurn'},{kind:'endReinforcement'},{kind:'reinforce',province:x.from,amount:1},{kind:'attack',from:x.from,to:x.to},{kind:'captureMove'},{kind:'friendlyMove',from:x.from,to:x.to},{kind:'watchComputers'},{kind:'stopGame'},...[-1,5,0.5,NaN,Infinity].map(handIndex=>({kind:'discardCard' as const,handIndex}))];
  for(const a of blocked){expect(core.apply(frozen(s),a as never).ok,JSON.stringify(a)).toBe(false);expect(s).toEqual(snapshot);}
  const done=act(s,{kind:'discardCard',handIndex:2});expect(cards(done).hands[me]).toEqual(['Anchor','Compass','Raid','Shield','Wild']);expect(cards(done).discardPile).toEqual(['Lantern']);expect(done.phase).toBe('finished');expect(done.result?.reason).toBe('conquest');expect(done.history.slice(-2)).toEqual([{kind:'endTurn'},{kind:'discardCard',handIndex:2}]);expect(done.log.filter(e=>e.event==='turn_ended')).toHaveLength(1);conserved(done);
 });
 it('does a friendly transfer once even when its end-turn reward requires discard',()=>{
  const x=example();arrange(x.s,['Anchor','Compass','Lantern','Raid','Shield'],['Wild']);let s=capture(x.s,x.from,x.to);const me=player(s),before=structuredClone(s.armies);
  s=act(s,{kind:'friendlyMove',from:x.from,to:x.to,amount:3});expect(cards(s).pendingDiscard).toEqual({player:me});expect(s.armies[x.from]).toBe(before[x.from]!-3);expect(s.armies[x.to]).toBe(before[x.to]!+3);
  const moved=structuredClone(s.armies);s=act(s,{kind:'discardCard',handIndex:0});expect(s.armies).toEqual(moved);expect(s.history.filter(a=>a.kind==='friendlyMove')).toHaveLength(1);expect(s.log.filter(e=>e.event==='turn_ended')).toHaveLength(1);conserved(s);
 });
 for(const hand of [[],['Anchor','Compass','Lantern','Raid','Shield']] as const)it(`Squall discards itself and all ${hand.length} held cards without replacement`,()=>{
  const x=example();arrange(x.s,[...hand],['Squall']);let s=capture(x.s,x.from,x.to);const me=player(s),beforeDraw=cards(s).drawPile.slice(1);s=act(s,{kind:'endTurn'});
  if(hand.length)s=act(s,{kind:'discardCard',handIndex:1});
  expect(cards(s).hands[me]).toEqual([]);expect(cards(s).drawPile).toEqual(beforeDraw);expect(cards(s).discardPile.slice().sort()).toEqual([...hand,'Squall'].sort());conserved(s);
 });
 it('discards an eliminated enemy hand immediately, before capture move or end turn',()=>{
  const x=example(true);arrange(x.s,[],['Anchor']);const enemy=x.s.ownerOf[x.to]!,c=cards(x.s);
  c.hands[enemy]=[c.drawPile.splice(c.drawPile.indexOf('Shield'),1)[0]!];
  const next=act(frozen(x.s),{kind:'attack',from:x.from,to:x.to});expect(next.phase).toBe('capture');expect(next.players.find(p=>p.id===enemy)!.eliminated).toBe(true);expect(cards(next).hands[enemy]).toEqual([]);expect(cards(next).hands[player(x.s)]).toEqual([]);expect(cards(next).discardPile).toEqual(['Shield']);conserved(next);
 });
 it('returns only the viewer hand and public counts, without mutable aliases or hidden kinds in logs',()=>{
  const x=example();arrange(x.s,[],['Raid']);const s=act(capture(x.s,x.from,x.to),{kind:'endTurn'}),owner=player(x.s);expect(api.cardView).toBeTypeOf('function');
  const other=s.players.find(p=>p.id!==owner)!.id,own=api.cardView!(s,owner),view=api.cardView!(s,other);
  expect(own).toEqual({drawCount:39,discardCount:0,handCounts:Object.fromEntries(s.players.map(p=>[p.id,p.id===owner?1:0])),hand:['Raid']});expect(view.hand).toEqual([]);expect(Object.keys(view).sort()).toEqual(['drawCount','discardCount','handCounts','hand'].sort());
  (own.hand as string[]).push('Wild');(own.handCounts as Record<string,number>)[owner]=999;expect(cards(s).hands[owner]).toEqual(['Raid']);expect(JSON.stringify(s.log)).not.toMatch(/Raid|handIndex|drawPile/);conserved(s);
 });
 it('deep clones card arrays and pending metadata; out-of-phase discard is atomic',()=>{
  const s=arrange(ready(opening()),['Anchor','Compass','Lantern','Raid','Shield']);s.capturedThisTurn=true;const pending=act(s,{kind:'endTurn'}),copy=core.cloneState(pending) as State;
  cards(copy).drawPile.pop();cards(copy).discardPile.push('Squall');cards(copy).hands[player(pending)]!.pop();delete cards(copy).pendingDiscard;
  expect(cards(pending).drawPile).toHaveLength(35);expect(cards(pending).discardPile).toEqual([]);expect(cards(pending).hands[player(pending)]).toHaveLength(5);expect(cards(pending).pendingDiscard).toBeDefined();
  const before=structuredClone(s);expect(core.apply(frozen(s),{kind:'discardCard',handIndex:0} as never).ok).toBe(false);expect(s).toEqual(before);
 });
});
