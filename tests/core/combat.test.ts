import { describe, expect, it } from "vitest";
import { apply, armyCount, cloneState, DeterministicRng, ownerOf, pairResults, resolve, whyNot } from "../../src/core";
import { position, ScriptedDice, withCombat } from "./helpers";

// Every expected number below was worked by hand from core/rules/combat_resolver.gd
// and the Classic block of core/rules/rule_set.gd: attacker rolls min(3, armies - 1)
// dice, defender min(2, armies); each side's dice sorted high to low and paired;
// attacker wins a pair only by rolling strictly higher; each lost pair costs the
// loser one army. Dice are scripted: the attacker's are drawn first, then the defender's.

describe("one attack, worked by hand", () => {
  it("1: 4 v 2, dice [2,5,3 | 3,4] -> sorted 5,3,2 v 4,3: one pair each way (the tie goes to the defender)", () => {
    const state = position({ sulo: ["blue", 4], frostkabo: ["amber", 2] });
    const dice = new ScriptedDice([2, 5, 3, 3, 4]);
    const out = resolve(state, "sulo", "frostkabo", dice);
    expect(out.attackerRolls).toEqual([5, 3, 2]);
    expect(out.defenderRolls).toEqual([4, 3]);
    expect(out.defenderLosses).toBe(1); // 5 beats 4
    expect(out.attackerLosses).toBe(1); // 3 ties 3: defender
    expect(armyCount(state, "sulo")).toBe(3);
    expect(armyCount(state, "frostkabo")).toBe(1);
    expect(out).toMatchObject({ captured: false, penalty: false, endsPhase: false });
    expect(ownerOf(state, "frostkabo")).toBe("amber");
    expect(dice.asked).toEqual([6, 6, 6, 6, 6]); // 3 + 2 six-sided dice, no more
    expect(dice.unused).toBe(0);
  });

  it("2: 4 v 1, dice [6,2,1 | 3] -> capture; diceCount moves 3 (min(dice rolled, armies - 1))", () => {
    const state = position({ sulo: ["blue", 4], longa_strando: ["amber", 1] });
    const out = resolve(state, "sulo", "longa_strando", new ScriptedDice([6, 2, 1, 3]));
    expect(out).toMatchObject({ attackerLosses: 0, defenderLosses: 1, captured: true, moved: 3 });
    expect(ownerOf(state, "longa_strando")).toBe("blue");
    expect(armyCount(state, "longa_strando")).toBe(3);
    expect(armyCount(state, "sulo")).toBe(1);
  });

  it("3: 3 v 2, dice [6,5 | 2,1] -> both pairs won, capture, 2 move in, 1 stays", () => {
    const state = position({ sulo: ["blue", 3], frostkabo: ["amber", 2] });
    const out = resolve(state, "sulo", "frostkabo", new ScriptedDice([6, 5, 2, 1]));
    expect(out).toMatchObject({ attackerLosses: 0, defenderLosses: 2, captured: true, moved: 2 });
    expect(armyCount(state, "sulo")).toBe(1);
    expect(armyCount(state, "frostkabo")).toBe(2);
  });

  it("4: 2 v 2, dice [3 | 3,1] -> tie to the defender, attacker down to 1: the province is lost and the phase ends", () => {
    const state = position({ sulo: ["blue", 2], frostkabo: ["amber", 2] });
    const out = resolve(state, "sulo", "frostkabo", new ScriptedDice([3, 3, 1]));
    expect(out.attackerRolls).toEqual([3]); // one die: armies - 1
    expect(out.defenderRolls).toEqual([3, 1]);
    expect(out).toMatchObject({ attackerLosses: 1, defenderLosses: 0, captured: false, penalty: true, endsPhase: true });
    expect(ownerOf(state, "sulo")).toBe("amber");
    expect(armyCount(state, "sulo")).toBe(1);
    expect(armyCount(state, "frostkabo")).toBe(2);
  });

  it("5: the same dice with ties going to the attacker: the defender loses one and there is no penalty", () => {
    const state = position({ sulo: ["blue", 2], frostkabo: ["amber", 2] }, withCombat({ ties: "attacker" }));
    const out = resolve(state, "sulo", "frostkabo", new ScriptedDice([3, 3, 1]));
    expect(out).toMatchObject({ attackerLosses: 0, defenderLosses: 1, penalty: false, endsPhase: false });
    expect(armyCount(state, "sulo")).toBe(2);
    expect(armyCount(state, "frostkabo")).toBe(1);
  });

  it("6: 3 v 2, dice [1,1 | 6,6] -> the attacker loses both pairs and the penalty applies", () => {
    const state = position({ sulo: ["blue", 3], frostkabo: ["amber", 2] });
    const out = resolve(state, "sulo", "frostkabo", new ScriptedDice([1, 1, 6, 6]));
    expect(out).toMatchObject({ attackerLosses: 2, defenderLosses: 0, penalty: true, endsPhase: true });
    expect(ownerOf(state, "sulo")).toBe("amber");
  });

  it("7: a sea lane attack resolves like a border one (frostkabo -> splito), 3 v 2, dice [6,5 | 1,1]", () => {
    const state = position({ frostkabo: ["blue", 3], splito: ["amber", 2] });
    expect(whyNot(state, "frostkabo", "splito")).toBe("");
    const out = resolve(state, "frostkabo", "splito", new ScriptedDice([6, 5, 1, 1]));
    expect(out).toMatchObject({ captured: true, moved: 2 });
    expect(ownerOf(state, "splito")).toBe("blue");
  });

  it("8: the failure penalty variants: endPhase keeps the province, none does not even end the phase", () => {
    const dice = () => new ScriptedDice([3, 3, 1]);
    const endPhase = position({ sulo: ["blue", 2], frostkabo: ["amber", 2] }, withCombat({ failurePenalty: "endPhase" }));
    expect(resolve(endPhase, "sulo", "frostkabo", dice())).toMatchObject({ penalty: false, endsPhase: true });
    expect(ownerOf(endPhase, "sulo")).toBe("blue");
    const none = position({ sulo: ["blue", 2], frostkabo: ["amber", 2] }, withCombat({ failurePenalty: "none" }));
    expect(resolve(none, "sulo", "frostkabo", dice())).toMatchObject({ penalty: false, endsPhase: false });
  });

  it("9: capture variants on 5 v 1, dice [4,3,2 | 1]: all moves 4, one moves 1, diceCount moves 3", () => {
    const run = (capture: "all" | "one" | "diceCount") => {
      const state = position({ sulo: ["blue", 5], ventflanko: ["amber", 1] }, withCombat({ capture }));
      const out = resolve(state, "sulo", "ventflanko", new ScriptedDice([4, 3, 2, 1]));
      return [out.moved, armyCount(state, "sulo"), armyCount(state, "ventflanko")];
    };
    expect(run("all")).toEqual([4, 1, 4]);
    expect(run("one")).toEqual([1, 4, 1]);
    expect(run("diceCount")).toEqual([3, 2, 3]);
  });
});

