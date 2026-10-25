import { activePlayer } from './state';
import { classifyCardSet } from './cards';
import { computerView } from './computer-view';
import { reserveTransfer } from './computer-movement';
import {planAllocation} from './computer-allocation';
import {planOffensive} from './computer-offensive';
import {planMovement} from './computer-positioning';
import type {ComputerStrategicView} from './computer-view';
import type { ComputerDecisionView } from './computer-view';
import type { Action,GameState } from './types';

/** Host eligibility only; decision code receives no GameState or controller flags. */
export function computerAction(state:GameState):Action|null {
 const mover=activePlayer(state);
 if(!mover||mover.kind!=='computer'||mover.eliminated||state.phase==='finished'||state.phase==='human-loss')return null;
 return decideTacticalAction(computerView(state));
}
/** Approved scripted baseline computer108/111/112, pinned ae298e37 computer.md.
 * Army/Surge gain first, Raid last, oldest discard; no stream draws or strength
 * timing/foresight. Designed stable ties: fewer Wilds, then indices/target IDs.
 * Card, capture, placement and attack priorities and the N-exchange budget stay.
 * T128 extends end-of-turn movement across owned routes toward the front.
 */
export function decideComputerAction(view:ComputerDecisionView):Action|null {
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

/** T141 owner adoption: one improved policy for future moves. Recorded history
 * replays through apply,never this chooser. The retained script supplies cards
 * and explicit unsupported/work-budget fallback;it is not a player option. */
export function decideTacticalAction(view:ComputerStrategicView):Action|null {
 const action=planAllocation(view).action??decideComputerAction(view);
 const offensive=planOffensive(view);if(offensive.action)return offensive.action;
 return action?.kind==='friendlyMove'||action?.kind==='endTurn'?planMovement(view).action??action:action;
}
