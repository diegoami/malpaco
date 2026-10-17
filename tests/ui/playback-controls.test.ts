import { expect, test } from "vitest";
import { activePlayer, apply, computerAction } from "../../src/core";
import { deserializeVersionedMatch } from "../../src/core/match-save";
import { BattleController } from "../../src/ui/battleController";
import { ComputerTurnLoop } from "../../src/ui/computerTurnLoop";
import { Clock, battle } from "./battle-fixtures";
import { pinned } from "../core/versioned-match-fixture";

test("global pause invalidates an already dequeued battle callback and resumes one pending exchange", () => {
  const clock = new Clock(), c = new BattleController(battle(100, 100), clock);
  c.select("sulo", "frostkabo"); c.setThreshold(1); c.fightOn();
  const stale = [...clock.pending.values()][0]!.callback, frozen = c.state;
  c.setPlaybackPaused(true); expect(clock.pending.size).toBe(0); stale();
  expect(c.state).toBe(frozen); expect(c.fightOn()).toBe(false); expect(c.stop()).toBe(false);
  expect(c.setSpeed("very-slow")).toBe(true); expect(clock.pending.size).toBe(0);
  c.setPlaybackPaused(false); expect(c.state).toBe(frozen);
  expect([...clock.pending.values()][0]!.delay).toBe(2400);
  stale(); expect(c.state).toBe(frozen); clock.tick();
  const expected = apply(frozen, { kind: "attack", from: "sulo", to: "frostkabo" });
  if (!expected.ok) throw Error(expected.error);
  expect(c.state).toEqual(expected.state);
});

test("paused computer rejects callbacks and direct commands, keeps speed usable and replacement starts unpaused", () => {
  const initial = deserializeVersionedMatch(pinned("watch").text).state;
  expect(activePlayer(initial)!.kind).toBe("computer");
  const clock = new Clock(); let loop: ComputerTurnLoop | undefined;
  const c = new BattleController(initial, clock, () => loop?.update());
  loop = new ComputerTurnLoop(c, clock); loop.update();
  const stale = [...clock.pending.values()][0]!.callback, action = computerAction(initial)!;
  c.setPlaybackPaused(true); expect(clock.pending.size).toBe(0); stale();
  expect(c.dispatchComputer(action)).toBe(false); expect(c.state).toBe(initial);
  c.setSpeed("very-slow"); expect(clock.pending.size).toBe(0);
  c.setPlaybackPaused(false); expect([...clock.pending.values()][0]!.delay).toBe(2000);
  stale(); expect(c.state).toBe(initial); clock.tick();
  const expected = apply(initial, action); if (!expected.ok) throw Error(expected.error);
  expect(c.state).toEqual(expected.state);
  c.setPlaybackPaused(true);
  const human = deserializeVersionedMatch(pinned("placement").text).state;
  c.replaceGame(human, "load"); expect(c.playbackPaused).toBe(false); stale(); expect(c.state).toBe(human);
  c.setPlaybackPaused(true);
  const own = human.map.provinces.find(region => human.ownerOf[region.id] === activePlayer(human)!.id)!.id;
  expect(c.dispatch({ kind: "reinforce", province: own, amount: 1 })).toBe(false);
  expect(c.state).toBe(human); loop.dispose(); c.dispose();
});
