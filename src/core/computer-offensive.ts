import type {Action,PendingCapture} from './types';
import type {ComputerCountry,ComputerStrategicView} from './computer-view';
import {createArmyEvaluator} from './computer-army-evaluation';
import {planAllocation,ALLOCATION_PARAMETERS} from './computer-allocation';
import {planMovement} from './computer-positioning';
import {reserveTransfer} from './computer-movement';
import {estimateAttackCampaign,CAMPAIGN_MAX_CELLS,CAMPAIGN_SCALE} from './computer-campaign';
/** [designed] T137/#358 hypotheses, not tuned strength or game-rule constants. */
export const OFFENSIVE_PARAMETERS=Object.freeze({maxCountries:96,maxPairs:6,maxPositions:256,modelCellBudget:1_048_576,
 riskTolerance:500_000,incomeHorizon:2,maxEnemySources:8,landValue:1,ownCasualtyValue:1,enemyCasualtyValue:1,firstCardValue:2,eliminationValue:4});
export interface OffensiveDecision {
 readonly action:Action|null;readonly reason:'candidate'|'baseline'|'phase'|'unsupported'|'budget';
 readonly modelCells:number;readonly positions:number;readonly pairs:number;
 readonly winningChance:{readonly lower:number;readonly upper:number;readonly scale:number}|null;
 readonly utility:{readonly lower:number;readonly upper:number;readonly scale:number}|null;
}
type Attack=Extract<Action,{kind:'attack'}>;
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
/** Arena-only campaign objectives against stopping. Every exchange is reevaluated;
 * terminal boards, not capture-conditioned average armies, face public threats.
 * Utility is a designed proxy, not expected game wins or an optimal strategy.
 */
