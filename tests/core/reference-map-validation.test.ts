import {it,expect} from "vitest";
import raw from "../../fixtures/new-game/T63/board.json";
import {createReferenceGame,defaultOptions} from "../../src/core";
import type {GameMap} from "../../src/core";
it("rejects a non-46 reference map before it can leave countries undealt",()=>{
 const data=structuredClone(raw),original=data.provinces[0]!;
 for(let i=0;i<2;i++){const id=`extra_${i}`;data.provinces.push({...structuredClone(original),id});data.islands.find(island=>island.id===original.island)!.provinces.push(id);}
 const map={...data,id:"unsupported-48",name:"unsupported"} as unknown as GameMap;
 const before=JSON.stringify(map),r=createReferenceGame(map,{...defaultOptions(),seed:1994,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]});
 expect(r.ok).toBe(false);if(r.ok)throw Error("unsupported map accepted");expect(r.errors.join(" ")).toMatch(/46/);expect(JSON.stringify(map)).toBe(before);
});
