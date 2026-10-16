import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { activePlayer, apply } from "../../src/core";
import type { GameState } from "../../src/core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { pinned } from "../core/versioned-match-fixture";
async function save(page:Page){const p=page.waitForEvent("download");await page.getByRole("button",{name:"Save game",exact:true}).click();return readFileSync((await (await p).path())!,"utf8");}
async function load(page:Page,text:string){await page.getByLabel("Load game",{exact:true}).setInputFiles({name:"resume.json",mimeType:"application/json",buffer:Buffer.from(text)});await expect(page.locator("[data-country]")).toHaveCount(46);}
async function begin(page:Page){await page.clock.install();await page.clock.pauseAt(new Date());await page.goto("/?view=reference-game");}
async function capture(page:Page,name:string,project:string){const dir=process.env["COMPUTER_FLOW_EVIDENCE_DIR"]??"screenshots";mkdirSync(dir,{recursive:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const boxes=await page.locator("#reference-computer-status,#confirm-capture-button,#reference-save-game").evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return {id:n.id,font:parseFloat(getComputedStyle(n).fontSize),fits:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};}));expect(boxes.filter(b=>!b.fits||b.font<12)).toEqual([]);await page.screenshot({path:join(mkdtempSync(join(dir,"flow-")),`${name}-${project}.png`)});}
function computerCapture(){const f=pinned("human-loss");let s=deserializeVersionedMatch(serializeVersionedMatch(f.options,[],REFERENCE_MATCH_IDENTITY)).state;for(const a of f.actions){const r=apply(s,a);if(!r.ok)throw Error(r.error);s=r.state;if(s.phase==="capture"&&activePlayer(s)!.kind==="computer")return serializeVersionedMatch(f.options,s.history,REFERENCE_MATCH_IDENTITY);}throw Error("No computer capture");}
async function runToHuman(page:Page){for(let i=0;i<400;i++){if(await page.locator("#reference-computer-status").isHidden())return;await page.clock.runFor(525);}throw Error("Computer did not hand back control");}

