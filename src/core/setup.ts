import { initializeCards } from './cards';
import { generateBoardWithRng } from "./board-gen";
import type { BoardGenResult } from "./board-gen";
import { DeterministicRng } from "./rng";
import { validateGameOptions } from "./options";
import { malpacoRules } from "./state";
import { reinforcementIncome } from "./reinforcement";
import type { GameOptions } from "./options";
import type { GameMap, GameState, Player, RuleSet } from "./types";

/** C-STA-01..07: the generated deal always covers the design's 46 countries. */
export const DEAL_COUNTRY_COUNT = 46;
/** C-STA-03, decision 6: a computer share cannot be reduced below three. */
export const MIN_COMPUTER_COUNTRIES = 3;
/** C-CEN-01, C-CEN-04: exactly three uniformly drawn production centres. */
export const PRODUCTION_CENTRE_COUNT = 3;

export type CreateGameResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly errors: string[] };

/** Validate options, then generate and deal one complete game on a shared RNG stream. */
export function createGame(options: GameOptions, rules: RuleSet = malpacoRules()): CreateGameResult {
  const validated = validateGameOptions(options);
  return createGameValidated(validated, rules, new DeterministicRng(validated.seed), generateBoardWithRng);
}

/** Internal injection seam for stream and exhaustion acceptance tests. */
export function createGameWithRng(
  options: GameOptions,
  rng: DeterministicRng,
  boardBuilder: (rng: DeterministicRng) => BoardGenResult = generateBoardWithRng,
  rules: RuleSet = malpacoRules(),
  variableBoardSize = false,
): CreateGameResult {
  return createGameValidated(validateGameOptions(options), rules, rng, boardBuilder, variableBoardSize);
}

function createGameValidated(
  validated: GameOptions,
  rules: RuleSet,
  rng: DeterministicRng,
  boardBuilder: (rng: DeterministicRng) => BoardGenResult,
  variableBoardSize = false,
): CreateGameResult {
  const board = boardBuilder(rng);
  if (!board.ok) return { ok: false, errors: [...board.errors] };

  const players = makePlayers(validated);
  const firstSeat = rng.nextInt(0, players.length - 1);
  const order = Array.from({ length: players.length }, (_, i) => (firstSeat + i) % players.length);
  const shares = countryShares(players, order, validated.humanShare, variableBoardSize?board.map.provinces.length:DEAL_COUNTRY_COUNT);
  const ids = rng.shuffled(board.map.provinces.map((province) => province.id));
  const ownerOf: Record<string, string> = {};
  let offset = 0;
  for (const seat of order) {
    for (let i = 0; i < shares[seat]!; i++) ownerOf[ids[offset++]!] = players[seat]!.id;
  }

  const repaired = repairCompleteIslands(board.map, ownerOf, rng);
  if (!repaired.ok) return { ok: false, errors: [repaired.error] };

  const top = validated.startingArmiesRange === "1-2" ? 2 : validated.startingArmiesRange === "1-3" ? 3 : 4;
  const armies: Record<string, number> = {};
  for (const id of ids) armies[id] = 1;
  const equal=rules.startingArmyBudget==='equal-v1',armyRng=equal?DeterministicRng.subStream(validated.seed,113):rng;
  for (const player of players) {
    const holdings = ids.filter((id) => ownerOf[id] === player.id);
    // C-STA-05: multiply before flooring so odd holdings round as specified.
    const budget=Math.floor(ids.length*(1+top)/2),position=order.indexOf(players.indexOf(player));
    const total = equal?Math.floor(budget/players.length)+Number(position<budget%players.length):Math.floor((1 + top) * holdings.length / 2);
    if(total<holdings.length||total>top*holdings.length)return {ok:false,errors:['Equal starting-army budget is infeasible.']};
    const eligible = holdings.slice();
    for (let n = holdings.length; n < total; n++) {
      const candidates = eligible.filter((id) => armies[id]! < top);
      const pick = candidates[armyRng.nextInt(0, candidates.length - 1)]!;
      armies[pick] = armies[pick]! + 1;
    }
  }
  // C-CEN-01, C-CEN-04: uniform sample after ownership repair and army spread.
  const productionCentres = rng.shuffled(ids).slice(0, PRODUCTION_CENTRE_COUNT);
  const computerRngs: Record<string, { seed: number; state: number }> = {};
  players.forEach((player, seat) => {
    if (player.kind === "computer") computerRngs[player.id] = DeterministicRng.subStream(validated.seed, seat).snapshot();
  });

  const state: GameState = {
      ...(rules.events?{events:{sequence:0,cooldown:false}}:{}),
      map: board.map, rules, players, ownerOf, armies, currentPlayer: firstSeat,
      phase: (rules.cards === "trade-v1" || rules.cards === "raid-v1") ? "cards" : rules.turnSequence === "reinforcement" ? "reinforce" : "attack",
      reinforcementPool: 0, turnNumber: 1, capturedThisTurn: false, rng: rng.snapshot(), computerRngs,
      ...(rules.victoryOptions ? { roundOrigin: firstSeat } : {}),
      log: [{ event: "game_started", seed: validated.seed, players: players.length }],
      history: [], winner: "", productionCentres,
  };
  initializeCards(state,rng);
  if (rules.turnSequence === "reinforcement") {
    state.reinforcementPool = reinforcementIncome(state, players[firstSeat]!.id).total;
  }
  return { ok: true, state };
}

