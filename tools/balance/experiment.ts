import {DeterministicRng} from '../../src/core/rng';
import {reinforcementIncome} from '../../src/core/reinforcement';
import type {GameState} from '../../src/core/types';

export const VARIANTS = ['current', 'deal', 'bonus', 'both'] as const;
export type Variant = typeof VARIANTS[number];
/** [designed] T105 diagnostic protocol, frozen on #273 before measurement.
 * Searched setup/geographic-board/bonuses/reinforcement and T102. These are
 * experimental state transforms, never production constructors or identities.
 */
export const PROTOCOL = {
  version: 1, dealerSalt: 105, actionCap: 20_000, roundCap: 100,
  bonus: 'max(1, floor(original bonus / 2))',
  deal: 'original country shares; island-seat cap ceil(size / seats); equal total armies',
  round5: 'start of round 5, before first move; eliminated seats zero; early finishes separate',
} as const;

/** Exact integral max flow: islands supply countries, seats demand original shares. */
function allocation(sizes: number[], shares: number[], rng: DeterministicRng): number[][] {
  const n = sizes.length, m = shares.length, sink = n + m + 1, count = sink + 1;
  const capacity = Array.from({length: count}, () => Array<number>(count).fill(0));
  const adjacency = Array.from({length: count}, () => [] as number[]);
  const edge = (a: number, b: number, cap: number) => {
    capacity[a]![b] = cap; adjacency[a]!.push(b); adjacency[b]!.push(a);
  };
  for (const i of rng.shuffled(sizes.map((_, i) => i))) {
    edge(0, i + 1, sizes[i]!);
    for (const p of rng.shuffled(shares.map((_, p) => p))) edge(i + 1, n + p + 1, Math.ceil(sizes[i]! / m));
  }
  for (let p = 0; p < m; p++) edge(n + p + 1, sink, shares[p]!);
  let total = 0;
  while (true) {
    const parent = Array<number>(count).fill(-1), queue = [0]; parent[0] = 0;
    for (let q = 0; q < queue.length && parent[sink] === -1; q++) {
      const a = queue[q]!;
      for (const b of adjacency[a]!) if (parent[b] === -1 && capacity[a]![b]! > 0) {
        parent[b] = a; queue.push(b);
      }
    }
    if (parent[sink] === -1) break;
    let amount = Number.MAX_SAFE_INTEGER;
    for (let b = sink; b !== 0; b = parent[b]!) amount = Math.min(amount, capacity[parent[b]!]![b]!);
    for (let b = sink; b !== 0; b = parent[b]!) {
      const a = parent[b]!; capacity[a]![b]! -= amount; capacity[b]![a]! += amount;
    }
    total += amount;
  }
  if (total !== shares.reduce((a, b) => a + b, 0)) throw new Error('Experimental balanced allocation is infeasible');
  return sizes.map((size, i) => shares.map((_, p) => Math.ceil(size / m) - capacity[i + 1]![n + p + 1]!));
}

export function candidate(initial: GameState, variant: Variant): GameState {
  if (!VARIANTS.includes(variant)) throw new Error('Unknown variant');
  let state = structuredClone(initial);
  if (variant === 'deal' || variant === 'both') {
    const rng = DeterministicRng.subStream(initial.rng.seed, PROTOCOL.dealerSalt);
    const players = state.players, n = players.length;
    const shares = players.map(p => state.map.provinces.filter(c => state.ownerOf[c.id] === p.id).length);
    const counts = allocation(state.map.islands.map(i => i.provinces.length), shares, rng);
    state.map.islands.forEach((island, i) => {
      const ids = rng.shuffled(island.provinces); let at = 0;
      for (const p of rng.shuffled(players.map((_, p) => p))) {
        for (let k = 0; k < counts[i]![p]!; k++) state.ownerOf[ids[at++]!] = players[p]!.id;
      }
      if (at !== ids.length) throw new Error('Allocation did not cover island');
    });
    const total = Object.values(initial.armies).reduce((a, b) => a + b, 0);
    // Initial fixtures use the default 1–3 range; refuse incompatible inputs.
    if (Object.values(initial.armies).some(a => a < 1 || a > 3)) throw new Error('Expected default 1–3 initial armies');
    for (const province of state.map.provinces) state.armies[province.id] = 1;
    for (let seat = 0; seat < n; seat++) {
      const p = (state.currentPlayer + seat) % n;
      const ids = state.map.provinces.filter(c => state.ownerOf[c.id] === players[p]!.id).map(c => c.id);
      const target = Math.floor(total / n) + Number(seat < total % n);
      if (target < ids.length || target > 3 * ids.length) throw new Error('Army target infeasible');
      for (let k = ids.length; k < target; k++) {
        const eligible = ids.filter(id => state.armies[id]! < 3);
        state.armies[eligible[rng.nextInt(0, eligible.length - 1)]!]!++;
      }
    }
  }
  if (variant === 'bonus' || variant === 'both') {
    state = {...state, map: {...state.map, islands: state.map.islands.map(i => ({...i, bonus: Math.max(1, Math.floor(i.bonus / 2))}))}};
  }
  state.reinforcementPool = reinforcementIncome(state, state.players[state.currentPlayer]!.id).total;
  return state;
}

