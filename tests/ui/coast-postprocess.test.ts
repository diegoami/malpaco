import {describe,it,expect} from "vitest";
import input from "../../fixtures/new-game/T63/board.json";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import target from "../../fixtures/new-game/T64/acceptance/board.json";
type Board=typeof input;
const implementation=new URL("../../fixtures/new-game/T64/layout.mjs",import.meta.url).href;
const contract=new URL("../../fixtures/new-game/T62/contract.mjs",import.meta.url).href;
const {coastPostprocess}=await import(implementation) as {coastPostprocess:(b:Board)=>Board};
const {inspect}=await import(contract) as {inspect:(b:Board)=>Record<string,string[]>};
function freeze(value:unknown):void{if(value&&typeof value==="object"){Object.freeze(value);for(const child of Object.values(value))freeze(child);}}
const semantics=(b:Board)=>({...b,provinces:b.provinces.map(({polygon:_p,labelAt:_l,...p})=>p),islands:b.islands.map(({polygon:_p,...i})=>i),routes:b.routes.map(({points:_p,...r})=>r)});
describe("fixed-reference geographical coast contract",()=>{
 it("changes all nine coast silhouettes and all countries while preserving the exact playable graph",()=>{
  const result=coastPostprocess(input);
  expect(semantics(result)).toEqual(semantics(input));
  expect(result).toEqual(target);
  for(const island of input.islands)expect(result.islands.find(i=>i.id===island.id)!.polygon,island.id).not.toEqual(island.polygon);
  for(const country of input.provinces)expect(result.provinces.find(p=>p.id===country.id)!.polygon,country.id).not.toEqual(country.polygon);
  expect(result.routes.some((r,j)=>JSON.stringify(r.points)!==JSON.stringify(input.routes[j]!.points))).toBe(true);
 },20000);
 it("same frozen input and seed reproduce identical geometry without mutating canonical map bytes",()=>{
  const source=structuredClone(input),bytes=JSON.stringify(source);freeze(source);
  const first=coastPostprocess(source),second=coastPostprocess(source);
  expect(first).toEqual(second);expect(JSON.stringify(source)).toBe(bytes);expect(first).not.toBe(source);
 },30000);
 it("retains unchanged T62 subdivision, exact contacts, landing, water and label/hit constraints",()=>{
  const output=coastPostprocess(input);
  expect(inspect(output)).toEqual({attachment:[],water:[],traceability:[],preserved:[]});
  for(const land of [...output.islands,...output.provinces])for(const [x,y] of land.polygon){expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThanOrEqual(800);expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThanOrEqual(460);}
 },20000);
 it("ownership, army sizes and live production flags do not influence geography or lose metadata",()=>{
  const varied=structuredClone(input);for(const[j,p]of varied.provinces.entries()){p.owner=j%2?"seat1":"seat2";p.armies=j===0?143:j+1;p.production=!p.production;}
  const base=coastPostprocess(input),output=coastPostprocess(varied);
  expect(semantics(output)).toEqual(semantics(varied));
  expect(output.provinces.map(p=>[p.id,p.polygon,p.labelAt])).toEqual(base.provinces.map(p=>[p.id,p.polygon,p.labelAt]));
  expect(output.islands).toEqual(base.islands);expect(output.routes).toEqual(base.routes);
 },30000);
 it("leaves approved T22 and canonical T63 reference files immutable",()=>{
  const sha=(relative:string)=>createHash("sha256").update(readFileSync(new URL(relative,import.meta.url))).digest("hex");
  expect(sha("../../fixtures/map-1994/preview.html")).toBe("94106c6c8797e8640934f51fcd582ec96b222aa70e4ac9302e74085394a58763");
  expect(sha("../../fixtures/new-game/T63/board.json")).toBe("ec8086a4a1f9fe37ecc7b8e834ca767a95745a5216f06c617a6cf66e8c23b8d9");
  expect(semantics(coastPostprocess(input))).toEqual(semantics(input));
 },20000);
});
