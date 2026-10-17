import {describe,it,expect} from "vitest";
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