export function dealMetrics(state: GameState) {
  return state.players.map(p => {
    const own = state.map.provinces.filter(c => state.ownerOf[c.id] === p.id);
    return {
      seat: p.id, countries: own.length, armies: own.reduce((n, c) => n + state.armies[c.id]!, 0),
      islandsTouched: state.map.islands.filter(i => i.provinces.some(id => state.ownerOf[id] === p.id)).length,
      enemyBorders: own.reduce((n, c) => n + [...c.borders, ...c.seaLanes].filter(id => state.ownerOf[id] !== p.id).length, 0),
      capViolations: state.map.islands.filter(i => i.provinces.filter(id => state.ownerOf[id] === p.id).length > Math.ceil(i.provinces.length / state.players.length)).map(i => i.id),
    };
  });
}
export type DealMetrics = ReturnType<typeof dealMetrics>;
export function incomes(state: GameState) {
  return state.players.map(p => ({seat: p.id, eliminated: p.eliminated,
    ...(p.eliminated ? {base: 0, islandBonus: 0, total: 0, provinceCount: 0} : reinforcementIncome(state, p.id))}));
}
export type Incomes = ReturnType<typeof incomes>;
export interface Outcome {
  seed: number; variant: Variant; status: 'finished' | 'unfinished' | 'refused' | 'error';
  firstSeat?: string; winner?: string; round?: number; actions?: number;
  round5?: Incomes | null; error?: string;
}
export function distribution(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  // Nearest-rank percentiles; ordinary midpoint median for an even sample.
  const at = (q: number) => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)]!;
  const median = (sorted[Math.floor((sorted.length - 1) / 2)]! + sorted[Math.floor(sorted.length / 2)]!) / 2;
  return {count: sorted.length, min: sorted[0]!, p10: at(.1), median, p90: at(.9), max: sorted.at(-1)!, mean: values.reduce((a, b) => a + b, 0) / values.length};
}
export function summarize(rows: Outcome[]) {
  const finished = rows.filter(r => r.status === 'finished');
  const round5 = rows.flatMap(r => r.round5 ? [r.round5] : []);
  const spread = (values: number[]) => values.length ? Math.max(...values) - Math.min(...values) : 0;
  const firstMoverWins = finished.filter(r => r.winner === r.firstSeat).length;
  return {
    scheduled: rows.length, finished: finished.length,
    unfinished: rows.filter(r => r.status === 'unfinished').length,
    refused: rows.filter(r => r.status === 'refused').length, errors: rows.filter(r => r.status === 'error').length,
    firstMoverWins, firstMoverWinRateAllScheduled: rows.length ? firstMoverWins / rows.length : null,
    winsBySeat: Object.fromEntries(['seat1', 'seat2', 'seat3', 'seat4'].map(id => [id, finished.filter(r => r.winner === id).length])),
    finishingRounds: distribution(finished.map(r => r.round!)),
    round5Samples: round5.length,
    finishedBeforeRound5: finished.filter(r => r.round! < 5).length,
    round5MissingOther: rows.filter(r => !r.round5 && !(r.status === 'finished' && r.round! < 5)).length,
    round5SpreadAllSeats: distribution(round5.map(v => spread(v.map(i => i.total)))),
    round5SpreadLiving: distribution(round5.map(v => spread(v.filter(i => !i.eliminated).map(i => i.total)))),
    round5MaxIncome: distribution(round5.map(v => Math.max(...v.map(i => i.total)))),
    round5MaxIslandBonus: distribution(round5.map(v => Math.max(...v.map(i => i.islandBonus)))),
  };
}

/** [designed] T113 owner-selected starting ranges, experimental only.
 * Preserve T105 ownership/half-bonuses, all live streams and card state. Starting
 * stacks use a separate substream; floor(N*(1+maximum)/2) is shared equally,
 * with integer remainder in first-seat order, never as a human advantage.
 */
export function startingArmyCandidate(initial:GameState,maximum:2|3|4):GameState {
  if(![2,3,4].includes(maximum))throw Error('Unsupported starting maximum');
  if((initial.rules.reinforcementDivisor??3)!==3)throw Error('Pilot requires fixed divisor 3');
  const state=candidate(initial,'both'),rng=DeterministicRng.subStream(initial.rng.seed,113),n=state.players.length;
  const total=Math.floor(state.map.provinces.length*(1+maximum)/2);
  for(const c of state.map.provinces)state.armies[c.id]=1;
  for(let offset=0;offset<n;offset++){
    const seat=(state.currentPlayer+offset)%n,ids=state.map.provinces.filter(c=>state.ownerOf[c.id]===state.players[seat]!.id).map(c=>c.id);
    const target=Math.floor(total/n)+Number(offset<total%n);
    if(target<ids.length||target>ids.length*maximum)throw Error('Starting-army target infeasible');
    for(let k=ids.length;k<target;k++){
      const eligible=ids.filter(id=>state.armies[id]!<maximum);
      state.armies[eligible[rng.nextInt(0,eligible.length-1)]!]!++;
    }
  }
  return state;
}
