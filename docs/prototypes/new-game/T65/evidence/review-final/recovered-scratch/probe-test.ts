import {describe,it,expect} from "vitest";
import input from "../../docs/prototypes/new-game/T64/board.json";
import target from "../../docs/prototypes/new-game/T65/acceptance/board.json";
type Board=typeof input;
const {naturalizeBorders}=await import(new URL("../../docs/prototypes/new-game/T65/borders.mjs",import.meta.url).href) as {naturalizeBorders:(b:Board,s?:number)=>Board};
describe("aliasing probe",()=>{
 it("global flattened points",()=>{
  const result=naturalizeBorders(input);
  const points=result.provinces.flatMap(p=>p.polygon);
  console.log("global flat points:",points.length,"unique:",new Set(points.map(JSON.stringify)).size);
 });
 it("per-province uniqueness",()=>{
  const result=naturalizeBorders(input);
  for(const p of result.provinces){
   const us=new Set(p.polygon.map(JSON.stringify));
   if(us.size!==p.polygon.length)console.log("province",p.id,"has",p.polygon.length-us.size,"aliases");
  }
  expect(true).toBe(true);
 });
});
