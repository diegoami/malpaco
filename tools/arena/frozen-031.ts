// Frozen tool-only policy from v0.3.1. Add a new comparator version to change it.
// Source: 6e75ad9cff3529b3bb13d1dff31a336a86c64627; no current policy helpers imported.
import type {ComputerDecisionView} from '../../src/core/computer-view';
import type {Action} from '../../src/core/types';
import type {CardKind,TradeableCardKind} from '../../src/core/cards';

function classifyCardSet(cards:readonly CardKind[]):TradeableCardKind|null {
 if(cards.length!==3)return null;
 const genuine=cards.filter(k=>k!=='Wild');
 if(!genuine.length)return null;
 const kind=genuine[0]!;
 if(kind!=='Anchor'&&kind!=='Compass'&&kind!=='Lantern'&&kind!=='Surge'&&kind!=='Raid')return null;
 return genuine.every(k=>k===kind)?kind:null;
}

/** [designed] T128/#320: inspected the prior one-hop policy and legal saved stalls.
 * Route the largest interior reserve toward the public front through owned regions.
 * One existing legal hop per turn; nearer destinations and IDs break equal ties.
 * No private state, stream draws, weights or changes to movement rules.
 */
function reserveTransfer(view:ComputerDecisionView):Extract<Action,{kind:'friendlyMove'}>|null {
 const player=view.playerId;if(!player||!view.movePairs.length)return null;
 const countries=new Map(view.countries.map(country=>[country.id,country]));
 const frontier=view.countries.filter(country=>country.owner===player&&country.neighbours.some(id=>countries.get(id)?.owner!==player));
 const distance=new Map(frontier.map(country=>[country.id,0])),queue=frontier.map(country=>country.id);
 for(let index=0;index<queue.length;index++){
  const id=queue[index]!;
  for(const neighbour of countries.get(id)!.neighbours){
   if(countries.get(neighbour)?.owner===player&&!distance.has(neighbour)){
    distance.set(neighbour,distance.get(id)!+1);queue.push(neighbour);
   }
  }
 }
 const moves=view.movePairs.filter(move=>{
  const from=distance.get(move.from),to=distance.get(move.to);
  return from!==undefined&&from>0&&to!==undefined&&to===from-1;
 });
 moves.sort((a,b)=>countries.get(b.from)!.armies-countries.get(a.from)!.armies||distance.get(a.to)!-distance.get(b.to)!||
  (a.from<b.from?-1:a.from>b.from?1:a.to<b.to?-1:a.to>b.to?1:0));
 return moves[0]?{...moves[0]}:null;
}

/** Approved scripted baseline computer108/111/112, pinned ae298e37 computer.md.
 * Army/Surge gain first, Raid last, oldest discard; no stream draws or strength
 * timing/foresight. Designed stable ties: fewer Wilds, then indices/target IDs.
 * Card, capture, placement and attack priorities and the N-exchange budget stay.
 * T128 extends end-of-turn movement across owned routes toward the front.
 */
export function baseline031(view:ComputerDecisionView):Action|null {
 const p=view.playerId;if(!p||view.phase==='finished'||view.phase==='human-loss')return null;
 const countries=new Map(view.countries.map(c=>[c.id,c])),owned=view.countries.filter(c=>c.owner===p),frontier=(id:string)=>countries.get(id)!.neighbours.some(n=>countries.get(n)?.owner!==p);
 const enemies=view.countries.filter(c=>c.owner!==p),adjacent=enemies.filter(c=>c.neighbours.some(n=>countries.get(n)?.owner===p));
 const raidTarget=()=>[...(adjacent.length?adjacent:enemies)].sort((a,b)=>b.armies-a.armies||(a.id<b.id?-1:a.id>b.id?1:0))[0];
 if(view.pendingDiscard)return view.ownHand.length?{kind:'discardCard',handIndex:0}:null;
 if(view.pendingRaid){const target=raidTarget();return target?{kind:'raidTarget',province:target.id}:null;}
 if(view.phase==='cards'){
  const sets:{indices:readonly[number,number,number];gain:number;wilds:number;raid:boolean}[]=[],h=view.ownHand;
  for(let a=0;a<h.length;a++)for(let b=a+1;b<h.length;b++)for(let c=b+1;c<h.length;c++){
   const indices=[a,b,c] as const,kind=classifyCardSet(indices.map(i=>h[i]!));if(!kind)continue;
   if(kind==='Raid'&&(view.cardStage!=='raid-v1'||!adjacent.length))continue;
   const gain=kind==='Surge'?view.reinforcementPool:kind==='Raid'?0:({Anchor:5,Compass:8,Lantern:15}as const)[kind];
   sets.push({indices,gain,wilds:indices.filter(i=>h[i]==='Wild').length,raid:kind==='Raid'});
  }
  sets.sort((a,b)=>Number(a.raid)-Number(b.raid)||b.gain-a.gain||a.wilds-b.wilds||a.indices[0]-b.indices[0]||a.indices[1]-b.indices[1]||a.indices[2]-b.indices[2]);
  return sets[0]?{kind:'tradeCards',handIndices:sets[0].indices}:{kind:'skipCards'};
 }
 if(view.pendingCapture)return {kind:'captureMove'};
 if(view.phase==='reinforce'){
  if(!view.reinforcementPool)return {kind:'endReinforcement'};
  const front=owned.filter(c=>frontier(c.id)),choices=[...(front.length?front:owned)];choices.sort((a,b)=>b.armies-a.armies||(a.id<b.id?-1:a.id>b.id?1:0));
  return choices[0]?{kind:'reinforce',province:choices[0].id,amount:view.reinforcementPool}:null;
 }
 if(view.phase==='attack'&&view.attacksThisTurn<view.attackBudget){
  const choices=view.attackPairs.filter(a=>countries.get(a.from)!.armies>countries.get(a.to)!.armies),key=(a:Extract<Action,{kind:'attack'}>)=>a.from+'/'+a.to;
  choices.sort((a,b)=>countries.get(a.to)!.armies-countries.get(b.to)!.armies||countries.get(b.from)!.armies-countries.get(a.from)!.armies||(key(a)<key(b)?-1:key(a)>key(b)?1:0));
  if(choices[0])return {...choices[0]};
 }
 return reserveTransfer(view)??{kind:'endTurn'};
}
