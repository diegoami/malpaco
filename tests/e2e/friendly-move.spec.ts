import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import type {GameState} from "../../src/core";
import {reinforcementIncome} from "../../src/core";
import {fixture,map,step,targets} from "./friendly-fixture";
import {mkdirSync,mkdtempSync} from "node:fs";
import {join} from "node:path";
const country=(page:Page,id:string)=>page.locator(`[data-country="${id}"]`);
async function paint(page:Page,s:GameState){for(const p of map.provinces){await expect(country(page,p.id)).toHaveAttribute("data-owner",s.ownerOf[p.id]!);await expect(country(page,p.id)).toHaveAttribute("data-armies",String(s.armies[p.id]));}}
async function prepare(page:Page,capture=false){const f=fixture(capture);await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();await paint(page,f.ready);return f;}
async function screenshot(page:Page,label:string,project:string){const root=process.env["FRIENDLY_EVIDENCE_DIR"]??"screenshots";mkdirSync(root,{recursive:true});await page.screenshot({path:join(mkdtempSync(join(root,"friendly-")),`${label}-${project}.png`)});}
async function begin(page:Page,state:GameState){await expect(page.locator("#start-friendly-move-button")).toBeVisible();await page.locator("#start-friendly-move-button").click();await expect(page.getByRole("region",{name:"Friendly move",exact:true})).toBeVisible();expect((await page.locator('[data-country][data-target="true"]').evaluateAll(ns=>ns.map(n=>n.getAttribute("data-country")))).sort()).toEqual(map.provinces.filter(p=>state.ownerOf[p.id]===state.players[state.currentPlayer]!.id&&targets(state,p.id).length>0).map(p=>p.id).sort());}
async function select(page:Page,s:GameState,from:string,to:string){
 await country(page,from).click();expect((await page.locator('[data-country][data-target="true"]').evaluateAll(ns=>ns.map(n=>n.getAttribute("data-country")))).sort()).toEqual(targets(s,from).sort());
 for(const id of targets(s,from))await expect(country(page,id)).toHaveClass(/neighbor/);
 await country(page,to).click();await expect(page.locator("#friendly-move-amount")).toHaveValue(String(s.armies[from]!-1));await expect(page.locator("#friendly-move-amount")).toHaveAttribute("min","1");await expect(page.locator("#friendly-move-amount")).toHaveAttribute("max",String(s.armies[from]!-1));
}
async function handoff(page:Page,s:GameState){await paint(page,s);await expect(page.locator("#turn-title")).toHaveText(`${s.players[s.currentPlayer]!.name}'s turn`);await expect(page.locator("#reinforcement-pool")).toHaveText(String(reinforcementIncome(s,s.players[s.currentPlayer]!.id).total));await expect(page.locator("#confirm-friendly-move-button")).toHaveCount(0);}
for(const amount of ["minimum","maximum"] as const)test(`friendly ${amount} transfer ends turn, fits and refuses stale confirmation`,async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page);await begin(page,f.ready);await select(page,f.ready,f.from,f.to);
 await page.locator("#friendly-move-amount").fill("0");await page.locator("#confirm-friendly-move-button").click();await paint(page,f.ready);
 await page.locator("#friendly-move-minimum-button").click();await expect(page.locator("#friendly-move-amount")).toHaveValue("1");await page.locator("#friendly-move-more-button").click();await expect(page.locator("#friendly-move-amount")).toHaveValue("2");await page.locator("#friendly-move-less-button").click();await expect(page.locator("#friendly-move-amount")).toHaveValue("1");
 if(amount==="maximum")await page.locator("#friendly-move-maximum-button").click();
 const n=amount==="minimum"?1:f.ready.armies[f.from]!-1;await expect(page.locator("#friendly-move-amount")).toHaveValue(String(n));
 const fits=await page.locator('#friendly-move-amount,#confirm-friendly-move-button,#cancel-friendly-move-button,#skip-friendly-move-button').evaluateAll(ns=>ns.every(n=>{const b=n.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight;}));expect(fits).toBe(true);
 await expect(page.locator("#confirm-friendly-move-button")).toContainText(/end.*turn/i);await screenshot(page,`choose-${amount}`,info.project.name);
 const stale=await page.locator("#confirm-friendly-move-button").elementHandle();await page.locator("#confirm-friendly-move-button").click();const done=step(f.ready,{kind:"friendlyMove",from:f.from,to:f.to,amount:n});await handoff(page,done);await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await handoff(page,done);await screenshot(page,`done-${amount}`,info.project.name);expect(errors).toEqual([]);
});
test("cancel returns to attacks without movement; skip hands off normally",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page);await begin(page,f.ready);await select(page,f.ready,f.from,f.to);const stale=await page.locator("#confirm-friendly-move-button").elementHandle();await page.locator("#cancel-friendly-move-button").click();await expect(page.locator("#start-friendly-move-button")).toBeVisible();await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await paint(page,f.ready);await expect(page.getByRole("region",{name:"Battle controls",exact:true})).toHaveAttribute("data-history-count",String(f.ready.history.length));
 await begin(page,f.ready);await page.locator("#skip-friendly-move-button").click();await handoff(page,step(f.ready,{kind:"endTurn"}));await screenshot(page,"skipped",info.project.name);expect(errors).toEqual([]);
});
test("a just-captured country can supply the final friendly move",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const f=await prepare(page,true);let state=f.ready;await country(page,f.from).click();await country(page,f.to).click();for(let n=0;n<128&&state.phase==="attack";n++){await page.locator("#single-exchange-button").click();state=step(state,{kind:"attack",from:f.from,to:f.to});}expect(state.phase).toBe("capture");await expect(page.locator("#start-friendly-move-button")).toBeDisabled();await page.locator("#confirm-capture-button").click();state=step(state,{kind:"captureMove",amount:state.pendingCapture!.max});await begin(page,state);await select(page,state,f.to,f.from);await page.locator("#friendly-move-minimum-button").click();await screenshot(page,"captured-source",info.project.name);await page.locator("#confirm-friendly-move-button").click();await handoff(page,step(state,{kind:"friendlyMove",from:f.to,to:f.from,amount:1}));expect(errors).toEqual([]);
});
