import {DeterministicRng} from './rng';
import {cloneState} from './state';
import {reinforcementIncome} from './reinforcement';
import type {StartingArmiesRange} from './options';
import type {GameMap,GameState} from './types';

/** [designed] T102, owner-selected T105 combined candidate (#256/#273).
 * Searched C-STA/C-BON, setup/geographic-board/bonuses and the frozen experiment.
 * Salt 105 isolates allocation from the unchanged initial game stream.
 * Old constructors never call this module. Only balanced-cards/1 selects it.
 */
const DEALER_SALT=105;

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

/** Deterministic island-graph sides. Each side's cap sum must be below the
 * smallest share, so a valid capped deal necessarily spans both sides.
 * Sorted roots/neighbours and first-on-tie selection fix the witness forever.
 */
export function balancedIslandSides(map:GameMap,shares:readonly number[]):readonly string[] {
 const provinces=new Map(map.provinces.map(p=>[p.id,p]));
 const islands=new Map(map.islands.map(i=>[i.id,i]));
 const near=new Map(map.islands.map(i=>[i.id,new Set(i.provinces.flatMap(id=>{
  const p=provinces.get(id)!;return [...p.borders,...p.seaLanes].map(n=>provinces.get(n)!.island);
 }).filter(id=>id!==i.id))]));
 const minimum=Math.min(...shares),seats=shares.length;
 let best:{ids:string[];gap:number}|undefined;
 for(const root of [...islands.keys()].sort()){
  const queue=[root],seen=new Set(queue);
  for(let n=0;n<queue.length;n++)for(const id of [...near.get(queue[n]!)!].sort())if(!seen.has(id)){seen.add(id);queue.push(id);}
  if(queue.length!==islands.size)throw Error('Island graph is disconnected');
  for(let cut=1;cut<queue.length;cut++){
   const ids=queue.slice(0,cut),other=queue.slice(cut);
   const cap=(side:string[])=>side.reduce((sum,id)=>sum+Math.ceil(islands.get(id)!.provinces.length/seats),0);
   if(cap(ids)>=minimum||cap(other)>=minimum)continue;
   const size=ids.reduce((sum,id)=>sum+islands.get(id)!.provinces.length,0);
   const gap=Math.abs(map.provinces.length-2*size);
   if(!best||gap<best.gap)best={ids,gap};
  }
 }
 if(!best)throw Error('No balanced island-graph partition');
 return best.ids;
}

/** Preserve the original total army budget and range; redistribute only its
 * seat totals. The separate seeded dealer matches T105 exactly at range 1–3.
 */
export function balanceInitialState(initial:GameState,range:StartingArmiesRange):GameState {
 const state=cloneState(initial),players=state.players,seats=players.length;
 const rng=DeterministicRng.subStream(initial.rng.seed,DEALER_SALT);
 const shares=players.map(p=>state.map.provinces.filter(c=>state.ownerOf[c.id]===p.id).length);
 const sides=new Set(balancedIslandSides(state.map,shares));
 const counts=allocation(state.map.islands.map(i=>i.provinces.length),shares,rng);
 state.map.islands.forEach((island,i)=>{
  const ids=rng.shuffled(island.provinces);let at=0;
  for(const p of rng.shuffled(players.map((_,p)=>p)))for(let n=0;n<counts[i]![p]!;n++)state.ownerOf[ids[at++]!]=players[p]!.id;
  if(at!==ids.length)throw Error('Balanced deal did not cover an island');
 });
 const total=Object.values(initial.armies).reduce((a,b)=>a+b,0);
 const top=range==='1-2'?2:range==='1-3'?3:4;
 for(const p of state.map.provinces)state.armies[p.id]=1;
 for(let seat=0;seat<seats;seat++){
  const p=(state.currentPlayer+seat)%seats;
  const ids=state.map.provinces.filter(c=>state.ownerOf[c.id]===players[p]!.id).map(c=>c.id);
  const target=Math.floor(total/seats)+Number(seat<total%seats);
  if(target<ids.length||target>top*ids.length)throw Error('Balanced army target infeasible');
  for(let n=ids.length;n<target;n++){
   const eligible=ids.filter(id=>state.armies[id]!<top);
   state.armies[eligible[rng.nextInt(0,eligible.length-1)]!]!++;
  }
  const touched=state.map.islands.filter(i=>i.provinces.some(id=>state.ownerOf[id]===players[p]!.id));
  if(touched.length<2||!touched.some(i=>sides.has(i.id))||!touched.some(i=>!sides.has(i.id)))throw Error('Balanced position did not span the island graph');
 }
 // [designed] Owner-selected experimental formula, #273: halve each old
 // per-island value with floor and minimum one. Apply exactly once at creation.
 const map={...state.map,islands:state.map.islands.map(i=>({...i,bonus:Math.max(1,Math.floor(i.bonus/2))}))};
 const result={...state,map};
 result.reinforcementPool=reinforcementIncome(result,players[state.currentPlayer]!.id).total;
 return result;
}
