// T82 (A2–A4): a target is staged, never fought; Attack fights exactly one legal exchange;
// stale, paused and repeated input cannot act; Fight on needs a first Attack on the pair.
import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFileSync} from "node:fs";
import {fixture,step,map} from "./battle-fixture";
import {attackTargets} from "../../src/core";
import type {GameState} from "../../src/core";
import {deserializeVersionedMatch} from "../../src/core/match-save";
import {captureOdds,oddsLabel} from "../../src/ui/captureOdds";
import {openSurface,withSurface} from "./shell";

const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function saved(page:Page){const pending=page.waitForEvent("download");await withSurface(page,'settings',()=>page.getByRole("button",{name:"Save game",exact:true}).click());return deserializeVersionedMatch(readFileSync((await (await pending).path())!,"utf8")).state;}
/** The saved game replays to exactly this state: same history, so the same RNG. */
async function check(page:Page,state:GameState){const s=await saved(page);expect(s.history).toEqual(state.history);expect(s.rng).toEqual(state.rng);expect(s.armies).toEqual(state.armies);expect(s.ownerOf).toEqual(state.ownerOf);}
async function prepare(page:Page){
 const f=fixture("manual");await page.clock.install();await page.clock.pauseAt(new Date());
 await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");
 await page.getByRole("button",{name:"Start game",exact:true}).click();for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();
 return {...f,state:await saved(page)};
}

test("a target tap, Enter, Space or list choice stages the pair and shows the exact odds; nothing is fought",async({page})=>{
 const f=await prepare(page);const state=f.state;
 await country(page,f.from).click();await country(page,f.to).click();await check(page,state);
 await openSurface(page,'actions');
 await expect(page.locator("#battle-target-name")).toHaveText(map.provinces.find(p=>p.id===f.to)!.name);
 await expect(page.locator("#battle-odds")).toHaveText(`${oddsLabel(captureOdds(state,f.from,f.to)!)} capture · if fought to end`);
 await expect(page.locator("#fight-on-button")).toBeHidden();
 // Keyboard and repeated activations of the staged target still fight nothing.
 await country(page,f.to).focus();for(const key of ["Enter","Space","Enter"])await page.keyboard.press(key);await check(page,state);
 await expect(page.locator("[data-battle-roll]")).toHaveCount(0);
});

test("Attack fights exactly one legal exchange; then Fight on appears",async({page})=>{
 const f=await prepare(page);let state=f.state;
 await country(page,f.from).click();await country(page,f.to).click();
 await openSurface(page,'actions');await page.locator("#single-exchange-button").click();
 state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);
 await openSurface(page,'actions');await expect(page.locator("#fight-on-button")).toBeVisible();
 await page.locator("#single-exchange-button").click();state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);
});

test("a stale Attack control, a repeated click and a paused game cannot act; a new pair hides Fight on",async({page})=>{
 const f=await prepare(page);let state=f.state;
 await country(page,f.from).click();await country(page,f.to).click();await openSurface(page,'actions');
 const stale=await page.locator("#single-exchange-button").elementHandle();
 // Two synchronous clicks on one control: only the first acts (the second is a stale revision).
 await stale!.evaluate(n=>{n.dispatchEvent(new MouseEvent("click",{bubbles:true}));n.dispatchEvent(new MouseEvent("click",{bubbles:true}));});
 state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);
 await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await check(page,state);
 // Paused, Attack does nothing.
 await page.locator("#game-pause-button").click();await openSurface(page,'actions');await page.locator("#single-exchange-button").dispatchEvent("click");await check(page,state);
 await page.locator("#game-pause-button").click();
 // Another target clears the confirmation: Fight on hides and refuses until Attack.
 const other=attackTargets(state,f.from).find(id=>id!==f.to);
 if(other){
  await country(page,other).click();await openSurface(page,'actions');await expect(page.locator("#fight-on-button")).toBeHidden();
  await page.locator("#fight-on-button").dispatchEvent("click");await check(page,state);
 }
});
