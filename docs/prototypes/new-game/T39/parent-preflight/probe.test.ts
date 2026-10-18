import {describe,it,expect} from 'vitest';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import * as c from './runtime/src/core';
import {referenceMap} from './runtime/src/core/reference-map';
import type {GameState,Action,CardKind,GameOptions} from './runtime/src/core';
const owned='docs/prototypes/new-game/T39/parent-preflight';
const options:GameOptions={...c.defaultOptions(),seed:2,seats:Array.from({length:4},()=>({kind:'human' as const})),computerStrengths:[],dominationWin:false,roundLimit:null};
function opening(o=options){const r=c.createReferenceGame(referenceMap,o,c.raidCardsRules(o));if(!r.ok)throw Error(r.errors.join(';'));return r.state;}
function act(s:GameState,a:Action){const r=c.apply(s,a);if(!r.ok)throw Error(`${JSON.stringify(a)} ${r.error}`);return r.state;}
function conservation(s:GameState){const cs=s.cards!,all=[...cs.drawPile,...cs.discardPile,...Object.values(cs.hands).flat()];expect(all.length).toBe(40);for(const [kind,n]of Object.entries(c.CARD_COMPOSITION))expect(all.filter(k=>k===kind)).toHaveLength(n);}
function synthetic(defenderHand:CardKind[]=[],stack=40){const s=opening(),player=c.activePlayer(s)!.id,own=s.map.provinces.find(p=>s.ownerOf[p.id]===player)!,target=s.map.provinces.find(p=>s.ownerOf[p.id]!==player&&p.island!==own.island)!;const defender=s.ownerOf[target.id]!;
 const all=(Object.entries(c.CARD_COMPOSITION) as [CardKind,number][]).flatMap(([k,n])=>Array<CardKind>(n).fill(k)),take=(k:CardKind)=>all.splice(all.indexOf(k),1)[0]!;
 s.cards!.hands=Object.fromEntries(s.players.map(p=>[p.id,[]]));s.cards!.hands[player]=(['Raid','Wild','Raid','Compass'] as CardKind[]).map(take);s.cards!.hands[defender]=defenderHand.map(take);s.cards!.drawPile=all;s.cards!.discardPile=[];s.armies[target.id]=stack;return {s,player,target:target.id,defender,own:own.id};}
