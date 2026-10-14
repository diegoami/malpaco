import { describe, expect, it } from "vitest";
import * as core from "../../src/core";
import { countryShares, createGameWithRng, repairCompleteIslands } from "../../src/core/setup";
import { smallSea } from "./helpers";
import type { GameMap, Player } from "../../src/core";
import { generateBoard, generateBoardWithRng } from "../../src/core/board-gen";

const computeOptions = (seed: number, n: number, kinds: ("human" | "computer")[], humanShare = 0, range: core.StartingArmiesRange = "1-3"): core.GameOptions => ({
  ...core.defaultOptions(), seed, startingArmiesRange: range, humanShare,
  seats: kinds.map((kind) => ({ kind })),
  computerStrengths: kinds.filter((kind) => kind === "computer").map(() => "Normal"),
});

function gameAtSeat(n: number, first: number): core.GameState {
  for (let seed = 1; seed < 1000; seed++) {
    const options = computeOptions(seed, n, Array.from({ length: n }, () => "computer"));
    const result = core.createGame(options);
    if (result.ok && result.state.currentPlayer === first) return result.state;
  }
  throw new Error(`no seed found for ${n} seats, first ${first}`);
}

function complete(map: GameMap, owners: Record<string, string>): Map<string, string> {
  return new Map(map.islands.flatMap((island) => {
    const owner = owners[island.provinces[0]!];
    return owner && island.provinces.every((id) => owners[id] === owner) ? [[island.id, owner] as const] : [];
  }));
}

function simple46(): GameMap {
  const provinces = Array.from({ length: 46 }, (_, i) => ({ id: `p${i}`, name: `p${i}`, island: "i", borders: [], seaLanes: [], polygon: [], labelAt: [0, 0] as const }));
  return {
    id: "scripted", name: "scripted", bounds: { x: 0, y: 0, width: 1, height: 1 }, provinces,
    islands: [{ id: "i", name: "i", bonus: 0, provinces: provinces.map((p) => p.id) }],
  };
}

class ScriptedRng extends core.DeterministicRng {
  calls = 0;
  override nextInt(from: number, to: number): number {
    this.calls++;
    if (this.calls >= 47 && this.calls <= 92) return to; // army spread draws
    return from; // seat, country shuffle, and centre shuffle
  }
}