describe("pair results (the labels the result dialog shows)", () => {
  it("pairs highest against highest, ties by the rule, and leaves unpaired dice out", () => {
    expect(pairResults("defender", [5, 3, 2], [4, 3])).toEqual(["attacker", "defender"]);
    expect(pairResults("attacker", [5, 3, 2], [4, 3])).toEqual(["attacker", "attacker"]);
    expect(pairResults("defender", [3], [3, 1])).toEqual(["defender"]);
    expect(pairResults("attacker", [3], [3, 1])).toEqual(["attacker"]);
    expect(pairResults("defender", [1, 1], [6, 6])).toEqual(["defender", "defender"]);
  });
});

describe("what is allowed", () => {
  it("the match rule: an attacker must hold at least the defender's armies", () => {
    expect(whyNot(position({ sulo: ["blue", 3], frostkabo: ["amber", 3] }), "sulo", "frostkabo")).toBe("");
    expect(whyNot(position({ sulo: ["blue", 3], frostkabo: ["amber", 4] }), "sulo", "frostkabo")).toBe(
      "Sulo has 3 armies and Frostkabo has 4 — an attacker must match the defender",
    );
  });

  it("the classic rule allows a weaker attacker; the threshold rule asks for a ratio", () => {
    const weaker: Record<string, [string, number]> = { sulo: ["blue", 3], frostkabo: ["amber", 4] };
    expect(whyNot(position(weaker, withCombat({ attackRule: "classic" })), "sulo", "frostkabo")).toBe("");
    const threshold = withCombat({ attackRule: "threshold", attackRatio: 2 });
    expect(whyNot(position({ sulo: ["blue", 3], frostkabo: ["amber", 2] }, threshold), "sulo", "frostkabo")).toBe(
      "Sulo needs 2.0 times the defender's armies",
    );
    expect(whyNot(position({ sulo: ["blue", 4], frostkabo: ["amber", 2] }, threshold), "sulo", "frostkabo")).toBe("");
  });

  it("refuses: one army, a province you do not hold, your own province, a province not in reach, unknown ids", () => {
    const state = position({ sulo: ["blue", 1], ventflanko: ["blue", 5], frostkabo: ["amber", 1], dentego: ["amber", 1] });
    expect(whyNot(state, "sulo", "frostkabo")).toBe("Sulo needs at least 2 armies to attack");
    expect(whyNot(state, "frostkabo", "sulo")).toBe("you do not hold Frostkabo");
    expect(whyNot(state, "ventflanko", "sulo")).toBe("Sulo is already yours");
    expect(whyNot(state, "ventflanko", "dentego")).toBe("Ventflanko does not reach Dentego");
    expect(whyNot(state, "nowhere", "sulo")).toBe("no such province 'nowhere'");
    expect(whyNot(state, "sulo", "nowhere")).toBe("no such province 'nowhere'");
  });
});

