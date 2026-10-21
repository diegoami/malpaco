import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { computerAction } from "../../src/core/computer";
import { deserializeMatch, serializeMatch } from "../../src/core";
import type { GameState } from "../../src/core";
import { mixedOpening, mixedOptions, passive, step } from "../helpers/computer";
import {withSurface} from './shell';
async function save(page:Page){const event=page.waitForEvent("download");await withSurface(page,'settings',()=>page.getByRole("button",{name:"Save game",exact:true}).click());return readFileSync((await (await event).path())!,"utf8");}
async function load(page:Page,text:string){await page.getByLabel("Load game",{exact:true}).setInputFiles({name:"mixed.json",mimeType:"application/json",buffer:Buffer.from(text)});await expect(page.getByLabel("Load game",{exact:true})).toHaveValue("");await expect.poll(()=>page.getByRole("alert",{includeHidden:true}).textContent()).toBe("");}
async function capture(page:Page,name:string,project:string){
 const boxes=await page.locator("#turn-title,#seat-controller,.score-name,.match-files button,.match-load label,#new-game-button,.setup-card label,.setup-card select").evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect();return {text:n.textContent,x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height,font:parseFloat(getComputedStyle(n).fontSize)};}));
 const size=page.viewportSize()!;for(const b of boxes){expect(b.font,JSON.stringify(b)).toBeGreaterThanOrEqual(12);expect(b.w).toBeGreaterThan(0);expect(b.h).toBeGreaterThan(0);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(size.width+1);expect(b.bottom).toBeLessThanOrEqual(size.height+1);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const root=process.env["COMPUTER_EVIDENCE_DIR"]??"screenshots";mkdirSync(root,{recursive:true});await page.screenshot({path:join(mkdtempSync(join(root,"computer-")),`${name}-${project}.png`)});
}
async function tick(page:Page,s:GameState){const a=computerAction(s);expect(a).not.toBeNull();await page.clock.runFor(350);return step(s,a!);}
// A focused baseline target avoids repeating the missing-control timeout for every flow.
test("setup offers computer opponents",async({page})=>{await page.goto("/?view=game-setup");await expect(page.getByLabel("Players",{exact:true})).toBeVisible();});
for(const seats of [2,3,4])test(`setup clicks, autonomous ordinary actions, gated input and human return ${seats}`,async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",e=>{if(e.type()==="error")errors.push(e.text());});
 await page.clock.install();await page.clock.pauseAt(new Date());
 await page.goto("/?view=game-setup&seed=1994");await page.getByLabel("Players",{exact:true}).selectOption("computer");await page.getByLabel("Total seats",{exact:true}).selectOption(String(seats));await capture(page,"setup",info.project.name);await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.locator("#turn-title")).toBeVisible();
 let s=mixedOpening(1994,seats);
 if(s.currentPlayer===0){
  const p=passive(s);expect(p.kind).toBe("reinforce");if(p.kind!=="reinforce")throw Error("fixture");
  for(let i=0;i<p.amount;i++){await page.locator(`[data-country="${p.province}"]`).click();s=step(s,{...p,amount:1});}
  await page.locator("#start-combat-button").click();s=step(s,{kind:"endReinforcement"});await page.locator("#end-turn-button").click();s=step(s,{kind:"endTurn"});
 }
 await expect(page.locator("#seat-controller")).toContainText("Computer");await capture(page,"computer",info.project.name);
 const computerSave=await save(page);expect(deserializeMatch(computerSave).state).toEqual(s);
 for(const id of ["attack-button","end-turn-button","start-combat-button"])await expect(page.locator(`#${id}`)).toBeDisabled();
 const own=s.map.provinces.find(p=>s.ownerOf[p.id]===s.players[s.currentPlayer]!.id)!;await page.locator(`[data-country="${own.id}"]`).click({force:true});await page.keyboard.press("Escape");expect(await save(page)).toBe(computerSave);
 let actions=0,attacks=0;const computers=new Set<string>();
 while(s.currentPlayer!==0&&s.phase!=="finished"&&actions++<160){computers.add(s.players[s.currentPlayer]!.id);if(computerAction(s)?.kind==="attack")attacks++;s=await tick(page,s);}
 expect(actions).toBeLessThan(160);expect(attacks).toBeGreaterThan(0);expect(computers.size).toBe(seats-deserializeMatch(computerSave).state.currentPlayer);await expect(page.locator("#turn-title")).toHaveText("Seat 1's turn");expect(deserializeMatch(await save(page)).state).toEqual(s);await expect(page.locator("#result-dialog")).not.toBeVisible();await capture(page,"human-return",info.project.name);
 // Real upload of a real download resumes a computer turn, then repeats exactly.
 await load(page,computerSave);await expect(page.locator("#seat-controller")).toContainText("Computer");let resumed=deserializeMatch(computerSave).state;resumed=await tick(page,resumed);expect(deserializeMatch(await save(page)).state).toEqual(resumed);
 expect(errors).toEqual([]);
});
async function instrumentTimers(page:Page){
 await page.evaluate(()=>{
  const pending=new Set<number>();const set=window.setTimeout.bind(window),clear=window.clearTimeout.bind(window);
  window.setTimeout=((fn:TimerHandler,delay?:number,...args:unknown[])=>{let id=0;id=set(()=>{pending.delete(id);if(typeof fn==="function")fn(...args);},delay);if(delay===350)pending.add(id);return id;}) as typeof window.setTimeout;
  window.clearTimeout=((id?:number)=>{pending.delete(id!);clear(id);}) as typeof window.clearTimeout;Object.defineProperty(window,"computerTimers",{get:()=>pending.size});
 });
}
test("load replacement and New game cancel scheduled work; victory stays stopped",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));

 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto("/?view=game-setup");await instrumentTimers(page);
 let s=mixedOpening(1994,4);while(s.currentPlayer===0)s=step(s,passive(s));const text=serializeMatch(mixedOptions(1994,4),s.history);
 await load(page,text);await expect.poll(()=>page.evaluate(()=>Reflect.get(window,"computerTimers"))).toBe(1);
 // Load a human turn before the old timer fires: exact save must remain unchanged.
 let human=mixedOpening(42,2);while(human.currentPlayer!==0)human=step(human,computerAction(human)!);
 const humanText=serializeMatch(mixedOptions(42,2),human.history);await load(page,humanText);await expect(page.locator("#turn-title")).toHaveText("Seat 1's turn");expect(await page.evaluate(()=>Reflect.get(window,"computerTimers"))).toBe(0);await page.clock.runFor(700);expect(deserializeMatch(await save(page)).state).toEqual(human);
 await load(page,text);await withSurface(page,'settings',()=>page.getByRole("button",{name:"New game",exact:true}).click());await expect(page.getByRole("heading",{name:"New generated game"})).toBeVisible();await page.clock.runFor(700);await expect(page.locator("[data-country]")).toHaveCount(0);await instrumentTimers(page);
 // Produce a legal history immediately before a winning computer attack.
 s=mixedOpening(1994,3);let pre=s,n=0;while(s.phase!=="finished"&&n++<12000){pre=s;s=step(s,computerAction(s)??passive(s));}expect(s.phase).toBe("finished");
 await load(page,serializeMatch(mixedOptions(1994,3),pre.history));await page.clock.runFor(350);await expect(page.locator("#turn-title")).toContainText("conquers the sea");expect(deserializeMatch(await save(page)).state).toEqual(s);expect(await page.evaluate(()=>Reflect.get(window,"computerTimers"))).toBe(0);await page.clock.runFor(3500);expect(deserializeMatch(await save(page)).state).toEqual(s);await capture(page,"winner",info.project.name);expect(errors).toEqual([]);
});
