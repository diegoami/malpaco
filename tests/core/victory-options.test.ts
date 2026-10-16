import { describe, expect, it } from "vitest";
import type { Action, GameState } from "../../src/core";
import { act, core, end, frozen, layout, opening, ready, rotation, standings } from "./victory-options-fixture";
import type { CompleteState } from "./victory-options-fixture";

function finished(state: CompleteState, winner: string, reason: string) {
  expect(state.phase).toBe("finished");
  expect(state.winner).toBe(winner);
  expect(state.result?.reason).toBe(reason);
  expect(state.result?.standings).toEqual(standings(state));
}

function domination() {
  const state = layout(rotation(2, 0), [35, 11]);
  const next = end(frozen(state));
  finished(next, state.players[0]!.id, "domination");
  return next;
}

describe("rounds from the seeded origin and complete end-of-turn victory", () => {
  for (const seats of [2, 3, 4]) for (let first = 0; first < seats; first++) {
    it(`${seats} seats, first ${first}: one complete rotated round before increment`, () => {
      let state = rotation(seats, first);
      expect(state.roundOrigin).toBe(first);
      const rng = state.rng;
      for (let turn = 0; turn < seats * 2; turn++) {
        expect(state.currentPlayer).toBe((first + turn) % seats);
        expect(state.turnNumber).toBe(1 + Math.floor(turn / seats));
        state = end(frozen(state));
        expect(state.phase).toBe("reinforce");
        expect(state.rng).toEqual(rng);
        expect(state.roundOrigin).toBe(first);
      }
      expect(state.turnNumber).toBe(3);
    });
  }

  for (let first = 0; first < 4; first++) for (const eliminateOrigin of [false, true]) {
    it(`origin ${first}, eliminated ${eliminateOrigin ? "origin" : "middle"}: skips without extra/missing rounds`, () => {
      let state = rotation(4, first, { dominationWin: false });
      const dead = eliminateOrigin ? first : (first + 1) % 4;
      const counts = [12, 12, 11, 11];
      const receiver = (dead + 1) % 4;
      counts[receiver]! += counts[dead]!;
      counts[dead] = 0;
      state = layout(state, counts);
      const alive = Array.from({ length: 4 }, (_, n) => (first + n) % 4).filter(n => n !== dead);
      state.currentPlayer = alive[0]!;
      for (let turn = 0; turn < 6; turn++) {
        expect(state.currentPlayer).toBe(alive[turn % 3]);
        expect(state.turnNumber).toBe(1 + Math.floor(turn / 3));
        state = end(frozen(state));
        expect(state.roundOrigin).toBe(first);
      }
      expect(state.turnNumber).toBe(3);
    });
  }

  it("35 of46 wins at own turn end before next income;34 does not", () => {
    domination();
    const state = layout(rotation(2, 0), [34, 12]);
    const next = end(state);
    expect(next.phase).toBe("reinforce");
    expect(next.winner).toBe("");
    expect(next.result).toBeUndefined();
    const winning = layout(rotation(2, 0), [35, 11]);
    const before = structuredClone(winning);
    const done = end(frozen(winning));
    expect(winning).toEqual(before);
    expect(done.currentPlayer).toBe(0);
    expect(done.reinforcementPool).toBe(0);
    expect(done.rng).toEqual(winning.rng);
    expect(done.computerRngs).toEqual(winning.computerRngs);
    expect(done.history).toEqual([...winning.history, { kind: "endTurn" }]);
  });

  it("disabled domination and an opponent's domination do not end the wrong turn", () => {
    domination();
    for (const [counts, options] of [[ [35, 11], { dominationWin: false } ], [ [11, 35], {} ]] as const) {
      const state = layout(rotation(2, 0, options), counts);
      expect(end(state).phase).toBe("reinforce");
    }
  });

  it("conquest/one living seat takes precedence over domination and human loss", () => {
    domination();
    const state = layout(rotation(4, 1, {
      seats: [{ kind: "human" }, { kind: "computer" }, { kind: "computer" }, { kind: "computer" }],
      computerStrengths: ["Normal", "Normal", "Normal"],
    }), [0, 46, 0, 0]);
    finished(end(frozen(state)), state.players[1]!.id, "conquest");
  });

  it("a completed friendly transfer is reflected in final standings before victory", () => {
    domination();
    const state = layout(rotation(2, 0), [35, 11]);
    const from = state.map.provinces.find(p => state.ownerOf[p.id] === state.players[0]!.id && [...p.borders, ...p.seaLanes].some(id => state.ownerOf[id] === state.players[0]!.id))!;
    const to = [...from.borders, ...from.seaLanes].find(id => state.ownerOf[id] === state.players[0]!.id)!;
    state.armies[from.id] = 8;
    const previous = state.armies[to]!;
    const done = act(frozen(state), { kind: "friendlyMove", from: from.id, to, amount: 3 });
    finished(done, state.players[0]!.id, "domination");
    expect([done.armies[from.id], done.armies[to]]).toEqual([5, previous + 3]);
    expect(done.history).toEqual([{ kind: "friendlyMove", from: from.id, to, amount: 3 }]);
  });

  it("capture choice never finishes the game or permits turn end before confirmation", () => {
    domination();
    let state = layout(rotation(2, 0), [34, 12]);
    const player = state.players[0]!.id;
    const from = state.map.provinces.find(p => state.ownerOf[p.id] === player && [...p.borders, ...p.seaLanes].some(id => state.ownerOf[id] !== player))!;
    const to = [...from.borders, ...from.seaLanes].find(id => state.ownerOf[id] !== player)!;
    state.armies[from.id] = 40;
    state.armies[to] = 1;
    for (let n = 0; n < 128 && state.phase === "attack"; n++) state = act(state, { kind: "attack", from: from.id, to });
    expect(state.phase).toBe("capture");
    expect(state.winner).toBe("");
    expect(state.result).toBeUndefined();
    const before = structuredClone(state);
    expect(core.apply(frozen(state) as GameState, { kind: "endTurn" }).ok).toBe(false);
    expect(state).toEqual(before);
    state = act(state, { kind: "captureMove" });
    expect(state.phase).toBe("attack");
    expect(state.result).toBeUndefined();
    finished(end(state), player, "domination");
  });

  for (const limit of [20, 30, 40] as const) for (let first = 0; first < 4; first++) {
    it(`limit ${limit}, origin ${first}: scores only after the last live turn, later rotated seat wins exact tie`, () => {
      let state = rotation(4, first, { dominationWin: false, roundLimit: limit });
      const expected = Array.from({ length: 4 }, (_, n) => (first + n) % 4).filter(n => n === 0 || n === 1).at(-1)!;
      state = layout(state, [12, 12, 11, 11], [30, 30, 25, 25]);
      state.turnNumber = limit;
      for (let turn = 0; turn < 3; turn++) {
        state = end(state);
        expect(state.phase).toBe("reinforce");
        expect(state.turnNumber).toBe(limit);
        // Explicit examples keep the tied end scores constant despite legal income placement.
        state = layout(state, [12, 12, 11, 11], [30, 30, 25, 25]);
      }
      const rng = state.rng;
      const done = end(frozen(state));
      finished(done, state.players[expected]!.id, "round-limit");
      expect(done.rng).toEqual(rng);
      expect(done.reinforcementPool).toBe(0);
      expect(done.turnNumber).toBe(limit);
    });
  }

  it("round-limit scoring prefers countries, then armies, skipping eliminated final seats", () => {
    domination();
    for (const [counts, totals, winner] of [
      [[13, 12, 11, 10], [13, 80, 30, 30], 0],
      [[12, 12, 11, 11], [30, 31, 40, 40], 1],
      [[12, 12, 11, 11], [31, 30, 40, 40], 0],
      [[23, 23, 0, 0], [30, 31, 0, 0], 1],
    ] as const) {
      const state = layout(rotation(4, 0, { dominationWin: false, roundLimit: 20 }), counts, totals);
      state.turnNumber = 20;
      state.currentPlayer = counts[3] ? 3 : 1;
      finished(end(frozen(state)), state.players[winner]!.id, "round-limit");
    }
  });

  it("round limit off keeps playing past40, and conquest/domination precede the limit", () => {
    domination();
    const ordinary = layout(rotation(2, 0, { dominationWin: false, roundLimit: null }), [23, 23]);
    ordinary.turnNumber = 40;
    ordinary.currentPlayer = 1;
    expect(end(ordinary).phase).toBe("reinforce");
    for (const [counts, reason] of [[[46, 0], "conquest"], [[35, 11], "domination"]] as const) {
      const state = layout(rotation(2, 1, { roundLimit: 20 }), counts);
      state.currentPlayer = 0;
      state.turnNumber = 20;
      finished(end(state), state.players[0]!.id, reason);
    }
  });

  const mixed = { seats: [{ kind: "human" }, { kind: "computer" }, { kind: "computer" }, { kind: "computer" }] as const, computerStrengths: ["Normal", "Normal", "Normal"] as const, dominationWin: false };
  function humanLoss() {
    const before = layout(rotation(4, 1, mixed), [0, 20, 13, 13]);
    const paused = end(frozen(before));
    expect(paused.phase).toBe("human-loss");
    expect(paused.result?.reason).toBe("no-human-left");
    expect(paused.result?.standings).toEqual(standings(paused));
    expect(paused.currentPlayer).toBe(1);
    expect(paused.reinforcementPool).toBe(0);
    expect(paused.winner).toBe("");
    expect(paused.rng).toEqual(before.rng);
    return paused;
  }

  it("human loss freezes ordinary input until Watch or Stop and never grants premature income", () => {
    domination();
    const state = humanLoss();
    const before = structuredClone(state);
    for (const action of [{ kind: "endTurn" }, { kind: "endReinforcement" }, { kind: "attack", from: state.map.provinces[0]!.id, to: state.map.provinces[1]!.id }] as Action[]) {
      expect(core.apply(frozen(state) as GameState, action).ok).toBe(false);
      expect(state).toEqual(before);
    }
    const stopped = act(state, { kind: "stopGame" });
    finished(stopped, "", "no-human-left");
    expect(stopped.currentPlayer).toBe(state.currentPlayer);
    expect(stopped.reinforcementPool).toBe(0);
    expect(core.apply(stopped as GameState, { kind: "endTurn" }).ok).toBe(false);
  });

  it("Watch hands off once, resumes remaining computers and cannot repeat the loss prompt", () => {
    domination();
    const state = humanLoss();
    const watched = act(frozen(state), { kind: "watchComputers" });
    expect(watched.watchingComputers).toBe(true);
    expect(watched.phase).toBe("reinforce");
    expect(watched.currentPlayer).toBe(2);
    expect(watched.result).toBeUndefined();
    expect(watched.reinforcementPool).toBe(core.reinforcementIncome(watched as GameState, watched.players[2]!.id).total);
    expect(watched.rng).toEqual(state.rng);
    expect(watched.history.at(-1)).toEqual({ kind: "watchComputers" });
    let next = watched;
    for (let i = 0; i < 6; i++) {
      next = end(next);
      expect(next.phase).toBe("reinforce");
      expect(next.players[next.currentPlayer]!.kind).toBe("computer");
    }
    const won = layout(next, [0, 46, 0, 0]);
    won.currentPlayer = 1;
    finished(end(won), won.players[1]!.id, "conquest");
  });

  it("all-computer games and a surviving human bypass no-human-loss; higher victory rules win first", () => {
    domination();
    const all = opening(1994, 4, { dominationWin: false, seats: Array.from({ length: 4 }, () => ({ kind: "computer" as const })), computerStrengths: ["Normal", "Normal", "Normal", "Normal"] });
    expect(end(all).phase).toBe("reinforce");
    const hotseat = layout(opening(1994, 4, { ...mixed, seats: [{ kind: "human" }, { kind: "human" }, { kind: "computer" }, { kind: "computer" }], computerStrengths: ["Normal", "Normal"] }), [0, 10, 18, 18]);
    hotseat.currentPlayer = 2;
    expect(end(hotseat).phase).toBe("reinforce");
    const score = layout(rotation(4, 0, { ...mixed, roundLimit: 20 }), [0, 20, 13, 13]);
    score.currentPlayer = 3;
    score.turnNumber = 20;
    finished(end(score), score.players[1]!.id, "round-limit");
    const dominate = layout(rotation(4, 1, { ...mixed, dominationWin: true }), [0, 35, 6, 5]);
    finished(end(dominate), dominate.players[1]!.id, "domination");
  });

  it("terminal actions and out-of-phase Watch/Stop refuse atomically; legacy presets stay unchanged", () => {
    const terminal = domination();
    const ordinary = ready(opening());
    for (const state of [ordinary, terminal]) for (const action of [{ kind: "watchComputers" }, { kind: "stopGame" }] as const) {
      const before = structuredClone(state);
      expect(core.apply(frozen(state) as GameState, action as unknown as Action).ok).toBe(false);
      expect(state).toEqual(before);
    }
    for (const rules of [core.classicRules(), core.malpacoRules(), core.captureChoiceRules(), core.friendlyMoveRules()]) expect((rules as unknown as { victoryOptions?: unknown }).victoryOptions).toBeUndefined();
  });
});
