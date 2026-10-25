import type {Action} from './types';
import type {ComputerCountry,ComputerStrategicView} from './computer-view';
import {evaluateComputerPosition} from './computer-position';
import {estimateCapturePath} from './computer-risk';
import type {CaptureRisk} from './computer-risk';

/** [designed] T133/#350, hypotheses from #339, not game rules or tuned weights.
 * Threats are alternative conditional tactics; their probabilities are never summed.
 */
export const ALLOCATION_PARAMETERS=Object.freeze({riskTolerance:500_000,incomeHorizon:2,
 maxCountries:96,maxCandidateCountries:6,maxEnemySources:8,maxCandidates:24,modelCellBudget:262_144});
export interface AllocationDecision {
 readonly action:Action|null;readonly modelCells:number;readonly candidates:number;
 readonly reason:'candidate'|'baseline'|'phase'|'unsupported'|'budget';
}
type Position=Pick<ComputerStrategicView,'countries'|'strategy'>;
type Bound=Extract<CaptureRisk,{kind:'bounded'}>;
interface Score {winning:number;offense:number;risks:number[];byId:Map<string,number>}
interface Plan {key:string;allocations:readonly (readonly[string,number])[];amount:number|null}
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;

/** Experimental allocation/capture only. No default routing, movement or attack
 * override. Income is a public all-on-one-source hypothesis, not hidden cards or
 * actual opponent prediction. Ordered excesses are not whole-turn expected loss.
 */
