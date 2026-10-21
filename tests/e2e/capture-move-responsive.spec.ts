// T82 (A3, A4, E): pending capture and friendly-move drafts survive resize, overlays and
// fold/return; pending badges stay dashed on their own land, even at short landscape heights.
import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFileSync} from "node:fs";
import {fixture as battleFixture,step} from "./battle-fixture";
import {fixture as friendlyFixture} from "./friendly-fixture";
import type {GameState} from "../../src/core";
import {deserializeVersionedMatch} from "../../src/core/match-save";
import {openSurface,closeSurface,withSurface} from "./shell";

const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function saved(page:Page){const pending=page.waitForEvent("download");await withSurface(page,'settings',()=>page.getByRole("button",{name:"Save game",exact:true}).click());return deserializeVersionedMatch(readFileSync((await (await pending).path())!,"utf8")).state;}
async function start(page:Page,seed:number,from:string,placements:number){
 await page.clock.install();await page.clock.pauseAt(new Date());
 await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");
 await page.getByRole("button",{name:"Start game",exact:true}).click();for(let n=0;n<placements;n++)await country(page,from).click();await page.locator("#start-combat-button").click();
}
/** Resize, open and close the menu, fold and return: the draft amount must survive all of it. */
async function disturb(page:Page,input:string,fold:boolean){
 await page.setViewportSize({width:844,height:390});await page.setViewportSize({width:1280,height:800});
 await page.locator("#open-game-menu").click();await closeSurface(page);
 if(fold){await openSurface(page,'actions');await page.locator("#capture-fold-button").click();await expect(page.locator("#game-focus-drawer")).toBeHidden();await page.locator("#open-required-action").click();}
 else await openSurface(page,'actions');
 await expect(page.locator(input)).toBeVisible();
}
/** Every pending country is in view, its badge centre lies on its own land, and the badge is dashed. */
async function pendingBadges(page:Page,ids:string[]){
 for(const id of ids)expect(await country(page,id).evaluate(n=>{
  const badge=n.querySelector<SVGGraphicsElement>(".badge")!,cell=n.querySelector<SVGGeometryElement>(".cell")!,b=badge.getBoundingClientRect();
  const centre=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(cell.getScreenCTM()!.inverse());
  return {inView:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,onLand:cell.isPointInFill(centre),dashed:getComputedStyle(badge).strokeDasharray!=="none"};
 }),id).toEqual({inView:true,onLand:true,dashed:true});
}

test("a non-default and an invalid capture draft survive resize, overlays and fold/return; Confirm refuses the invalid one",async({page})=>{
 const f=battleFixture("capture");await start(page,f.seed,f.from,f.placements);let state:GameState=await saved(page);
 await country(page,f.from).click();await country(page,f.to).click();
 for(let n=0;n<128&&state.phase==="attack";n++){await openSurface(page,'actions');await page.locator("#single-exchange-button").click();state=step(state,{kind:"attack",from:f.from,to:f.to});}
 expect(state.phase).toBe("capture");
 const pending=state.pendingCapture!,draft=String(pending.min+1);expect(Number(draft)).not.toBe(pending.defaultAmount);
 await openSurface(page,'actions');await page.locator("#capture-amount").fill(draft);
 await disturb(page,"#capture-amount",true);await expect(page.locator("#capture-amount")).toHaveValue(draft);
 await pendingBadges(page,[f.from,f.to]);
 await page.locator("#capture-amount").fill("0");await disturb(page,"#capture-amount",true);await expect(page.locator("#capture-amount")).toHaveValue("0");
 await page.locator("#confirm-capture-button").click();expect((await saved(page)).history).toEqual(state.history);
 // Short landscape: the pending pair keeps its dashed badges on its own land.
 await page.setViewportSize({width:640,height:360});await closeSurface(page);await pendingBadges(page,[f.from,f.to]);
 await page.setViewportSize({width:1280,height:800});await openSurface(page,'actions');
 await page.locator("#capture-amount").fill(draft);await page.locator("#confirm-capture-button").click();
 state=step(state,{kind:"captureMove",amount:Number(draft)});expect((await saved(page)).armies).toEqual(state.armies);
 for(const id of [f.from,f.to])expect(await country(page,id).locator(".badge").evaluate(n=>getComputedStyle(n).strokeDasharray)).toBe("none");
});

test("a non-default friendly-move draft survives resize and overlays; Cancel and Move & end turn stay distinct",async({page})=>{
 const f=friendlyFixture();await start(page,f.seed,f.from,f.placements);const state=await saved(page);
 await page.locator("#start-friendly-move-button").click();await country(page,f.from).click();await country(page,f.to).click();
 await openSurface(page,'actions');const draft="1";await page.locator("#friendly-move-amount").fill(draft);
 await disturb(page,"#friendly-move-amount",false);await expect(page.locator("#friendly-move-amount")).toHaveValue(draft);
 await page.locator("#cancel-friendly-move-button").click();expect((await saved(page)).history).toEqual(state.history);
 await page.locator("#start-friendly-move-button").click();await country(page,f.from).click();await country(page,f.to).click();
 await openSurface(page,'actions');await page.locator("#friendly-move-amount").fill(draft);await page.locator("#confirm-friendly-move-button").click();
 const after=step(state,{kind:"friendlyMove",from:f.from,to:f.to,amount:1});expect((await saved(page)).armies).toEqual(after.armies);
});
