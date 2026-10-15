import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { defaultOptions } from "../../src/core";
import { deserializeMatch } from "../../src/core/match-save";
import type { Action, GameState } from "../../src/core";
import { ACTION_BUDGET, advance, nextAction, opening, policyFor } from "../helpers/complete-game";
const country = (p: Page,id: string) => p.locator(`[data-country="${id}"]`);
async function download(page: Page) {
  const event = page.waitForEvent("download");
  await page.getByRole("button",{name:"Save game",exact:true}).click();
  const file = await event; expect(file.suggestedFilename()).toMatch(/^malpaco-\d+\.json$/);
  return readFileSync((await file.path())!,"utf8");
}
async function upload(page: Page, text: string) {
  await page.getByLabel("Load game",{exact:true}).setInputFiles({name:"resume.json",mimeType:"application/json",buffer:Buffer.from(text)});
}
async function check(page: Page,state: GameState) {
  for(const p of state.map.provinces) {
    await expect(country(page,p.id)).toHaveAttribute("data-owner",state.ownerOf[p.id]!);
    await expect(country(page,p.id)).toHaveAttribute("data-armies",String(state.armies[p.id]));
  }
  if(state.phase === "finished") await expect(page.locator("#turn-title")).toHaveText(`${state.players.find(p=>p.id===state.winner)!.name} conquers the sea`);
  else {
    await expect(page.locator("#turn-title")).toHaveText(`${state.players[state.currentPlayer]!.name}'s turn`);
    if(state.phase === "reinforce") await expect(page.locator("#reinforcement-pool")).toHaveText(String(state.reinforcementPool));
  }
  expect(deserializeMatch(await download(page)).state).toEqual(state);
}
async function click(page: Page, action: Action) {
  if(action.kind === "reinforce") await country(page,action.province).click();
  else if(action.kind === "endReinforcement") await page.locator("#start-combat-button").click();
  else if(action.kind === "endTurn") await page.locator("#end-turn-button").click();
  else {
    const from = country(page,action.from);
    if(await from.getAttribute("aria-pressed") !== "true") await from.click();
    await country(page,action.to).click(); await page.locator("#attack-button").click();
    await expect(page.locator("#result-dialog")).toBeVisible();
    await page.getByRole("button",{name:"Continue",exact:true}).click();
  }
}
async function fitAndCapture(page: Page,name: string,project: string) {
  const selectors = ".match-files button, .match-load label, .match-load input, #turn-title, #game-seed";
  const boxes = await page.locator(selectors).evaluateAll(ns=>ns.map(n=>{
    const b=n.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(n);
    return {text:n.textContent,font:parseFloat(getComputedStyle(n).fontSize),x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height,lines:Array.from(r.getClientRects()).map(l=>({x:l.x,y:l.y,right:l.right,bottom:l.bottom}))};
  }));
  const size=page.viewportSize()!;expect(boxes.length).toBeGreaterThanOrEqual(5);
  for(const b of boxes){expect(b.font,b.text!).toBeGreaterThanOrEqual(12);expect(b.w).toBeGreaterThan(0);expect(b.h).toBeGreaterThan(0);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(size.width+1);expect(b.bottom).toBeLessThanOrEqual(size.height+1);for(const l of b.lines){expect(l.x).toBeGreaterThanOrEqual(b.x-1);expect(l.right).toBeLessThanOrEqual(b.right+1);expect(l.y).toBeGreaterThanOrEqual(b.y-1);expect(l.bottom).toBeLessThanOrEqual(b.bottom+1);}}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const root=process.env["MATCH_SAVE_EVIDENCE_DIR"]??"screenshots";mkdirSync(root,{recursive:true});
  const dir=mkdtempSync(join(root,"save-"));await page.screenshot({path:join(dir,`${name}-${project}.png`)});
}
for(const seats of [2,3,4]) test(`${seats} humans download, real upload on setup/gameplay, exact restore and continued attack/handoff`,async({page},info)=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",e=>{if(e.type()==="error")errors.push(e.text());});
  await page.goto(`/?view=generated-game&seed=1994&seats=${seats}`);
  let state=opening(1994,seats);const policy=policyFor(state);
  await check(page,state);
  let action=nextAction(state,policy);await click(page,action);state=advance(state,action);
  const partial=await download(page);await fitAndCapture(page,`partial-${seats}`,info.project.name);
  await page.getByRole("button",{name:"New game",exact:true}).click();
  await expect(page.getByRole("heading",{name:"New generated game"})).toBeVisible();
  await upload(page,partial);await check(page,state);
  await expect(page.getByLabel("Seed",{exact:true})).toHaveValue("1994");
  expect(new URL(page.url()).searchParams.get("seats")).toBe(String(seats));
  while(state.phase==="reinforce") { action=nextAction(state,policy);await click(page,action);state=advance(state,action); }
  action=nextAction(state,policy);expect(action.kind).toBe("attack");await click(page,action);state=advance(state,action);
  const combat=await download(page);
  await page.reload();await upload(page,combat);await check(page,state);
  await expect(page.locator("#result-dialog")).not.toBeVisible();
  await expect(page.locator('[data-country][aria-pressed="true"]')).toHaveCount(0);
  await fitAndCapture(page,`restored-combat-${seats}`,info.project.name);
  // Load failures leave the exact current history/options and a playable controller.
  for(const invalid of ["{",JSON.stringify({version:99}),JSON.stringify({version:1,options:{seed:-1},actions:[]}),JSON.stringify({version:1,options:{...defaultOptions(),seed:1994,seats:Array.from({length:seats},()=>({kind:"human"})),computerStrengths:[]},actions:[{kind:"attack",from:"missing",to:"missing"}]}),JSON.stringify({version:1,options:defaultOptions(),actions:[]})]) {
    await upload(page,invalid);await expect(page.getByRole("alert")).toContainText("Load failed:");expect(await download(page)).toBe(combat);
  }
  action=nextAction(state,policy);await click(page,action);state=advance(state,action);await check(page,state);
  action={kind:"endTurn"};await click(page,action);state=advance(state,action);await check(page,state);
  await upload(page,partial);await check(page,deserializeMatch(partial).state);
  expect(errors).toEqual([]);
});
test("finished legal history loads with readable winner and can be saved again",async({page},info)=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  let state=opening(1994,3),n=0;const policy=policyFor(state);
  while(state.phase!=="finished"&&n++<ACTION_BUDGET)state=advance(state,nextAction(state,policy));
  expect(state.phase).toBe("finished");
  const text=JSON.stringify({version:1,options:{...defaultOptions(),seed:1994,seats:[{kind:"human"},{kind:"human"},{kind:"human"}],computerStrengths:[]},actions:state.history});
  await page.goto("/?view=game-setup");await upload(page,text);await check(page,state);
  await fitAndCapture(page,"restored-winner",info.project.name);
  for(const id of ["attack-button","end-turn-button","start-combat-button"])await expect(page.locator(`#${id}`)).toBeDisabled();
  const saved=await download(page);await page.reload();await upload(page,saved);await check(page,state);expect(errors).toEqual([]);
});
