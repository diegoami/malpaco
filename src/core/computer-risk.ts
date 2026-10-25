import type {ComputerStrategicView} from './computer-view';
import {DIE_SIDES} from './combat';

/** [designed] T130/#345: precision and work limits, not gameplay constants.
 * Searched current combat/capture rules and #339's rational battle models.
 */
export const CAPTURE_RISK_SCALE=1_000_000;
export const CAPTURE_RISK_MAX_CELLS=16_384;
export type CaptureRisk=
 | {readonly kind:'bounded';readonly lower:number;readonly upper:number;readonly scale:number;readonly cells:number}
 | {readonly kind:'unknown';readonly reason:'path'|'combat'|'counts'|'budget'};

/** Conditional probability bounds for a specified one-source tactic, under
 * independent uniform dice: fight each target until captured or unable to attack,
 * then transfer the maximum into it before continuing. No other stacks/cards,
 * opponent-policy inference, exchange cap, handoff events or future income.
 * `extraArmies` is an explicit hypothetical addition, not predicted reinforcement.
 * Intervals use outward integer rounding; unknown never means zero probability.
 */
export function estimateCapturePath(view:ComputerStrategicView,from:string,path:readonly string[],extraArmies=0):CaptureRisk {
 const countries=new Map(view.countries.map(c=>[c.id,c])),source=countries.get(from);
 if(!source||countries.size!==view.countries.length||path.length<1||path.length>2||new Set([from,...path]).size!==path.length+1)return {kind:'unknown',reason:'path'};
 const targets=[];
 let previous=source;
 for(const id of path){
  const target=countries.get(id);
  if(!target||target.owner===source.owner||!previous.neighbours.includes(id))return {kind:'unknown',reason:'path'};
  targets.push(target);previous=target;
 }
 const combat=view.strategy.combat,minimum=combat.minArmiesToAttack;
 if(combat.attackRule!=='classic'||combat.attackerDice.max!==1||combat.defenderDice.max!==1||combat.defenderDice.minus!==0
  ||!Number.isSafeInteger(minimum)||minimum<2||!Number.isSafeInteger(combat.attackerDice.minus)||combat.attackerDice.minus<0||minimum-combat.attackerDice.minus<1
  ||!['reroll','attacker','defender'].includes(combat.ties)
  ||path.length>1&&combat.capture!=='all'&&combat.capture!=='choice')return {kind:'unknown',reason:'combat'};
 const attackers=source.armies+extraArmies,defenders=targets.reduce((sum,c)=>sum+c.armies,0);
 if(!Number.isSafeInteger(source.armies)||source.armies<1||!Number.isSafeInteger(extraArmies)||extraArmies<0
  ||!Number.isSafeInteger(attackers)||targets.some(c=>!Number.isSafeInteger(c.armies)||c.armies<1)||!Number.isSafeInteger(defenders))return {kind:'unknown',reason:'counts'};
 if(attackers<minimum)return {kind:'bounded',lower:0,upper:0,scale:CAPTURE_RISK_SCALE,cells:0};
 // Division checks the product budget before allocating, without unsafe multiplication.
 if(attackers>Math.floor(CAPTURE_RISK_MAX_CELLS/defenders))return {kind:'unknown',reason:'budget'};

 // Count the 36 die pairs. Rerolled ties are omitted from decisive outcomes.
 let wins=0,losses=0;
 for(let a=1;a<=DIE_SIDES;a++)for(let d=1;d<=DIE_SIDES;d++){
  if(a>d||a===d&&combat.ties==='attacker')wins++;
  else if(a<d||combat.ties!=='reroll')losses++;
 }
 const denominator=wins+losses;
 let nextLower:number[]|null=null,nextUpper:number[]|null=null,cells=0;
 // Work backwards from the final target. On capture, the next source has one
 // fewer army: its predecessor retains a garrison. Casualties stay shared.
 for(let index=targets.length-1;index>=0;index--){
  let lower=Array.from({length:attackers+1},(_,a)=>nextLower===null?CAPTURE_RISK_SCALE:nextLower[a-1]??0);
  let upper=Array.from({length:attackers+1},(_,a)=>nextUpper===null?CAPTURE_RISK_SCALE:nextUpper[a-1]??0);
  for(let d=1;d<=targets[index]!.armies;d++){
   const rowLower:number[]=Array(attackers+1).fill(0),rowUpper:number[]=Array(attackers+1).fill(0);
   for(let a=minimum;a<=attackers;a++){
    // P(a,d)=p*P(a,d-1)+(1-p)*P(a-1,d). Every term is an integer;
    // floor/ceiling enclose the exact model under this convex recurrence.
    rowLower[a]=Math.floor((wins*lower[a]!+losses*rowLower[a-1]!)/denominator);
    rowUpper[a]=Math.floor((wins*upper[a]!+losses*rowUpper[a-1]!+denominator-1)/denominator);
    cells++;
   }
   lower=rowLower;upper=rowUpper;
  }
  nextLower=lower;nextUpper=upper;
 }
 return {kind:'bounded',lower:nextLower![attackers]!,upper:nextUpper![attackers]!,scale:CAPTURE_RISK_SCALE,cells};
}
