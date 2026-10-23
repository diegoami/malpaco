import {DeterministicRng} from './rng';
import {dominationThreshold} from './victory';
import type {GameMap,GameState,WorldEvent,WorldEventKind,WorldChange} from './types';
/** Approved Malpaco variety V7–V12 (ae298e37); researched originals #287 are distinct.
 * [designed] Off/protection checks precede every draw, unlike Pro's Never override.
 */
export const EVENT_DENOMINATORS={Rare:21,Normal:14,Often:8} as const;
export const EVENT_WEIGHTS:readonly WorldEventKind[]=['storm','storm','storm','storm','revolt','revolt','shift','shift','harvest','harvest','harvest','harvest','harvest','harvest'];
export const HARVEST_MAX_GAIN=10;
const neighbours=(map:GameMap,id:string):string[]=>{const p=map.provinces.find(p=>p.id===id);return p?[...new Set([...p.borders,...p.seaLanes])].sort():[];};
/** Enumerate every unique connected group containing the origin; no rejection approximation. */
export function connectedEventGroups(map:GameMap,origin:string,size:number):string[][] {
 if(!map.provinces.some(p=>p.id===origin)||size<1||size>4)return [];
 let groups=new Map([[origin,[origin]]]);
 for(let count=1;count<size;count++){
  const next=new Map<string,string[]>();
  for(const ids of groups.values())for(const id of new Set(ids.flatMap(id=>neighbours(map,id))))if(!ids.includes(id)){
   const group=[...ids,id].sort();next.set(group.join('|'),group);
  }
  groups=next;
 }
 return [...groups.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,ids])=>ids);
}
/** Mutates only its supplied working state; called after apply has cloned it. */
export function applyWorldEvent(state:GameState,kind:WorldEventKind,rng:DeterministicRng):WorldEvent {
 const beforeCentres=[...state.productionCentres],before=new Map(state.map.provinces.map(p=>[p.id,{armies:state.armies[p.id]!,owner:state.ownerOf[p.id]!}]));
 let ids:string[]=[];
 if(kind==='storm'){
  const origin=state.map.provinces[rng.nextInt(0,state.map.provinces.length-1)]!.id,size=rng.nextInt(3,4),groups=connectedEventGroups(state.map,origin,size);
  if(groups.length){ids=groups[rng.nextInt(0,groups.length-1)]!;for(const id of ids){const old=state.armies[id]!;state.armies[id]=rng.nextInt(1,Math.max(1,old>6?Math.floor(old/2)-1:old-1));}}
 }else if(kind==='revolt'){
  const eligible=state.players.filter(p=>Object.values(state.ownerOf).filter(owner=>owner===p.id).length>=3);
  if(eligible.length>=2){
   const victim=eligible[rng.nextInt(0,eligible.length-1)]!.id;
   const border=state.map.provinces.filter(p=>state.ownerOf[p.id]===victim&&neighbours(state.map,p.id).some(id=>state.ownerOf[id]!==victim));
   const strong=border.filter(p=>state.armies[p.id]!>1),choices=strong.length?strong:border;
   if(choices.length){const id=choices[rng.nextInt(0,choices.length-1)]!.id,owners=[...new Set(neighbours(state.map,id).map(id=>state.ownerOf[id]!).filter(owner=>owner!==victim))].sort();state.ownerOf[id]=owners[rng.nextInt(0,owners.length-1)]!;ids=[id];}
  }
 }else if(kind==='harvest'){
  ids=[...state.productionCentres];for(const id of ids)state.armies[id]!+=Math.min(state.armies[id]!,HARVEST_MAX_GAIN);
 }else{
  state.productionCentres=rng.shuffled(state.map.provinces.map(p=>p.id)).slice(0,3);ids=[...new Set([...beforeCentres,...state.productionCentres])].sort();
 }
 const changes:WorldChange[]=ids.map(id=>({id,armiesBefore:before.get(id)!.armies,armiesAfter:state.armies[id]!,ownerBefore:before.get(id)!.owner,ownerAfter:state.ownerOf[id]!,centreBefore:beforeCentres.includes(id),centreAfter:state.productionCentres.includes(id)}));
 return {kind,sequence:(state.events?.sequence??0)+1,round:state.turnNumber,afterSeat:state.players[state.currentPlayer]!.id,changes,centresBefore:beforeCentres,centresAfter:[...state.productionCentres]};
}
/** Prospective round guards cover the incoming turn, before its income. */
export function processWorldEvents(state:GameState,nextRound:number,provided?:DeterministicRng):void {
 if(!state.rules.events)return;
 const info=state.events??{sequence:0,cooldown:false};state.events=info;
 if(info.cooldown){info.cooldown=false;return;}
 const frequency=state.rules.events.frequency,limit=state.rules.victoryOptions?.roundLimit;
 const threshold=state.rules.victoryOptions?.dominationWin?dominationThreshold(state.map.provinces.length):state.map.provinces.length;
 if(frequency==='Off'||nextRound<=1||state.result||state.phase==='finished'||state.phase==='human-loss'||(limit!=null&&nextRound>=limit-2)||state.players.some(p=>Object.values(state.ownerOf).filter(owner=>owner===p.id).length>=threshold-4))return;
 const rng=provided??DeterministicRng.fromSnapshot(state.rng);
 if(rng.nextInt(1,EVENT_DENOMINATORS[frequency])!==1){state.rng=rng.snapshot();return;}
 let kind=EVENT_WEIGHTS[rng.nextInt(0,13)]!;
 if(kind===info.lastKind)kind=EVENT_WEIGHTS[rng.nextInt(0,13)]!;
 const event={...applyWorldEvent(state,kind,rng),round:nextRound};
 state.events={sequence:event.sequence,cooldown:true,lastKind:kind,latest:event};
 state.log.push({event:'world_event',player:event.afterSeat,turn:event.round,detail:event});state.rng=rng.snapshot();
}
