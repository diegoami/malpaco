import {createHash} from 'node:crypto';
import {defaultOptions} from '../../src/core/options';
import type {GameOptions} from '../../src/core/options';
import type {Action,GameState} from '../../src/core/types';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import {computerView} from '../../src/core/computer-view';
import {createGeographicGame} from '../../src/core/geographic-game';
import {islandRules} from '../../src/core/state';
import {reinforcementIncome} from '../../src/core/reinforcement';
import {apply} from '../../src/core/rules';
import {decideArenaPolicy,POLICY_DESCRIPTORS} from './policies';

export const ARENA_LIMITS={roundCap:100,actionCap:20_000} as const;
export interface ArenaConfig {
 readonly cohort:'development'|'evaluation';readonly seeds:readonly number[];readonly regions:readonly (46|72|96)[];
 readonly policies:readonly string[];readonly ties:readonly ('reroll'|'defender')[];readonly actionCap?:number;readonly roundCap?:number;
}
export interface ArenaCase {
 readonly id:string;readonly cohort:ArenaConfig['cohort'];readonly seed:number;readonly regions:46|72|96;
 readonly policies:readonly string[];readonly ties:'reroll'|'defender';readonly firstOffset:number;readonly actionCap:number;readonly roundCap:number;
}
export type ArenaStart={ok:true;state:GameState;options:GameOptions}|{ok:false;errors:readonly string[]};
export interface ArenaRow {
 readonly case:ArenaCase;readonly status:'finished'|'unfinished'|'refused'|'error';readonly error:string|null;
 readonly actions:number;readonly roundAtStop:number|null;readonly winner:string|null;readonly winnerPolicy:string|null;
 readonly replayVerified:boolean|null;readonly optionsHash:string|null;readonly initialHash:string|null;readonly finalHash:string|null;readonly historyHash:string;
 readonly failedAction:Action|null;readonly reason:string|null;
}
export interface ArenaProof {readonly row:ArenaRow;readonly initial:GameState|null;readonly options:GameOptions|null;readonly history:readonly Action[]}
export const hashArena=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** [designed] T132: fixed disjoint cohorts, cyclic seat assignment, and first-seat
 * rotation on each unchanged deal. Rotations/repeats are correlated observations.
 */
export function scheduleArena(config:ArenaConfig):ArenaCase[]{
 const fail=()=>{throw Error('Invalid arena configuration/seed partition');};
 if(!config||typeof config!=='object'||Object.keys(config).some(k=>!['cohort','seeds','regions','policies','ties','actionCap','roundCap'].includes(k)))fail();
 for(const axis of [config.seeds,config.regions,config.policies,config.ties])if(!Array.isArray(axis)||!axis.length)fail();
 if(config.cohort!=='development'&&config.cohort!=='evaluation')fail();
 const low=config.cohort==='development'?0:1000;
 if(config.seeds.some(s=>!Number.isSafeInteger(s)||s<low||s>low+31)||new Set(config.seeds).size!==config.seeds.length)fail();
 if(config.regions.some(r=>![46,72,96].includes(r))||new Set(config.regions).size!==config.regions.length)fail();
 if(config.policies.length<2||config.policies.length>4||config.policies.some(p=>!Object.hasOwn(POLICY_DESCRIPTORS,p)))fail();
 if(config.ties.some(t=>t!=='reroll'&&t!=='defender')||new Set(config.ties).size!==config.ties.length)fail();
 const actionCap=config.actionCap??ARENA_LIMITS.actionCap,roundCap=config.roundCap??ARENA_LIMITS.roundCap;
 if(!Number.isSafeInteger(actionCap)||actionCap<1||actionCap>ARENA_LIMITS.actionCap||!Number.isSafeInteger(roundCap)||roundCap<1||roundCap>ARENA_LIMITS.roundCap)fail();
 const rotations=new Map<string,string[]>(),count=config.policies.length;
 for(let i=0;i<count;i++){const policies=config.policies.map((_,j)=>config.policies[(i+j)%count]!);rotations.set(JSON.stringify(policies),policies);}
 const cases:ArenaCase[]=[];
 for(const seed of config.seeds)for(const regions of config.regions)for(const ties of config.ties)for(const policies of rotations.values())for(let firstOffset=0;firstOffset<count;firstOffset++){
  const value={cohort:config.cohort,seed,regions,policies:[...policies],ties,firstOffset,actionCap,roundCap};
  cases.push({id:hashArena(value),...value});
 }
 return cases;
}

/** Experimental constructor only: these rules IDs are never product save IDs.
 * First-seat rotation deliberately retains the original fixed deal/compensation.
 */
