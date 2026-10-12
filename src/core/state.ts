import { DeterministicRng } from "./rng";
import type { GameMap, GameState, Player, RuleSet } from "./types";
import type { GameOptions } from "./options";

/** The Classic preset, restricted to the blocks the slice reads (core/rules/rule_set.gd). */
export function classicRules(): RuleSet {
  return {
    id: "classic",
    setup: { startingArmies: 1, distributionPool: 10, shortStackBonus: 1 },
    combat: {
      attackRule: "match",
      attackRatio: 1.0,
      minArmiesToAttack: 2,
      attackerDice: { max: 3, minus: 1 },
      defenderDice: { max: 2, minus: 0 },
      ties: "defender",
      failurePenalty: "loseProvince",
      capture: "diceCount",
    },
    victory: ["conquest"],
  };
}

export function activePlayer(state: GameState): Player | undefined {
  return state.players[state.currentPlayer];
}

export function ownerOf(state: GameState, provinceId: string): string {
  return state.ownerOf[provinceId] ?? "";
}

export function armyCount(state: GameState, provinceId: string): number {
  return state.armies[provinceId] ?? 0;
}

export function provincesOf(state: GameState, playerId: string): string[] {
  return state.map.provinces.filter((p) => ownerOf(state, p.id) === playerId).map((p) => p.id);
}

export function armyTotal(state: GameState, playerId: string): number {
  return provincesOf(state, playerId).reduce((sum, id) => sum + armyCount(state, id), 0);
}

export function livingPlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.eliminated);
}

/** A deep copy, so applying an action never touches the state it was given. The map and rules are shared. */
export function cloneState(state: GameState): GameState {
  return {
    map: state.map,
    rules: state.rules,
    players: state.players.map((p) => ({ ...p })),
    ownerOf: { ...state.ownerOf },
    armies: { ...state.armies },
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    turnNumber: state.turnNumber,
    capturedThisTurn: state.capturedThisTurn,
    rng: { ...state.rng },
    computerRngs: Object.fromEntries(Object.entries(state.computerRngs).map(([k, v]) => [k, { ...v }])),
    log: [...state.log],
    history: [...state.history],
    winner: state.winner,
  };
}

/**
 * Deals a new game, ported from core/rules/game_setup.gd: a round-robin deal
 * from a shuffled order, one starting army each, then each player's opening
 * pool (with the short-stack bonus).
 *
 * SPIKE STAND-IN: Godot has players place the pool by hand, one army at a
 * time. The slice has no placement UI, so the pool is spread on the player's
 * own provinces by the seeded RNG. The deal and the pool sizes are as in
 * core/; only who chooses the provinces differs. Centres, reinforcements and
 * hazards are not ported.
 */
export function newGame(map: GameMap, rules: RuleSet, playerList: readonly Player[], seed: number): GameState {
  const rng = new DeterministicRng(seed);
  const players = playerList.map((p) => ({ ...p, kind: p.kind ?? "human" }));
  const ownerOfMap: Record<string, string> = {};
  const armies: Record<string, number> = {};

  const ids = rng.shuffled(map.provinces.map((p) => p.id));
  ids.forEach((id, seat) => {
    const holder = players[seat % players.length] as Player;
    ownerOfMap[id] = holder.id;
    armies[id] = rules.setup.startingArmies;
  });

  const holdings = (playerId: string) => map.provinces.map((p) => p.id).filter((id) => ownerOfMap[id] === playerId);
  const most = Math.max(...players.map((p) => holdings(p.id).length));
  for (const player of players) {
    const mine = holdings(player.id);
    const bonus = most - mine.length > 0 ? rules.setup.shortStackBonus : 0;
    const pool = rules.setup.distributionPool + bonus;
    for (let i = 0; i < pool; i++) {
      const pick = mine[rng.nextInt(0, mine.length - 1)] as string;
      armies[pick] = (armies[pick] ?? 0) + 1;
    }
  }

  // Per-seat computer streams, seeded from the game seed and the seat number
  // (C-RND-03). The computer opponent draws from these; the rules never do.
  const computerRngs: Record<string, { seed: number; state: number }> = {};
  players.forEach((player, idx) => {
    if (player.kind === "computer") {
      const child = DeterministicRng.subStream(seed, idx);
      computerRngs[player.id] = child.snapshot();
    }
  });

  return {
    map,
    rules,
    players,
    ownerOf: ownerOfMap,
    armies,
    currentPlayer: 0,
    phase: "attack",
    turnNumber: 1,
    capturedThisTurn: false,
    rng: rng.snapshot(),
    computerRngs,
    log: [{ event: "game_started", seed, players: players.length }],
    history: [],
    winner: "",
  };
}

/**
 * Build a Player list from the seat specs in GameOptions, then call newGame.
 * The default name is "Seat N" with the seat number; the id is the player
 * colour (T52 sets the colour palette). Each seat becomes a Player with the
 * right kind and difficulty.
 */
export function newGameFromOptions(map: GameMap, rules: RuleSet, options: GameOptions, seed: number): GameState {
  const playerList: Player[] = options.seats.map((seat, idx) => ({
    id: `seat${idx + 1}`,
    name: `Seat ${idx + 1}`,
    kind: seat.kind,
    ...(seat.kind === "computer" ? { difficulty: seat.difficulty } : {}),
    eliminated: false,
  }));
  return newGame(map, rules, playerList, seed);
}
