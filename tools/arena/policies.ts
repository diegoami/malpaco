import type {Action} from '../../src/core/types';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import {baseline031} from './frozen-031';
import {planAllocation,ALLOCATION_PARAMETERS} from '../../src/core/computer-allocation';
import {planMovement,MOVEMENT_PARAMETERS} from '../../src/core/computer-positioning';
import {planOffensive,OFFENSIVE_PARAMETERS} from '../../src/core/computer-offensive';
export {baseline031} from './frozen-031';

/** Research registry, not player-facing personalities or ranked strength levels. */
export const POLICY_DESCRIPTORS:Readonly<Record<string,{
 readonly purpose:string;readonly sourceCommit?:string;readonly sourceHashes?:Readonly<Record<string,string>>;
 readonly parameters?:Readonly<Record<string,number>>;
}>>=Object.freeze({
 'baseline-031':{purpose:'Frozen released v0.3.1 decision/card/reserve logic',sourceCommit:'6e75ad9cff3529b3bb13d1dff31a336a86c64627',sourceHashes:{
  'src/core/computer.ts':'0a468ff9e85cb956a7df36219d960cc753f7ac81b48657de0c896ed458a38e0b',
  'src/core/computer-movement.ts':'b5807d32b3577f54d0e4085580207f019b9849edea5a5003645a74540e23ad99',
  'src/core/cards.ts':'25bd5df153885e8ae1445bbd41bed52dbf7ce9a2c97c1b8bb19a97326455fd57',
 }},
 'hold-v1':{purpose:'Diagnostic: baseline cards, first-ID placement, no ordinary attack/final transfer'},
 'largest-gap-v1':{purpose:'Diagnostic: baseline except largest positive source-target army-gap attack'},
 'tactical-v1':{purpose:'Experimental T137 campaign objective/stopping plus allocation/movement; no adoption claim',parameters:Object.fromEntries([...Object.entries(ALLOCATION_PARAMETERS).map(([k,v])=>[`allocation.${k}`,v]),...Object.entries(MOVEMENT_PARAMETERS).map(([k,v])=>[`movement.${k}`,v]),...Object.entries(OFFENSIVE_PARAMETERS).map(([k,v])=>[`offensive.${k}`,v])])},
 'movement-v1':{purpose:'Experimental T135 movement plus allocation-v1; frozen attacks/cards, no adoption claim',parameters:Object.fromEntries([...Object.entries(ALLOCATION_PARAMETERS).map(([k,v])=>[`allocation.${k}`,v]),...Object.entries(MOVEMENT_PARAMETERS).map(([k,v])=>[`movement.${k}`,v])])},
 'allocation-v1':{purpose:'Experimental T133 allocation/capture; frozen fallback, no adoption/strength claim',parameters:ALLOCATION_PARAMETERS},
});
export function decideArenaPolicy(id:string,view:ComputerStrategicView):Action|null {
 if(!Object.hasOwn(POLICY_DESCRIPTORS,id))throw Error(`Unknown policy ${id}`);
 if(id==='tactical-v1'){
  const action=planAllocation(view).action??baseline031(view);
  const offensive=planOffensive(view);if(offensive.action)return offensive.action;
  return action?.kind==='friendlyMove'||action?.kind==='endTurn'?planMovement(view).action??action:action;
 }
 if(id==='movement-v1'){
  const action=planAllocation(view).action??baseline031(view);
  return action?.kind==='friendlyMove'||action?.kind==='endTurn'?planMovement(view).action??action:action;
 }
 if(id==='allocation-v1')return planAllocation(view).action??baseline031(view);
 const action=baseline031(view);
 if(id==='baseline-031'||!action||view.pendingRaid||view.pendingDiscard||view.pendingCapture)return action;
 if(id==='hold-v1'){
  if(view.phase==='attack')return {kind:'endTurn'};
  if(view.phase==='reinforce'&&view.reinforcementPool>0){
   const country=view.countries.filter(c=>c.owner===view.playerId).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)[0];
   return country?{kind:'reinforce',province:country.id,amount:view.reinforcementPool}:null;
  }
 }
 if(id==='largest-gap-v1'&&view.phase==='attack'&&view.attacksThisTurn<view.attackBudget){
  const countries=new Map(view.countries.map(c=>[c.id,c]));
  const gap=(a:Extract<Action,{kind:'attack'}>)=>countries.get(a.from)!.armies-countries.get(a.to)!.armies;
  const key=(a:Extract<Action,{kind:'attack'}>)=>`${a.from}/${a.to}`;
  const choices=view.attackPairs.filter(a=>gap(a)>0).sort((a,b)=>gap(b)-gap(a)||(key(a)<key(b)?-1:key(a)>key(b)?1:0));
  if(choices[0])return {...choices[0]};
 }
 return action;
}
