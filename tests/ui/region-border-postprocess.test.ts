import {describe,it,expect} from "vitest";
import input from "../../fixtures/new-game/T64/board.json";
import target from "../../fixtures/new-game/T65/acceptance/board.json";
type Board=typeof input;
const {naturalizeBorders}=await import(new URL("../../fixtures/new-game/T65/borders.mjs",import.meta.url).href) as {naturalizeBorders:(b:Board,s?:number)=>Board};
const {inspect}=await import(new URL("../../fixtures/new-game/T62/contract.mjs",import.meta.url).href) as {inspect:(b:Board)=>Record<string,string[]>};
const semantics=(b:Board)=>({...b,provinces:b.provinces.map(({polygon:_p,...p})=>p)});
function freeze(value:unknown):void{if(value&&typeof value==="object"){Object.freeze(value);for(const child of Object.values(value))freeze(child);}}
const key=(a:number[],b:number[])=>[JSON.stringify(a),JSON.stringify(b)].sort().join("|");
function contacts(board:Board){const edges=new Map<string,string[]>();for(const p of board.provinces)for(let j=0;j<p.polygon.length;j++){const a=p.polygon[j]!,b=p.polygon[(j+1)%p.polygon.length]!,k=key(a,b);edges.set(k,[...(edges.get(k)??[]),p.id]);}return edges;}
describe("canonical shared region borders",()=>{
 it("replaces straight divisions with the frozen geographical border drawing",()=>{const result=naturalizeBorders(input);expect(result).toEqual(target);expect(result.provinces.filter((p,j)=>JSON.stringify(p.polygon)!==JSON.stringify(input.provinces[j]!.polygon))).toHaveLength(46);});
 it("same frozen input and seed give identical boundaries and different seeds change the curves",()=>{const source=structuredClone(input),before=JSON.stringify(source);freeze(source);const a=naturalizeBorders(source,1994);expect(a).toEqual(naturalizeBorders(source,1994));expect(a).not.toEqual(naturalizeBorders(source,7));expect(JSON.stringify(source)).toBe(before);});
 it("retains exact metadata, coast, ports, labels and routes",()=>{expect(semantics(naturalizeBorders(input))).toEqual(semantics(input));});
 it("retains connected cells, exact contacts, subdivisions and protected reservations on five seeds",()=>{for(const seed of [1994,0,7,42,4294967295])expect(inspect(naturalizeBorders(input,seed)),String(seed)).toEqual({attachment:[],water:[],traceability:[],preserved:[]});},60000);
 it("uses each canonical shared curve twice with opposite orientation and no point aliasing",()=>{const result=naturalizeBorders(input),registry=contacts(result),pairs=new Set<string>();for(const [k,owners]of registry){expect(owners.length).toBeLessThanOrEqual(2);if(owners.length===2){pairs.add([...owners].sort().join("|"));const [a,b]=JSON.parse("["+k.replace("|",",")+"]") as number[][];const direction=owners.map(id=>{const p=result.provinces.find(p=>p.id===id)!;return p.polygon.some((v,j)=>JSON.stringify(v)===JSON.stringify(a)&&JSON.stringify(p.polygon[(j+1)%p.polygon.length])===JSON.stringify(b));});expect(direction[0]).not.toBe(direction[1]);}}const expected=new Set(input.provinces.flatMap(p=>p.borders.map(id=>[p.id,id].sort().join("|"))));expect(pairs).toEqual(expected);const points=result.provinces.flatMap(p=>p.polygon);expect(new Set(points).size).toBe(points.length);});
});
