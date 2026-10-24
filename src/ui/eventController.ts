import type {GameState,WorldEvent} from '../core/types';
export interface EventProgress {ack:number;cleared:number}
export interface EventBridge {readonly state:GameState;readonly gameGeneration:number;setWorldEventPending(value:boolean):void}
/** Presentation only: never dispatches a rules action or reads a rules RNG. */
export class WorldEventController {
 private disposed=false;private generation:number;private acked:number;private cleared:number;private seen=0;
 private pending:WorldEvent|null=null;private passive:WorldEvent|null=null;private folded=false;
 constructor(private readonly battle:EventBridge,private readonly viewer:string,progress:EventProgress={ack:0,cleared:0},private readonly remember:(p:EventProgress)=>void=()=>{}){
  this.generation=battle.gameGeneration;const sequence=battle.state.events?.sequence??0;
  this.acked=Number.isSafeInteger(progress.ack)&&progress.ack>=0?Math.min(progress.ack,sequence):0;
  this.cleared=Number.isSafeInteger(progress.cleared)&&progress.cleared>=0?Math.min(progress.cleared,this.acked):0;
 }
 update(deferForReward=false):void {
  if(this.disposed)return;
  if(this.generation!==this.battle.gameGeneration){this.generation=this.battle.gameGeneration;this.acked=0;this.cleared=0;this.seen=0;this.pending=null;this.passive=null;this.folded=false;this.battle.setWorldEventPending(false);}
  const state=this.battle.state,event=state.events?.latest;
  if(!event){this.pending=null;this.passive=null;this.battle.setWorldEventPending(false);return;}
  if(event.sequence!==this.seen){this.seen=event.sequence;this.folded=false;}
  if(state.result||state.phase==='finished'||state.phase==='human-loss'){this.pending=null;this.passive=null;this.acked=event.sequence;this.cleared=event.sequence;this.battle.setWorldEventPending(false);return;}
  if(deferForReward&&event.sequence>this.acked){this.pending=null;this.passive=null;this.battle.setWorldEventPending(false);return;}
  const human=state.players.find(p=>p.id===this.viewer&&p.kind==='human'&&!p.eliminated);
  if(!human){this.pending=null;this.passive=event.sequence>this.cleared?event:null;this.acked=event.sequence;this.battle.setWorldEventPending(false);return;}
  this.passive=null;
  if(event.sequence>this.acked){
   if(deferForReward){this.pending=null;this.battle.setWorldEventPending(false);return;}
   this.pending=event;this.battle.setWorldEventPending(true);
  }else{
   this.pending=null;this.battle.setWorldEventPending(false);
   if(state.players[state.currentPlayer]?.id===this.viewer&&this.cleared<event.sequence){this.cleared=event.sequence;this.save();}
  }
 }
 private save():void {this.remember({ack:this.acked,cleared:this.cleared});}
 get view(){
  const event=this.pending??this.passive,latest=this.battle.state.events?.latest;
  return {event,requiresAck:this.pending!==null,folded:this.folded,marked:latest&&(this.pending||latest.sequence>this.cleared)?latest.changes.map(c=>c.id):[]};
 }
 acknowledge(sequence:number):boolean {
  if(this.disposed||!this.pending||this.pending.sequence!==sequence||this.battle.state.events?.latest?.sequence!==sequence)return false;
  this.acked=sequence;this.pending=null;this.folded=false;
  if(this.battle.state.players[this.battle.state.currentPlayer]?.id===this.viewer)this.cleared=sequence;
  this.save();this.battle.setWorldEventPending(false);return true;
 }
 dismiss(sequence=this.view.event?.sequence):boolean {
  if(this.disposed||this.generation!==this.battle.gameGeneration||sequence===undefined||this.battle.state.events?.latest?.sequence!==sequence)return false;
  if(this.pending?.sequence===sequence)return this.acknowledge(sequence);
  if(this.passive?.sequence!==sequence)return false;
  this.acked=sequence;this.cleared=sequence;this.passive=null;this.folded=false;this.save();this.battle.setWorldEventPending(false);return true;
 }
 fold():boolean {if(this.disposed||!this.view.event||this.folded)return false;this.folded=true;return true;}
 unfold():void {if(!this.disposed)this.folded=false;}
 dispose():void {this.disposed=true;this.pending=null;this.passive=null;}
}
