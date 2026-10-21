import {describe,it,expect} from "vitest";
import {BattleController,Clock,battle,core,deepFreeze} from "./battle-fixtures";
import type {Speed} from "./battle-fixtures";

describe("ordinary exchange controller",()=>{
 it("publishes the complete tie trace without perturbing actual game RNG or actions",()=>{
  const s=deepFreeze(battle(3,20,8)),clock=new Clock(),c=new BattleController(s,clock);expect(c.select("sulo","frostkabo")).toBe(true);
  const result=core.apply(s,{kind:"attack",from:"sulo",to:"frostkabo"});if(!result.ok)throw Error(result.error);
  expect(c.singleExchange()).toBe(true);expect(c.state).toEqual(result.state);expect(c.state.history).toHaveLength(1);expect(clock.pending.size).toBe(0);
  expect(c.view.rolls).toEqual([{attackerRolls:[4],defenderRolls:[4],results:["tie"]},{attackerRolls:[2],defenderRolls:[6],results:["defender"]}]);
  expect(c.view.ties).toBe(1);expect(c.view.defenderWins).toBe(1);expect(c.view.lastOutcome).toEqual(result.outcome);expect(c.view.from).toBe("sulo");expect(c.view.to).toBe("frostkabo");
 });
 it("offers Stop after the chosen exchange and ignores an already queued stale callback",()=>{
  const clock=new Clock(),c=new BattleController(battle(20,20),clock);c.select("sulo","frostkabo");c.setThreshold(1);expect(c.singleExchange()).toBe(true);expect(c.fightOn()).toBe(true);
  expect(c.state.history).toHaveLength(2);expect(clock.pending.size).toBe(1);const stale=[...clock.pending.values()][0]!.callback;
  expect(c.stop()).toBe(true);expect(clock.pending.size).toBe(0);const stopped=structuredClone(c.view);stale();expect(c.view).toEqual(stopped);
  expect(c.view.running).toBe(false);expect(c.view.from).toBe("sulo");expect(c.view.to).toBe("frostkabo");
 });
 it("holds the remembered threshold fixed while armies fall and preserves its preference after clamping",()=>{
  // T82: seed 5 with 4 armies: the explicit Attack leaves 3 (still above the threshold), then Fight on falls to 2.
  const clock=new Clock(),c=new BattleController(battle(4,20,5),clock);c.select("sulo","frostkabo");expect(c.view.threshold).toBe(2);expect(c.view.effectiveThreshold).toBe(2);
  expect(c.singleExchange()).toBe(true);expect(c.state.armies["sulo"]).toBe(3);expect(c.view.effectiveThreshold).toBe(2);
  expect(c.fightOn()).toBe(true);expect(c.state.armies["sulo"]).toBe(2);expect(c.view.running).toBe(false);expect(clock.pending.size).toBe(0);expect(c.view.effectiveThreshold).toBe(2);
  c.replaceGame(battle(2,20),"new-game");c.select("sulo","frostkabo");expect(c.view.threshold).toBe(2);expect(c.view.effectiveThreshold).toBe(1);
  c.replaceGame(battle(20,20),"new-game");c.select("sulo","frostkabo");expect(c.view.threshold).toBe(2);expect(c.view.effectiveThreshold).toBe(2);
 });
 it("captures before scheduling another exchange, defaults to max and gates unrelated/stale input",()=>{
  // T82: two defenders, so the explicit Attack does not capture and Fight on's first exchange does.
  const clock=new Clock(),c=new BattleController(battle(5,2),clock);c.select("sulo","frostkabo");const oldRevision=c.view.revision;
  expect(c.singleExchange()).toBe(true);expect(c.state.phase).toBe("attack");expect(c.fightOn()).toBe(true);
  expect(c.state.phase).toBe("capture");expect(clock.pending.size).toBe(0);expect(c.view.running).toBe(false);expect(c.state.pendingCapture).toMatchObject({min:1,max:4,defaultAmount:4});
  const pending=structuredClone(c.view);expect(c.select("sulo","longa_strando")).toBe(false);expect(c.singleExchange()).toBe(false);expect(c.fightOn()).toBe(false);expect(c.dispatch({kind:"endTurn"})).toBe(false);expect(c.view).toEqual(pending);
  expect(c.confirmCapture(1,oldRevision)).toBe(false);expect(c.view).toEqual(pending);
  expect(c.confirmCapture(4)).toBe(true);expect([c.state.armies["sulo"],c.state.armies["frostkabo"]]).toEqual([1,4]);expect(c.state.phase).toBe("attack");
  const done=structuredClone(c.view);expect(c.confirmCapture(4)).toBe(false);expect(c.view).toEqual(done);
 });
 for(const reason of ["load","new-game"] as const)it(`cancels scheduled work on ${reason} and rejects old user revisions`,()=>{
  const clock=new Clock(),c=new BattleController(battle(),clock);c.select("sulo","frostkabo");c.setThreshold(1);c.singleExchange();c.fightOn();expect(clock.pending.size).toBe(1);const callback=[...clock.pending.values()][0]!.callback,revision=c.view.revision;
  const replacement=battle(10,10,8);expect(c.replaceGame(replacement,reason)).toBe(true);expect(clock.pending.size).toBe(0);const next=structuredClone(c.view);callback();expect(c.singleExchange(revision)).toBe(false);expect(c.view).toEqual(next);expect(c.state).toEqual(replacement);
 });
 it("disposal cancels automation and refuses all later commands",()=>{
  const clock=new Clock(),c=new BattleController(battle(),clock);c.select("sulo","frostkabo");c.singleExchange();c.fightOn();expect(clock.pending.size).toBe(1);const callback=[...clock.pending.values()][0]!.callback;expect(c.dispose()).toBe(true);expect(c.dispose()).toBe(false);expect(clock.pending.size).toBe(0);
  const final=structuredClone(c.view);callback();expect(c.singleExchange()).toBe(false);expect(c.fightOn()).toBe(false);expect(c.select("sulo","frostkabo")).toBe(false);expect(c.replaceGame(battle(),"load")).toBe(false);expect(c.view).toEqual(final);
 });
 it("uses the same ordinary exchange actions/results at every supported speed",()=>{
  const results=[];
  for(const [speed,delay] of [["slow",600],["normal",400],["fast",200]] as const){
   const s=battle(20,20),clock=new Clock(),c=new BattleController(s,clock);c.select("sulo","frostkabo");c.setThreshold(1);expect(c.setSpeed(speed as Speed)).toBe(true);expect(c.singleExchange()).toBe(true);expect(c.fightOn()).toBe(true);
   for(let n=0;n<4;n++){expect([...clock.pending.values()][0]!.delay).toBe(delay);expect(clock.pending.size).toBe(1);clock.tick();}
   // T82: Attack + Fight on's first exchange + four scheduled ones = six ordinary exchanges.
   c.stop();let expected=s;for(let n=0;n<6;n++){const r=core.apply(expected,{kind:"attack",from:"sulo",to:"frostkabo"});if(!r.ok)throw Error(r.error);expected=r.state;}expect(c.state).toEqual(expected);results.push(c.state);
  }
  expect(results[1]).toEqual(results[0]);expect(results[2]).toEqual(results[0]);
 });
 it("pauses a long battle before an unseen thirteenth exchange and can resume or stop",()=>{
  const clock=new Clock(),c=new BattleController(battle(1000,100),clock);// T82: the explicit Attack is exchange 1; Fight on then shows twelve before pausing.
  c.select("sulo","frostkabo");c.setThreshold(1);expect(c.singleExchange()).toBe(true);c.fightOn();clock.flush();
  expect(c.view.paused).toBe(true);expect(c.view.running).toBe(false);expect(c.state.history).toHaveLength(1+12);expect(clock.pending.size).toBe(0);
  expect(c.fightOn()).toBe(true);expect(c.state.history).toHaveLength(1+13);expect(clock.pending.size).toBe(1);expect(c.stop()).toBe(true);expect(clock.pending.size).toBe(0);
 });
 it("Fight on refuses a fresh pair until an explicit Attack, and a new pair clears it",()=>{
  const clock=new Clock(),c=new BattleController(battle(20,20),clock);expect(c.select("sulo","frostkabo")).toBe(true);
  const fresh=structuredClone(c.view);expect(c.fightOn()).toBe(false);expect(c.view).toEqual(fresh);expect(c.state.history).toHaveLength(0);expect(clock.pending.size).toBe(0);
  expect(c.singleExchange()).toBe(true);expect(c.state.history).toHaveLength(1);
  expect(c.fightOn()).toBe(true);expect(c.view.running).toBe(true);expect(c.state.history).toHaveLength(2);expect(c.stop()).toBe(true);
  expect(c.select("sulo","longa_strando")).toBe(true);const other=structuredClone(c.view);
  expect(c.fightOn()).toBe(false);expect(c.view).toEqual(other);expect(c.state.history).toHaveLength(2);expect(clock.pending.size).toBe(0);
 });
});
