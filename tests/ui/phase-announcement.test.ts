import {expect,test} from 'vitest';
import {PhaseAnnouncementTimer} from '../../src/ui/phaseAnnouncement';
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
