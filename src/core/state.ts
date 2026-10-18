import { initializeCards } from './cards';
import { DeterministicRng } from "./rng";
import { reinforcementIncome } from "./reinforcement";
import type { GameMap, GameState, Player, RuleSet } from "./types";
import type { GameOptions } from "./options";
import { defaultOptions } from "./options";

/** The generated-game combat preset, per C-CMB-01..11 and C-OWN-01. */
export function malpacoRules(): RuleSet {
  const classic = classicRules();
  return {
    ...classic,
    id: "malpaco",
    turnSequence: "reinforcement",
    combat: {
      ...classic.combat,
      attackRule: "classic", // C-CMB-02: no defender-strength gate.
      minArmiesToAttack: 2, // C-CMB-01, C-CMB-03: one minimum for every seat.
      attackerDice: { max: 1, minus: 1 }, // C-CMB-04: one six-sided die per exchange.
      defenderDice: { max: 1, minus: 0 }, // C-CMB-04: one six-sided die per exchange.
      ties: "reroll", // C-CMB-05: reroll ties until unequal.
      failurePenalty: "none", // C-CMB-09: a one-army attacker keeps its country.
      capture: "all", // C-OWN-01: move in all but one, without clipping.
    },
  };
}

/**
 * Opt-in C-OWN-01 move-in choice and end-of-turn conquest (core-rules.md,
 * pinned ae298e37, Ownership change / Victory). Legacy presets stay stable.
 */
export function captureChoiceRules(): RuleSet {
  const rules = malpacoRules();
  return { ...rules, id: "malpaco-capture-choice", combat: { ...rules.combat, capture: "choice" } };
}

/** Pinned core-rules.md Movement, ae298e37: one adjacent move ending the turn. */
export function friendlyMoveRules(): RuleSet {
  return { ...captureChoiceRules(), id: "malpaco-friendly-move", movement: "adjacent" };
}

/** Pinned core-rules.md Victory / The turn, ae298e37; options use the setup vocabulary. */
export function victoryRules(options: Pick<GameOptions, "dominationWin" | "roundLimit"> = defaultOptions()): RuleSet {
  return { ...friendlyMoveRules(), id: "malpaco-victory",
    victoryOptions: { dominationWin: options.dominationWin, roundLimit: options.roundLimit } };
}

/** Frozen T37 deck-only stage; later stages must retain this factory's semantics. */
export function cardsRules(options: Pick<GameOptions,"dominationWin"|"roundLimit"> = defaultOptions()):RuleSet {
 return {...victoryRules(options),id:'malpaco-cards',cards:'deck-v1'};
}