test("untouched setup starts one human and three Normal computers and consecutive turns return",async({page},info)=>{
 await begin(page);await expect(page.locator("#reference-seats")).toHaveValue("4");for(let i=1;i<=4;i++)await expect(page.getByLabel(`Seat ${i} control`)).toHaveValue(i===1?"human":"computer");
 await page.getByRole("button",{name:"Start game",exact:true}).click();let text=await save(page),loaded=deserializeVersionedMatch(text),s=loaded.state;
 expect(loaded.options.computerStrengths).toEqual(["Normal","Normal","Normal"]);expect(loaded.options.seats.map(p=>p.kind)).toEqual(["human","computer","computer","computer"]);
 await runToHuman(page);s=deserializeVersionedMatch(await save(page)).state;expect(activePlayer(s)!.kind).toBe("human");const priorHandoffs=s.history.filter(a=>a.kind==="endTurn"||a.kind==="friendlyMove").length;
 const own=s.map.provinces.find(p=>s.ownerOf[p.id]===activePlayer(s)!.id)!.id;
 for(let i=0;i<s.reinforcementPool;i++)await page.locator(`[data-country="${own}"]`).press("Enter");await page.locator("#start-combat-button").click();await page.locator("#end-turn-button").click();
 await expect(page.locator("#reference-computer-status")).toBeVisible();await expect(page.locator("#end-turn-button")).toBeDisabled();await capture(page,"computer-turn",info.project.name);
 const during=await save(page),computerState=deserializeVersionedMatch(during).state,computerCountry=computerState.map.provinces.find(p=>computerState.ownerOf[p.id]===activePlayer(computerState)!.id)!.id;await page.locator(`[data-country="${computerCountry}"]`).press("Enter");await page.keyboard.press("Escape");expect(await save(page)).toBe(during);
 await runToHuman(page);s=deserializeVersionedMatch(await save(page)).state;expect(activePlayer(s)!.kind).toBe("human");expect(s.currentPlayer).toBe(0);expect(s.history.filter(a=>a.kind==="endTurn"||a.kind==="friendlyMove")).toHaveLength(priorHandoffs+4);await capture(page,"human-return",info.project.name);
});
test("loaded computer capture resolves without a click; replacement and new game cancel old callbacks",async({page},info)=>{
 await begin(page);await page.evaluate(()=>{const original=window.setTimeout.bind(window);const callbacks:(()=>void)[]=[],canceled:number[]=[];Reflect.set(window,"oldComputerCallbacks",callbacks);Reflect.set(window,"canceledComputerTimers",canceled);const clear=window.clearTimeout.bind(window);window.clearTimeout=((id?:number)=>{if(id!==undefined)canceled.push(id);clear(id);}) as typeof window.clearTimeout;window.setTimeout=((fn:TimerHandler,delay?:number,...args:unknown[])=>{const id=original(fn,delay,...args);if(typeof fn==="function"&&[175,350,525].includes(delay??0)){callbacks.push(fn as ()=>void);Reflect.set(window,"lastComputerTimer",id);}return id;}) as typeof window.setTimeout;});
 const pending=computerCapture();await load(page,pending);await expect(page.locator("#confirm-capture-button")).toBeDisabled();await capture(page,"pending-computer",info.project.name);
 const before=deserializeVersionedMatch(pending).state.history.length;await page.clock.runFor(350);let s=deserializeVersionedMatch(await save(page)).state;expect(s.history[before]?.kind).toBe("captureMove");await runToHuman(page);
 await load(page,pending);const queued=await page.evaluate(()=>Reflect.get(window,"lastComputerTimer") as number);const restored=pinned("placement").text;await load(page,restored);const fresh=await save(page);expect(await page.evaluate(() => Reflect.get(window,"canceledComputerTimers") as number[])).toContain(queued);
 expect(await page.evaluate(()=>(Reflect.get(window,"oldComputerCallbacks") as unknown[]).length)).toBeGreaterThan(0);
 await page.evaluate(()=>{for(const cb of Reflect.get(window,"oldComputerCallbacks") as (()=>void)[])cb();});await page.clock.runFor(2000);expect(await save(page)).toBe(fresh);
 await load(page,pending);const queuedNew=await page.evaluate(()=>Reflect.get(window,"lastComputerTimer") as number);await page.getByRole("button",{name:"New game",exact:true}).click();expect(await page.evaluate(()=>Reflect.get(window,"canceledComputerTimers") as number[])).toContain(queuedNew);await page.evaluate(()=>{for(const cb of Reflect.get(window,"oldComputerCallbacks") as (()=>void)[])cb();});await page.clock.runFor(2000);await expect(page.getByRole("heading",{name:"New reference game",exact:true})).toBeVisible();
});
test("loss waits for Watch or Stop; finished game schedules no play; manual route stays manual",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await begin(page);await load(page,pinned("human-loss").text);const loss=await save(page);await page.clock.runFor(10000);expect(await save(page)).toBe(loss);
 await page.locator("#watch-computers-button").click();await expect(page.locator("#reference-computer-status")).toBeVisible();await page.clock.runFor(1050);expect(deserializeVersionedMatch(await save(page)).state.history.length).toBeGreaterThan(deserializeVersionedMatch(loss).state.history.length+1);
 await load(page,loss);await page.locator("#stop-game-button").click();const stopped=await save(page);await page.clock.runFor(10000);expect(await save(page)).toBe(stopped);await capture(page,"stopped",info.project.name);
 await page.goto("/?view=reference-game&control=manual");await expect(page.locator("#reference-seats")).toHaveValue("2");await load(page,computerCapture());const manual=await save(page);await page.clock.runFor(10000);expect(await save(page)).toBe(manual);await expect(page.locator("#confirm-capture-button")).toBeEnabled();expect(errors).toEqual([]);
});
