import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {fixture,seaFixture,map,targets} from "./friendly-fixture";
const country=(page:Page,id:string)=>page.locator(`[data-country="${id}"]`);
async function ready(page:Page,mixed=false){const f=mixed?seaFixture():fixture();await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();return f;}

test("movement route emphasis includes own sea neighbours and excludes enemy routes",async({page})=>{
 const f=await ready(page,true),source=map.provinces.find(p=>p.id===f.from)!;
 const legal=targets(f.ready,f.from),ownSea=source.seaLanes.filter(id=>legal.includes(id)),enemySea=source.seaLanes.filter(id=>!legal.includes(id));
 expect(ownSea.length).toBeGreaterThan(0);expect(enemySea.length).toBeGreaterThan(0);
 await page.locator("#start-friendly-move-button").click();await country(page,f.from).click();
 const active=await page.locator("#reference-map .lane.active").evaluateAll(ns=>ns.map(n=>n.getAttribute("data-edge")!.split("|").sort().join("|")).sort());
 expect(active).toEqual(ownSea.map(id=>[f.from,id].sort().join("|")).sort());
});

test("Escape cancels a move draft and restores the previous battle selection",async({page})=>{
 const f=await ready(page),source=map.provinces.find(p=>p.id===f.from)!,enemy=[...source.borders,...source.seaLanes].find(id=>f.ready.ownerOf[id]!==f.ready.ownerOf[f.from])!;expect(enemy).toBeTruthy();
 await country(page,f.from).click();await country(page,enemy).click({modifiers:["Shift"]});const sourceName=await page.locator("#battle-source-name").textContent(),targetName=await page.locator("#battle-target-name").textContent();
 await page.locator("#start-friendly-move-button").click();await country(page,f.from).click();await country(page,f.to).click();await page.keyboard.press("Escape");
 await expect(page.getByRole("region",{name:"Friendly move",exact:true})).toBeHidden();await expect(page.getByRole("region",{name:"Battle controls",exact:true})).toHaveAttribute("data-history-count",String(f.ready.history.length));await expect(page.locator("#battle-source-name")).toHaveText(sourceName!);await expect(page.locator("#battle-target-name")).toHaveText(targetName!);
 for(const p of map.provinces)await expect(country(page,p.id)).toHaveAttribute("data-armies",String(f.ready.armies[p.id]));
});