/** Classic combat remains available to the legacy spike entry points. */
export function classicRules(): RuleSet {
  return {
    id: "classic",
    turnSequence: "classic",
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
    ...(state.cards ? {cards:{drawPile:[...state.cards.drawPile],discardPile:[...state.cards.discardPile],hands:Object.fromEntries(Object.entries(state.cards.hands).map(([p,h])=>[p,[...h]])),...(state.cards.pendingDiscard?{pendingDiscard:{...state.cards.pendingDiscard}}:{})}} : {}),
    map: state.map,
    rules: state.rules,
    players: state.players.map((p) => ({ ...p })),
    ownerOf: { ...state.ownerOf },
    armies: { ...state.armies },
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    ...(state.pendingCapture ? { pendingCapture: { ...state.pendingCapture } } : {}),
    reinforcementPool: state.reinforcementPool,
    turnNumber: state.turnNumber,
    ...(state.roundOrigin !== undefined ? { roundOrigin: state.roundOrigin } : {}),
    ...(state.watchingComputers !== undefined ? { watchingComputers: state.watchingComputers } : {}),
    ...(state.result ? { result: { ...state.result, standings: state.result.standings.map(row => ({ ...row })) } } : {}),
    capturedThisTurn: state.capturedThisTurn,
    rng: { ...state.rng },
    computerRngs: Object.fromEntries(Object.entries(state.computerRngs).map(([k, v]) => [k, { ...v }])),
    log: [...state.log],
    history: [...state.history],
    winner: state.winner,
    productionCentres: [...(state.productionCentres ?? [])],
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
 *
 * Two overloads: `newGame(map, rules, players, seed)` (the spike's
 * four-argument form) and `newGame(map, rules, options)` (C-SET-01: the
 * new-game entry point takes a full GameOptions record and uses its
 * `seed`).
 */
export function newGame(map: GameMap, rules: RuleSet, options: GameOptions): GameState;
export function newGame(map: GameMap, rules: RuleSet, players: readonly Player[], seed: number): GameState;
export function newGame(
  map: GameMap,
  rules: RuleSet,
  playersOrOptions: readonly Player[] | GameOptions,
  seed?: number,
): GameState {
  if (isPlayerList(playersOrOptions)) {
    return newGameWithPlayers(map, rules, playersOrOptions, seed ?? 0);
  }
  return newGameFromOptions(map, rules, playersOrOptions, playersOrOptions.seed);
}

/** Type guard for the array branch of the newGame overload. */
function isPlayerList(value: readonly Player[] | GameOptions): value is readonly Player[] {
  return Array.isArray(value);
}

/**
 * Internal implementation: take a pre-built Player list and a seed, do the
 * spike's deal. Not exported.
 */
function newGameWithPlayers(map: GameMap, rules: RuleSet, playerList: readonly Player[], seed: number): GameState {
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

  const state: GameState = {
    map,
    rules,
    players,
    ownerOf: ownerOfMap,
    armies,
    currentPlayer: 0,
    phase: rules.cards === "trade-v1" ? "cards" : rules.turnSequence === "reinforcement" ? "reinforce" : "attack",
    reinforcementPool: 0,
    turnNumber: 1,
    ...(rules.victoryOptions ? { roundOrigin: 0 } : {}),
    capturedThisTurn: false,
    rng: rng.snapshot(),
    computerRngs,
    log: [{ event: "game_started", seed, players: players.length }],
    history: [],
    winner: "",
    productionCentres: [],
  };
  initializeCards(state,rng);
  if (rules.turnSequence === "reinforcement") {
    const active = state.players[state.currentPlayer]!;
    state.reinforcementPool = reinforcementIncome(state, active.id).total;
  }
  return state;
}

/**
 * Build a Player list from the seat specs and computerStrengths in
 * GameOptions, then call newGameWithPlayers. The default name is "Seat N"
 * with the seat number; the id is the player colour (T52 sets the colour
 * palette). Each computer seat is given its difficulty from
 * options.computerStrengths, in seat order; humans have no difficulty.
 */
export function newGameFromOptions(map: GameMap, rules: RuleSet, options: GameOptions, seed: number): GameState {
  let computerIdx = 0;
  const playerList: Player[] = options.seats.map((seat, idx) => {
    if (seat.kind === "computer") {
      const difficulty = options.computerStrengths[computerIdx++];
      if (difficulty === undefined) {
        throw new Error(`computerStrengths missing entry for seat ${idx + 1}`);
      }
      return {
        id: `seat${idx + 1}`,
        name: `Seat ${idx + 1}`,
        kind: "computer",
        difficulty,
        eliminated: false,
      };
    }
    return {
      id: `seat${idx + 1}`,
      name: `Seat ${idx + 1}`,
      kind: "human",
      eliminated: false,
    };
  });
  return newGameWithPlayers(map, rules, playerList, seed);
}

/** [designed] T38 stage; T23 variety-029..035. deck-v1 remains frozen. */
export function tradeCardsRules(options:Pick<GameOptions,'dominationWin'|'roundLimit'>=defaultOptions()):RuleSet {
 return {...cardsRules(options),id:'malpaco-card-trades',cards:'trade-v1'};
}