describe("generated initial deal", () => {
  it.each([
    [2, [23, 23]], [3, [15, 15, 16]], [4, [11, 11, 12, 12]],
  ] as const)("rotates exact remainder shares for %i seats", (n, expected) => {
    for (let first = 0; first < n; first++) {
      const state = gameAtSeat(n, first);
      const order = Array.from({ length: n }, (_, i) => (first + i) % n);
      expect(order.map((seat) => core.provincesOf(state, state.players[seat]!.id).length)).toEqual(expected);
    }
  });

  it("applies human shares in turn order with stable ties, floor, and exclusions", () => {
    const players = (kinds: ("human" | "computer")[]): Player[] => kinds.map((kind, i) => ({ id: `p${i}`, name: `p${i}`, kind, eliminated: false }));
    expect(countryShares(players(["human", "computer", "computer", "computer"]), [0, 1, 2, 3], 1)).toEqual([12, 11, 12, 11]);
    expect(countryShares(players(["human", "computer", "computer", "computer"]), [0, 1, 2, 3], -1)).toEqual([10, 12, 12, 12]);
    expect(countryShares(players(["human", "human", "computer", "computer"]), [0, 1, 2, 3], 1)).toEqual([12, 12, 11, 11]);
    expect(countryShares(players(["human", "human", "computer", "computer"]), [0, 1, 2, 3], -1)).toEqual([10, 10, 13, 13]);
    expect(countryShares(players(["human", "human", "human", "computer"]), [0, 1, 2, 3], 4)).toEqual([15, 15, 13, 3]);
    expect(countryShares(players(["human", "human", "human"]), [2, 0, 1], 4)).toEqual([15, 16, 15]);
    expect(countryShares(players(["computer", "computer", "computer", "computer"]), [2, 0, 1, 3], 4)).toEqual([11, 12, 11, 12]);
  });

  it("repairs a forced complete island without changing shares or completing another island", () => {
    const map = smallSea();
    const owners: Record<string, string> = {};
    for (const [i, province] of map.provinces.entries()) owners[province.id] = i % 2 ? "b" : "a";
    const [target, ...rest] = map.islands;
    for (const id of target!.provinces) owners[id] = "a";
    const beforeCounts = ["a", "b"].map((owner) => Object.values(owners).filter((v) => v === owner).length);
    const before = complete(map, owners);
    expect(before.has(target!.id)).toBe(true);
    expect(repairCompleteIslands(map, owners, new core.DeterministicRng(99))).toEqual({ ok: true });
    expect(complete(map, owners).size).toBe(0);
    expect(["a", "b"].map((owner) => Object.values(owners).filter((v) => v === owner).length)).toEqual(beforeCounts);
    for (const island of rest) expect(complete(map, owners).has(island.id)).toBe(false);
  });

  it("returns an explicit failure when no owner swap can repair an island", () => {
    const map = { provinces: [{ id: "only", island: "i" }], islands: [{ id: "i", provinces: ["only"] }] } as unknown as GameMap;
    expect(repairCompleteIslands(map, { only: "a" }, new core.DeterministicRng(1))).toMatchObject({ ok: false, error: expect.stringContaining("unable to repair") });
  });

  it("assigns every country once with no complete islands across seeds 1..100", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const result = core.createGame({ ...core.defaultOptions(), seed });
      expect(result.ok, `seed ${seed}: ${result.ok ? "" : result.errors.join("; ")}`).toBe(true);
      if (!result.ok) continue;
      expect(Object.keys(result.state.ownerOf)).toHaveLength(46);
      expect(new Set(Object.keys(result.state.ownerOf)).size).toBe(46);
      expect(complete(result.state.map, result.state.ownerOf).size).toBe(0);
    }
  });

  it.each([["1-2", 2], ["1-3", 3], ["1-4", 4]] as const)("distributes integer armies in 1..%i range and exact midpoint totals", (range, top) => {
    const result = core.createGame(computeOptions(313, 4, ["human", "computer", "computer", "computer"], 0, range));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const state = result.state;
    for (const id of Object.keys(state.ownerOf)) expect(Number.isInteger(state.armies[id]) && state.armies[id]! >= 1 && state.armies[id]! <= top).toBe(true);
    for (const player of state.players) {
      const count = core.provincesOf(state, player.id).length;
      expect(core.armyTotal(state, player.id)).toBe(Math.floor((1 + top) * count / 2));
    }
  });

  it("makes deterministic complete states while varying first seats across seeds", () => {
    const options = computeOptions(711, 4, ["human", "computer", "computer", "computer"]);
    expect(core.createGame(options)).toEqual(core.createGame(options));
    const starts = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const result = core.createGame({ ...options, seed });
      if (result.ok) starts.add(result.state.players.map((p) => core.provincesOf(result.state, p.id).sort().join(",")).join("|"));
    }
    expect(starts.size).toBeGreaterThanOrEqual(5);
  });

  it("selects three distinct valid centres and clones their array independently", () => {
    const result = core.createGame({ ...core.defaultOptions(), seed: 53 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const state = result.state;
    expect(state.productionCentres).toHaveLength(3);
    expect(new Set(state.productionCentres).size).toBe(3);
    for (const id of state.productionCentres) expect(state.map.provinces.some((p) => p.id === id)).toBe(true);
    const clone = core.cloneState(state);
    clone.productionCentres.push("mutation");
    expect(state.productionCentres).not.toContain("mutation");
  });

  it("uses scripted draws for centres after armies, without owner or island filtering", () => {
    const rng = new ScriptedRng(1);
    const result = createGameWithRng(computeOptions(1, 2, ["computer", "computer"]), rng, () => ({ ok: true, map: simple46() }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(rng.calls).toBe(137); // 1 first-seat + 45 deal shuffle + 46 army + 45 centre draws
    expect(result.state.productionCentres).toEqual(["p2", "p3", "p4"]);
    expect(new Set(result.state.productionCentres.map((id) => result.state.ownerOf[id])).size).toBe(1);
    expect(new Set(result.state.productionCentres.map((id) => result.state.map.provinces.find((p) => p.id === id)!.island)).size).toBe(1);
  });

  it("continues one game stream through board retry and resumes the stored next draw", () => {
    const options = computeOptions(97, 4, ["human", "computer", "computer", "computer"]);
    const knownGood = generateBoard(options.seed);
    expect(knownGood.ok).toBe(true);
    if (!knownGood.ok) return;
    const gameRng = new core.DeterministicRng(options.seed);
    const seen: core.DeterministicRng[] = [];
    let calls = 0;
    const builder = (rng: core.DeterministicRng) => generateBoardWithRng(rng, {
      attempts: 2,
      body: (shared) => {
        seen.push(shared);
        if (calls++ === 0) {
          shared.nextInt(0, 0xffffffff);
          return { ok: false, errors: ["forced retry"] };
        }
        return { ok: true, map: knownGood.map };
      },
      fairnessCheck: () => [],
    });
    const result = createGameWithRng(options, gameRng, builder);
    expect(result.ok).toBe(true);
    expect(seen).toEqual([gameRng, gameRng]);
    if (!result.ok) return;
    const continuation = core.DeterministicRng.fromSnapshot(result.state.rng);
    expect(result.state.rng).toEqual(gameRng.snapshot());
    expect(continuation.nextInt(0, 0xffffffff)).toBe(gameRng.nextInt(0, 0xffffffff));
  });

  it("keeps computer streams derived from the seed without changing game draws", () => {
    const computers = core.createGame(computeOptions(321, 4, ["computer", "computer", "computer", "computer"]));
    const humans = core.createGame(computeOptions(321, 4, ["human", "human", "human", "human"]));
    expect(computers.ok && humans.ok).toBe(true);
    if (!computers.ok || !humans.ok) return;
    expect(computers.state.rng).toEqual(humans.state.rng);
    for (let seat = 0; seat < 4; seat++) {
      expect(computers.state.computerRngs[`seat${seat + 1}`]).toEqual(core.DeterministicRng.subStream(321, seat).snapshot());
    }
  });

  it("returns board exhaustion as failure without a partial state", () => {
    const result = createGameWithRng(computeOptions(3, 2, ["human", "computer"]), new core.DeterministicRng(3), () => ({ ok: false, errors: ["exhausted"] }));
    expect(result).toEqual({ ok: false, errors: ["exhausted"] });
    expect("state" in result).toBe(false);
  });

  it("leaves invalid option validation as OptionsError", () => {
    expect(() => core.createGame({ ...core.defaultOptions(), seed: -1 } as core.GameOptions)).toThrow(core.OptionsError);
  });
});
