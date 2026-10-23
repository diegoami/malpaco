import type {BattleScheduler} from './battleController';
/** Owner-requested UI lifetime; never advances a rules clock or dispatches a move. */
export class DrawNoticeTimer {
 private id:string|null=null;private paused=false;private fired:string|null=null;private handle:number|null=null;private token=0;private disposed=false;
 constructor(private readonly clock:BattleScheduler,private readonly dismiss:()=>void){}
 update(id:string|null,paused:boolean):void {
  if(this.disposed)return;
  if(id!==this.id){this.cancel();this.id=id;this.fired=null;}
  this.paused=paused;
  if(!id||paused){this.cancel();return;}
  if(this.handle!==null||this.fired===id)return;
  const token=++this.token;
  this.handle=this.clock.schedule(()=>{if(this.disposed||this.paused||this.id!==id||token!==this.token)return;this.handle=null;this.fired=id;this.dismiss();},3000);
 }
 private cancel():void {this.token++;if(this.handle!==null)this.clock.cancel(this.handle);this.handle=null;}
 dispose():void {this.disposed=true;this.cancel();this.id=null;}
}
