import {describe,it,expect,vi} from 'vitest';
import * as c from '../../src/core';
import type {Action,CardKind,GameState} from '../../src/core';
import {historicalComputerAction} from './computer-cards-historical';
import {fixture,opening,passive,step,synthetic,view} from './computer-cards-fixtures';
import type {Policy,View} from './computer-cards-fixtures';

async function policy():Promise<Policy>{
 // Existing barrel import collects on baseline; absent new exports fail assertions.
 const m=await import('../../src/core');
 expect(m).toHaveProperty('computerView',expect.any(Function));
 expect(m).toHaveProperty('decideComputerAction',expect.any(Function));
 return m as unknown as Policy;
}
function conserved(s:GameState){const all=[...s.cards!.drawPile,...s.cards!.discardPile,...Object.values(s.cards!.hands).flat()];for(const [k,n] of Object.entries(c.CARD_COMPOSITION))expect(all.filter(x=>x===k)).toHaveLength(n);}
function protect(a:CardKind[]):CardKind[]{return new Proxy(a,{get(t,k,r){if(k===Symbol.iterator||typeof k==='string'&&/^\d+$/.test(k))throw Error('private contents read');return Reflect.get(t,k,r);}});}
function poison(s:GameState){const own=c.activePlayer(s)!.id;for(const p of s.players)if(p.id!==own)s.cards!.hands[p.id]=protect(s.cards!.hands[p.id]!);s.cards!.drawPile=protect(s.cards!.drawPile);for(const key of ['rng','computerRngs'] as const)Object.defineProperty(s,key,{get(){throw Error(`${key} read`);},configurable:true});}

