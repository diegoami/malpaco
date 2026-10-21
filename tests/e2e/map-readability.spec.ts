import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
import {pinned} from "../core/versioned-match-fixture";
import {seatLook} from "../../src/ui/palette";
import {openSurface} from './shell';
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
const output=process.env["READABILITY_EVIDENCE_DIR"]??"screenshots";
async function shot(page:Page,name:string,project:string){mkdirSync(output,{recursive:true});await page.mouse.move(0,0);await page.screenshot({path:join(output,`${name}-${project}.png`)});}
async function opening(page:Page){await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill("1994");await page.getByLabel("Seats",{exact:true}).selectOption("4");await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.locator("[data-country]")).toHaveCount(46);}
test("at rest the map shows counts in owner shapes and no names (T93)",async({page},info)=>{
 await opening(page);await shot(page,"opening",info.project.name);
 const rows=await page.locator("[data-country]").evaluateAll(ns=>ns.map(n=>{
  const count=n.querySelector(".army-count")!,name=n.querySelector(".name")!,badge=n.querySelector(".badge")!;
  return {army:n.getAttribute("data-armies"),owner:n.getAttribute("data-owner"),label:n.getAttribute("aria-label"),text:count.textContent,nameSize:parseFloat(getComputedStyle(name).fontSize),countSize:parseFloat(getComputedStyle(count).fontSize),nameWeight:Number(getComputedStyle(name).fontWeight),countWeight:Number(getComputedStyle(count).fontWeight),nameVisible:getComputedStyle(name).visibility!=="hidden"&&getComputedStyle(name).display!=="none",shape:badge.getAttribute("d")};
 }));
 const owners=[...new Set(rows.map(r=>r.owner))];expect(owners).toHaveLength(4);
 const players=await page.locator("[data-player]").evaluateAll(ns=>ns.map(n=>n.getAttribute("data-player")));
 for(const r of rows){expect(r.text).toBe(r.army);expect(r.label).toContain(`Seat ${players.indexOf(r.owner)+1}, ${r.army} armies`);expect(r.nameSize).toBeLessThanOrEqual(r.countSize*.7);expect(r.nameWeight).toBeLessThan(r.countWeight);expect(r.nameVisible).toBe(false);expect(r.shape).toBe(seatLook(players.indexOf(r.owner)).badge);}
 expect(new Set(rows.map(r=>r.shape)).size).toBe(4);
 expect(await page.locator(".island-name").evaluateAll(ns=>ns.filter(n=>getComputedStyle(n).display!=="none").length)).toBe(0);
});
test("choosing a country dims unrelated countries, not the source or its targets (T93)",async({page})=>{
 await opening(page);
 const dim=()=>page.locator("[data-country]").evaluateAll(ns=>ns.map(n=>({id:n.getAttribute("data-country"),selected:n.classList.contains("selected"),target:n.classList.contains("neighbor"),filter:getComputedStyle(n.querySelector(".cell")!).filter})));
 for(const r of await dim())expect(r.filter,`${r.id} at rest`).toBe("none");
 const active=await page.locator(".score-row.active").getAttribute("data-player");
 const source=page.locator(`[data-country][data-owner="${active}"]`).first();
 while(Number(await page.locator("#reinforcement-pool").textContent())>0)await source.click();
 await page.locator("#start-combat-button").click();await source.click();await expect(source).toHaveAttribute("aria-pressed","true");
 const rows=await dim();
 for(const r of rows)expect(r.filter!=="none",`${r.id} dimmed`).toBe(!r.selected&&!r.target);
 expect(rows.some(r=>r.filter!=="none")).toBe(true);
});
test("region names remain identifiable on mouse, keyboard and touch without changing inputs",async({page,browser},info)=>{
 await opening(page);
 const first=page.locator("[data-country]").first();const normal=await first.locator(".name").first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize));
 await first.hover();expect(await first.locator(".name").first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThan(normal);
 await page.mouse.move(0,0);await first.focus();expect(await first.locator(".name").first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThan(normal);
 await page.keyboard.press("ArrowRight");await expect(page.locator("[data-country]").nth(1)).toBeFocused();
 const active=await page.locator(".score-row.active").getAttribute("data-player");
 const source=page.locator(`[data-country][data-owner="${active}"]`).first();
 while(Number(await page.locator("#reinforcement-pool").textContent())>0)await source.click();
 await page.locator("#start-combat-button").click();await source.click();await expect(source).toHaveAttribute("aria-pressed","true");
 const sourceName=(await source.getAttribute("aria-label"))!.split(",")[0]!;await openSurface(page,'actions');await expect(page.locator("#battle-source-name")).toHaveText(sourceName);
 expect(await source.locator(".name").first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThan(normal);await shot(page,"selected",info.project.name);
 const save=pinned("round-limit");await page.getByLabel("Load game",{exact:true}).setInputFiles({name:"round-limit.json",mimeType:"application/json",buffer:Buffer.from(save.text)});
 await expect(page.locator("#victory-reason")).toBeVisible();
 const armies=save.expected["armies"] as Record<string,number>,id=Object.keys(armies).find(id=>armies[id]===143)!;expect(id).toBeTruthy();
 await expect(country(page,id).locator(".army-count")).toHaveText("143");
 const fit=await country(page,id).evaluate(n=>{const c=(n.querySelector(".count")! as SVGGraphicsElement).getBoundingClientRect(),b=(n.querySelector(".badge")! as SVGGraphicsElement).getBoundingClientRect();return {ok:c.left>=b.left&&c.right<=b.right&&c.top>=b.top&&c.bottom<=b.bottom,count:c.toJSON(),badge:b.toJSON()};});expect(fit.ok,JSON.stringify(fit)).toBe(true);
 await shot(page,"large-stack",info.project.name);
 const context=await browser.newContext({viewport:page.viewportSize()!,hasTouch:true});const touch=await context.newPage();
 try{await opening(touch);const node=touch.locator("[data-country]").first();const label=await node.getAttribute("aria-label");const box=await node.boundingBox();expect(box).not.toBeNull();await touch.touchscreen.tap(box!.x+box!.width/2,box!.y+box!.height/2);await expect(node).toHaveAttribute("aria-label",/Seat \d, \d+ armies/);expect(label).toBeTruthy();await expect(node.locator(".name").first()).toBeVisible();await shot(touch,"touch",info.project.name);}finally{await context.close();}
});