export function createArenaStart(c:ArenaCase):ArenaStart {
 const options:GameOptions={...defaultOptions(),seed:c.seed,seats:c.policies.map(()=>({kind:'computer'})),
  computerStrengths:c.policies.map(()=>'Normal'),names:'numbered',islandRules:1,eventFrequency:'Off',...(c.regions===46?{}:{regionCount:c.regions})};
 const created=createGeographicGame(options,islandRules(options),{},c.regions===46?2:3);
 if(!created.ok)return {ok:false,errors:created.errors};
 const original=created.state,seat=(original.currentPlayer+c.firstOffset)%original.players.length;
 const state:GameState={...original,currentPlayer:seat,roundOrigin:seat,reinforcementPool:reinforcementIncome(original,original.players[seat]!.id).total,
  rules:{...original.rules,id:`research-arena-island-${c.ties}-v1`,combat:{...original.rules.combat,ties:c.ties}}};
 return {ok:true,state,options};
}

export function runArenaCase(c:ArenaCase,dependencies:{create?:(c:ArenaCase)=>ArenaStart;decide?:(id:string,v:ComputerStrategicView)=>Action|null}={}):ArenaProof {
 let initial:GameState|null=null,state:GameState|null=null,options:GameOptions|null=null;
 let error:string|null=null,failedAction:Action|null=null,replayVerified:boolean|null=null;
 let status:ArenaRow['status']='error';
 try{
  const planned=scheduleArena({cohort:c.cohort,seeds:[c.seed],regions:[c.regions],policies:c.policies,ties:[c.ties],actionCap:c.actionCap,roundCap:c.roundCap});
  if(!planned.some(p=>p.id===c.id&&p.firstOffset===c.firstOffset))throw Error('Invalid arena case/caps');
  const start=(dependencies.create??createArenaStart)(c);
  if(!start.ok){status='refused';error=start.errors.join('; ');}
  else {
   initial=start.state;state=initial;options=start.options;
   while(state.phase!=='finished'&&state.turnNumber<=c.roundCap&&state.history.length<c.actionCap){
    const policy=c.policies[state.currentPlayer]!;
    // This is the sole policy boundary: no GameState/controller/policy roster is passed.
    const action=(dependencies.decide??decideArenaPolicy)(policy,computerView(state));
    if(!action)throw Error(`No action in ${state.phase}`);
    const result=apply(state,action);
    if(!result.ok){failedAction=action;throw Error(`Illegal action: ${result.error}`);}
    state=result.state;
   }
   status=state.phase==='finished'?'finished':'unfinished';
  }
 }catch(cause){status='error';error=String(cause);}
 if(initial&&state){
  try{
   let replay=structuredClone(initial);
   for(const action of state.history){const result=apply(replay,action);if(!result.ok)throw Error(`Replay refused: ${result.error}`);replay=result.state;}
   replayVerified=hashArena(replay)===hashArena(state);if(!replayVerified)throw Error('Replay state differs');
  }catch(cause){replayVerified=false;status='error';error=[error,String(cause)].filter(Boolean).join('; ');}
 }
 const history=state?.history??[],winner=state?.winner||null;
 const winnerSeat=state?.players.findIndex(p=>p.id===winner)??-1;
 const row:ArenaRow={case:c,status,error,actions:history.length,roundAtStop:state?.turnNumber??null,winner,
  winnerPolicy:winnerSeat>=0?c.policies[winnerSeat]??null:null,replayVerified,
  optionsHash:options?hashArena(options):null,initialHash:initial?hashArena(initial):null,finalHash:state?hashArena(state):null,historyHash:hashArena(history),failedAction,reason:state?.result?.reason??null};
 return {row,initial,options,history};
}

export function summarizeArena(rows:readonly ArenaRow[]){
 if(new Set(rows.map(r=>r.case.id)).size!==rows.length)throw Error('Duplicate arena case: repeats are not independent samples');
 const counts={scheduled:rows.length,finished:0,unfinished:0,refused:0,error:0,replayFailures:0,wins:{} as Record<string,number>,seatOpportunities:{} as Record<string,number>};
 for(const row of rows){
  counts[row.status]++;counts.replayFailures+=Number(row.replayVerified===false);
  if(row.status==='finished'&&row.replayVerified===true&&row.winnerPolicy)counts.wins[row.winnerPolicy]=(counts.wins[row.winnerPolicy]??0)+1;
  for(const policy of row.case.policies)counts.seatOpportunities[policy]=(counts.seatOpportunities[policy]??0)+1;
 }
 return counts;
}
