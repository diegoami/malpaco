import {describe,it,expect,beforeAll} from "vitest";
import {generateIslandGeography} from "../../src/core/island-geography";
import type {IslandGeography} from "../../src/core/island-geography";
const acceptance=new URL("../../docs/prototypes/new-game/T34/acceptance.mjs",import.meta.url).href;
const {inspectGeography}=await import(acceptance) as {inspectGeography:(g:IslandGeography)=>string[]};
function result(seed:number):IslandGeography {
 const r=generateIslandGeography(seed);
 expect(r.ok,JSON.stringify(r)).toBe(true);
 if(!r.ok)throw Error("Expected exported geography");
 expect(r.attempts).toBeGreaterThanOrEqual(1);expect(r.attempts).toBeLessThanOrEqual(50);
 expect(r.failures).toHaveLength(r.attempts-1);
 for(const[j,f]of r.failures.entries()){expect(f.attempt).toBe(j+1);expect(f.constraints.length).toBeGreaterThan(0);expect(f.candidate).toBeDefined();}
 return r.geography;
}
describe("seeded partial island geography",()=>{
 for(const seed of [0,1,7,42,99,1994])it(`exports valid jointly reserved subdivision for seed ${seed}`,()=>{
  const g=result(seed);expect(inspectGeography(g)).toEqual([]);
  expect(g.provinces).toHaveLength(46);expect(g.islands.map(i=>i.provinces.length).sort((a,b)=>a-b)).toEqual([3,3,3,3,5,5,7,7,10]);
  expect(g).not.toHaveProperty("routes");expect(g).not.toHaveProperty("map");
  for(const p of g.provinces){expect(p).not.toHaveProperty("owner");expect(p).not.toHaveProperty("seaLanes");}
 },30000);
 it("replays all geometry, refusal history and RNG identically with independent returned vectors",()=>{
  const first=generateIslandGeography(42),second=generateIslandGeography(42);expect(first.ok).toBe(true);expect(second).toEqual(first);
  if(first.ok&&second.ok){first.geography.provinces[0]!.polygon[0]![0]++;expect(generateIslandGeography(42)).toEqual(second);}
 });
 it("uses the seed to vary geometry and at least one land subdivision topology",()=>{
  const a=result(0),b=result(1),c=result(42);
  expect(JSON.stringify(a.islands.map(i=>i.polygon))).not.toEqual(JSON.stringify(b.islands.map(i=>i.polygon)));
  expect(JSON.stringify(a.provinces.map(p=>p.polygon))).not.toEqual(JSON.stringify(b.provinces.map(p=>p.polygon)));
  const graph=(g:IslandGeography)=>JSON.stringify(g.provinces.map(p=>[p.id,[...p.borders].sort()]));
  expect(new Set([graph(a),graph(b),graph(c)]).size).toBeGreaterThan(1);
 });
 it("reports bounded exhaustion without a partial success or fallback board",()=>{
  const r=generateIslandGeography(42,{attempts:0});expect(r.ok).toBe(false);expect(r.attempts).toBe(0);expect(r).not.toHaveProperty("geography");expect(r.rng).toEqual({seed:42,state:42});
 });
 it("independent acceptance catches stale adjacency, unusable hits, missing ports and playable data",()=>{
  const base=result(7);
  const stale=structuredClone(base);stale.provinces[0]!.borders=[];expect(inspectGeography(stale).length).toBeGreaterThan(0);
  const hit=structuredClone(base);hit.provinces[0]!.labelAt=[0,0];expect(inspectGeography(hit).length).toBeGreaterThan(0);
  const ports=structuredClone(base);ports.entranceReservations[0]!.points[0]=[0,0];expect(inspectGeography(ports).length).toBeGreaterThan(0);
  const leak=structuredClone(base);Object.assign(leak.provinces[0]!,{seaLanes:[]});expect(inspectGeography(leak)).toContain("partial: playable rules/state leaked");
 });
});