describe('independent computer card policy acceptance',()=>{
 const choices:[string,CardKind[],number,readonly[number,number,number]][]=[
  ['literal Anchor +5 beats Raid',['Raid','Wild','Wild','Anchor','Shield'],1,[1,2,3]],
  ['literal Compass +8 beats Anchor +5',['Anchor','Wild','Wild','Compass','Shield'],1,[1,2,3]],
  ['literal Lantern +15 beats Compass +8',['Compass','Wild','Wild','Lantern','Shield'],1,[1,2,3]],
  ['Anchor +5 beats Surge gain 4',['Anchor','Wild','Wild','Surge','Shield'],4,[0,1,2]],
  ['Surge gain 6 beats Anchor +5',['Anchor','Wild','Wild','Surge','Shield'],6,[1,2,3]],
  ['Compass +8 beats Surge gain 7',['Compass','Wild','Wild','Surge','Shield'],7,[0,1,2]],
  ['Surge gain 9 beats Compass +8',['Compass','Wild','Wild','Surge','Shield'],9,[1,2,3]],
  ['Surge gain 16 beats Lantern +15',['Lantern','Wild','Wild','Surge','Shield'],16,[1,2,3]],
  ['Lantern +15 beats Surge gain 14',['Lantern','Wild','Wild','Surge','Shield'],14,[0,1,2]],
  ['equal gain uses fewer Wilds',['Anchor','Wild','Wild','Anchor','Anchor'],5,[0,3,4]],
  ['equal gain/equal Wilds uses lexicographic indices',['Anchor','Anchor','Anchor','Anchor','Shield'],5,[0,1,2]],
  ['one Wild is legal',['Compass','Shield','Compass','Wild'],1,[0,2,3]],
  ['two Wilds are legal',['Lantern','Shield','Wild','Wild'],1,[0,2,3]],
  ['Raid only after all income sets',['Raid','Raid','Wild','Shield'],10,[0,1,2]],
 ];
 for(const [name,hand,pool,indices] of choices)it(name,async()=>{
  const p=await policy(),v=view(hand,pool),snapshot=structuredClone(v);
  expect(p.decideComputerAction(v)).toEqual({kind:'tradeCards',handIndices:indices});expect(v).toEqual(snapshot);
  const s=synthetic(hand,pool),before=structuredClone(s),a=p.computerAction(s);
  expect(a).toEqual({kind:'tradeCards',handIndices:indices});expect(s).toEqual(before);conserved(s);expect(c.apply(s,a!).ok).toBe(true);
 });
 for(const hand of [[],['Wild','Wild','Wild'],['Shield','Shield','Shield'],['Squall','Wild','Wild'],['Anchor','Compass','Lantern']] as CardKind[][])it(`skips invalid/no set ${hand.join('/')}`,async()=>{const p=await policy();expect(p.decideComputerAction(view(hand))).toEqual({kind:'skipCards'});const s=synthetic(hand);expect(p.computerAction(s)).toEqual({kind:'skipCards'});expect(c.apply(s,{kind:'skipCards'}).ok).toBe(true);});
 it('ties equal Surge/army gain by indices, not a card-kind preference',async()=>{const p=await policy();expect(p.decideComputerAction(view(['Surge','Wild','Wild','Lantern'],15))).toEqual({kind:'tradeCards',handIndices:[0,1,2]});expect(p.decideComputerAction(view(['Lantern','Wild','Wild','Surge'],15))).toEqual({kind:'tradeCards',handIndices:[0,1,2]});});
 it('Raid availability respects rule stage and adjacent-enemy requirement',async()=>{const p=await policy(),v=view(['Raid','Raid','Wild']);expect(p.decideComputerAction({...v,cardStage:'trade-v1'})).toEqual({kind:'skipCards'});expect(p.decideComputerAction({...v,countries:v.countries.map(x=>({...x,neighbours:[]}))})).toEqual({kind:'skipCards'});});
 it('mandatory Raid chooses adjacent stack then raw ID; only missing adjacency permits remote fallback',async()=>{const p=await policy(),v={...view(),pendingRaid:true};expect(p.decideComputerAction(v)).toEqual({kind:'raidTarget',province:'a10'});expect(p.decideComputerAction({...v,countries:v.countries.map(x=>x.id==='a2'?{...x,armies:21}:x)})).toEqual({kind:'raidTarget',province:'a2'});expect(p.decideComputerAction({...v,countries:v.countries.map(x=>({...x,neighbours:[]}))})).toEqual({kind:'raidTarget',province:'z99'});});
 it('discards oldest index zero before an actual Squall draw, preserving composition',async()=>{
  const p=await policy();let s=synthetic(['Raid','Anchor','Shield','Wild','Surge']);const own=c.activePlayer(s)!.id;
  s.phase='attack';s.reinforcementPool=0;s.capturedThisTurn=true;
  const deck=s.cards!.drawPile,i=deck.indexOf('Squall');deck.unshift(deck.splice(i,1)[0]!);conserved(s);
  s=step(s,{kind:'endTurn'});expect(s.cards!.pendingDiscard).toEqual({player:own});expect(s.cards!.drawPile[0]).toBe('Squall');
  const before=structuredClone(s);expect(p.computerAction(s)).toEqual({kind:'discardCard',handIndex:0});expect(s).toEqual(before);
  s=step(s,{kind:'discardCard',handIndex:0});expect(s.cards!.hands[own]).toEqual([]);expect(s.cards!.pendingDiscard).toBeUndefined();expect(s.cards!.discardPile).toEqual(['Raid','Anchor','Shield','Wild','Surge','Squall']);conserved(s);
  if(s.phase!=='finished'&&s.phase!=='human-loss'){const next=p.computerAction(s);expect(next).not.toBeNull();expect(c.apply(s,next!).ok).toBe(true);}
 });
 it('uses ordinary Shield cancellation after a choice made without reading the hidden Shield',async()=>{
  const p=await policy(),s=fixture('policy-raid-pending').state,expected=p.computerAction(s);expect(expected).toEqual({kind:'raidTarget',province:'province_30'});
  // Synthetic Shield variant of the real public Raid position; rebuild all cards.
  const defender=s.ownerOf.province_30!,own=c.activePlayer(s)!.id,ownHand=[...s.cards!.hands[own]!];
  const deck=(Object.entries(c.CARD_COMPOSITION) as [CardKind,number][]).flatMap(([k,n])=>Array<CardKind>(n).fill(k));
  for(const k of [...ownHand,'Shield'] as CardKind[]){const i=deck.indexOf(k);if(i<0)throw Error('composition');deck.splice(i,1);}
  s.cards!.hands=Object.fromEntries(s.players.map(x=>[x.id,x.id===own?ownHand:x.id===defender?['Shield' as CardKind]:[]]));s.cards!.drawPile=deck;s.cards!.discardPile=[];conserved(s);
  const guarded=structuredClone(s);poison(guarded);expect(p.computerAction(guarded)).toEqual(expected);
  const after=step(s,expected!);expect(after.armies.province_30).toBe(s.armies.province_30);expect(after.rng).toEqual(s.rng);expect(after.cards!.hands[defender]).not.toContain('Shield');expect(after.cards!.discardPile.at(-1)).toBe('Shield');expect(after.cards!.pendingRaid).toBeUndefined();conserved(after);
 });
 it('projects only copied public facts and own hand, including nested topology and legal pairs',async()=>{
  const p=await policy(),s=synthetic(['Anchor','Wild']);s.phase='attack';s.reinforcementPool=0;
  const own=c.activePlayer(s)!.id,enemy=s.players.find(x=>x.id!==own)!.id;
  for(const x of s.map.provinces){s.ownerOf[x.id]=own;s.armies[x.id]=3;}s.ownerOf[s.map.provinces.at(-1)!.id]=enemy;
  const before=structuredClone(s),v=p.computerView(s);
  expect(Object.keys(v).sort()).toEqual(['strategy','playerId','phase','cardStage','pendingCapture','pendingDiscard','pendingRaid','ownHand','handCounts','drawCount','discardCount','discardTop','reinforcementPool','countries','attackPairs','movePairs','attacksThisTurn','attackBudget'].sort());
  expect(v).toMatchObject({playerId:own,phase:'attack',cardStage:'raid-v1',pendingCapture:false,pendingDiscard:false,pendingRaid:false,ownHand:['Anchor','Wild'],reinforcementPool:0,attacksThisTurn:0,attackBudget:s.map.provinces.length,drawCount:s.cards!.drawPile.length,discardCount:0,discardTop:null});
  expect(v.handCounts).toEqual(Object.fromEntries(s.players.map(x=>[x.id,s.cards!.hands[x.id]!.length])));
  expect(v.countries).toEqual(s.map.provinces.map(x=>({id:x.id,owner:s.ownerOf[x.id],armies:s.armies[x.id],neighbours:[...x.borders,...x.seaLanes]})));
  expect(v.attackPairs).toEqual(c.legalAttacks(s));
  expect(v.movePairs).toEqual(c.friendlySources(s).flatMap(from=>c.friendlyTargets(s,from).map(to=>({kind:'friendlyMove',from,to}))));
  expect(v.attackPairs.length).toBeGreaterThan(0);expect(v.movePairs.length).toBeGreaterThan(0);
  const mutable=v as unknown as {ownHand:CardKind[];handCounts:Record<string,number>;countries:{owner:string;neighbours:string[]}[];attackPairs:{from:string}[];movePairs:{to:string}[]};
  mutable.ownHand.push('Squall');mutable.handCounts[own]=999;mutable.countries[0]!.owner='changed';mutable.countries[0]!.neighbours.push('changed');mutable.attackPairs[0]!.from='changed';mutable.movePairs[0]!.to='changed';
  expect(s).toEqual(before);
 });
 it('cannot inspect enemy contents, deck order, either RNG stream, or other controllers',async()=>{
  const p=await policy(),s=synthetic(['Raid','Wild','Wild']);
  const own=c.activePlayer(s)!.id,enemy=s.players.find(x=>x.id!==own)!.id;
  const i=s.cards!.drawPile.indexOf('Anchor');s.cards!.hands[enemy]!.push(s.cards!.drawPile.splice(i,1)[0]!);
  const expectedView=p.computerView(s),expectedAction=p.decideComputerAction(expectedView),before=structuredClone(s);
  const changed=structuredClone(s);const swap=changed.cards!.drawPile.indexOf('Compass');changed.cards!.drawPile[swap]='Anchor';changed.cards!.hands[enemy]=['Compass'];changed.cards!.drawPile.reverse();changed.rng={seed:8,state:12};
  for(const x of changed.players)if(x.id!==own)Object.defineProperty(x,'kind',{get(){throw Error('other controller read');}});
  expect(p.computerView(changed)).toEqual(expectedView);expect(p.computerAction(changed)).toEqual(expectedAction);
  const guarded=structuredClone(s);poison(guarded);expect(p.computerView(guarded)).toEqual(expectedView);expect(p.computerAction(guarded)).toEqual(expectedAction);expect(s).toEqual(before);
 });
 it('keeps host eligibility outside the decision view',async()=>{
  const p=await policy(),s=synthetic(['Anchor','Anchor','Anchor']),v=p.computerView(s);
  expect(p.decideComputerAction(v)).toEqual({kind:'tradeCards',handIndices:[0,1,2]});
  for(const phase of ['finished','human-loss'] as const)expect(p.computerAction({...s,phase})).toBeNull();
  expect(p.computerAction({...s,currentPlayer:999})).toBeNull();
  for(const patch of [{kind:'human' as const},{eliminated:true}])expect(p.computerAction({...s,players:s.players.map((x,i)=>i===s.currentPlayer?{...x,...patch}:x)})).toBeNull();
  const human={...s,players:s.players.map((x,i)=>i===s.currentPlayer?{...x,kind:'human' as const}:x)};
  expect(p.computerView(human)).toEqual(v);expect(p.decideComputerAction({...v,playerId:null})).toBeNull();
 });
 it('preserves the historical script component and its legal exchange budget',async()=>{
  const p=await policy(),options={...c.defaultOptions(),seed:1994,dominationWin:false},created=c.createGame(options);if(!created.ok)throw Error(created.errors.join(';'));
  let s=created.state,compared=0;
  for(let n=0;n<240&&s.phase!=='finished'&&s.phase!=='human-loss';n++){
   const before=structuredClone(s),expected=historicalComputerAction(s),actual=c.activePlayer(s)?.kind==='computer'?p.decideComputerAction(p.computerView(s)):null;expect(actual).toEqual(expected);expect(s).toEqual(before);if(actual)compared++;
   s=step(s,actual??passive(s));
  }
  expect(compared).toBeGreaterThan(20);
  const v={...view(),phase:'attack' as const,countries:[{id:'home',owner:'self',armies:20,neighbours:['enemy']},{id:'enemy',owner:'other',armies:1,neighbours:['home']}],attackPairs:[{kind:'attack' as const,from:'home',to:'enemy'}],attackBudget:2,attacksThisTurn:1};
  expect(p.decideComputerAction(v)).toEqual({kind:'attack',from:'home',to:'enemy'});expect(p.decideComputerAction({...v,attacksThisTurn:2})).toEqual({kind:'endTurn'});
 });
 it('continues a legal recorded Raid prefix and loads its actions without invoking policy',async()=>{
  const p=await policy(),loaded=fixture('policy-raid-before'),s=loaded.state,own=c.activePlayer(s)!.id;
  expect(s.history).toHaveLength(429);expect(s.cards!.hands[own]).toEqual(['Compass','Raid','Raid','Shield','Wild']);
  const streams=structuredClone(s.computerRngs),trade:Action={kind:'tradeCards',handIndices:[1,2,4]};expect(p.computerAction(s)).toEqual(trade);
  const pending=step(s,trade);expect(pending).toEqual(fixture('policy-raid-pending').state);expect(p.computerAction(pending)).toEqual({kind:'raidTarget',province:'province_30'});
  const after=step(pending,{kind:'raidTarget',province:'province_30'});expect(pending.armies.province_30).toBe(22);expect(after.armies.province_30).toBe(5);expect(after).toEqual(fixture('policy-raid-after').state);expect(after.computerRngs).toEqual(streams);
  // Spy on the actual policy module exports while calling the actual codec.
  const policyModule=await import('../../src/core/computer');const spy=vi.spyOn(policyModule,'computerAction').mockImplementation(()=>{throw Error('load reran policy');});const decisionSpy=vi.spyOn(policyModule,'decideComputerAction').mockImplementation(()=>{throw Error('load reran decision policy');});
  try{const text=c.serializeVersionedMatch(loaded.options,after.history,loaded.identity);expect(c.deserializeVersionedMatch(text).state).toEqual(after);expect(fixture('policy-raid-pending').state).toEqual(pending);expect(spy).not.toHaveBeenCalled();expect(decisionSpy).not.toHaveBeenCalled();}finally{decisionSpy.mockRestore();spy.mockRestore();}
 });
 it('completes a legal mixed seed-one game within 2N+6 actions per computer turn',async()=>{
  const p=await policy(),loaded=opening(1);let s=loaded.state,completed=0,trades=0,discards=0,computerCount=0;
  const streams=structuredClone(s.computerRngs);let turnPlayer=s.currentPlayer;
  const budget=2*s.map.provinces.length+6;
  // 12,000 is a test stopping budget, not a runtime policy/rule constant.
  for(let n=0;n<12000&&s.phase!=='finished'&&s.phase!=='human-loss';n++){
   const computer=c.activePlayer(s)!.kind==='computer',before=structuredClone(s),action=p.computerAction(s);
   expect(action===null).toBe(!computer);expect(s).toEqual(before);const a=action??passive(s);
   if(computer){computerCount++;expect(computerCount).toBeLessThanOrEqual(budget);if(a.kind==='tradeCards')trades++;if(a.kind==='discardCard')discards++;}
   s=step(s,a);expect(s.computerRngs).toEqual(streams);
   if(s.currentPlayer!==turnPlayer||s.phase==='finished'||s.phase==='human-loss'){if(computer)completed++;computerCount=0;turnPlayer=s.currentPlayer;}
  }
  expect(s.phase).toBe('finished');expect(completed).toBeGreaterThan(3);expect(trades).toBeGreaterThan(0);expect(discards).toBeGreaterThan(0);
  expect(c.deserializeVersionedMatch(c.serializeVersionedMatch(loaded.options,s.history,loaded.identity)).state).toEqual(s);
 },60000);
 it('completes an imported older-policy mandatory Raid rather than revisiting its recorded trade',async()=>{
  const p=await policy();
  const mixed=(name:string)=>{const old=fixture(`T39-${name}`),options={...old.options,seats:[{kind:'human' as const},{kind:'computer' as const},{kind:'computer' as const},{kind:'computer' as const}],computerStrengths:['Normal','Normal','Normal'] as const};return c.deserializeVersionedMatch(c.serializeVersionedMatch(options,old.state.history,old.identity));};
  const before=mixed('legal-before-trade').state,pending=mixed('legal-pending-raid').state;
  expect(c.activePlayer(pending)!.kind).toBe('computer');expect(pending.history.at(-1)).toEqual({kind:'tradeCards',handIndices:[0,1,4]});
  expect(p.computerAction(before)).not.toEqual(pending.history.at(-1));expect(pending.cards!.pendingRaid).toBeDefined();
  const original=structuredClone(pending),a=p.computerAction(pending);expect(a?.kind).toBe('raidTarget');expect(pending).toEqual(original);
  const after=step(pending,a!);expect(after.cards!.pendingRaid).toBeUndefined();expect(after.phase).toBe('reinforce');expect(after.history).toEqual([...pending.history,a]);
  // Synthetic disconnected-topology variant, not a replayable checkpoint:
  // an already mandatory Raid must still issue an ordinary legal remote action.
  const remote={...structuredClone(pending),map:{...pending.map,provinces:pending.map.provinces.map(x=>({...x,borders:[],seaLanes:[]}))}};
  const ra=p.computerAction(remote);expect(ra?.kind).toBe('raidTarget');expect(c.apply(remote,ra!).ok).toBe(true);
 });
 it('projects pending flags and public top without including earlier discard contents',async()=>{
  const p=await policy(),s=synthetic(['Anchor']);s.cards!.pendingRaid={player:c.activePlayer(s)!.id};
  const d=s.cards!.drawPile; s.cards!.discardPile.push(d.shift()!,d.shift()!);
  const v=p.computerView(s);expect(v.pendingRaid).toBe(true);expect(v.discardCount).toBe(2);expect(v.discardTop).toBe(s.cards!.discardPile.at(-1));
  expect(v).not.toHaveProperty('discardPile');expect(v).not.toHaveProperty('history');
  delete s.cards!.pendingRaid;s.cards!.pendingDiscard={player:c.activePlayer(s)!.id};expect(p.computerView(s).pendingDiscard).toBe(true);
  delete s.cards!.pendingDiscard;s.phase='capture';expect(p.computerView(s).pendingCapture).toBe(true);
 });

});
