import { expect, test } from "vitest";
import { createGame, defaultOptions, malpacoRules } from "../../src/core";
import { createGeneratedGame, projectGeneratedState } from "../../src/ui/generatedGame";
const options=(seed:number)=>({...defaultOptions(),seed,seats:[{kind:"human" as const},{kind:"human" as const}],computerStrengths:[]});
function freeze(value:unknown):void {if(value&&typeof value==="object"){Object.freeze(value);for(const v of Object.values(value))freeze(v);}}
for(const seed of [1,2,3,7,42,1994]) test(`createGame semantics survive projection seed ${seed}`,()=>{
 const expected=createGame(options(seed),malpacoRules()); expect(expected.ok).toBe(true);if(!expected.ok)throw Error("fixture refused");
 const before=structuredClone(expected.state);freeze(expected.state);
 const projected=projectGeneratedState(expected.state);
 expect(expected.state).toEqual(before);
 const geometryRemoved=(state:typeof before)=>({...state,map:{...state.map,bounds:null,provinces:state.map.provinces.map(({polygon,labelAt,...p})=>p)}});
 expect(geometryRemoved(projected)).toEqual(geometryRemoved(before));
 expect(projected.map.provinces.some((p,i)=>JSON.stringify(p.polygon)!==JSON.stringify(before.map.provinces[i]!.polygon))).toBe(true);
 const actual=createGeneratedGame(seed);expect(actual).toEqual({ok:true,state:projected});expect(createGeneratedGame(seed)).toEqual(actual);
 expect(projected.rng).toEqual(before.rng);expect(projected.productionCentres).toEqual(before.productionCentres);
});
test("actual generation refusal remains observable",()=>{const expected=createGame(options(1506),malpacoRules());expect(expected.ok).toBe(false);expect(createGeneratedGame(1506)).toEqual(expected);});
