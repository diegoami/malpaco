import type {ComputerStrategicView} from './computer-view';
import {DIE_SIDES} from './combat';
/** [designed] T136/#356 precision/work limits, not rule or policy constants. */
export const CAMPAIGN_SCALE=1_000_000;
export const CAMPAIGN_MAX_CELLS=16_384;
interface Interval {readonly lower:number;readonly upper:number}
export interface CampaignTerminal extends Interval {
 readonly ownLosses:number;readonly enemyLosses:number;readonly captured:boolean;
}
export type AttackCampaign={readonly kind:'bounded';readonly scale:number;readonly cells:number;
 readonly terminals:readonly CampaignTerminal[];readonly capture:Interval;
 /** Expected casualties, in scale units of one army (not capture-conditioned). */
 readonly ownLosses:Interval;readonly enemyLosses:Interval;
}|{readonly kind:'unknown';readonly reason:'path'|'combat'|'counts'|'budget'};

/** Conditional repeated-pair tactic. Stop on lost strict advantage, minimum or
 * existing remaining resolved-exchange budget. No private input/RNG, hypothetical
 * income, capture allocation, card rewards or counterattacks. Terminal intervals
 * jointly enclose this specified tactic; they are not independent probabilities.
 */
export function estimateAttackCampaign(view:ComputerStrategicView,from:string,to:string):AttackCampaign {
 const unknown=(reason:Extract<AttackCampaign,{kind:'unknown'}>['reason']):AttackCampaign=>({kind:'unknown',reason});
 const sources=view.countries.filter(c=>c.id===from),targets=view.countries.filter(c=>c.id===to),source=sources[0],target=targets[0];
 if(!view.playerId||sources.length!==1||targets.length!==1||!source||!target||from===to||source.owner!==view.playerId||target.owner===view.playerId||!source.neighbours.includes(to))return unknown('path');
 const combat=view.strategy.combat;
 if(combat.attackRule!=='classic'||combat.attackerDice.max!==1||combat.defenderDice.max!==1||combat.defenderDice.minus!==0||combat.failurePenalty!=='none'
  ||!['reroll','attacker','defender'].includes(combat.ties)||!Number.isSafeInteger(combat.minArmiesToAttack)||combat.minArmiesToAttack<2
  ||!Number.isSafeInteger(combat.attackerDice.minus)||combat.attackerDice.minus<0||combat.minArmiesToAttack-combat.attackerDice.minus<1)return unknown('combat');
 const a=source.armies,d=target.armies,budget=view.attackBudget,used=view.attacksThisTurn;
 if(![a,d,budget,used].every(Number.isSafeInteger)||a<1||d<1||budget<0||used<0)return unknown('counts');
 const remaining=Math.max(0,budget-used),scale=CAMPAIGN_SCALE;
 if(!remaining||a<=d||a<combat.minArmiesToAttack)return {kind:'bounded',scale,cells:0,
  terminals:[{ownLosses:0,enemyLosses:0,captured:false,lower:scale,upper:scale}],capture:{lower:0,upper:0},ownLosses:{lower:0,upper:0},enemyLosses:{lower:0,upper:0}};
 const maxWins=Math.min(d,remaining),maxLosses=Math.min(a-combat.minArmiesToAttack+1,remaining),cells=(maxWins+1)*(maxLosses+1);
 if(!Number.isSafeInteger(cells)||cells>CAMPAIGN_MAX_CELLS)return unknown('budget');
 // Each coordinate counts losses/wins; their sum is the exact exchange count.
 // Forward masses round outward at every branch/merge. Boundaries retain failed
 // and unfinished campaigns rather than renormalizing successful paths.
 let wins=0,losses=0;
 for(let attack=1;attack<=DIE_SIDES;attack++)for(let defend=1;defend<=DIE_SIDES;defend++){
  if(attack>defend||attack===defend&&combat.ties==='attacker')wins++;else if(attack<defend||combat.ties!=='reroll')losses++;
 }
 const denominator=wins+losses;
 let lower:number[]=Array(maxLosses+1).fill(0),upper:number[]=[...lower];lower[0]=scale;upper[0]=scale;
 const terminals:CampaignTerminal[]=[];
 for(let won=0;won<=maxWins;won++){
  const nextLower:number[]=Array(maxLosses+1).fill(0),nextUpper:number[]=[...nextLower];
  for(let lost=0;lost<=maxLosses;lost++){
   const lo=lower[lost]!,hi=upper[lost]!;if(!hi)continue;
   const captured=won===d;
   if(captured||won+lost>=remaining||a-lost<=d-won||a-lost<combat.minArmiesToAttack){
    terminals.push({ownLosses:lost,enemyLosses:won,captured,lower:lo,upper:hi});continue;
   }
   nextLower[lost]=Math.min(scale,nextLower[lost]!+Math.floor(lo*wins/denominator));
   nextUpper[lost]=Math.min(scale,nextUpper[lost]!+Math.floor((hi*wins+denominator-1)/denominator));
   // The loss boundary is included in maxLosses, so an active cell always has
   // room for this branch. No state can proceed after that boundary.
   lower[lost+1]=Math.min(scale,lower[lost+1]!+Math.floor(lo*losses/denominator));
   upper[lost+1]=Math.min(scale,upper[lost+1]!+Math.floor((hi*losses+denominator-1)/denominator));
  }
  lower=nextLower;upper=nextUpper;
 }
 function expected(weight:(t:CampaignTerminal)=>number,max:number):Interval {
  return {lower:terminals.reduce((n,t)=>n+t.lower*weight(t),0),upper:Math.min(max*scale,terminals.reduce((n,t)=>n+t.upper*weight(t),0))};
 }
 return {kind:'bounded',scale,cells,terminals,
  capture:expected(t=>Number(t.captured),1),ownLosses:expected(t=>t.ownLosses,maxLosses),enemyLosses:expected(t=>t.enemyLosses,maxWins)};
}
