import type {BattleScheduler} from './battleController';
import type {GameState} from '../core';
import {turnRows} from './turnTracker';
import type {GuidanceContext} from './turnTracker';

export interface PhaseMessage {readonly key:string;readonly title:string;readonly detail:string;readonly seat:number}
/** Public presentation only: no actions, private cards, RNG or save writes. */
export function phaseMessage(state:GameState,context:GuidanceContext):PhaseMessage|null {
 if(state.result)return null;
 const rows=turnRows(state,context.feedbackSeat),index=rows.findIndex(row=>row.current),row=rows[index];
 if(!row)return null;
 const prefix=`${state.turnNumber}/${row.id}`;
 if(!row.human)return {key:prefix,title:`${row.colour} is moving`,detail:'Watch their turn',seat:index};
 // Owner review decision: captures and changing suggestions stay in the tracker.
 // A capture is part of attacking, not a new announcement phase.
 const phase=state.phase==='capture'?'attack':state.phase;
 const title=context.mode==='move'?'Your turn to move':phase==='reinforce'?'Your turn to place armies':phase==='attack'?'Your turn to attack':'Your turn to play cards';
 const detail=context.mode==='move'?'Choose your country and an owned neighbour':phase==='reinforce'?'Place armies in your regions':phase==='attack'?'Choose an enemy neighbour, or end your turn':'Review your cards before continuing';
 return {key:`${prefix}/${phase}/${context.mode}`,title,detail,seat:index};
}

/** [designed] Three 1-second start beats, then 3 unpaused seconds per new phase.
 * Repeated renders keep the deadline; pauses preserve the remaining interval.
 * The host owns all game state. A deadline only requests another paint.
 */
export class PhaseAnnouncementTimer {
 private count:number|null;
 private message:PhaseMessage|null=null;
 private remaining:number;
 private paused=false;
 private dismissed=false;
 private handle:number|null=null;
 private began:number|null=null;
 private generation=0;
 private disposed=false;
 constructor(private readonly clock:BattleScheduler&{now:()=>number},fresh:boolean,private readonly paint:()=>void){this.count=fresh?3:null;this.remaining=fresh?1000:3000;}
 get counting():boolean{return !this.disposed&&this.count!==null;}
 get view(){return {count:this.count,message:this.message,visible:!this.disposed&&!this.paused&&(this.count!==null||!!this.message&&!this.dismissed)};}
 update(message:PhaseMessage|null,paused:boolean):void {
  if(this.disposed)return;
  if(message?.key!==this.message?.key){
   this.message=message;this.dismissed=false;
   if(this.count===null){this.cancel(false);this.remaining=3000;}
  }else this.message=message;
  this.paused=paused;
  if(paused||this.count===null&&(!message||this.dismissed)){this.cancel(true);return;}
  if(this.handle!==null)return;
  const token=++this.generation;
  this.began=this.clock.now();
  this.handle=this.clock.schedule(()=>{
   if(this.disposed||this.paused||token!==this.generation)return;
   this.handle=null;this.began=null;
   if(this.count!==null){this.count=this.count>1?this.count-1:null;this.remaining=this.count===null?3000:1000;}
   else this.dismissed=true;
   this.paint();
  },this.remaining);
 }
 private cancel(keepRemaining:boolean):void {
  if(keepRemaining&&this.began!==null)this.remaining=Math.max(0,this.remaining-(this.clock.now()-this.began));
  this.generation++;if(this.handle!==null)this.clock.cancel(this.handle);this.handle=null;this.began=null;
 }
 dispose():void {this.disposed=true;this.cancel(false);this.message=null;}
}
