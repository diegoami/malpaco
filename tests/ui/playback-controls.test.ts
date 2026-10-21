import { expect, test } from "vitest";
import { activePlayer, apply, computerAction } from "../../src/core";
import { deserializeVersionedMatch } from "../../src/core/match-save";
import { BattleController } from "../../src/ui/battleController";
import { ComputerTurnLoop, FAST_FORWARD_STEP_TIME } from "../../src/ui/computerTurnLoop";
import { Clock, battle } from "./battle-fixtures";
import { pinned } from "../core/versioned-match-fixture";

test("global pause invalidates an already dequeued battle callback and resumes one pending exchange", () => {
  const clock = new Clock(), c = new BattleController(battle(100, 100), clock);
  c.select("sulo", "frostkabo"); c.setThreshold(1); c.singleExchange(); c.fightOn();
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

test("Fast-forward shortens only the wait, plays the same actions, ends on a human turn and with Pause", () => {
  const initial = deserializeVersionedMatch(pinned("watch").text).state;
  const clock = new Clock(); let loop: ComputerTurnLoop | undefined;
  const c = new BattleController(initial, clock, () => loop?.update());
  loop = new ComputerTurnLoop(c, clock); loop.update();
  expect([...clock.pending.values()][0]!.delay).toBe(350);
  loop.fastForward(); expect(loop.fastForwarding).toBe(true);
  expect(clock.pending.size).toBe(1); expect([...clock.pending.values()][0]!.delay).toBe(FAST_FORWARD_STEP_TIME);
  let expected = initial;
  for (let i = 0; i < 3; i++) {clock.tick(); const r = apply(expected, computerAction(expected)!); if (!r.ok) throw Error(r.error); expected = r.state;}
  expect(c.state).toEqual(expected); expect(clock.pending.size).toBe(1);
  // Pause ends it; resuming returns to the chosen speed.
  c.setPlaybackPaused(true); expect(loop.fastForwarding).toBe(false); c.setPlaybackPaused(false);
  expect([...clock.pending.values()][0]!.delay).toBe(350);
  loop.dispose(); c.dispose();
  // On a human turn there is nothing to fast-forward.
  const human = deserializeVersionedMatch(pinned("placement").text).state, h2 = new Clock();
  const c2 = new BattleController(human, h2); const l2 = new ComputerTurnLoop(c2, h2);
  l2.fastForward(); expect(l2.fastForwarding).toBe(false); expect(h2.pending.size).toBe(0); l2.dispose(); c2.dispose();
});
