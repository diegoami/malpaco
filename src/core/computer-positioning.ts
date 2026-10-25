import type {Action} from './types';
import type {ComputerStrategicView} from './computer-view';
import {createArmyEvaluator} from './computer-army-evaluation';
import type {ArmyScore} from './computer-army-evaluation';
import {evaluateComputerPosition} from './computer-position';
import {reserveTransfer} from './computer-movement';
/** [designed] T135/#354: bounded research search, not game rules or tuned weights. */
export const MOVEMENT_PARAMETERS=Object.freeze({riskTolerance:500_000,incomeHorizon:2,
 maxCountries:96,maxPairs:5,maxEnemySources:8,maxCandidates:48,modelCellBudget:524_288});
export interface MovementDecision {
 readonly action:Action|null;readonly reason:'candidate'|'baseline'|'phase'|'unsupported'|'budget';
 readonly modelCells:number;readonly candidates:number;readonly pairs:number;
}
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
type Move=Extract<Action,{kind:'friendlyMove'}>;
/** One adjacent transfer ends this turn. Readiness evaluates a hypothetical next
 * turn with the existing exchange budget, unchanged board and no added income.
 * Opponent threats include their public income and one/two-hop future fronts.
 * Unsupported/budget exits return null so the frozen caller retains its action.
 */
export function planMovement(view:ComputerStrategicView):MovementDecision {
 const p=MOVEMENT_PARAMETERS;
 let evaluator:Extract<ReturnType<typeof createArmyEvaluator>,{kind:'ready'}>|undefined,pairs=0;
 const result=(reason:MovementDecision['reason'],action:Action|null=null):MovementDecision=>({action,reason,modelCells:evaluator?.modelCells??0,candidates:evaluator?.candidates??0,pairs});
 if(!view.playerId||view.phase!=='attack'||view.pendingCapture||view.pendingRaid||view.pendingDiscard)return result('phase');
 const cs=new Map(view.countries.map(c=>[c.id,c]));
 // Retain attacks/cards exactly. This slice runs only after the frozen script stops.
 if(view.attacksThisTurn<view.attackBudget&&view.attackPairs.some(a=>(cs.get(a.from)?.armies??0)>(cs.get(a.to)?.armies??0)))return result('phase');
 const setup=createArmyEvaluator(view,p,{nextTurn:true});
 if(setup.kind==='unsupported')return result('unsupported');
 if(setup.kind==='terminal')return result('candidate',{kind:'endTurn'});
 evaluator=setup;
 const {countries,owned,byId,assess}=setup;
 const legal=new Map<string,Move>();
 const key=(a:Move)=>JSON.stringify([a.from,a.to]);
 for(const a of view.movePairs){
  const from=byId.get(a.from),to=byId.get(a.to);
  if(!from||!to||from.id===to.id||from.owner!==view.playerId||to.owner!==view.playerId||from.armies<2||!from.neighbours.includes(to.id))return result('unsupported');
  legal.set(key(a),{kind:'friendlyMove',from:a.from,to:a.to});
 }
 const baseline=reserveTransfer(view)??{kind:'endTurn' as const};
 if(baseline.kind==='friendlyMove'&&!legal.has(key(baseline)))return result('unsupported');
 const facts=evaluateComputerPosition(view),dist=new Map(facts.countries.map(c=>[c.id,c.frontDistance]));
 function distance(position:typeof countries):number {
  const value=position.filter(c=>c.owner===view.playerId).reduce((n,c)=>n+(c.armies-1)*(dist.get(c.id)??countries.length),0);
  return Number.isSafeInteger(value)?value:NaN;
 }
 const initial=assess({countries,strategy:view.strategy});if(setup.stopped)return result(setup.stopped);
 const ordered=[...legal.values()].sort((a,b)=>initial.byId.get(b.to)!-initial.byId.get(a.to)!
  ||(byId.get(b.from)!.armies-1)-(byId.get(a.from)!.armies-1)
  ||(dist.get(a.to)??countries.length)-(dist.get(b.to)??countries.length)||cmp(a.from,b.from)||cmp(a.to,b.to));
 const selected:Move[]=baseline.kind==='friendlyMove'?[legal.get(key(baseline))!]:[];
 for(const a of ordered)if(selected.length<p.maxPairs&&!selected.some(b=>key(a)===key(b)))selected.push(a);
 pairs=selected.length;
 const plans:Action[]=[],keys=new Set<string>();
 function add(a:Action){
  const normalized=a.kind==='friendlyMove'?{...a,amount:a.amount??byId.get(a.from)!.armies-1}:a;
  const k=JSON.stringify(normalized);if(!keys.has(k)){keys.add(k);plans.push(normalized);}
 }
 add(baseline);add({kind:'endTurn'});
 for(const a of selected){
  const max=byId.get(a.from)!.armies-1,span=max-1,q=Math.floor(span/4),r=span%4;
  const amounts=max<=8?Array.from({length:max},(_,i)=>i+1):[1,max,...[1,2,3].flatMap(n=>[1+q*n+Math.floor(r*n/4),1+q*n+Math.ceil(r*n/4)])];
  for(const amount of amounts)add({...a,amount});
 }
 function better(a:ArmyScore,ad:number,b:ArmyScore,bd:number):boolean {
  for(let i=0;i<a.risks.length;i++)if(a.risks[i]!==b.risks[i])return a.risks[i]!<b.risks[i]!;
  return a.offense!==b.offense?a.offense>b.offense:ad<bd;
 }
 let best:Action|null=null,bestScore:ArmyScore|null=null,bestDistance=0;
 for(const a of plans){
  if(setup.candidates>=p.maxCandidates)return result('budget');
  const changed=countries.map(c=>({id:c.id,owner:c.owner,neighbours:c.neighbours,
   armies:c.armies+(a.kind==='friendlyMove'?(c.id===a.from?-a.amount!:c.id===a.to?a.amount!:0):0)}));
  if(changed.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1))return result('unsupported');
  const d=distance(changed);if(!Number.isSafeInteger(d))return result('unsupported');
  const score=assess({countries:changed,strategy:view.strategy});if(setup.stopped)return result(setup.stopped);
  if(bestScore===null||better(score,d,bestScore,bestDistance)){best=a;bestScore=score;bestDistance=d;}
 }
 if(best===plans[0])return result('baseline');
 return result('candidate',best);
}
