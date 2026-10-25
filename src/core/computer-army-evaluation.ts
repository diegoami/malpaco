import type {ComputerCountry,ComputerStrategicView} from './computer-view';
import {estimateCapturePath,CAPTURE_RISK_SCALE} from './computer-risk';
import {DIE_SIDES} from './combat';
import type {CaptureRisk} from './computer-risk';
type Position=Pick<ComputerStrategicView,'countries'|'strategy'>;
type Bound=Extract<CaptureRisk,{kind:'bounded'}>;
export interface ArmyScore {winning:number;winningUpper:number;offense:number;risks:number[];byId:Map<string,number>}
type Score=ArmyScore;
export interface ArmyParameters {maxCountries:number;riskTolerance:number;incomeHorizon:number;maxEnemySources:number;modelCellBudget:number}
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
/** Conditional public threats, never summed. nextTurn is a readiness proxy with
 * a fresh existing budget, not an immediate-win prediction. T133/T135 [designed]. */
export function createArmyEvaluator(view:ComputerStrategicView,p:ArmyParameters,options:{nextTurn?:boolean;defenseOnly?:boolean}={}) {
 const player=view.playerId!,combat=view.strategy.combat;
 let modelCells=0,candidates=0,stopped:'unsupported'|'budget'|null=null;
 if(view.countries.length>p.maxCountries||combat.attackRule!=='classic'||combat.attackerDice.max!==1||combat.defenderDice.max!==1||combat.defenderDice.minus!==0
  ||combat.capture!=='choice'&&combat.capture!=='all'||!Number.isSafeInteger(view.strategy.reinforcementDivisor)||view.strategy.reinforcementDivisor<1
  ||!Number.isSafeInteger(combat.minArmiesToAttack)||combat.minArmiesToAttack<2||!Number.isSafeInteger(combat.attackerDice.minus)||combat.attackerDice.minus<0||combat.minArmiesToAttack-combat.attackerDice.minus<1
  ||!['reroll','attacker','defender'].includes(combat.ties)||!Number.isSafeInteger(view.attackBudget)||view.attackBudget<0||!Number.isSafeInteger(view.attacksThisTurn)||view.attacksThisTurn<0
  ||view.countries.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1)||view.strategy.islands.some(i=>!Number.isSafeInteger(i.bonus)||i.bonus<0))return {kind:'unsupported' as const};
 const countries=[...view.countries].sort((a,b)=>cmp(a.id,b.id)),byId=new Map(countries.map(c=>[c.id,c]));
 const owned=countries.filter(c=>c.owner===player);
 if(!owned.length||byId.size!==countries.length)return {kind:'unsupported' as const};
 if(owned.length===countries.length||view.strategy.dominationTarget!==null&&owned.length>=view.strategy.dominationTarget)return {kind:'terminal' as const};
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
 if([...importance.values()].some(v=>!Number.isSafeInteger(v)||v<1))return {kind:'unsupported' as const};
 const enemyIncome=new Map([...new Set(countries.filter(c=>c.owner!==player).map(c=>c.owner))].map(id=>[id,income(id)]));
 if(stopped||countries.some(c=>c.owner!==player&&!Number.isSafeInteger(c.armies+enemyIncome.get(c.owner)!)))return {kind:'unsupported' as const};
 const sources=countries.filter(c=>c.owner!==player&&neighbors(c).some(n=>n.owner===player))
  .sort((a,b)=>(b.armies+enemyIncome.get(b.owner)!)-(a.armies+enemyIncome.get(a.owner)!)||cmp(a.id,b.id)).slice(0,p.maxEnemySources);
 const paths=sources.flatMap(source=>neighbors(source).filter(c=>c.owner===player).flatMap(first=>[
  {source:source.id,targets:[first.id]},...neighbors(first).filter(c=>c.owner===player&&c.id!==first.id).map(second=>({source:source.id,targets:[first.id,second.id]})),
 ]));
 const cache=new Map<string,Bound>();
 const remaining=options.nextTurn?view.attackBudget:Math.max(0,view.attackBudget-view.attacksThisTurn);
 let wins=0,losses=0;
 for(let a=1;a<=DIE_SIDES;a++)for(let d=1;d<=DIE_SIDES;d++){
  if(a>d||a===d&&combat.ties==='attacker')wins++;else if(a<d||combat.ties!=='reroll')losses++;
 }
 const denominator=wins+losses;
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
 /** A specified own pair follows the retained script's strict-advantage stop.
  * Success needs D wins and at most remaining-D losses; use original armies
  * for the gate rather than inventing a smaller starting advantage.
  */
 function ownRisk(a:number,d:number):Bound|null {
  const key=JSON.stringify(['own',a,d,remaining]),old=cache.get(key);if(old)return old;
  const zero:Bound={kind:'bounded',lower:0,upper:0,scale:CAPTURE_RISK_SCALE,cells:0};
  if(a<=d||a<combat.minArmiesToAttack||remaining<d){cache.set(key,zero);return zero;}
  const limit=Math.min(a-combat.minArmiesToAttack,remaining-d),work=d*(limit+1);
  if(!Number.isSafeInteger(work)||work>p.modelCellBudget-modelCells){stopped='budget';return null;}
  let lower:number[]=Array.from({length:limit+2},(_,lost)=>lost<=limit?CAPTURE_RISK_SCALE:0),upper:number[]=[...lower];
  for(let defenders=1;defenders<=d;defenders++){
   const rowLower:number[]=Array(limit+2).fill(0),rowUpper:number[]=Array(limit+2).fill(0);
   for(let lost=limit;lost>=0;lost--){
    if(a-lost>defenders&&a-lost>=combat.minArmiesToAttack){
     rowLower[lost]=Math.floor((wins*lower[lost]!+losses*rowLower[lost+1]!)/denominator);
     rowUpper[lost]=Math.floor((wins*upper[lost]!+losses*rowUpper[lost+1]!+denominator-1)/denominator);
    }
   }
   lower=rowLower;upper=rowUpper;
  }
  const r:Bound={kind:'bounded',lower:lower[0]!,upper:upper[0]!,scale:CAPTURE_RISK_SCALE,cells:work};
  modelCells+=work;cache.set(key,r);return r;
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
  let winning=0,winningUpper=0,offense=0;
  if(!stopped&&!options.defenseOnly&&remaining>0)for(const country of owned){
   const source=cs.get(country.id)!;if(source.armies<combat.minArmiesToAttack)continue;
   for(const enemy of neighbors(country).filter(c=>c.owner!==player)){
    const r=ownRisk(source.armies,enemy.armies);if(!r)break;
    const gain=1+p.incomeHorizon*((income(player,enemy.id,player)-ownIncome)+(enemyIncome.get(enemy.owner)!-income(enemy.owner,enemy.id,player)));
    const value=r.lower*gain;if(!Number.isSafeInteger(gain)||!Number.isSafeInteger(value)){stopped='unsupported';break;}
    offense=Math.max(offense,value);
    if(!options.nextTurn&&(owned.length+1===countries.length||view.strategy.dominationTarget!==null&&owned.length+1>=view.strategy.dominationTarget)){winning=Math.max(winning,r.lower);winningUpper=Math.max(winningUpper,r.upper);}
   }
   if(stopped)break;
  }
  return {winning,winningUpper,offense,risks:[...byRisk.values()].sort((a,b)=>b-a),byId:byRisk};
 }
 function better(a:Score,b:Score){
  if(a.winning!==b.winning)return a.winning>b.winning;
  for(let i=0;i<a.risks.length;i++)if(a.risks[i]!==b.risks[i])return a.risks[i]!<b.risks[i]!;
  return a.offense>b.offense;
 }
 return {kind:'ready' as const,countries,byId,owned,importance,assess,better,get modelCells(){return modelCells;},get candidates(){return candidates;},get stopped(){return stopped;}};
}
