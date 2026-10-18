import { activePlayer } from './state';
import { legalAttacks } from './rules';
import { friendlySources, friendlyTargets } from './movement';
import type { Action,GameState,Phase,RuleSet } from './types';
import type { CardKind } from './cards';
export interface ComputerCountry {readonly id:string;readonly owner:string;readonly armies:number;readonly neighbours:readonly string[]}
/** Public facts + own hand only. No state, players/controllers, history payloads or RNG. */
export interface ComputerDecisionView {
 readonly playerId:string|null;readonly phase:Phase;readonly cardStage:NonNullable<RuleSet['cards']>|null;
 readonly pendingCapture:boolean;readonly pendingDiscard:boolean;readonly pendingRaid:boolean;
 readonly ownHand:readonly CardKind[];readonly handCounts:Readonly<Record<string,number>>;
 readonly drawCount:number;readonly discardCount:number;readonly discardTop:CardKind|null;
 readonly reinforcementPool:number;readonly countries:readonly ComputerCountry[];
 readonly attackPairs:readonly Extract<Action,{kind:'attack'}>[];
 readonly movePairs:readonly Extract<Action,{kind:'friendlyMove'}>[];
 readonly attacksThisTurn:number;readonly attackBudget:number;
}
/** Approved computer inventory012..016: projection is the sole engine-state boundary. */
export function computerView(state:GameState):ComputerDecisionView {
 const p=activePlayer(state)?.id??null,c=state.cards;let attacksThisTurn=0;
 for(let i=state.history.length-1;i>=0;i--){const kind=state.history[i]!.kind;if(kind==='endTurn'||kind==='friendlyMove'||kind==='watchComputers')break;if(kind==='attack')attacksThisTurn++;}
 return {playerId:p,phase:state.phase,cardStage:state.rules.cards??null,pendingCapture:state.phase==='capture',pendingDiscard:!!c?.pendingDiscard,pendingRaid:!!c?.pendingRaid,
 ownHand:p?[...(c?.hands[p]??[])]:[],handCounts:Object.fromEntries(state.players.map(player=>[player.id,c?.hands[player.id]?.length??0])),drawCount:c?.drawPile.length??0,discardCount:c?.discardPile.length??0,discardTop:c?.discardPile.at(-1)??null,
 reinforcementPool:state.reinforcementPool,countries:state.map.provinces.map(v=>({id:v.id,owner:state.ownerOf[v.id]??'',armies:state.armies[v.id]??0,neighbours:[...v.borders,...v.seaLanes]})),
 attackPairs:legalAttacks(state).filter((a):a is Extract<Action,{kind:'attack'}>=>a.kind==='attack').map(a=>({...a})),movePairs:friendlySources(state).flatMap(from=>friendlyTargets(state,from).map(to=>({kind:'friendlyMove' as const,from,to}))),attacksThisTurn,attackBudget:state.map.provinces.length};
}
