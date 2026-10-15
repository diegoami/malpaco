import { describe, expect, it } from "vitest";
import { apply } from "../../src/core";
import type { Action } from "../../src/core";
import { ACTION_BUDGET, advance, nextAction, opening, policyFor } from "../helpers/complete-game";

describe("complete generated human games through legal actions", () => {
  for (const seed of [1, 42, 1994]) for (const seats of [2, 3, 4]) {
    it(`seed ${seed}, ${seats} seats: elimination, living handoff, conquest and frozen finish`, () => {
      let state = opening(seed, seats);
      const policy = policyFor(state);
      let actions = 0, handoffs = 0, skippedDead = 0;
      while (state.phase !== "finished" && actions < ACTION_BUDGET) {
        const before = state;
        const action = nextAction(state, policy);
        state = advance(state, action);
        actions++;
        for (const p of state.players) {
          const count = Object.values(state.ownerOf).filter(owner => owner === p.id).length;
          expect(p.eliminated, `${p.id} owns ${count} countries`).toBe(count === 0);
        }
        if (action.kind === "endTurn") {
          handoffs++;
          let expected = (before.currentPlayer + 1) % seats;
          while (before.players[expected]!.eliminated) { skippedDead++; expected = (expected + 1) % seats; }
          expect(state.currentPlayer).toBe(expected);
          expect(state.players[state.currentPlayer]!.eliminated).toBe(false);
        }
      }
      console.log(JSON.stringify({ seed, seats, actions, handoffs, rounds: state.turnNumber, skippedDead }));
      expect(actions).toBeLessThan(ACTION_BUDGET);
      expect(state.phase).toBe("finished");
      expect(state.winner).toBe(policy.conqueror);
      expect(new Set(Object.values(state.ownerOf))).toEqual(new Set([policy.conqueror]));
      expect(state.players.filter(p => p.eliminated)).toHaveLength(seats - 1);
      expect(state.log.filter(e => e.event === "eliminated")).toHaveLength(seats - 1);
      expect(state.log.filter(e => e.event === "victory")).toEqual([{ event: "victory", player: policy.conqueror, turn: state.turnNumber }]);
      if (seats > 2) expect(skippedDead).toBeGreaterThan(0);
      const frozen = JSON.stringify(state);
      const province = state.map.provinces[0]!.id;
      for (const action of [{kind:"reinforce",province,amount:1}, {kind:"endReinforcement"}, {kind:"attack",from:province,to:state.map.provinces[1]!.id}, {kind:"endTurn"}] satisfies Action[]) {
        expect(apply(state, action)).toEqual({ok:false,error:"the game is over"});
        expect(JSON.stringify(state)).toBe(frozen);
      }
    });
  }
});
