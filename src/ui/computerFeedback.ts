import type {GameState,Action} from '../core';
import type {BattleScheduler,BattleSpeed} from './battleController';
export type FeedbackKind='reinforce'|'attack'|'captureMove'|'friendlyMove'|'raidTarget';
export interface FeedbackChange {id:string;before:number;after:number;ownerBefore:string;ownerAfter:string}
export interface FeedbackFrame {kind:FeedbackKind;seat:string;index:number;from?:string;to?:string;changes:FeedbackChange[];progress:number;reduced:boolean;forward:boolean;shielded:boolean}
export interface FeedbackBridge {readonly state:GameState;readonly gameGeneration:number;setComputerFeedbackPending(value:boolean):void}
/** [designed] T115 readable executed-action beats, replacing T101's12s default-round target. */
export const FEEDBACK_NORMAL_MS:Readonly<Record<FeedbackKind,number>>={reinforce:650,attack:900,captureMove:650,friendlyMove:800,raidTarget:700};
export function feedbackDuration(kind:FeedbackKind,speed:BattleSpeed,forward:boolean){return forward?40:speed==='fast'?Math.round(FEEDBACK_NORMAL_MS[kind]*.35):speed==='slow'?Math.round(FEEDBACK_NORMAL_MS[kind]*1.6):speed==='very-slow'?FEEDBACK_NORMAL_MS[kind]*3:FEEDBACK_NORMAL_MS[kind];}
export class ComputerFeedbackController {
 private previous:GameState;private match:number;private generation=0;private timer:number|null=null;private disposed=false;private active:FeedbackFrame|null=null;
 constructor(private readonly bridge:FeedbackBridge,private readonly scheduler:BattleScheduler,private readonly paint:()=>void){this.previous=bridge.state;this.match=bridge.gameGeneration;}
 get frame():FeedbackFrame|null{return this.active;}
 get pending():boolean{return this.active!==null;}
 update(options:{speed:BattleSpeed;forward:boolean;paused:boolean;ack:boolean;reduced:boolean}):void {
  if(this.disposed)return;const state=this.bridge.state;
  if(this.match!==this.bridge.gameGeneration){this.match=this.bridge.gameGeneration;this.previous=state;this.finish();return;}
  if(options.paused||options.ack){this.previous=state;this.finish();return;}
  if(state===this.previous){if(this.active&&options.forward&&!this.active.forward)this.finish();return;}
  const before=this.previous;this.previous=state;this.finish();
  if(state.history.length!==before.history.length+1||before.history.length&&state.history[before.history.length-1]!==before.history.at(-1)||before.players[before.currentPlayer]?.kind!=='computer')return;
  const action=state.history.at(-1)!;
  if(!['reinforce','attack','captureMove','friendlyMove','raidTarget'].includes(action.kind))return;
  const world=state.events?.latest&&state.events.latest.sequence>(before.events?.sequence??0)?state.events.latest:null;
  const changes=state.map.provinces.flatMap(p=>{
   const hold=world?.changes.find(c=>c.id===p.id),after=hold?.armiesBefore??state.armies[p.id]!,ownerAfter=hold?.ownerBefore??state.ownerOf[p.id]!;
   const endpoint=action.kind==='reinforce'?action.province===p.id:action.kind==='raidTarget'?action.province===p.id:false;
   return before.armies[p.id]!==after||before.ownerOf[p.id]!==ownerAfter||hold||endpoint?[{id:p.id,before:before.armies[p.id]!,after,ownerBefore:before.ownerOf[p.id]!,ownerAfter}]:[];
  });
  if(!changes.some(c=>c.before!==c.after||c.ownerBefore!==c.ownerAfter)&&action.kind!=='attack'&&action.kind!=='raidTarget')return;
  const from='from' in action?action.from:action.kind==='captureMove'?before.pendingCapture?.from:undefined,to='to' in action?action.to:action.kind==='captureMove'?before.pendingCapture?.to:action.kind==='raidTarget'?action.province:undefined;
  const last=state.log.at(-1),frame:FeedbackFrame={kind:action.kind as FeedbackKind,seat:before.players[before.currentPlayer]!.id,index:state.history.length,...(from?{from}:{}),...(to?{to}:{}),changes,progress:options.reduced?1:0,reduced:options.reduced,forward:options.forward,shielded:last?.event==='raid'&&last.shielded};
  this.active=frame;const token=++this.generation,steps=options.reduced||options.forward?1:10,duration=feedbackDuration(frame.kind,options.speed,options.forward);let step=0;
  this.bridge.setComputerFeedbackPending(true);
  const tick=()=>{if(this.disposed||token!==this.generation||this.bridge.state!==state)return;this.timer=null;step++;if(step===steps){this.finish();return;}if(this.active)this.active={...this.active,progress:step/steps};this.paint();this.timer=this.scheduler.schedule(tick,Math.round(duration/steps));};
  this.timer=this.scheduler.schedule(tick,Math.round(duration/steps));
 }
 private finish():void {if(this.timer!==null)this.scheduler.cancel(this.timer);this.timer=null;this.generation++;const had=this.active!==null;this.active=null;if(had&&!this.disposed)this.paint();this.bridge.setComputerFeedbackPending(false);}
 dispose():void {this.disposed=true;this.finish();}
}