function makePlayers(options: GameOptions): Player[] {
  let computer = 0;
  return options.seats.map((seat, index) => {
    const base: Player = {
      id: `seat${index + 1}`, name: `Seat ${index + 1}`, kind: seat.kind, eliminated: false,
    };
    return seat.kind === "computer"
      ? { ...base, difficulty: options.computerStrengths[computer++]! }
      : base;
  });
}

/** Calculate base shares and apply each human adjustment in rotated turn order. */
export function countryShares(players: readonly Player[], order: readonly number[], humanShare: number, countryCount=DEAL_COUNTRY_COUNT): number[] {
  const base = Math.floor(countryCount / players.length);
  const shares = players.map(() => base);
  for (const seat of order.slice(players.length - (countryCount % players.length))) shares[seat]!++;
  const computers = order.filter((seat) => players[seat]!.kind === "computer");
  if (computers.length === 0 || computers.length === players.length || humanShare === 0) return shares;
  for (const human of order.filter((seat) => players[seat]!.kind === "human")) {
    if (humanShare > 0) {
      // C-STA-03, decision 6: largest computer share, later in turn order on ties.
      const source = [...computers].sort((a, b) => shares[b]! - shares[a]! || order.indexOf(b) - order.indexOf(a))[0]!;
      const moved = Math.min(humanShare, Math.max(0, shares[source]! - MIN_COMPUTER_COUNTRIES));
      shares[source]! -= moved;
      shares[human]! += moved;
    } else {
      // C-STA-03, decision 6: smallest computer share, earlier in turn order on ties.
      const target = [...computers].sort((a, b) => shares[a]! - shares[b]! || order.indexOf(a) - order.indexOf(b))[0]!;
      shares[human]! += humanShare;
      shares[target]! -= humanShare;
    }
  }
  return shares;
}

type RepairResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

/** Swap owners without completing an island for either participant; returns failure if stuck. */
export function repairCompleteIslands(map: GameMap, ownerOf: Record<string, string>, rng: DeterministicRng): RepairResult {
  const completeIslands = () => map.islands.filter((island) => {
    const owner = ownerOf[island.provinces[0]!];
    return !!owner && island.provinces.every((id) => ownerOf[id] === owner);
  });
  let complete = completeIslands();
  while (complete.length > 0) {
    const before = new Map(map.islands.flatMap((island) => {
      const owner = ownerOf[island.provinces[0]!];
      return owner && island.provinces.every((id) => ownerOf[id] === owner) ? [[island.id, owner] as const] : [];
    }));
    const eligible: [string, string][] = [];
    const seenPairs = new Set<string>();
    const ids = map.provinces.map((province) => province.id);
    const sources = complete.flatMap((island) => island.provinces);
    for (const from of sources) {
      for (const to of ids) {
        const fromOwner = ownerOf[from]!;
        const toOwner = ownerOf[to]!;
        if (fromOwner === toOwner) continue;
        ownerOf[from] = toOwner;
        ownerOf[to] = fromOwner;
        const createsComplete = map.islands.some((island) => {
          const owner = ownerOf[island.provinces[0]!];
          return !!owner && island.provinces.every((id) => ownerOf[id] === owner) && before.get(island.id) !== owner;
        });
        ownerOf[from] = fromOwner;
        ownerOf[to] = toOwner;
        const key = [from, to].sort().join("\u0000");
        if (!createsComplete && !seenPairs.has(key)) {
          seenPairs.add(key);
          eligible.push([from, to]);
        }
      }
    }
    if (eligible.length === 0) return { ok: false, error: "unable to repair complete islands without completing another island" };
    const [a, b] = eligible[rng.nextInt(0, eligible.length - 1)]!;
    [ownerOf[a], ownerOf[b]] = [ownerOf[b]!, ownerOf[a]!];
    complete = completeIslands();
  }
  return { ok: true };
}
