import type {Action} from './types';
import type {ComputerStrategicView} from './computer-view';
import {evaluateComputerPosition} from './computer-position';
import {CAPTURE_RISK_SCALE} from './computer-risk';
import {createArmyEvaluator} from './computer-army-evaluation';
import type {ArmyScore} from './computer-army-evaluation';

/** [designed] T133/#350, hypotheses from #339, not game rules or tuned weights.
 * Threats are alternative conditional tactics; their probabilities are never summed.
 */
export const ALLOCATION_PARAMETERS=Object.freeze({riskTolerance:500_000,incomeHorizon:2,
 maxCountries:96,maxCandidateCountries:6,maxEnemySources:8,maxCandidates:24,modelCellBudget:262_144});
export interface AllocationDecision {
 readonly action:Action|null;readonly modelCells:number;readonly candidates:number;
 readonly reason:'candidate'|'baseline'|'phase'|'unsupported'|'budget';
 readonly winningChance:{readonly lower:number;readonly upper:number;readonly scale:number}|null;
}
type Score=ArmyScore;
interface Plan {key:string;allocations:readonly (readonly[string,number])[];amount:number|null}
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;

/** Experimental allocation/capture only. No default routing, movement or attack
 * override. Income is a public all-on-one-source hypothesis, not hidden cards or
 * actual opponent prediction. Ordered excesses are not whole-turn expected loss.
 */
export function planAllocation(view:ComputerStrategicView):AllocationDecision {
 const p=ALLOCATION_PARAMETERS,mover=view.playerId;
 let evaluator:Extract<ReturnType<typeof createArmyEvaluator>,{kind:'ready'}>|undefined;
 let winningChance:AllocationDecision['winningChance']=null;
 const result=(reason:AllocationDecision['reason'],action:Action|null=null):AllocationDecision=>({action,reason,modelCells:evaluator?.modelCells??0,candidates:evaluator?.candidates??0,winningChance});
 if(!mover||view.pendingRaid||view.pendingDiscard||view.phase!=='reinforce'&&view.phase!=='capture'||view.phase==='reinforce'&&view.reinforcementPool===0)return result('phase');
 if(view.pendingCapture&&view.phase!=='capture')return result('phase');
 const player=mover,setup=createArmyEvaluator(view,p);
 if(setup.kind!=='ready')return result(setup.kind==='terminal'?'baseline':'unsupported');
 evaluator=setup;
 const {countries,byId,owned,importance,assess,better}=setup;
 const plans:Plan[]=[],keys=new Set<string>();
 function add(allocations:readonly (readonly[string,number])[],amount:number|null=null){
  const normalized=allocations.filter(([,n])=>n>0).map(([id,n])=>[id,n] as const).sort((a,b)=>cmp(a[0],b[0]));
  const key=JSON.stringify([normalized,amount]);if(!keys.has(key)){keys.add(key);plans.push({key,allocations:normalized,amount});}
 }
 if(view.phase==='reinforce'){
  const pool=view.reinforcementPool;if(!Number.isSafeInteger(pool)||pool<1)return result('unsupported');
  const facts=evaluateComputerPosition(view),current=assess({countries,strategy:view.strategy});if(setup.stopped)return result(setup.stopped);
  const fronts=owned.filter(c=>facts.countries.find(f=>f.id===c.id)!.frontier);
  const baseline=[...(fronts.length?fronts:owned)].sort((a,b)=>b.armies-a.armies||cmp(a.id,b.id))[0]!;add([[baseline.id,pool]]);
  const targets=owned.filter(c=>{const d=facts.countries.find(f=>f.id===c.id)!.frontDistance;return d!==null&&d<=1;})
   .sort((a,b)=>current.byId.get(b.id)!-current.byId.get(a.id)!||importance.get(b.id)!-importance.get(a.id)!
    ||facts.countries.find(f=>f.id===a.id)!.frontDistance!-facts.countries.find(f=>f.id===b.id)!.frontDistance!||cmp(a.id,b.id)).slice(0,p.maxCandidateCountries);
  for(const c of targets)add([[c.id,pool]]);
  for(let i=0;i<Math.min(4,targets.length);i++)for(let j=i+1;j<Math.min(4,targets.length);j++){
   const half=Math.floor(pool/2);add([[targets[i]!.id,half],[targets[j]!.id,pool-half]]);add([[targets[i]!.id,pool-half],[targets[j]!.id,half]]);
  }
  if(targets.length){const share=Math.floor(pool/targets.length),remainder=pool%targets.length;add(targets.map((c,i)=>[c.id,share+Number(i<remainder)]));}
 }else{
  const cap=view.strategy.capture,from=cap?byId.get(cap.from):null,to=cap?byId.get(cap.to):null;
  if(!cap||!view.pendingCapture||!from||!to||from.owner!==player||to.owner!==player||!from.neighbours.includes(to.id)
   ||![cap.min,cap.max,cap.defaultAmount].every(Number.isSafeInteger)||cap.min<1||cap.max<cap.min||!Number.isSafeInteger(from.armies-1+cap.min)||cap.max>from.armies-1+cap.min
   ||to.armies!==cap.min||cap.defaultAmount<cap.min||cap.defaultAmount>cap.max)return result('unsupported');
  add([],cap.defaultAmount);
  const width=cap.max-cap.min+1,span=cap.max-cap.min,quarter=Math.floor(span/4),remainder=span%4;
  const amounts=width<=p.maxCandidates?Array.from({length:width},(_,i)=>cap.min+i):[cap.min,cap.max,
   ...[1,2,3].flatMap(n=>[cap.min+quarter*n+Math.floor(remainder*n/4),cap.min+quarter*n+Math.ceil(remainder*n/4)])];
  for(const amount of amounts)add([],amount);
 }
 if(setup.stopped)return result(setup.stopped);
 let best:Plan|null=null,bestScore:Score|null=null;
 for(const candidate of plans){
  if(setup.candidates>=p.maxCandidates)return result('budget');
  const changes=new Map(candidate.allocations);
  if(candidate.amount!==null){const cap=view.strategy.capture!;changes.set(cap.from,-(candidate.amount-cap.min));changes.set(cap.to,candidate.amount-cap.min);}
  const changed=countries.map(c=>({id:c.id,owner:c.owner,neighbours:c.neighbours,armies:c.armies+(changes.get(c.id)??0)}));
  if(changed.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1))return result('unsupported');
  const score=assess({countries:changed,strategy:view.strategy});if(setup.stopped)return result(setup.stopped);
  if(bestScore===null||better(score,bestScore)){best=candidate;bestScore=score;}
 }
 if(bestScore)winningChance={lower:bestScore.winning,upper:bestScore.winningUpper,scale:CAPTURE_RISK_SCALE};
 if(!best||best.key===plans[0]!.key)return result('baseline');
 if(best.amount!==null)return result('candidate',{kind:'captureMove',amount:best.amount});
 const first=best.allocations[0]!;return result('candidate',{kind:'reinforce',province:first[0],amount:first[1]});
}
