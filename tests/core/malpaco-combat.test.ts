import { describe, expect, it } from "vitest";
import * as core from "../../src/core";
import type { RuleSet } from "../../src/core";
import { position, ScriptedDice } from "./helpers";

function preset(): RuleSet {
  const factory = (core as unknown as { malpacoRules?: () => RuleSet }).malpacoRules;
  expect(factory, "T08 malpaco preset").toBeTypeOf("function");
  return factory!();
}

function battle(armies = 4, defenders = 3, seed = 7) {
  const state = position({ sulo: ["blue", armies], frostkabo: ["amber", defenders] }, preset(), seed);
  state.rng = new core.DeterministicRng(seed).snapshot();
  state.productionCentres = ["sulo", "frostkabo", "longa_strando"];
  return state;
}

const attack = { kind: "attack", from: "sulo", to: "frostkabo" } as const;

describe("T08 shared combat acceptance", () => {
  it("uses malpaco rules for generated games while retaining explicit and legacy Classic rules", () => {
    const rules = preset();
    const generated = core.createGame({ ...core.defaultOptions(), seed: 7 });
    expect(generated.ok).toBe(true);
    if (generated.ok) expect(generated.state.rules).toEqual(rules);
    const classic = core.classicRules();
    const custom = core.createGame({ ...core.defaultOptions(), seed: 7 }, classic);
    expect(custom.ok).toBe(true);
    if (custom.ok) expect(custom.state.rules).toEqual(classic);
    const legacy = position({ sulo: ["blue", 2], frostkabo: ["amber", 2000] }, classic);
    expect(core.whyNot(legacy, "sulo", "frostkabo")).not.toBe("");
    expect(legacy.rules.combat.failurePenalty).toBe("loseProvince");
  });

  it.each(["unowned", "missing"])("refuses an %s source through apply", (kind) => {
    const state = battle();
    if (kind === "unowned") state.ownerOf.sulo = "amber";
    const action = { ...attack, from: kind === "missing" ? "absent" : "sulo" };
    expect(core.apply(state, action).ok).toBe(false);
  });

  it.each(["friendly", "missing"])("refuses a %s target through apply", (kind) => {
    const state = battle();
    if (kind === "friendly") state.ownerOf.frostkabo = "blue";
    expect(core.apply(state, { ...attack, to: kind === "missing" ? "absent" : "frostkabo" }).ok).toBe(false);
  });

  it("refuses a non-neighbour through apply", () => {
    const state = battle();
    const source = core.province(state.map, "sulo")!;
    const remote = state.map.provinces.find(p => p.id !== source.id && !core.neighbours(source).includes(p.id))!;
    expect(remote).toBeDefined();
    state.ownerOf[remote.id] = "amber";
    expect(core.apply(state, { ...attack, to: remote.id }).ok).toBe(false);
  });

  it.each(["redeploy", "finished"] as const)("refuses an attack in the %s phase", phase => {
    const state = battle();
    state.phase = phase;
    expect(core.apply(state, attack).ok).toBe(false);
    expect(core.attackTargets(state, "sulo")).toEqual([]);
  });

  it("allows two armies against 2000 and refuses a one-army source", () => {
    const state = battle(2, 2000);
    expect(core.whyNot(state, "sulo", "frostkabo")).toBe("");
    expect(core.apply(state, attack).ok).toBe(true);
    state.armies.sulo = 1;
    expect(core.apply(state, attack).ok).toBe(false);
  });

  it("gives human and Easy, Normal, Hard computer seats identical combat results", () => {
    const configurations = [["human", undefined], ["computer", "Easy"], ["computer", "Normal"], ["computer", "Hard"]] as const;
    const results = configurations.map(([kind, difficulty]) => {
      const state = battle(2, 2000, 19);
      state.players[0] = { ...state.players[0]!, kind, difficulty };
      const result = core.apply(state, attack);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error);
      return { outcome: result.outcome, armies: result.state.armies, owners: result.state.ownerOf, phase: result.state.phase, rng: result.state.rng };
    });
    for (const result of results) expect(result).toEqual(results[0]);
  });

  it("reports unresolved reroll ties without assigning either side a win", () => {
    expect(core.pairResults("reroll", [3], [3])).toEqual(["tie"]);
  });

  it("rerolls repeated ties before a single decisive exchange", () => {
    const state = battle();
    const dice = new ScriptedDice([3, 3, 6, 6, 5, 1]);
    const outcome = core.resolve(state, "sulo", "frostkabo", dice);
    expect(dice.asked).toEqual([6, 6, 6, 6, 6, 6]);
    expect(dice.unused).toBe(0);
    expect(outcome).toMatchObject({ attackerRolls: [5], defenderRolls: [1], attackerLosses: 0, defenderLosses: 1, penalty: false, endsPhase: false });
    expect(state.armies.sulo).toBe(4);
    expect(state.armies.frostkabo).toBe(2);
  });

  it("loses exactly one attacking army without forfeiting the country or phase", () => {
    const state = battle(2, 3);
    const outcome = core.resolve(state, "sulo", "frostkabo", new ScriptedDice([1, 6]));
    expect(outcome).toMatchObject({ attackerLosses: 1, defenderLosses: 0, penalty: false, endsPhase: false });
    expect(state.ownerOf.sulo).toBe("blue");
    expect(state.armies.sulo).toBe(1);
    expect(state.phase).toBe("attack");
    let exercised = false;
    for (let seed = 0; seed < 100; seed++) {
      const result = core.apply(battle(2, 3, seed), attack);
      if (result.ok && result.outcome?.attackerLosses === 1) {
        expect(result.state.ownerOf.sulo).toBe("blue");
        expect(result.state.armies.sulo).toBe(1);
        expect(result.state.phase).toBe("attack");
        exercised = true;
        break;
      }
    }
    expect(exercised).toBe(true);
  });

  it("captures with all but one, conserves large armies, and preserves centres", () => {
    const state = battle(5001, 1);
    const centres = [...state.productionCentres];
    const total = state.armies.sulo! + state.armies.frostkabo!;
    const outcome = core.resolve(state, "sulo", "frostkabo", new ScriptedDice([6, 1]));
    expect(outcome).toMatchObject({ captured: true, moved: 5000, attackerLosses: 0, defenderLosses: 1 });
    expect(state.armies.sulo).toBe(1);
    expect(state.armies.frostkabo).toBe(5000);
    expect(state.armies.sulo! + state.armies.frostkabo!).toBe(total - 1);
    expect(state.ownerOf.frostkabo).toBe("blue");
    expect(state.productionCentres).toEqual(centres);
  });

  it("reproduces seeded exchanges, resumes after ties, preserves input and computer streams", () => {
    let seed = -1;
    for (let candidate = 0; candidate < 1000; candidate++) {
      const probe = new core.DeterministicRng(candidate);
      if (probe.rollDie(6) === probe.rollDie(6)) { seed = candidate; break; }
    }
    expect(seed).toBeGreaterThanOrEqual(0);
    const state = battle(4, 3, seed);
    state.players[0] = { ...state.players[0]!, kind: "computer", difficulty: "Hard" };
    state.computerRngs.blue = core.DeterministicRng.subStream(seed, 0).snapshot();
    const original = core.cloneState(state);
    const reference = core.DeterministicRng.fromSnapshot(state.rng);
    let a: number, d: number;
    do { a = reference.rollDie(6); d = reference.rollDie(6); } while (a === d);
    const expectedSnapshot = reference.snapshot();
    const first = core.apply(state, attack);
    const second = core.apply(state, attack);
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error);
    expect(first.state.rng).toEqual(expectedSnapshot);
    expect(core.DeterministicRng.fromSnapshot(first.state.rng).rollDie(6)).toBe(reference.rollDie(6));
    expect(first.outcome).toMatchObject({ attackerRolls: [a!], defenderRolls: [d!] });
    expect(first.state.computerRngs).toEqual(original.computerRngs);
    expect(first.state.productionCentres).toEqual(original.productionCentres);
    expect(first.state.productionCentres).not.toBe(state.productionCentres);
    expect(state).toEqual(original);
  });
});
