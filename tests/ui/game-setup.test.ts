import { expect, test } from "vitest";
import { createGame, defaultOptions, malpacoRules } from "../../src/core";
import { createGeneratedGame, parseGameSettings, projectGeneratedState } from "../../src/ui/generatedGame";

for (const seats of [2, 3, 4]) for (const seed of [0, 42, 1994, 4294967295]) {
  test(`settings preserve exact core semantics: seed ${seed}, ${seats} humans`, () => {
    expect(parseGameSettings(String(seed), String(seats))).toEqual({ok:true, seed, seats});
    const expected = createGame({...defaultOptions(), seed, seats:Array.from({length:seats},()=>({kind:"human" as const})), computerStrengths:[]}, malpacoRules());
    const actual = createGeneratedGame(seed, seats);
    expect(actual).toEqual(expected.ok ? {ok:true,state:projectGeneratedState(expected.state)} : expected);
    expect(createGeneratedGame(seed, seats)).toEqual(actual);
  });
}
for(const seed of ["", "-1", "1.5", "1e3", "4294967296", "99999999999999999999", "NaN", "Infinity", " 42"]) test(`reject seed ${JSON.stringify(seed)} without wrapping`,()=>{
  const result = parseGameSettings(seed,"2"); expect(result.ok).toBe(false); if(!result.ok) expect(result.errors.join(" ")).toMatch(/Seed.*0.*4294967295/);
});
for(const seats of ["", "1", "5", "2.5", "02", "computer", "NaN"]) test(`reject seat count ${JSON.stringify(seats)}`,()=>{
 const result=parseGameSettings("1994",seats);expect(result.ok).toBe(false);if(!result.ok)expect(result.errors.join(" ")).toMatch(/2.*3.*4.*human/);
});
for(const seed of [-1, 1.5, 4294967296, NaN, Infinity]) test(`numeric creation rejects ${seed}`,()=>expect(createGeneratedGame(seed,2).ok).toBe(false));
for(const seats of [1,5,2.5,NaN,Infinity]) test(`numeric creation rejects seats ${seats}`,()=>expect(createGeneratedGame(1994,seats).ok).toBe(false));
test("deterministic defaults and original two-seat call survive",()=>{
 expect(parseGameSettings(null,null)).toEqual({ok:true,seed:1994,seats:2});
 expect(createGeneratedGame()).toEqual(createGeneratedGame(1994));
 expect(createGeneratedGame(42)).toEqual(createGeneratedGame(42,2));
});
test("genuine generation refusal survives",()=>{
 const options={...defaultOptions(),seed:1506,seats:[{kind:"human" as const},{kind:"human" as const}],computerStrengths:[]};
 const expected=createGame(options,malpacoRules());expect(expected.ok).toBe(false);expect(createGeneratedGame(1506,2)).toEqual(expected);
});