export function planAllocation(view:ComputerStrategicView):AllocationDecision {
 const p=ALLOCATION_PARAMETERS,mover=view.playerId,combat=view.strategy.combat;
 let modelCells=0,candidates=0,stopped:AllocationDecision['reason']|null=null;
 const result=(reason:AllocationDecision['reason'],action:Action|null=null):AllocationDecision=>({action,reason,modelCells,candidates});
 if(!mover||view.pendingRaid||view.pendingDiscard||view.phase!=='reinforce'&&view.phase!=='capture'||view.phase==='reinforce'&&view.reinforcementPool===0)return result('phase');
 if(view.pendingCapture&&view.phase!=='capture')return result('phase');
 const player=mover;
 if(view.countries.length>p.maxCountries||combat.attackRule!=='classic'||combat.attackerDice.max!==1||combat.defenderDice.max!==1||combat.defenderDice.minus!==0
  ||combat.capture!=='choice'&&combat.capture!=='all'||!Number.isSafeInteger(view.strategy.reinforcementDivisor)||view.strategy.reinforcementDivisor<1
  ||!Number.isSafeInteger(combat.minArmiesToAttack)||combat.minArmiesToAttack<2||!Number.isSafeInteger(combat.attackerDice.minus)||combat.attackerDice.minus<0||combat.minArmiesToAttack-combat.attackerDice.minus<1
  ||view.countries.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1)||view.strategy.islands.some(i=>!Number.isSafeInteger(i.bonus)||i.bonus<0))return result('unsupported');
 const countries=[...view.countries].sort((a,b)=>cmp(a.id,b.id)),byId=new Map(countries.map(c=>[c.id,c]));
 const owned=countries.filter(c=>c.owner===player);
 if(!owned.length||byId.size!==countries.length)return result('unsupported');
 if(owned.length===countries.length||view.strategy.dominationTarget!==null&&owned.length>=view.strategy.dominationTarget)return result('baseline');
 const neighbors=(c:ComputerCountry)=>[...new Set(c.neighbours)].sort(cmp).flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);
 function income(owner:string,changed?:string,newOwner?:string|null):number {
  const belongs=(id:string)=>(id===changed?newOwner:byId.get(id)?.owner)===owner;
  const count=countries.filter(c=>belongs(c.id)).length;
  if(!count||view.strategy.turnSequence!=='reinforcement')return 0;
  const value=Math.max(2,Math.floor(count/view.strategy.reinforcementDivisor))+
   view.strategy.islands.filter(i=>i.provinces.length>0&&i.provinces.every(belongs)).reduce((n,i)=>n+i.bonus,0);
  if(!Number.isSafeInteger(value))stopped='unsupported';return value;
 }
 const ownIncome=income(player),importance=new Map(owned.map(c=>[c.id,1+p.incomeHorizon*(ownIncome-income(player,c.id,null))]));
 if([...importance.values()].some(v=>!Number.isSafeInteger(v)||v<1))return result('unsupported');
 const enemyIncome=new Map([...new Set(countries.filter(c=>c.owner!==player).map(c=>c.owner))].map(id=>[id,income(id)]));
 if(stopped||countries.some(c=>c.owner!==player&&!Number.isSafeInteger(c.armies+enemyIncome.get(c.owner)!)))return result('unsupported');
 const sources=countries.filter(c=>c.owner!==player&&neighbors(c).some(n=>n.owner===player))
  .sort((a,b)=>(b.armies+enemyIncome.get(b.owner)!)-(a.armies+enemyIncome.get(a.owner)!)||cmp(a.id,b.id)).slice(0,p.maxEnemySources);
 const paths=sources.flatMap(source=>neighbors(source).filter(c=>c.owner===player).flatMap(first=>[
  {source:source.id,targets:[first.id]},...neighbors(first).filter(c=>c.owner===player&&c.id!==first.id).map(second=>({source:source.id,targets:[first.id,second.id]})),
 ]));
 const cache=new Map<string,Bound>();
 function risk(position:Position,from:string,targets:readonly string[],extra=0):Bound|null {
  if(stopped)return null;
  const cs=new Map(position.countries.map(c=>[c.id,c])),a=cs.get(from)!.armies+extra,ds=targets.map(id=>cs.get(id)!.armies),sum=ds.reduce((n,d)=>n+d,0);
  const key=JSON.stringify([a,ds]),old=cache.get(key);if(old)return old;
  const work=Math.max(0,a-combat.minArmiesToAttack+1)*sum;
  if(!Number.isSafeInteger(work)||work>p.modelCellBudget-modelCells){stopped='budget';return null;}
  const r=estimateCapturePath(position,from,targets,extra);
  if(r.kind==='unknown'){stopped=r.reason==='budget'?'budget':'unsupported';return null;}
  modelCells+=r.cells;cache.set(key,r);return r;
 }
 function assess(position:Position):Score {
  candidates++;
  const cs=new Map(position.countries.map(c=>[c.id,c])),byRisk=new Map(owned.map(c=>[c.id,0]));
  for(const path of paths){
   const source=cs.get(path.source)!,r=risk(position,path.source,path.targets,enemyIncome.get(source.owner)!);if(!r)break;
   const target=path.targets.at(-1)!,value=Math.max(0,r.upper-p.riskTolerance)*importance.get(target)!;
   if(!Number.isSafeInteger(value)){stopped='unsupported';break;}
   byRisk.set(target,Math.max(byRisk.get(target)!,value));
  }
  let winning=0,offense=0;
  if(!stopped&&view.attacksThisTurn<view.attackBudget)for(const country of owned){
   const source=cs.get(country.id)!;if(source.armies<combat.minArmiesToAttack)continue;
   for(const enemy of neighbors(country).filter(c=>c.owner!==player)){
    const r=risk(position,source.id,[enemy.id]);if(!r)break;
    const gain=1+p.incomeHorizon*((income(player,enemy.id,player)-ownIncome)+(enemyIncome.get(enemy.owner)!-income(enemy.owner,enemy.id,player)));
    const value=r.lower*gain;if(!Number.isSafeInteger(gain)||!Number.isSafeInteger(value)){stopped='unsupported';break;}
    offense=Math.max(offense,value);
    if(owned.length+1===countries.length||view.strategy.dominationTarget!==null&&owned.length+1>=view.strategy.dominationTarget)winning=Math.max(winning,r.lower);
   }
   if(stopped)break;
  }
  return {winning,offense,risks:[...byRisk.values()].sort((a,b)=>b-a),byId:byRisk};
 }
 function better(a:Score,b:Score){
  if(a.winning!==b.winning)return a.winning>b.winning;
  for(let i=0;i<a.risks.length;i++)if(a.risks[i]!==b.risks[i])return a.risks[i]!<b.risks[i]!;
  return a.offense>b.offense;
 }
 const plans:Plan[]=[],keys=new Set<string>();
 function add(allocations:readonly (readonly[string,number])[],amount:number|null=null){
  const normalized=allocations.filter(([,n])=>n>0).map(([id,n])=>[id,n] as const).sort((a,b)=>cmp(a[0],b[0]));
  const key=JSON.stringify([normalized,amount]);if(!keys.has(key)){keys.add(key);plans.push({key,allocations:normalized,amount});}
 }
 if(view.phase==='reinforce'){
  const pool=view.reinforcementPool;if(!Number.isSafeInteger(pool)||pool<1)return result('unsupported');
  const facts=evaluateComputerPosition(view),current=assess({countries,strategy:view.strategy});if(stopped)return result(stopped);
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
 if(stopped)return result(stopped);
 let best:Plan|null=null,bestScore:Score|null=null;
 for(const candidate of plans){
  if(candidates>=p.maxCandidates)return result('budget');
  const changes=new Map(candidate.allocations);
  if(candidate.amount!==null){const cap=view.strategy.capture!;changes.set(cap.from,-(candidate.amount-cap.min));changes.set(cap.to,candidate.amount-cap.min);}
  const changed=countries.map(c=>({id:c.id,owner:c.owner,neighbours:c.neighbours,armies:c.armies+(changes.get(c.id)??0)}));
  if(changed.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1))return result('unsupported');
  const score=assess({countries:changed,strategy:view.strategy});if(stopped)return result(stopped);
  if(bestScore===null||better(score,bestScore)){best=candidate;bestScore=score;}
 }
 if(!best||best.key===plans[0]!.key)return result('baseline');
 if(best.amount!==null)return result('candidate',{kind:'captureMove',amount:best.amount});
 const first=best.allocations[0]!;return result('candidate',{kind:'reinforce',province:first[0],amount:first[1]});
}
