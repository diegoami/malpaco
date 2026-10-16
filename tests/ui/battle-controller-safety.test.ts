import { describe, it, expect } from "vitest";
import { BattleController, Clock, battle } from "./battle-fixtures";

describe("battle lifecycle boundaries", () => {
  for (const transition of ["stop", "load", "new-game"] as const) it(`ignores an old ${transition} callback even after a fresh battle starts`, () => {
    const clock = new Clock(), c = new BattleController(battle(100, 100), clock);
    c.select("sulo", "frostkabo"); c.setThreshold(1); c.fightOn();
    const stale = [...clock.pending.values()][0]!.callback;
    if (transition === "stop") c.stop();
    else { c.replaceGame(battle(100, 100, 8), transition); c.select("sulo", "frostkabo"); }
    c.fightOn();
    const fresh = structuredClone(c.view), pending = [...clock.pending.keys()];
    stale();
    expect(c.view).toEqual(fresh);
    expect([...clock.pending.keys()]).toEqual(pending);
    clock.tick();
    expect(c.state.history.length).toBe(fresh.state.history.length + 1);
  });

  for (const [speed, delay] of [["slow", 600], ["normal", 400], ["fast", 200]] as const) it(`pauses only after twelve shown exchanges at ${speed}`, () => {
    const clock = new Clock(), c = new BattleController(battle(1000, 100), clock);
    c.select("sulo", "frostkabo"); c.setThreshold(1); c.setSpeed(speed); c.fightOn();
    for (let n = 1; n < 12; n++) {
      expect([...clock.pending.values()][0]!.delay).toBe(delay);
      clock.tick();
      expect(c.state.history).toHaveLength(n + 1);
      expect(c.view.paused).toBe(false);
    }
    expect([...clock.pending.values()][0]!.delay).toBe(delay);
    clock.tick();
    expect(c.state.history).toHaveLength(12);
    expect(c.view.paused).toBe(true);
    expect(clock.pending.size).toBe(0);
    const paused = structuredClone(c.view);
    expect(c.setThreshold(2)).toBe(false);
    expect(c.singleExchange()).toBe(false);
    expect(c.view).toEqual(paused);
    expect(c.fightOn()).toBe(true);
    expect(c.view.effectiveThreshold).toBe(paused.effectiveThreshold);
    expect(c.state.history).toHaveLength(13);
    expect(c.stop()).toBe(true);
  });
});
