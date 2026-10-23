import {expect,test} from 'vitest';
import {Clock,battle} from './battle-fixtures';
import {BattleController} from '../../src/ui/battleController';
const background=(c:BattleController)=>{
 const host=c as BattleController & {pauseUntilExplicitResume?:()=>void};
 if(host.pauseUntilExplicitResume)host.pauseUntilExplicitResume();else c.setPlaybackPaused(true);
};
const resume=(c:BattleController)=>(c as BattleController & {setPlaybackPaused(value:boolean,explicit?:boolean):void}).setPlaybackPaused(false,true);
test('a native background pause cannot be released by a temporary dialog closing',()=>{
 const c=new BattleController(battle(),new Clock()),before=structuredClone(c.state);
 background(c);expect(c.playbackPaused).toBe(true);
 c.setPlaybackPaused(false);expect(c.playbackPaused).toBe(true);expect(c.state).toEqual(before);
 resume(c);expect(c.playbackPaused).toBe(false);expect(c.state).toEqual(before);
});
test('repeated background events and stale scheduled exchanges cannot advance the game',()=>{
 const clock=new Clock(),c=new BattleController(battle(20,20),clock);
 c.select('sulo','frostkabo');c.setThreshold(1);c.singleExchange();c.fightOn();
 const callback=[...clock.pending.values()][0]!.callback;
 background(c);const before=structuredClone(c.view);background(c);callback();
 expect(c.view).toEqual(before);expect(clock.pending.size).toBe(0);
 c.setPlaybackPaused(false);expect(c.playbackPaused).toBe(true);expect(clock.pending.size).toBe(0);
 resume(c);expect(c.playbackPaused).toBe(false);expect(clock.pending.size).toBe(1);
});
test('ordinary pauses keep their existing automatic-resume behavior',()=>{
 const c=new BattleController(battle(),new Clock());c.setPlaybackPaused(true);c.setPlaybackPaused(false);expect(c.playbackPaused).toBe(false);
});
test('replacement retires the old lock and disposal rejects later resume/callbacks',()=>{
 const clock=new Clock(),c=new BattleController(battle(),clock);background(c);
 expect(c.replaceGame(battle(7,7),'load')).toBe(true);expect(c.playbackPaused).toBe(false);
 c.setPlaybackPaused(true);c.setPlaybackPaused(false);expect(c.playbackPaused).toBe(false);
 background(c);c.dispose();const last=structuredClone(c.view);resume(c);background(c);expect(c.view).toEqual(last);expect(clock.pending.size).toBe(0);
});
