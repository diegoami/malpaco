import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {mkdirSync,mkdtempSync} from "node:fs";
import {join} from "node:path";
import {fixture,map,step} from "./battle-fixture";
import type {GameState} from "../../src/core";
const region=(p:Page)=>p.getByRole("region",{name:"Battle controls",exact:true});
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function prepare(page:Page,kind:Parameters<typeof fixture>[0]){
 const f=fixture(kind);await page.clock.install();await page.clock.pauseAt(new Date());await page.goto("/?view=reference-game&control=manual");
 await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();await page.getByRole("combobox",{name:"Panel detail",exact:true}).selectOption("detailed");
 for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();await country(page,f.from).click();await country(page,f.to).click({modifiers:["Shift"]});
 await expect(region(page)).toBeVisible();await expect(page.locator("#battle-stop-threshold")).toHaveValue("2");await paint(page,f.ready);return f;
}
async function paint(page:Page,state:GameState){
 for(const p of map.provinces){await expect(country(page,p.id)).toHaveAttribute("data-owner",state.ownerOf[p.id]!);await expect(country(page,p.id)).toHaveAttribute("data-armies",String(state.armies[p.id]));await expect(country(page,p.id).locator(".army-count")).toHaveText(String(state.armies[p.id]));}
}
async function history(page:Page,count:number){await expect(region(page)).toHaveAttribute("data-history-count",String(count));}
async function capture(page:Page,name:string,project:string){const root=process.env["BATTLE_EVIDENCE_DIR"]??"screenshots";mkdirSync(root,{recursive:true});const dir=mkdtempSync(join(root,"battle-"));await page.mouse.move(0,0);await page.screenshot({path:join(dir,`${name}-${project}.png`)});}
async function context(page:Page,s:GameState,from:string,to:string){
 await expect(page.locator("#battle-source-name")).toHaveText(map.provinces.find(p=>p.id===from)!.name);await expect(page.locator("#battle-target-name")).toHaveText(map.provinces.find(p=>p.id===to)!.name);
 await expect(page.locator("#battle-source-armies")).toHaveText(String(s.armies[from]));await expect(page.locator("#battle-target-armies")).toHaveText(String(s.armies[to]));
 const v=page.viewportSize()!;for(const id of ["fight-on-button","single-exchange-button","stop-battle-button","battle-stop-threshold","battle-speed"]){const n=page.locator('#'+id);if(s.pendingCapture){if(id!=="battle-speed")await expect(n).toBeDisabled();await expect(n).toBeHidden();continue;}await expect(n).toBeVisible();const b=await n.boundingBox();expect(b).not.toBeNull();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.y).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(v.width);expect(b!.y+b!.height).toBeLessThanOrEqual(v.height);}
}
test("one chosen exchange shows actual ties, dice and live stacks without a later exchange",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page,"tie");await page.locator("#single-exchange-button").click();const next=step(f.ready,{kind:"attack",from:f.from,to:f.to});
 await history(page,next.history.length);await paint(page,next);await context(page,next,f.from,f.to);
 expect(await page.locator("[data-battle-roll]").evaluateAll(ns=>ns.map(n=>({a:Number((n as HTMLElement).dataset["a"]),d:Number((n as HTMLElement).dataset["d"]),result:(n as HTMLElement).dataset["result"]})))).toEqual(f.first.rolls);
 for(const tie of await page.locator('[data-battle-roll][data-result="tie"]').all())await expect(tie).toBeVisible();await expect(page.locator("#battle-ties")).toHaveText(String(f.first.rolls.filter(r=>r.result==="tie").length));
 await page.clock.runFor(4000);await history(page,next.history.length);await paint(page,next);await capture(page,"single-tie",info.project.name);expect(errors).toEqual([]);
});
test("manual Stop takes effect before the next exchange while context stays visible",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page,"manual");await page.locator("#battle-stop-threshold").fill("1");await page.locator("#battle-stop-threshold").press("Tab");await page.locator("#fight-on-button").click();
 const next=step(f.ready,{kind:"attack",from:f.from,to:f.to});await history(page,next.history.length);await expect(region(page)).toHaveAttribute("data-running","true");await page.locator("#stop-battle-button").click();
 await expect(region(page)).toHaveAttribute("data-running","false");await page.clock.runFor(4000);await history(page,next.history.length);await paint(page,next);await context(page,next,f.from,f.to);await capture(page,"manual-stop",info.project.name);expect(errors).toEqual([]);
});
test("fight-on stops at the chosen fixed threshold after a loss",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page,"loss"),threshold=f.ready.armies[f.from]!-1;
 await page.locator("#battle-stop-threshold").fill(String(threshold));await page.locator("#battle-stop-threshold").press("Tab");await page.locator("#fight-on-button").click();const next=step(f.ready,{kind:"attack",from:f.from,to:f.to});
 expect(next.armies[f.from]).toBe(threshold);await expect(region(page)).toHaveAttribute("data-running","false");await expect(page.locator("#battle-stop-threshold")).toHaveValue(String(threshold));await page.clock.runFor(4000);await history(page,next.history.length);await paint(page,next);await context(page,next,f.from,f.to);await capture(page,"threshold-stop",info.project.name);expect(errors).toEqual([]);
});
for(const quantity of ["minimum","maximum"] as const)test(`capture ${quantity} preserves armies and rejects stale/unrelated controls`,async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page,"capture");await page.locator("#battle-stop-threshold").fill("1");await page.locator("#battle-stop-threshold").press("Tab");await page.locator("#battle-speed").selectOption("fast");
 const stale=await page.locator("#single-exchange-button").elementHandle();await page.locator("#fight-on-button").click();let next=step(f.ready,{kind:"attack",from:f.from,to:f.to});
 for(let n=0;next.phase==="attack"&&n<128;n++){await page.clock.runFor(200);next=step(next,{kind:"attack",from:f.from,to:f.to});}
 expect(next.phase).toBe("capture");const pending=next.pendingCapture!;await expect(page.locator("#capture-amount")).toHaveValue(String(pending.defaultAmount));await history(page,next.history.length);await paint(page,next);
 await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await page.locator("#end-turn-button").dispatchEvent("click");await country(page,f.from).click();await page.clock.runFor(2000);await history(page,next.history.length);await paint(page,next);await context(page,next,f.from,f.to);
 await page.locator("#capture-amount").fill("0");await page.locator("#confirm-capture-button").dispatchEvent("click");await history(page,next.history.length);await paint(page,next);
 await page.locator("#capture-minimum-button").click();await expect(page.locator("#capture-amount")).toHaveValue("1");await page.locator("#capture-more-button").click();await expect(page.locator("#capture-amount")).toHaveValue("2");await page.locator("#capture-less-button").click();await expect(page.locator("#capture-amount")).toHaveValue("1");
 if(quantity==="maximum")await page.locator("#capture-maximum-button").click();const amount=quantity==="minimum"?1:pending.max;await expect(page.locator("#capture-amount")).toHaveValue(String(amount));await capture(page,`capture-${quantity}-pending`,info.project.name);
 const oldConfirm=await page.locator("#confirm-capture-button").elementHandle();await page.locator("#confirm-capture-button").click();next=step(next,{kind:"captureMove",amount});await paint(page,next);await history(page,next.history.length);await oldConfirm!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await page.clock.runFor(2000);await history(page,next.history.length);await paint(page,next);await context(page,next,f.from,f.to);await capture(page,`capture-${quantity}-done`,info.project.name);expect(errors).toEqual([]);
});
