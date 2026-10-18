import {describe,it,expect} from 'vitest';
import {defaultOptions} from '../../../../../src/core/options';
import {createReferenceGame} from '../../../../../src/core/reference-game';
import {referenceMap} from '../../../../../src/core/reference-map';
import {victoryRules} from '../../../../../src/core/state';
import {DeterministicRng} from '../../../../../src/core/rng';
import * as c from './candidate-bypass-discard';
const options={...defaultOptions(),seed:37,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
const initial=()=>c.create(options);
function act(s:c.CardState,a:c.CardAction){const r=c.apply(s,a);if(!r.ok)throw Error(r.error);return r.state;}
function all(s:c.CardState){return [...s.cards.drawPile,...s.cards.discardPile,...Object.values(s.cards.hands).flat()].sort();}
function conserve(s:c.CardState){expect(all(s)).toEqual(c.canonical().sort());expect(Object.values(s.cards.hands).every(h=>h.length<=5&&!h.includes('Squall'))).toBe(true);}
function fixture(hand:c.CardKind[]=[],top:c.CardKind='Shield'){
 const s=initial(),p=s.players[s.currentPlayer]!.id;
 s.phase='attack';s.reinforcementPool=0;s.capturedThisTurn=true;
 const rest=c.canonical();const take=(kind:c.CardKind)=>rest.splice(rest.indexOf(kind),1)[0]!;
 s.cards.hands[p]=hand.map(take);s.cards.drawPile=[take(top),...rest];return s;
}
function replay(s:c.CardState,actions:c.CardAction[]){return actions.reduce(act,structuredClone(s));}
describe('disposable T37 feasibility only',()=>{
 it('exact composition, empty hands, shuffle after centres and game RNG continuation',()=>{
  const base=createReferenceGame(referenceMap,options,victoryRules(options));expect(base.ok).toBe(true);if(!base.ok)throw Error('setup');
  const rng=DeterministicRng.fromSnapshot(base.state.rng),expected=rng.shuffled(c.canonical()),s=initial();
  expect(s.cards.drawPile).toEqual(expected);expect(s.rng).toEqual(rng.snapshot());expect(s.ownerOf).toEqual(base.state.ownerOf);expect(s.productionCentres).toEqual(base.state.productionCentres);expect(Object.values(s.cards.hands).flat()).toEqual([]);conserve(s);
 });
 it('takes exactly top one on capturing turn and nothing for ordinary noncapture turn',()=>{
  const s=fixture(),p=s.players[s.currentPlayer]!.id,next=act(s,{kind:'endTurn'});expect(next.cards.hands[p]).toEqual(['Shield']);expect(next.cards.drawPile).toEqual(s.cards.drawPile.slice(1));conserve(next);
  const no=fixture();no.capturedThisTurn=false;const done=act(no,{kind:'endTurn'});expect(done.cards).toEqual(no.cards);
 });
 it('full hand waits before peeking, changing piles/RNG, handing off or victory; chosen discard then draw',()=>{
  const s=fixture(['Anchor','Compass','Lantern','Surge','Wild']),p=s.players[s.currentPlayer]!.id;
  const pending=act(s,{kind:'endTurn'});expect(pending.cards.pendingDiscard).toEqual({player:p});expect(pending.cards.drawPile).toEqual(s.cards.drawPile);expect(pending.rng).toEqual(s.rng);expect(pending.currentPlayer).toBe(s.currentPlayer);expect(pending.winner).toBe('');expect(c.apply(pending,{kind:'endTurn'}).ok).toBe(false);
  const done=act(pending,{kind:'discardCard',handIndex:2});expect(done.cards.hands[p]).toEqual(['Anchor','Compass','Surge','Wild','Shield']);expect(done.cards.discardPile).toEqual(['Lantern']);expect(s.cards.hands[p]).toHaveLength(5);conserve(pending);conserve(done);
 });
 it('Squall discards hand and itself without replacement, including empty hand',()=>{
  for(const h of [[],['Anchor','Wild']] as c.CardKind[][]){const s=fixture(h,'Squall'),p=s.players[s.currentPlayer]!.id,done=act(s,{kind:'endTurn'});expect(done.cards.hands[p]).toEqual([]);expect(done.cards.discardPile).toEqual([...h,'Squall']);expect(done.cards.drawPile.length).toBe(s.cards.drawPile.length-1);conserve(done);}
 });
 it('reshuffles only discard and resumes same game RNG',()=>{
  const s=fixture(['Anchor']);s.cards.discardPile=s.cards.drawPile;s.cards.drawPile=[];
  const rng=DeterministicRng.fromSnapshot(s.rng),pile=rng.shuffled(s.cards.discardPile),done=act(s,{kind:'endTurn'});expect(done.cards.drawPile).toEqual(pile.slice(1));expect(done.rng).toEqual(rng.snapshot());conserve(done);
 });
 it('public view never contains another hand kind or private pile order',()=>{
  const s=fixture(['Lantern']),other=s.players.find(p=>p.id!==s.players[s.currentPlayer]!.id)!.id;
  const v=c.view(s,other);expect(v.hand).toEqual([]);expect(Object.keys(v).sort()).toEqual(['discardCount','drawCount','hand','handCounts']);
 });
 it('pending discard and reshuffle continuation replay exactly from frozen fixture',()=>{
  const s=fixture(['Anchor','Compass','Lantern','Surge','Wild']);s.cards.discardPile=s.cards.drawPile;s.cards.drawPile=[];
  const actions:c.CardAction[]=[{kind:'endTurn'},{kind:'discardCard',handIndex:0}];const pending=act(s,actions[0]!);expect(replay(s,actions.slice(0,1))).toEqual(pending);expect(replay(s,actions)).toEqual(act(pending,actions[1]!));conserve(replay(s,actions));
 });
 it('decisive turn still rewards before final conquest',()=>{
  const s=fixture(),p=s.players[s.currentPlayer]!.id;
  for(const id of Object.keys(s.ownerOf))s.ownerOf[id]=p;for(const player of s.players)player.eliminated=player.id!==p;
  const done=act(s,{kind:'endTurn'});expect(done.winner).toBe(p);expect(done.cards.hands[p]).toEqual(['Shield']);conserve(done);
 });
});
