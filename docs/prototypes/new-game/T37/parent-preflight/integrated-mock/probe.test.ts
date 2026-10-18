import {writeFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as c from './runtime/src/core';
import {referenceMap} from './runtime/src/core/reference-map';
import {whyNotFriendlyMove} from './runtime/src/core/movement';
import type {GameState,Action,CardKind} from './runtime/src/core';
const options={...c.defaultOptions(),seed:37,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[],dominationWin:false,roundLimit:null};
function start(){const r=c.createReferenceGame(referenceMap,options,c.cardsRules(options));if(!r.ok)throw Error(r.errors.join(';'));return r.state;}
function act(s:GameState,a:Action){const r=c.apply(s,a);if(!r.ok)throw Error(r.error);return r.state;}
function conservation(s:GameState){const cards=s.cards!;const all=[...cards.drawPile,...cards.discardPile,...Object.values(cards.hands).flat()];expect(all.length).toBe(40);for(const [kind,count]of Object.entries(c.CARD_COMPOSITION))expect(all.filter(k=>k===kind).length).toBe(count);}
function rig(s:GameState,hand:CardKind[],top:CardKind='Shield'){const cs=s.cards!,p=c.activePlayer(s)!.id,all=[...cs.drawPile,...cs.discardPile,...Object.values(cs.hands).flat()];for(const player of s.players)cs.hands[player.id]=[];const take=(k:CardKind)=>{const i=all.indexOf(k);if(i<0)throw Error(k);return all.splice(i,1)[0]!;};cs.hands[p]=hand.map(take);cs.drawPile=[take(top),...all];cs.discardPile=[];return s;}
function winningCapture(){const s=rig(start(),['Anchor','Compass','Lantern','Surge','Wild']),p=c.activePlayer(s)!.id,other=s.players.find(x=>x.id!==p)!.id;
const from=s.map.provinces[0]!,to=from.borders[0]!;
for(const province of s.map.provinces){s.ownerOf[province.id]=p;s.armies[province.id]=1;}s.ownerOf[to]=other;s.armies[from.id]=8;s.phase='attack';s.reinforcementPool=0;s.rng=new c.DeterministicRng(0).snapshot();
return {s,p,other,from:from.id,to};}
function next(s:GameState):Action {
 if(s.cards?.pendingDiscard)return {kind:'discardCard',handIndex:0};
 if(s.pendingCapture)return {kind:'captureMove',amount:1};
 if(s.phase==='reinforce'){if(!s.reinforcementPool)return {kind:'endReinforcement'};const owned=c.provincesOf(s,c.activePlayer(s)!.id),front=owned.filter(id=>c.attackTargets(s,id).length>0);const ids=(front.length?front:owned).sort((a,b)=>s.armies[b]!-s.armies[a]!);return {kind:'reinforce',province:ids[0]!,amount:s.reinforcementPool};}
 const attacks=c.legalAttacks(s).filter((a):a is Extract<Action,{kind:'attack'}>=>a.kind==='attack'&&s.armies[a.from]!>s.armies[a.to]!+1);
 return !s.capturedThisTurn&&attacks[0]?attacks[0]:{kind:'endTurn'};
}
describe('integrated disposable core sources',()=>{
 it('real public export setup shuffles after centres without perturbing historical setup',()=>{const base=c.createReferenceGame(referenceMap,options,c.victoryRules(options));if(!base.ok)throw Error();const s=start();expect(s.ownerOf).toEqual(base.state.ownerOf);expect(s.productionCentres).toEqual(base.state.productionCentres);expect(base.state.cards).toBeUndefined();expect(s.rng).not.toEqual(base.state.rng);conservation(s);expect(c.cardView(s,'stranger').hand).toEqual([]);});
 it('actual capture disposes eliminated hand; captureMove then decisive pending reward gates everything before victory',()=>{
 let {s,p,other,from,to}=winningCapture();const victim=s.cards!.drawPile.splice(3,2);s.cards!.hands[other]=victim;
 s=act(s,{kind:'attack',from,to});expect(s.capturedThisTurn).toBe(true);expect(s.players.find(x=>x.id===other)!.eliminated).toBe(true);expect(s.cards!.hands[other]).toEqual([]);expect(s.cards!.discardPile).toEqual(victim);conservation(s);
 s=act(s,{kind:'captureMove'});const before=structuredClone(s);s=act(s,{kind:'endTurn'});expect(s.cards!.pendingDiscard).toEqual({player:p});expect(s.winner).toBe('');expect(s.rng).toEqual(before.rng);expect(s.cards!.drawPile).toEqual(before.cards!.drawPile);
 for(const a of [{kind:'endTurn'},{kind:'watchComputers'},{kind:'captureMove'},{kind:'attack',from,to}] as Action[])expect(c.apply(s,a).ok).toBe(false);
 expect(c.apply(s,{kind:'discardCard',handIndex:5}).ok).toBe(false);const done=act(s,{kind:'discardCard',handIndex:2});expect(done.winner).toBe(p);expect(done.cards!.hands[p]).toHaveLength(5);expect(done.log.filter(e=>e.event==='turn_ended')).toHaveLength(1);expect(before.cards!.hands[p]).toHaveLength(5);conservation(done);
 });
 it('friendly move initiates once and full-hand Squall has no replacement',()=>{
 const f=winningCapture();let s=act(act(f.s,{kind:'attack',from:f.from,to:f.to}),{kind:'captureMove',amount:2});s=rig(s,['Anchor','Compass','Lantern','Surge','Wild'],'Squall');
 expect(whyNotFriendlyMove(s,f.from,f.to)).toBe('');const before={...s.armies};s=act(s,{kind:'friendlyMove',from:f.from,to:f.to,amount:1});expect(s.cards!.pendingDiscard).toBeDefined();expect(s.armies[f.from]).toBe(before[f.from]!-1);
 const pendingArmies={...s.armies};const done=act(s,{kind:'discardCard',handIndex:0});expect(done.armies).toEqual(pendingArmies);expect(done.cards!.hands[f.p]).toEqual([]);expect(done.cards!.discardPile).toHaveLength(6);conservation(done);
 });
 it('strict real codec and legal options/action histories round-trip and continue RNG',()=>{
 let s=start(),pending=false,replayOptions=options;
 const outcomes=[];
 for(let seed=1;seed<=64&&!pending;seed++){
  replayOptions={...options,seed};const created=c.createReferenceGame(referenceMap,replayOptions,c.cardsRules(replayOptions));if(!created.ok)throw Error();s=created.state;
  for(let i=0;i<1600&&s.phase!=='finished';i++){s=act(s,next(s));if(s.cards!.pendingDiscard){pending=true;break;}}
  outcomes.push({seed,actions:s.history.length,phase:s.phase,pending,counts:c.cardView(s,'').handCounts});
 }
 writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/legal-history-search.json',JSON.stringify(outcomes,null,2));
 expect(pending).toBe(true);
 const text=c.serializeVersionedMatch(replayOptions,s.history,c.REFERENCE_CARD_MATCH_IDENTITY);const loaded=c.deserializeVersionedMatch(text);expect(loaded.state).toEqual(s);expect(loaded.state.cards).toBeDefined();
 const a=next(s);if(s.phase!=='finished')expect(act(loaded.state,a)).toEqual(act(s,a));
 const empty=JSON.parse(c.serializeVersionedMatch(options,[],c.REFERENCE_CARD_MATCH_IDENTITY));
 for(const action of [{kind:'discardCard',handIndex:-1},{kind:'discardCard',handIndex:1.1},{kind:'discardCard',handIndex:0,extra:1}])expect(()=>c.deserializeVersionedMatch(JSON.stringify({...empty,actions:[action]}))).toThrow();
 const legacy={...empty,...c.REFERENCE_MATCH_IDENTITY,actions:[{kind:'discardCard',handIndex:0}]};expect(()=>c.deserializeVersionedMatch(JSON.stringify(legacy))).toThrow();
 expect(()=>c.deserializeVersionedMatch(JSON.stringify({...empty,rules:{id:'cards',version:2}}))).toThrow();
 console.log(JSON.stringify({legalHistoryActions:s.history.length,pendingReached:pending,phase:s.phase,rng:s.rng,handCounts:c.cardView(s,'').handCounts}));conservation(s);
 });
 it('real geographic card tuple rebuilds from options and retains old geographic identity',()=>{
 const text=c.serializeVersionedMatch(options,[],c.GEOGRAPHIC_CARD_MATCH_IDENTITY),loaded=c.deserializeVersionedMatch(text);expect(loaded.state.rules.cards).toBe('deck-v1');expect(loaded.geography).toBeDefined();conservation(loaded.state);
 const old=c.deserializeVersionedMatch(c.serializeVersionedMatch(options,[],c.GEOGRAPHIC_MATCH_IDENTITY));expect(old.state.cards).toBeUndefined();expect(old.state.productionCentres).toEqual(loaded.state.productionCentres);expect(old.state.ownerOf).toEqual(loaded.state.ownerOf);
 });
 it('bounded ordinary-action search reaches real reshuffle then replays RNG continuation',()=>{
  let found=false;const summary=[];
  for(let seed=1;seed<=16&&!found;seed++){
   const o={...options,seed,seats:Array.from({length:4},()=>({kind:'human' as const}))};
   const created=c.createReferenceGame(referenceMap,o,c.cardsRules(o));if(!created.ok)throw Error();let s=created.state;
   for(let step=0;step<5000&&s.phase!=='finished';step++){
    const a=next(s),before=s;s=act(s,a);
    if((a.kind==='endTurn'||a.kind==='discardCard')&&before.cards!.drawPile.length===0&&s.cards!.drawPile.length>0){
     found=true;
     const payload=c.serializeVersionedMatch(o,s.history,c.REFERENCE_CARD_MATCH_IDENTITY);
     writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/reshuffle-match.json',payload);
     writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/reshuffle-before-match.json',c.serializeVersionedMatch(o,before.history,c.REFERENCE_CARD_MATCH_IDENTITY));
     const loaded=c.deserializeVersionedMatch(payload).state;expect(loaded).toEqual(s);expect(act(loaded,next(s))).toEqual(act(s,next(s)));conservation(s);
     summary.push({seed,actions:s.history.length,round:s.turnNumber,action:a,beforeRng:before.rng,afterRng:s.rng,beforeDraw:0,afterDraw:s.cards!.drawPile.length,handCounts:c.cardView(s,'').handCounts});break;
    }
   }
   if(!found)summary.push({seed,actions:s.history.length,round:s.turnNumber,phase:s.phase,draw:s.cards!.drawPile.length,discard:s.cards!.discardPile.length,handCounts:c.cardView(s,'').handCounts});
  }
  writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/reshuffle-search.json',JSON.stringify(summary,null,2));expect(found).toBe(true);
 },20000);

 it('finds legal decisive capturing reward and real codec history',()=>{
  let found=false;const summary=[];
  for(const seed of [37,1,2,3,4,5,6,7,8]){
   if(found)break;
   const o={...options,seed,dominationWin:true,seats:Array.from({length:3},()=>({kind:'human' as const}))};
   const created=c.createReferenceGame(referenceMap,o,c.cardsRules(o));if(!created.ok)throw Error();let s=created.state;
   for(let step=0;step<2500&&s.phase!=='finished';step++){
    let a=next(s);
    const active=c.activePlayer(s)!.id;
    if(s.phase==='reinforce'&&s.reinforcementPool){
     const owned=c.provincesOf(s,active),border=owned.filter(id=>{const p=c.province(s.map,id)!;return c.neighbours(p).some(to=>s.ownerOf[to]!==active);});
     const targets=active==='seat1'?(border.length?border:owned):owned;
     targets.sort((a,b)=>active==='seat1'?s.armies[b]!-s.armies[a]!:s.armies[a]!-s.armies[b]!);
     a={kind:'reinforce',province:targets[0]!,amount:s.reinforcementPool};
    }
    if(s.pendingCapture)a={kind:'captureMove'};
    else if(s.phase==='attack'&&!s.cards!.pendingDiscard){const attacks=c.legalAttacks(s).filter((x):x is Extract<Action,{kind:'attack'}>=>x.kind==='attack'&&s.armies[x.from]!>s.armies[x.to]!+1);if(active!=='seat1')a={kind:'endTurn'};else if(attacks[0])a=attacks[0];}
    const before=s;s=act(s,a);
    if(s.phase==='finished'&&before.capturedThisTurn){
     found=true;const player=c.activePlayer(before)!.id;
     const payload=c.serializeVersionedMatch(o,s.history,c.REFERENCE_CARD_MATCH_IDENTITY);
     writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/decisive-match.json',payload);
     writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/decisive-before-match.json',c.serializeVersionedMatch(o,before.history,c.REFERENCE_CARD_MATCH_IDENTITY));
     expect(c.deserializeVersionedMatch(payload).state).toEqual(s);conservation(s);
     summary.push({seed,actions:s.history.length,round:s.turnNumber,action:a,winner:s.winner,reason:s.result?.reason,player,beforeDraw:before.cards!.drawPile.length,afterDraw:s.cards!.drawPile.length,top:before.cards!.drawPile[0],beforeHand:before.cards!.hands[player],afterHand:s.cards!.hands[player],beforeRng:before.rng,afterRng:s.rng});break;
    }
   }
   if(!found)summary.push({seed,actions:s.history.length,phase:s.phase,round:s.turnNumber});
  }
  writeFileSync('docs/prototypes/new-game/T37/parent-preflight/integrated-mock/decisive-search.json',JSON.stringify(summary,null,2));expect(found).toBe(true);
 },20000);

});
