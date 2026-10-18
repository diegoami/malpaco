import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import * as c from './mock/src/core/index';
import {referenceMap} from './mock/src/core/reference-map';
import type {Action,GameState,CardKind} from './mock/src/core/index';
const base='docs/prototypes/new-game/T38/parent-preflight/';
const act=(s:GameState,a:Action)=>{const r=c.apply(s,a);if(!r.ok)throw Error(JSON.stringify(a)+': '+r.error);return r.state;};
it('mirrored source classifies approved shapes, stages Raid, and leaves frozen deck-v1 opening unchanged',()=>{
 for(const k of ['Anchor','Compass','Lantern','Surge','Raid'] as const)for(let w=0;w<=2;w++)expect(c.classifyCardSet([...Array(3-w).fill(k),...Array(w).fill('Wild')])).toBe(k);
 for(const a of [['Wild','Wild','Wild'],['Anchor','Compass','Wild'],['Shield','Shield','Wild'],['Squall','Wild','Wild']] as CardKind[][])expect(c.classifyCardSet(a)).toBeNull();
 const opts={...c.defaultOptions(),seats:[{kind:'human' as const},{kind:'human' as const},{kind:'human' as const}],computerStrengths:[],seed:1994};
 const old=c.createReferenceGame(referenceMap,opts,c.cardsRules(opts));const next=c.createReferenceGame(referenceMap,opts,c.tradeCardsRules(opts));
 if(!old.ok||!next.ok)throw Error('opening');
 expect(old.state.phase).toBe('reinforce');expect(next.state.phase).toBe('cards');expect(old.state.cards).toEqual(next.state.cards);expect(old.state.rng).toEqual(next.state.rng);
 for(const [kind,delta] of [['Anchor',5],['Compass',8],['Lantern',15],['Surge',next.state.reinforcementPool]] as const){
  const s=structuredClone(next.state),p=s.players[s.currentPlayer]!.id;s.cards!.hands[p]=[kind,'Wild','Wild'];
  const done=act(s,{kind:'tradeCards',handIndices:[2,0,1]});expect(done.reinforcementPool).toBe(s.reinforcementPool+delta);expect(done.phase).toBe('reinforce');expect(done.cards!.discardPile).toEqual([kind,'Wild','Wild']);expect(done.rng).toEqual(s.rng);
 }
 const s=structuredClone(next.state),p=s.players[s.currentPlayer]!.id;s.cards!.hands[p]=['Raid','Wild','Wild'];const before=structuredClone(s);expect(c.apply(s,{kind:'tradeCards',handIndices:[0,1,2]}).ok).toBe(false);expect(s).toEqual(before);
});
it('bounded inherited histories yield genuine action-only skip/trade replay fixtures',()=>{
 const report:any[]=[];
 for(const name of ['reshuffle-match','decisive-match']){
  const input=JSON.parse(readFileSync(`docs/prototypes/new-game/T37/fixtures/${name}.json`,'utf8'));
  const opened=c.createReferenceGame(referenceMap,input.options,c.tradeCardsRules(input.options));if(!opened.ok)throw Error('opening');let s=opened.state;
  let skips=0;const found=new Set<string>();
  for(const a of input.actions){
   if(s.phase==='cards'){
    const h=s.cards!.hands[s.players[s.currentPlayer]!.id]!;
    for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++){
     const kind=c.classifyCardSet([h[i]!,h[j]!,h[k]!]);if(!kind||found.has(kind))continue;found.add(kind);
     if(kind==='Raid'){report.push({history:name,kind,supported:false,at:s.history.length,hand:h});continue;}
     const before=c.serializeVersionedMatch(input.options,s.history,c.REFERENCE_TRADE_CARD_MATCH_IDENTITY);
     const done=act(s,{kind:'tradeCards',handIndices:[i,j,k]});const after=c.serializeVersionedMatch(input.options,done.history,c.REFERENCE_TRADE_CARD_MATCH_IDENTITY);
     expect(c.deserializeVersionedMatch(before).state).toEqual(s);expect(c.deserializeVersionedMatch(after).state).toEqual(done);
     const stem=`legal-${name}-${kind}`;writeFileSync(base+stem+'-before.json',before+'\n');writeFileSync(base+stem+'-after.json',after+'\n');
     report.push({history:name,kind,supported:true,at:s.history.length,hand:h,basePool:s.reinforcementPool,afterPool:done.reinforcementPool});
    }
    const before=s;s=act(s,{kind:'skipCards'});expect(s.reinforcementPool).toBe(before.reinforcementPool);skips++;
   }
   s=act(s,a);
  }
  const text=c.serializeVersionedMatch(input.options,s.history,c.REFERENCE_TRADE_CARD_MATCH_IDENTITY);expect(c.deserializeVersionedMatch(text).state).toEqual(s);writeFileSync(base+`legal-${name}-skips.json`,text+'\n');report.push({history:name,actions:s.history.length,skips,finalPhase:s.phase});
 }
 writeFileSync(base+'legal-history-report.json',JSON.stringify(report,null,2)+'\n');
});
it('bounded ordinary-action search retains legal Surge replay with nonzero island bonus',()=>{
 const report:any[]=[];let found=false;
 for(let seed=1;seed<=16&&!found;seed++){
  const options={...c.defaultOptions(),seed,seats:Array.from({length:4},()=>({kind:'human' as const})),computerStrengths:[],dominationWin:false,roundLimit:null};
  const opened=c.createReferenceGame(referenceMap,options,c.tradeCardsRules(options));if(!opened.ok)throw Error();let s=opened.state;
  for(let step=0;step<3000&&s.phase!=='finished';step++){
   let a:Action;
   if(s.cards!.pendingDiscard){const h=s.cards!.hands[c.activePlayer(s)!.id]!;let i=h.findIndex(k=>k!=='Surge'&&k!=='Wild');a={kind:'discardCard',handIndex:i<0?0:i};}
   else if(s.pendingCapture)a={kind:'captureMove',amount:1};
   else if(s.phase==='cards'){
    const h=s.cards!.hands[c.activePlayer(s)!.id]!;let pick:readonly [number,number,number]|null=null;
    for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++)if(c.classifyCardSet([h[i]!,h[j]!,h[k]!])==='Surge')pick=[i,j,k];
    const income=c.reinforcementIncome(s,c.activePlayer(s)!.id);
    if(pick&&income.islandBonus>0){
     const before=c.serializeVersionedMatch(options,s.history,c.REFERENCE_TRADE_CARD_MATCH_IDENTITY);const done=act(s,{kind:'tradeCards',handIndices:pick});
     const after=c.serializeVersionedMatch(options,done.history,c.REFERENCE_TRADE_CARD_MATCH_IDENTITY);expect(c.deserializeVersionedMatch(before).state).toEqual(s);expect(c.deserializeVersionedMatch(after).state).toEqual(done);expect(done.reinforcementPool).toBe(s.reinforcementPool*2);
     writeFileSync(base+'legal-Surge-before.json',before+'\n');writeFileSync(base+'legal-Surge-after.json',after+'\n');report.push({seed,actions:s.history.length,hand:h,income,beforePool:s.reinforcementPool,afterPool:done.reinforcementPool});found=true;break;
    }
    a={kind:'skipCards'};
   }else if(s.phase==='reinforce'){
    if(!s.reinforcementPool)a={kind:'endReinforcement'};
    else {const owned=c.provincesOf(s,c.activePlayer(s)!.id),front=owned.filter(id=>c.attackTargets(s,id).length>0),ids=(front.length?front:owned).sort((a,b)=>s.armies[b]!-s.armies[a]!);a={kind:'reinforce',province:ids[0]!,amount:s.reinforcementPool};}
   }else {const attacks=c.legalAttacks(s).filter((a):a is Extract<Action,{kind:'attack'}>=>a.kind==='attack'&&s.armies[a.from]!>s.armies[a.to]!+1);a=!s.capturedThisTurn&&attacks[0]?attacks[0]:{kind:'endTurn'};}
   s=act(s,a);
  }
  if(!found)report.push({seed,actions:s.history.length,phase:s.phase});
 }
 writeFileSync(base+'Surge-search-report.json',JSON.stringify(report,null,2)+'\n');expect(found).toBe(true);
},20000);
