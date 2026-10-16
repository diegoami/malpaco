import { describe, expect, it } from "vitest";
import { deserializeVersionedMatch } from "../../src/core/match-save";
import { BattleController } from "../../src/ui/battleController";
import { pinned } from "../core/versioned-match-fixture";

describe("loaded pending capture context", () => {
  for (const replace of [false, true]) it(`restores source and target on ${replace ? "replacement" : "mount"} without another exchange`, () => {
    const state = deserializeVersionedMatch(pinned("pending-capture").text).state;
    const controller = new BattleController(replace ? deserializeVersionedMatch(pinned("placement").text).state : state, {
      schedule: () => { throw Error("A restored choice must not schedule another exchange"); }, cancel: () => {},
    });
    if (replace) controller.replaceGame(state, "load");
    expect(controller.view.from).toBe(state.pendingCapture!.from);
    expect(controller.view.to).toBe(state.pendingCapture!.to);
    expect(controller.view.running).toBe(false);
    expect(controller.view.state).toBe(state);
  });
});
