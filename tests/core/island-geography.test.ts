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


// Clone the retained witness, then exercise the real constructor including both repair passes.
async function withMockedWitness(mutate:(g:IslandGeography)=>void,check:(generate:typeof generateIslandGeography)=>void):Promise<void>{
 const {vi}=await import('vitest');vi.resetModules();
 vi.doMock('../../docs/prototypes/new-game/T34/witness.json',async()=>{
  const actual=await vi.importActual<{default:IslandGeography}>('../../docs/prototypes/new-game/T34/witness.json');
  const bad=structuredClone(actual.default);mutate(bad);return {default:bad};
 });
 try{const {generateIslandGeography:generate}=await import('../../src/core/island-geography');check(generate);}
 finally{vi.doUnmock('../../docs/prototypes/new-game/T34/witness.json');vi.resetModules();}
}
const refusalCases:{name:string;constraint:string;mutate:(g:IslandGeography)=>void}[]=[
 {name:'non-simple cells',constraint:'cells: non-simple polygon',mutate:g=>{
  const q=2048;g.islands[1]!.polygon=[[650*q,50*q],[750*q,125*q],[650*q,125*q],[750*q,50*q]];
 }},
 {name:'cells outside the frame',constraint:'cells: outside frame',mutate:g=>{g.provinces[0]!.polygon[0]![0]=-800*2048;}},
 {name:'islands touching or overlapping',constraint:'cells: islands touch/overlap',mutate:g=>{
  // These islands remain fixed under all three placement plans.
  g.islands[1]!.polygon=structuredClone(g.islands[3]!.polygon);
 }},
 {name:'duplicate reserved country pairs',constraint:'crossings: duplicate reserved country pair',mutate:g=>{
  const crossing=g.entranceReservations[10]!;
  // Restrict repair candidates on two fixed islands so repairs cannot hide the duplicate.
  for(const id of [crossing.from,crossing.to])g.islands.find(i=>i.id===g.provinces.find(p=>p.id===id)!.island)!.provinces=[id];
  g.entranceReservations.push(structuredClone(crossing));
 }},
 {name:'insufficient island bonus headroom',constraint:'crossings: insufficient bonus headroom',mutate:g=>{
  // A declared one-country island cannot hold even T24's minimum bonus of two.
  g.islands[1]!.provinces=g.islands[1]!.provinces.slice(0,1);
 }},
 {name:'insufficient country degree headroom',constraint:'degree: insufficient entrance headroom',mutate:g=>{
  // A detached cell has zero shared-boundary neighbours after adjacency is re-derived.
  g.provinces[0]!.polygon=[[5000,5000],[8000,5000],[5000,8000]];
 }}
];
for(const c of refusalCases)it(`refuses ${c.name} with the specific recorded constraint`,async()=>{
 await withMockedWitness(c.mutate,generate=>{
  const r=generate(42,{attempts:3});expect(r.ok).toBe(false);expect(r.attempts).toBe(3);expect(r.failures).toHaveLength(3);expect(r).not.toHaveProperty('geography');
  for(const [i,f]of r.failures.entries()){expect(f.attempt).toBe(i+1);expect(f.candidate).toBeDefined();expect(f.constraints).toContain(c.constraint);}
 });
},30000);
it('clamps negative attempt budgets to untouched zero-attempt exhaustion',async()=>{
 await withMockedWitness(g=>{for(const p of g.provinces)p.labelAt=[0,0];},generate=>{
  const r=generate(42,{attempts:-3});expect(r.ok).toBe(false);expect(r.attempts).toBe(0);expect(r.failures).toEqual([]);expect(r.rng).toEqual({seed:42,state:42});expect(r).not.toHaveProperty('geography');
 });
});
it('floors fractional attempt budgets before recording exhausted attempts',async()=>{
 await withMockedWitness(g=>{for(const p of g.provinces)p.labelAt=[0,0];},generate=>{
  const r=generate(42,{attempts:2.75});expect(r.ok).toBe(false);expect(r.attempts).toBe(2);expect(r.failures).toHaveLength(2);expect(r).not.toHaveProperty('geography');
  for(const [i,f]of r.failures.entries()){expect(f.attempt).toBe(i+1);expect(f.candidate).toBeDefined();expect(f.constraints).toContain('labels: unusable hit reservation');}
 });
});

// Deliberately invalid geometry isolates each upper degree bound. Identical triangle
// boundaries derive a clique and cannot undergo a T1 flip; no borders are mocked.
function degreeClique(g:IslandGeography,size:number):string {
 const island=g.islands.find(i=>i.id==='island_5')!;
 const countries=g.provinces.filter(p=>p.island===island.id);
 if(size===6){const extra=structuredClone(countries[0]!);extra.id='degree_extra';countries.push(extra);g.provinces.push(extra);island.provinces.push(extra.id);}
 for(const p of countries)p.polygon=[[900000,500000],[1000000,500000],[900000,600000]];
 return countries[0]!.id;
}
function forceDegreeLanes(g:IslandGeography,source:string,targets:string[]):void {
 // Only this source may be considered by the real port repair. Its unavailable
 // headroom prevents repair from silently moving the excess lanes elsewhere.
 g.islands.find(i=>i.id===g.provinces.find(p=>p.id===source)!.island)!.provinces=[source];
 g.entranceReservations=targets.map(to=>({from:source,to,points:[[900000,500000],[1200000,500000]]}));
}
const upperDegreeCases=[
 {name:'more than four land neighbours',clause:0,mutate:(g:IslandGeography)=>{degreeClique(g,6);g.entranceReservations=[];}},
 {name:'four land neighbours plus two lanes',clause:1,mutate:(g:IslandGeography)=>{forceDegreeLanes(g,degreeClique(g,5),['province_38','province_41']);}},
 {name:'more than two reserved lanes',clause:2,mutate:(g:IslandGeography)=>{forceDegreeLanes(g,'province_38',['province_41','province_11','province_24']);}}
];
for(const c of upperDegreeCases)it(`refuses ${c.name} with isolated degree constraint`,async()=>{
 await withMockedWitness(c.mutate,generate=>{
  const r=generate(42,{attempts:3});expect(r.ok).toBe(false);expect(r.attempts).toBe(3);expect(r.failures).toHaveLength(3);expect(r).not.toHaveProperty('geography');
  for(const [i,f]of r.failures.entries()){
   expect(f.attempt).toBe(i+1);expect(f.candidate).toBeDefined();expect(f.constraints).toContain('degree: insufficient entrance headroom');
   const g=f.candidate!;
   const violations=g.provinces.map(p=>{const lanes=g.entranceReservations.filter(r=>r.from===p.id||r.to===p.id).length;return [p.borders.length>4,p.borders.length+lanes>5,lanes>2];});
   expect(g.provinces.every(p=>p.borders.length>=2)).toBe(true);
   for(let clause=0;clause<3;clause++)expect(violations.some(v=>v[clause])).toBe(clause===c.clause);
  }
 });
},30000);