describe("apply: the engine's one way in", () => {
  it("resolves with the dice its own seeded generator rolls, and stores the generator's new position", () => {
    const state = position({ sulo: ["blue", 4], frostkabo: ["amber", 2] }, undefined, 99);
    const rehearsal = DeterministicRng.fromSnapshot(state.rng);
    const expected = resolve(cloneState(state), "sulo", "frostkabo", rehearsal);

    const result = apply(state, { kind: "attack", from: "sulo", to: "frostkabo" });
    if (!result.ok) throw new Error(result.error);
    expect(result.outcome).toEqual(expected);
    expect(result.state.rng).toEqual(rehearsal.snapshot());
    expect(result.state.rng).not.toEqual(state.rng);
    expect(result.state.log.at(-1)).toEqual(expected);
    expect(result.state.history).toEqual([{ kind: "attack", from: "sulo", to: "frostkabo" }]);
  });

  it("never touches the state it was given", () => {
    const state = position({ sulo: ["blue", 4], frostkabo: ["amber", 2] });
    const before = JSON.stringify(state);
    apply(state, { kind: "attack", from: "sulo", to: "frostkabo" });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("rejects an illegal attack with the reason, and changes nothing", () => {
    const state = position({ sulo: ["blue", 1], frostkabo: ["amber", 1] });
    const result = apply(state, { kind: "attack", from: "sulo", to: "frostkabo" });
    expect(result).toEqual({ ok: false, error: "Sulo needs at least 2 armies to attack" });
  });

  it("a penalty ends the attack phase: the mover can only end the turn", () => {
    const state = position({ sulo: ["blue", 2], frostkabo: ["amber", 2], ventflanko: ["blue", 5] });
    // Find a seed whose first three dice lose for the attacker, so the penalty fires through apply.
    for (let seed = 1; seed < 500; seed++) {
      state.rng = { seed, state: seed };
      const result = apply(state, { kind: "attack", from: "sulo", to: "frostkabo" });
      if (result.ok && result.outcome?.endsPhase) {
        expect(result.state.phase).toBe("redeploy");
        expect(apply(result.state, { kind: "attack", from: "ventflanko", to: "frostkabo" })).toEqual({
          ok: false,
          error: "attacks happen in the attack phase",
        });
        return;
      }
    }
    throw new Error("no seed in 1..499 triggered the penalty");
  });

  it("ending the turn passes play to the other player and back; the turn number counts full rounds", () => {
    let state = position({ sulo: ["blue", 2] });
    const end = () => {
      const r = apply(state, { kind: "endTurn" });
      if (!r.ok) throw new Error(r.error);
      state = r.state;
    };
    expect([state.currentPlayer, state.turnNumber]).toEqual([0, 1]);
    end();
    expect([state.currentPlayer, state.turnNumber, state.phase]).toEqual([1, 1, "attack"]);
    end();
    expect([state.currentPlayer, state.turnNumber]).toEqual([0, 2]);
  });

  it("taking the last enemy province wins the game and nothing more is accepted", () => {
    const holdings: Record<string, [string, number]> = {};
    const base = position({});
    for (const p of base.map.provinces) holdings[p.id] = ["blue", 1];
    holdings["sulo"] = ["blue", 4];
    holdings["longa_strando"] = ["amber", 1];
    const state = position(holdings);
    let won = false;
    for (let seed = 1; seed < 200 && !won; seed++) {
      state.rng = { seed, state: seed };
      const r = apply(state, { kind: "attack", from: "sulo", to: "longa_strando" });
      if (r.ok && r.outcome?.captured) {
        won = true;
        expect(r.state.phase).toBe("finished");
        expect(r.state.winner).toBe("blue");
        expect(r.state.players.find((p) => p.id === "amber")?.eliminated).toBe(true);
        expect(apply(r.state, { kind: "endTurn" })).toEqual({ ok: false, error: "the game is over" });
      }
    }
    expect(won).toBe(true);
  });
});