function reject(s:GameState,a:Action){const before=structuredClone(s);expect(c.apply(s,a).ok).toBe(false);expect(s).toEqual(before);}
function trade(s:GameState){return act(s,{kind:'tradeCards',handIndices:[0,1,2]});}
function findRaid(hand:CardKind[]):[number,number,number]|null {for(let a=0;a<hand.length;a++)for(let b=a+1;b<hand.length;b++)for(let d=b+1;d<hand.length;d++)if(c.classifyCardSet([hand[a]!,hand[b]!,hand[d]!])==='Raid')return [a,b,d];return null;}
function next(s:GameState):Action {
 if(s.cards!.pendingDiscard){const h=s.cards!.hands[c.activePlayer(s)!.id]!,index=h.findIndex(k=>k!=='Raid'&&k!=='Wild'&&k!=='Shield');return {kind:'discardCard',handIndex:index<0?0:index};}
 if(s.cards!.pendingRaid){const enemy=s.map.provinces.find(p=>s.ownerOf[p.id]!==c.activePlayer(s)!.id)!;return {kind:'raidTarget',province:enemy.id};}
 if(s.phase==='cards')return {kind:'skipCards'};
 if(s.pendingCapture)return {kind:'captureMove',amount:1};
 if(s.phase==='reinforce'){
  if(!s.reinforcementPool)return {kind:'endReinforcement'};
  const player=c.activePlayer(s)!.id,owned=c.provincesOf(s,player),front=owned.filter(id=>{const p=c.province(s.map,id)!;return c.neighbours(p).some(to=>s.ownerOf[to]!==player);}),ids=(front.length?front:owned).sort((a,b)=>s.armies[b]!-s.armies[a]!);
  return {kind:'reinforce',province:ids[0]!,amount:s.reinforcementPool};
 }
 const attacks=c.legalAttacks(s).filter((a):a is Extract<Action,{kind:'attack'}>=>a.kind==='attack'&&s.armies[a.from]!>s.armies[a.to]!+1);
 return !s.capturedThisTurn&&attacks[0]?attacks[0]:{kind:'endTurn'};
}
describe('T39 disposable actual source mock',()=>{
 it('scripted bounds include odd/even/one/large with one bounded draw',()=>{for(const [n,max]of [[9,4],[40,20],[1,1],[10000,5000]]){const calls:number[][]=[];expect(c.raidStackAfter(n!,{nextInt:(lo,hi)=>{calls.push([lo,hi]);return hi;}})).toBe(max);expect(calls).toEqual([[1,max]]);}});
 it('synthetic remote choice spends once and gates every unrelated action, invalid targets atomic',()=>{const {s,own,target,player}=synthetic(),before=structuredClone(s),pending=trade(s);expect(s).toEqual(before);expect(pending.cards!.pendingRaid).toEqual({player});expect(pending.cards!.hands[player]).toEqual(['Compass']);expect(pending.cards!.discardPile).toEqual(['Raid','Wild','Raid']);expect(pending.rng).toEqual(s.rng);expect(pending.reinforcementPool).toBe(s.reinforcementPool);
 for(const a of [{kind:'skipCards'},{kind:'endTurn'},{kind:'tradeCards',handIndices:[0,1,2]},{kind:'reinforce',province:own,amount:1},{kind:'raidTarget',province:own},{kind:'raidTarget',province:'unknown'}] as Action[])reject(pending,a);
 const clone=c.cloneState(pending);clone.cards!.pendingRaid!.player;expect(clone.cards!.pendingRaid).not.toBe(pending.cards!.pendingRaid);
 const expected=c.DeterministicRng.fromSnapshot(pending.rng),value=expected.nextInt(1,20),done=act(pending,{kind:'raidTarget',province:target});expect(done.armies[target]).toBe(value);expect(done.rng).toEqual(expected.snapshot());expect(done.ownerOf).toEqual(pending.ownerOf);expect(done.reinforcementPool).toBe(pending.reinforcementPool);expect(done.phase).toBe('reinforce');expect(done.cards!.pendingRaid).toBeUndefined();conservation(done);
 });
 it('synthetic Shield cancels with no RNG and discards first Shield only, public event has no hidden cards',()=>{const {s,defender,target}=synthetic(['Wild','Shield','Compass','Shield']),pending=trade(s),done=act(pending,{kind:'raidTarget',province:target});expect(done.armies[target]).toBe(40);expect(done.rng).toEqual(pending.rng);expect(done.cards!.hands[defender]).toEqual(['Wild','Compass','Shield']);expect(done.cards!.discardPile).toEqual(['Raid','Wild','Raid','Shield']);expect(Object.keys(done.log.at(-1)!).sort()).toEqual(['after','before','defender','event','player','province','shielded','turn']);conservation(done);});
 it('historical trade-v1 still refuses Raid atomically; real schema5 is exact',()=>{const {s}=synthetic();s.rules;const old={...s,rules:c.tradeCardsRules(options)};reject(old,{kind:'tradeCards',handIndices:[0,1,2]});
 const text=c.serializeVersionedMatch(options,[],c.REFERENCE_RAID_CARD_MATCH_IDENTITY),loaded=c.deserializeVersionedMatch(text);expect(loaded.state).toEqual(opening());const payload=JSON.parse(text);for(const [version,schema]of [[1,3],[2,4],[3,4],[2,5],[4,5]])expect(()=>c.deserializeVersionedMatch(JSON.stringify({...payload,rules:{id:'cards',version},actionSchemaVersion:schema,actions:[{kind:'raidTarget',province:'x'}]}))).toThrow();
 });
 it('bounded legal history reaches Raid set with shielded and unshielded enemy forks and real codec continuation',()=>{
 const summaries=[];let found=false;
 for(let seed=1;seed<=24&&!found;seed++){
  const o={...options,seed};let s=opening(o);
  for(let step=0;step<3200&&s.phase!=='finished';step++){
   if(s.phase==='cards'&&!s.cards!.pendingRaid){
    const player=c.activePlayer(s)!.id,indices=findRaid(s.cards!.hands[player]!);
    if(indices){
     const enemies=s.players.filter(p=>!p.eliminated&&p.id!==player),shielded=enemies.find(p=>s.cards!.hands[p.id]!.includes('Shield')),unshielded=enemies.find(p=>!s.cards!.hands[p.id]!.includes('Shield'));
     if(shielded&&unshielded){
      found=true;const before=s,pending=act(s,{kind:'tradeCards',handIndices:indices});
      const save=(name:string,state:GameState)=>{const text=c.serializeVersionedMatch(o,state.history,c.REFERENCE_RAID_CARD_MATCH_IDENTITY);if(existsSync(`${owned}/${name}.json`))expect(readFileSync(`${owned}/${name}.json`,'utf8')).toBe(text);else writeFileSync(`${owned}/${name}.json`,text);expect(c.deserializeVersionedMatch(text).state).toEqual(state);};
      save('legal-before-trade',before);save('legal-pending-raid',pending);
      const outcomes=[];
      for(const [name,enemy]of [['shielded',shielded],['unshielded',unshielded]] as const){const target=s.map.provinces.find(p=>s.ownerOf[p.id]===enemy.id)!.id,done=act(pending,{kind:'raidTarget',province:target});save(`legal-${name}-raid`,done);const load=c.deserializeVersionedMatch(c.serializeVersionedMatch(o,done.history,c.REFERENCE_RAID_CARD_MATCH_IDENTITY)).state;expect(act(load,next(done))).toEqual(act(done,next(done)));outcomes.push({name,target,before:pending.armies[target],after:done.armies[target],beforeRng:pending.rng,afterRng:done.rng,defenderHandBefore:pending.cards!.hands[enemy.id],defenderHandAfter:done.cards!.hands[enemy.id]});conservation(done);}
      summaries.push({seed,actionsBefore:before.history.length,actionsPending:pending.history.length,round:pending.turnNumber,player,indices,hand:before.cards!.hands[player],pool:pending.reinforcementPool,outcomes});break;
     }
    }
   }
   s=act(s,next(s));
  }
  if(!found)summaries.push({seed,actions:s.history.length,phase:s.phase,round:s.turnNumber,hands:s.cards!.hands});
 }
 writeFileSync(`${owned}/legal-search-02.json`,JSON.stringify(summaries,null,2));expect(found).toBe(true);
 },20000);
 it('synthetic one-army target still consumes one bounded rules draw',()=>{const {s,target}=synthetic([],1),pending=trade(s),rng=c.DeterministicRng.fromSnapshot(pending.rng);rng.nextInt(1,1);const done=act(pending,{kind:'raidTarget',province:target});expect(done.armies[target]).toBe(1);expect(done.rng).toEqual(rng.snapshot());expect(done.rng).not.toEqual(pending.rng);conservation(done);});
 it('legal pending invalid target/extra-field refusals and historical trade reconstruction remain exact',()=>{
  const text=readFileSync(`${owned}/legal-pending-raid.json`,'utf8'),payload=JSON.parse(text),loaded=c.deserializeVersionedMatch(text).state;
  for(const province of ['unknown',c.provincesOf(loaded,c.activePlayer(loaded)!.id)[0]!]){reject(loaded,{kind:'raidTarget',province});expect(()=>c.deserializeVersionedMatch(JSON.stringify({...payload,actions:[...payload.actions,{kind:'raidTarget',province}]}))).toThrow();}
  expect(()=>c.deserializeVersionedMatch(JSON.stringify({...payload,actions:[...payload.actions,{kind:'raidTarget',province:'province_4',extra:1}]}))).toThrow();
  const before=JSON.parse(readFileSync(`${owned}/legal-before-trade.json`,'utf8')),old=c.deserializeVersionedMatch(JSON.stringify({...before,rules:{id:'cards',version:2},actionSchemaVersion:4})).state,newer=c.deserializeVersionedMatch(JSON.stringify(before)).state;
  expect(old.rules.cards).toBe('trade-v1');expect(old.cards).toEqual(newer.cards);expect(old.rng).toEqual(newer.rng);expect(old.armies).toEqual(newer.armies);expect(old.history).toEqual(newer.history);
 });
 it('exact geographic raid tuple rebuilds through actual shared setup',()=>{
  const text=c.serializeVersionedMatch(options,[],c.GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY),loaded=c.deserializeVersionedMatch(text);expect(loaded.state.rules.cards).toBe('raid-v1');expect(loaded.state.phase).toBe('cards');expect(loaded.geography).toBeDefined();conservation(loaded.state);
 });

});
