import {expect,test} from 'vitest';
import {phaseMessage,PhaseAnnouncementTimer} from '../../src/ui/phaseAnnouncement';
import {apply,cloneState,deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core';
import {pinned} from '../core/versioned-match-fixture';
import {humanGuidance} from '../../src/ui/turnTracker';
const first={key:'turn1',title:'Your turn to move',detail:'Place armies',seat:0};
function fixture(fresh=false){
 let now=0,next=0,paints=0,paused=false,message=first;
 const jobs=new Map<number,{at:number;fn:()=>void}>();
 const clock={now:()=>now,schedule:(fn:()=>void,ms:number)=>{jobs.set(++next,{at:now+ms,fn});return next;},cancel:(id:number)=>{jobs.delete(id);}};
 const timer=new PhaseAnnouncementTimer(clock,fresh,()=>{paints++;timer.update(message,paused);});
 const update=(value=first,hold=false)=>{message=value;paused=hold;timer.update(value,hold);};
 const advance=(ms:number)=>{const end=now+ms;while(true){const due=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!due||due[1].at>end)break;now=due[1].at;jobs.delete(due[0]);due[1].fn();}now=end;};
 return {timer,jobs,update,advance,paints:()=>paints};
}
test('fresh countdown holds 3,2,1 then a phase; repeated paints do not restart deadlines',()=>{
 const f=fixture(true);f.update();expect(f.timer.counting).toBe(true);expect(f.timer.view.count).toBe(3);
 f.advance(999);f.update();expect(f.timer.view.count).toBe(3);f.advance(1);expect(f.timer.view.count).toBe(2);
 f.advance(1000);expect(f.timer.view.count).toBe(1);f.advance(1000);expect(f.timer.counting).toBe(false);expect(f.timer.view.visible).toBe(true);
 f.advance(2999);f.update();expect(f.timer.view.visible).toBe(true);f.advance(1);expect(f.timer.view.visible).toBe(false);f.update();f.advance(10000);expect(f.timer.view.visible).toBe(false);
});
test('retained game skips countdown and phase lifetime preserves remaining time across pause',()=>{
 const f=fixture();f.update();expect(f.timer.counting).toBe(false);f.advance(1200);const stale=[...f.jobs.values()][0]!.fn;
 f.update(first,true);expect(f.timer.view.visible).toBe(false);stale();f.advance(9000);f.update();f.advance(1799);expect(f.timer.view.visible).toBe(true);f.advance(1);expect(f.timer.view.visible).toBe(false);
});
test('countdown pauses without completing or restarting; stale timers cannot paint replacements or disposed games',()=>{
 const f=fixture(true);f.update();f.advance(400);const stale=[...f.jobs.values()][0]!.fn;f.update(first,true);stale();f.advance(5000);expect(f.timer.view.count).toBe(3);
 f.update();f.advance(599);expect(f.timer.view.count).toBe(3);f.advance(1);expect(f.timer.view.count).toBe(2);f.advance(2000);
 const old=[...f.jobs.values()][0]!.fn;f.update({...first,key:'purple',title:'Purple is moving'});old();expect(f.timer.view.message!.title).toBe('Purple is moving');
 const later=[...f.jobs.values()][0]!.fn,before=f.paints();f.timer.dispose();later();f.advance(5000);f.update();expect(f.paints()).toBe(before);expect(f.timer.view.visible).toBe(false);
});
test('capture prompts and advisory changes keep the attack banner and its original deadline',()=>{
 const loaded=deserializeVersionedMatch(pinned('pending-capture').text),capture=loaded.state;
 const before=deserializeVersionedMatch(serializeVersionedMatch(loaded.options,capture.history.slice(0,-1),loaded.identity)).state;
 const context={mode:'battle' as const,cardPhase:'hand',paused:false,worldPending:false,cardReward:false};
 const message=phaseMessage(before,context)!;
 expect(phaseMessage(capture,context)).toEqual(message);
 const after=apply(capture,{kind:'captureMove',amount:capture.pendingCapture!.min});if(!after.ok)throw Error(after.error);
 expect(phaseMessage(after.state,context)).toEqual(message);
 const quiet=cloneState(before);for(const id of Object.keys(quiet.armies))quiet.armies[id]=1;
 expect(humanGuidance(quiet,context).instruction).not.toBe(humanGuidance(before,context).instruction);
 expect(phaseMessage(quiet,context)).toEqual(message);
 const f=fixture();f.update(message);f.advance(1000);f.update(phaseMessage(capture,context)!);f.advance(1000);f.update(phaseMessage(after.state,context)!);
 f.advance(999);expect(f.timer.view.visible).toBe(true);f.advance(1);expect(f.timer.view.visible).toBe(false);
 f.update(phaseMessage(quiet,context)!);expect(f.timer.view.visible).toBe(false);
 expect(phaseMessage(after.state,{...context,mode:'move'})!.key).not.toBe(message.key);
});
