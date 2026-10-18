import {describe,it,expect} from 'vitest';
import {api,core,opening,options,cards,arrange,act,conserved,endPlacement,reject,player,frozen} from './card-sets-fixture';
import type {Kind,State,TradeKind} from './card-sets-fixture';
const kinds:Kind[]=['Anchor','Compass','Lantern','Surge','Raid','Wild','Shield','Squall'];
const key=(hand:readonly Kind[])=>hand.slice().sort().join('|');
const genuine=['Anchor','Compass','Lantern','Surge','Raid'] as const;
const table=new Map<string,TradeKind>();
for(const kind of genuine)for(const hand of [[kind,kind,kind],[kind,kind,'Wild'],[kind,'Wild','Wild']] as Kind[][])table.set(key(hand),kind);

describe('one optional homogeneous set and approved fixed income',()=>{
 it('classifies all512ordered triples against explicit independent homogeneous/Wild tables',()=>{
  expect(api.classifyCardSet).toBeTypeOf('function');let seen=0,valid=0;
  for(const a of kinds)for(const b of kinds)for(const c of kinds){const expected=table.get(key([a,b,c]))??null;expect(api.classifyCardSet!([a,b,c]),[a,b,c].join(',')).toBe(expected);seen++;if(expected)valid++;}
  expect(seen).toBe(512);expect(valid).toBe(35);
  for(const hand of [[],['Anchor'],['Anchor','Wild'],['Anchor','Anchor','Wild','Wild']] as Kind[][])expect(api.classifyCardSet!(hand)).toBeNull();
 });
 it('enters cards after income on initial setup and every turn, even with empty hands',()=>{
  let s=opening();expect(s.phase).toBe('cards');expect(cards(s).hands[player(s)]).toEqual([]);
  const initial=s.currentPlayer;
  for(let turn=0;turn<8;turn++){
   expect(s.phase).toBe('cards');expect(s.currentPlayer).toBe((initial+turn)%4);expect(s.reinforcementPool).toBe(core.reinforcementIncome(s as never,player(s)).total);
   s=act(endPlacement(act(frozen(s),{kind:'skipCards'})),{kind:'endTurn'});conserved(s);
  }
 });
 it('blocks all ordinary input until cards decision, without mutating state/history/RNG',()=>{
  const s=opening(),from=s.map.provinces.find(p=>s.ownerOf[p.id]===player(s))!.id,to=s.map.provinces.find(p=>s.ownerOf[p.id]!==player(s))!.id;
  expect(s.phase).toBe('cards');
  for(const a of [{kind:'reinforce',province:from,amount:1},{kind:'endReinforcement'},{kind:'attack',from,to},{kind:'endTurn'},{kind:'friendlyMove',from,to},{kind:'captureMove'},{kind:'discardCard',handIndex:0},{kind:'watchComputers'},{kind:'stopGame'}])reject(frozen(s),a);
 });
 for(const hand of [[],['Anchor','Anchor','Anchor'],['Anchor','Compass','Raid','Shield','Wild']] as Kind[][])it(`skip with ${hand.length} held cards preserves income and cards, permits placement`,()=>{
  const s=arrange(opening(),hand),before=structuredClone(s),next=act(frozen(s),{kind:'skipCards'});expect(s.phase).toBe('cards');expect(next.phase).toBe('reinforce');
  expect(next.cards).toEqual(before.cards);expect(next.rng).toEqual(before.rng);expect(next.computerRngs).toEqual(before.computerRngs);expect(next.reinforcementPool).toBe(before.reinforcementPool);expect(s).toEqual(before);
  expect(next.history.at(-1)).toEqual({kind:'skipCards'});reject(next,{kind:'skipCards'});reject(next,{kind:'tradeCards',handIndices:[0,1,2]});conserved(endPlacement(next));
 });
 for(const [kind,value] of [['Anchor',5],['Compass',8],['Lantern',15],['Surge',null]] as const)for(const wilds of [0,1,2])it(`${kind} with ${wilds}Wilds has fixed value and spends exactly one set`,()=>{
  const hand=[...Array<Kind>(3-wilds).fill(kind),...Array<Kind>(wilds).fill('Wild')],s=arrange(opening(),hand),before=structuredClone(s),pool=s.reinforcementPool,me=player(s);
  expect(s.phase).toBe('cards');const next=act(frozen(s),{kind:'tradeCards',handIndices:[2,0,1]});
  expect(next.phase).toBe('reinforce');expect(next.reinforcementPool).toBe(value===null?pool*2:pool+value);expect(cards(next).hands[me]).toEqual([]);expect(cards(next).discardPile).toEqual(hand);expect(cards(next).drawPile).toEqual(cards(s).drawPile);expect(next.rng).toEqual(s.rng);expect(next.computerRngs).toEqual(s.computerRngs);expect(s).toEqual(before);conserved(next);
  reject(next,{kind:'tradeCards',handIndices:[0,1,2]});reject(next,{kind:'skipCards'});
 });
 it('keeps nonselected cards in order and discards in original hand order',()=>{
  const s=arrange(opening(),['Wild','Shield','Anchor','Lantern','Wild']);expect(s.phase).toBe('cards');const next=act(s,{kind:'tradeCards',handIndices:[4,2,0]});expect(cards(next).hands[player(s)]).toEqual(['Shield','Lantern']);expect(cards(next).discardPile).toEqual(['Wild','Anchor','Wild']);conserved(next);
 });
 it('refuses invalid sets/indices and staged Raid with no consumption or RNG changes',()=>{
  for(const hand of [['Wild','Wild','Wild'],['Anchor','Compass','Wild'],['Shield','Shield','Wild'],['Squall','Wild','Wild'],['Raid','Wild','Wild']] as Kind[][]){const s=arrange(opening(),hand);expect(s.phase).toBe('cards');reject(frozen(s),{kind:'tradeCards',handIndices:[0,1,2]});conserved(s);}
  const s=arrange(opening(),['Anchor','Anchor','Anchor']);expect(s.phase).toBe('cards');
  for(const indices of [null,'012',[],[0,1],[0,1,2,3],[0,0,1],[-1,1,2],[0,1,3],[0,1,0.5],[0,1,NaN],[0,1,Infinity],[0,1,'2']])reject(frozen(s),{kind:'tradeCards',handIndices:indices});
 });
 it('Surge doubles a previously computed pool exactly once even if board income later changes',()=>{
  const s=arrange(opening(),['Surge','Wild','Wild']);expect(s.phase).toBe('cards');s.reinforcementPool=13;const before=structuredClone(s);s.productionCentres=[];
  const next=act(frozen(s),{kind:'tradeCards',handIndices:[0,1,2]});expect(next.reinforcementPool).toBe(26);expect(next.rng).toEqual(before.rng);
  const own=s.map.provinces.find(p=>s.ownerOf[p.id]===player(s))!.id,placed=act(next,{kind:'reinforce',province:own,amount:4});expect(placed.reinforcementPool).toBe(22);reject(placed,{kind:'tradeCards',handIndices:[0,1,2]});conserved(placed);
 });
 it('later turns keep fixed values rather than increasing a global trade counter',()=>{
  let s=arrange(opening(),['Anchor','Wild','Wild']);expect(s.phase).toBe('cards');
  for(let turn=0;turn<6;turn++){
   s=arrange(s,['Anchor','Wild','Wild']);const pool=s.reinforcementPool;s=act(s,{kind:'tradeCards',handIndices:[0,1,2]});expect(s.reinforcementPool).toBe(pool+5);s=act(endPlacement(s),{kind:'endTurn'});expect(s.phase).toBe('cards');
  }
 });
 it('old deck-v1 preset has no card phase or trade path and remains immutable',()=>{
  const o=options(),result=core.createReferenceGame(opening().map,o,core.cardsRules(o));if(!result.ok)throw Error();expect(result.state.phase).toBe('reinforce');expect(result.state.rules.cards).toBe('deck-v1');reject(result.state,{kind:'skipCards'});reject(result.state,{kind:'tradeCards',handIndices:[0,1,2]});
 });
});