export function planOffensive(view:ComputerStrategicView):OffensiveDecision {
 const p=OFFENSIVE_PARAMETERS,S=CAMPAIGN_SCALE,me=view.playerId;
 let modelCells=0,positions=0,pairs=0,failed:'budget'|'unsupported'|null=null;
 let winningChance:OffensiveDecision['winningChance']=null,utility:OffensiveDecision['utility']=null;
 const result=(reason:OffensiveDecision['reason'],action:Action|null=null):OffensiveDecision=>({action,reason,modelCells,positions,pairs,winningChance,utility});
 if(!me||view.phase!=='attack'||view.pendingRaid||view.pendingDiscard||view.pendingCapture||view.attacksThisTurn>=view.attackBudget)return result('phase');
 if(view.cardStage&&[view.drawCount,view.discardCount].some(n=>!Number.isSafeInteger(n)||n<0))return result('unsupported');
 const player=me,byId=new Map(view.countries.map(c=>[c.id,c]));
 const attacks=view.attackPairs.filter(a=>(byId.get(a.from)?.armies??0)>(byId.get(a.to)?.armies??0))
  .sort((a,b)=>byId.get(a.to)!.armies-byId.get(b.to)!.armies||byId.get(b.from)!.armies-byId.get(a.from)!.armies||cmp(`${a.from}/${a.to}`,`${b.from}/${b.to}`));
 if(!attacks.length)return result('phase');
 const setup=createArmyEvaluator(view,p,{defenseOnly:true});if(setup.kind==='unsupported')return result('unsupported');
 if(setup.kind==='terminal')return result('candidate',{kind:'endTurn'});
 for(const a of attacks){const from=byId.get(a.from),to=byId.get(a.to);if(!from||!to||from.owner!==player||to.owner===player||!from.neighbours.includes(to.id))return result('unsupported');}
 const countries=setup.countries;
 function projection(cs:readonly ComputerCountry[],cap:PendingCapture|null=null,used=view.attacksThisTurn):ComputerStrategicView {
  return {playerId:player,phase:cap?'capture':'attack',cardStage:view.cardStage,pendingCapture:!!cap,pendingDiscard:false,pendingRaid:false,
   ownHand:[],handCounts:{},drawCount:0,discardCount:0,discardTop:null,reinforcementPool:0,countries:cs,attackPairs:[],movePairs:[],
   attacksThisTurn:used,attackBudget:view.attackBudget,strategy:{...view.strategy,capture:cap,capturedThisTurn:view.strategy.capturedThisTurn||!!cap}};
 }
 function income(owner:string,cs:readonly ComputerCountry[]):number {
  const ids=new Set(cs.filter(c=>c.owner===owner).map(c=>c.id));
  if(!ids.size||view.strategy.turnSequence!=='reinforcement')return 0;
  return Math.max(2,Math.floor(ids.size/view.strategy.reinforcementDivisor))+view.strategy.islands.filter(i=>i.provinces.length&&i.provinces.every(id=>ids.has(id))).reduce((n,i)=>n+i.bonus,0);
 }
 function won(cs:readonly ComputerCountry[]){const count=cs.filter(c=>c.owner===player).length;return count===cs.length||view.strategy.dominationTarget!==null&&count>=view.strategy.dominationTarget;}
 function value(cs:readonly ComputerCountry[]):number|null {
  if(positions>=p.maxPositions){failed='budget';return null;}positions++;
  const v=projection(cs),ev=createArmyEvaluator(v,{...p,modelCellBudget:p.modelCellBudget-modelCells},{defenseOnly:true});
  if(ev.kind==='unsupported'){failed='unsupported';return null;}
  let exposure=0;
  if(ev.kind==='ready'){
   const score=ev.assess({countries:cs,strategy:v.strategy});modelCells+=ev.modelCells;
   if(ev.stopped){failed=ev.stopped;return null;}exposure=score.risks[0]??0;
  }
  const n=(cs.filter(c=>c.owner===player).length*p.landValue+p.incomeHorizon*income(player,cs))*S-exposure;
  if(!Number.isSafeInteger(n)){failed='unsupported';return null;}return n;
 }
 // Reserve the constituent maximum before a call; never exceed aggregate work.
 const stop=planMovement(view,{afterStopping:true});modelCells+=stop.modelCells;positions+=stop.candidates;
 if(stop.reason==='budget'||stop.reason==='unsupported')return result(stop.reason);
 const stopAction=stop.action??reserveTransfer(view)??{kind:'endTurn' as const};
 const stopCountries=countries.map(c=>({id:c.id,owner:c.owner,neighbours:c.neighbours,armies:c.armies+(stopAction.kind==='friendlyMove'?(c.id===stopAction.from?-(stopAction.amount??byId.get(stopAction.from)!.armies-1):c.id===stopAction.to?(stopAction.amount??byId.get(stopAction.from)!.armies-1):0):0)}));
 const stopValue=value(stopCountries);if(stopValue===null)return result(failed!);
 const remaining=view.attackBudget-view.attacksThisTurn,ownIncome=income(player,countries);
 const ownerCount=(id:string)=>countries.filter(c=>c.owner===id).length;
 const swing=(a:Attack)=>{const enemy=byId.get(a.to)!.owner,changed=countries.map(c=>c.id===a.to?{...c,owner:player}:c);return income(player,changed)-ownIncome+income(enemy,countries)-income(enemy,changed);};
 const swings=new Map(attacks.map(a=>[a,swing(a)]));if([...swings.values()].some(n=>!Number.isSafeInteger(n)))return result('unsupported');
 const ordered=[...attacks].sort((a,b)=>Number(ownerCount(byId.get(b.to)!.owner)===1)-Number(ownerCount(byId.get(a.to)!.owner)===1)
  ||Number(byId.get(b.to)!.armies<=remaining)-Number(byId.get(a.to)!.armies<=remaining)||swings.get(b)!-swings.get(a)!
  ||byId.get(a.to)!.armies-byId.get(b.to)!.armies||byId.get(b.from)!.armies-byId.get(a.from)!.armies||cmp(a.from,b.from)||cmp(a.to,b.to));
 const choices=[attacks[0]!];for(const a of ordered)if(choices.length<p.maxPairs&&!choices.some(b=>a.from===b.from&&a.to===b.to))choices.push(a);
 pairs=choices.length;
 let best:Action=stopAction,bestWin=0,bestUpperWin=0,bestLower=0,bestUpper=0;
 for(const a of choices){
  if(p.modelCellBudget-modelCells<CAMPAIGN_MAX_CELLS)return result('budget');
  const campaign=estimateAttackCampaign(view,a.from,a.to);if(campaign.kind==='unknown')return result(campaign.reason==='budget'?'budget':'unsupported');modelCells+=campaign.cells;
  let lower=0,upper=0,winLower=0,winUpper=0;
  for(const terminal of campaign.terminals){
   let changed=countries.map(c=>({id:c.id,owner:c.owner,neighbours:c.neighbours,armies:c.armies-(c.id===a.from?terminal.ownLosses:c.id===a.to?terminal.enemyLosses:0)}));
   if(terminal.captured){
    const available=byId.get(a.from)!.armies-terminal.ownLosses-1;
    let amount=available;
    if(view.strategy.combat.capture==='choice'){
     if(p.modelCellBudget-modelCells<ALLOCATION_PARAMETERS.modelCellBudget||p.maxPositions-positions<ALLOCATION_PARAMETERS.maxCandidates)return result('budget');
     const provisional=changed.map(c=>({...c,owner:c.id===a.to?player:c.owner,armies:c.id===a.from?c.armies-1:c.id===a.to?1:c.armies}));
     const cap={from:a.from,to:a.to,min:1,max:available,defaultAmount:available};
     const allocation=planAllocation(projection(provisional,cap,view.attacksThisTurn+terminal.enemyLosses+terminal.ownLosses));
     modelCells+=allocation.modelCells;positions+=allocation.candidates;
     if(allocation.reason==='budget'||allocation.reason==='unsupported')return result(allocation.reason);
     if(allocation.action?.kind==='captureMove')amount=allocation.action.amount??available;
    }else if(view.strategy.combat.capture!=='all')return result('unsupported');
    changed=changed.map(c=>({...c,owner:c.id===a.to?player:c.owner,armies:c.id===a.from?c.armies-amount:c.id===a.to?amount:c.armies}));
   }
   const terminalValue=value(changed);if(terminalValue===null)return result(failed!);
   const bonus=terminal.captured?Number(!!view.cardStage&&!view.strategy.capturedThisTurn&&(view.drawCount>0||view.discardCount>0))*p.firstCardValue+Number(ownerCount(byId.get(a.to)!.owner)===1)*p.eliminationValue:0;
   const delta=terminalValue-stopValue+(bonus+terminal.enemyLosses*p.enemyCasualtyValue-terminal.ownLosses*p.ownCasualtyValue)*S;
   const lo=delta*(delta>=0?terminal.lower:terminal.upper),hi=delta*(delta>=0?terminal.upper:terminal.lower);
   if(![delta,lo,hi,lower+lo,upper+hi].every(Number.isSafeInteger))return result('unsupported');lower+=lo;upper+=hi;
   if(terminal.captured&&won(changed)){winLower+=terminal.lower;winUpper+=terminal.upper;}
  }
  lower=Math.floor(lower/S);upper=Math.ceil(upper/S);winLower=Math.min(S,winLower);winUpper=Math.min(S,winUpper);
  if(winLower>bestWin||winLower===bestWin&&lower>bestLower){best={...a};bestWin=winLower;bestUpperWin=winUpper;bestLower=lower;bestUpper=upper;}
 }
 winningChance={lower:bestWin,upper:bestUpperWin,scale:S};utility={lower:bestLower,upper:bestUpper,scale:S};
 return result(best.kind==='attack'&&best.from===attacks[0]!.from&&best.to===attacks[0]!.to?'baseline':'candidate',best);
}