it('records every rejected candidate, replays exhaustion and clamps the attempt budget',async()=>{
 const {vi}=await import('vitest');
 vi.resetModules();
 vi.doMock('../../docs/prototypes/new-game/T34/witness.json',async()=>{
  const actual=await vi.importActual<{default:{provinces:{labelAt:number[]}[]}}>('../../docs/prototypes/new-game/T34/witness.json');
  const bad=structuredClone(actual.default); for(const p of bad.provinces)p.labelAt=[0,0];
  return {default:bad};
 });
 try {
  const {generateIslandGeography:generate}=await import('../../src/core/island-geography');
  const a=generate(42,{attempts:3}),b=generate(42,{attempts:3});
  expect(a.ok).toBe(false);expect(a.attempts).toBe(3);expect(a.failures).toHaveLength(3);expect(b).toEqual(a);
  for(const [i,f]of a.failures.entries()){expect(f.attempt).toBe(i+1);expect(f.constraints.length).toBeGreaterThan(0);expect(f.candidate).toBeDefined();}
  expect(a.rng.state).not.toBe(42);
  const clamped=generate(42,{attempts:51});expect(clamped.ok).toBe(false);expect(clamped.attempts).toBe(50);expect(clamped.failures).toHaveLength(50);
  for(const attempts of [NaN,Infinity,-Infinity]){
   const none=generate(42,{attempts});expect(none.ok).toBe(false);expect(none.attempts).toBe(0);expect(none.failures).toEqual([]);expect(none.rng).toEqual({seed:42,state:42});
  }
 }finally{vi.doUnmock('../../docs/prototypes/new-game/T34/witness.json');vi.resetModules();}
},30000);

// [designed] Owner's broader-layout requirement: fixed 32-seed corpus, reflection-invariant thirds and5%aspect variation.
describe("meaningful silhouette and layout diversity",()=>{
 const corpus:IslandGeography[]=[];
 beforeAll(()=>{for(let seed=0;seed<32;seed++){const g=result(seed);expect(inspectGeography(g)).toEqual([]);corpus.push(g);}},180000);
 it("places the10-country island both in the middle vertical third and outside it",()=>{
  const placements=corpus.map(g=>{const largest=g.islands.find(i=>i.provinces.length===10)!;const ys=largest.polygon.map(p=>p[1]);const centre=(Math.min(...ys)+Math.max(...ys))/2;return centre>g.bounds.height/3&&centre<2*g.bounds.height/3;});
  // This classification is unchanged by either whole-board reflection.
  expect(placements).toContain(true);expect(placements).toContain(false);
 });
 it("changes at least one island silhouette aspect ratio by5% beyond fixed-point jitter",()=>{
  const ranges=corpus[0]!.islands.map(island=>corpus.map(g=>{const p=g.islands.find(i=>i.id===island.id)!.polygon,x=p.map(p=>p[0]),y=p.map(p=>p[1]);return (Math.max(...x)-Math.min(...x))/(Math.max(...y)-Math.min(...y));}));
  expect(ranges.some(values=>Math.max(...values)/Math.min(...values)>=1.05)).toBe(true);
 });
});

// Reservations already determine distinct entrance countries, so partial successes must
// preserve the T24 fortress/concentration budget before T35 constructs playable data.
it('rejects reservations that concentrate entrances and bonuses into fortress islands',async()=>{
 const {vi}=await import('vitest');vi.resetModules();
 vi.doMock('../../docs/prototypes/new-game/T34/witness.json',async()=>{
  const actual=await vi.importActual<{default:IslandGeography}>('../../docs/prototypes/new-game/T34/witness.json');
  const bad=structuredClone(actual.default);
  // Four disjoint retained crossings leave eight islands with one entrance each.
  bad.entranceReservations=[0,2,4,10].map(i=>bad.entranceReservations[i]!);
  return {default:bad};
 });
 try {
  const {generateIslandGeography:generate}=await import('../../src/core/island-geography');
  const r=generate(42,{attempts:3});expect(r.ok).toBe(false);expect(r.failures).toHaveLength(3);
  for(const f of r.failures){
   expect(f.constraints).toContain('fortress: too many single-entry islands');
   expect(f.constraints).toContain('fortress: large single-entry island');
   expect(f.constraints).toContain('concentration: single-entry bonuses exceed quarter');
  }
 }finally{vi.doUnmock('../../docs/prototypes/new-game/T34/witness.json');vi.resetModules();}
},30000);
