import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createGame, defaultOptions, apply, attackTargets } from "../../src/core";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";

const test=base.extend<{errors:void}>({errors:[async({page},use)=>{const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",e=>{if(e.type()==="error")errors.push(e.text());});await use();expect(errors).toEqual([]);},{auto:true}]});
const country=(page:Page,id:string)=>page.locator(`[data-country="${id}"]`);
async function fit(page:Page) {
 const boxes=await page.locator(".setup-card input, .setup-card select, .setup-card label, .setup-card p:not([role="alert"]), .setup-card [role="alert"]:not(:empty), .setup-card h1, .setup-card button, .panel .turn-title, .panel .turn-sub, .panel .score-name, .panel .score-num, .panel .hint, .panel .steps li, .panel .income-row, .panel .pool-row, .panel button:not([hidden]), .panel-foot .seed").evaluateAll(nodes=>nodes.map(node=>{
   const e=node as HTMLElement,b=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();const c=e.closest(".card, .panel-foot")!.getBoundingClientRect();const panel=e.closest(".panel")?.getBoundingClientRect();return {text:e.textContent,b:{x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height},t:{x:t.x,y:t.y,r:t.right,b:t.bottom},c:{x:c.x,y:c.y,r:c.right,b:c.bottom},panel:panel?{x:panel.x,y:panel.y,r:panel.right,b:panel.bottom}:null,font:parseFloat(getComputedStyle(e).fontSize)};
 }));
 expect(boxes.length).toBeGreaterThan(3);const v=page.viewportSize()!;
 for(const {text,b,t,c,panel,font} of boxes){expect(b.w,text!).toBeGreaterThan(0);expect(b.h,text!).toBeGreaterThan(0);expect(font,text!).toBeGreaterThanOrEqual(12);expect(b.x,text!).toBeGreaterThanOrEqual(0);expect(b.y,text!).toBeGreaterThanOrEqual(0);expect(b.r,text!).toBeLessThanOrEqual(v.width+1);expect(b.b,text!).toBeLessThanOrEqual(v.height+1);expect(b.x,text!).toBeGreaterThanOrEqual(c.x-1);expect(b.r,text!).toBeLessThanOrEqual(c.r+1);expect(b.y,text!).toBeGreaterThanOrEqual(c.y-1);expect(b.b,text!).toBeLessThanOrEqual(c.b+1);if(t.r>t.x){expect(t.x,text!).toBeGreaterThanOrEqual(b.x-1);expect(t.r,text!).toBeLessThanOrEqual(b.r+1);expect(t.y,text!).toBeGreaterThanOrEqual(b.y-1);expect(t.b,text!).toBeLessThanOrEqual(b.b+1);}if(panel){expect(b.y,text!).toBeGreaterThanOrEqual(panel.y);expect(b.b,text!).toBeLessThanOrEqual(panel.b+1);}}
 expect(await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}))).toEqual({w:v.width,h:v.height});
}
async function screenshot(page:Page,name:string,project:string){const dir=process.env["SETUP_EVIDENCE_DIR"];if(dir)await page.screenshot({path:join(mkdtempSync(join(dir,"paint-")),`${name}-${project}.png`)});}

for(const seats of [2,3,4]) test(`settings start exact ${seats}-human game and preserve play and round-trip`,async({page},info)=>{
 const seed=seats===2?42:1994;
 await page.goto("/?view=game-setup");await expect(page.getByRole("heading",{name:"New generated game"})).toBeVisible();
 await page.getByLabel("Seed",{exact:true}).focus();await page.keyboard.press("ControlOrMeta+A");await page.keyboard.type(String(seed));
 await page.getByLabel("Human seats").selectOption(String(seats));await fit(page);
 if(seats===4){await screenshot(page,"setup",info.project.name);await expect(page).toHaveScreenshot(`setup-${info.project.name}.png`);}
 if(seats===3)await page.getByRole("button",{name:"Start game",exact:true}).click();else await page.getByRole("button",{name:"Start game",exact:true}).press("Enter");
 await expect(page).toHaveURL(new RegExp(`view=generated-game&seed=${seed}&seats=${seats}`));
 const r=createGame({...defaultOptions(),seed,seats:Array.from({length:seats},()=>({kind:"human" as const})),computerStrengths:[]});if(!r.ok)throw Error(r.errors.join(";"));let state=r.state;
 await expect(page.locator("[data-country]")).toHaveCount(46);await expect(page.locator(".score-row")).toHaveCount(seats);
 for(const p of state.map.provinces){const g=country(page,p.id);await expect(g).toHaveAttribute("data-owner",state.ownerOf[p.id]!);await expect(g).toHaveAttribute("data-armies",String(state.armies[p.id]));await expect(g.locator(".army-count")).toHaveText(`${state.players.findIndex(x=>x.id===state.ownerOf[p.id])+1} · ${state.armies[p.id]}`);}
 const cues=await page.locator(".score-row .chip path").evaluateAll(nodes=>nodes.map(n=>({fill:n.getAttribute("fill"),shape:n.getAttribute("d")})));expect(new Set(cues.map(c=>c.fill)).size).toBe(seats);expect(new Set(cues.map(c=>c.shape)).size).toBe(seats);
 const labels=await page.locator(".country-name, .army-count").evaluateAll(ns=>ns.map(n=>{const t=n as SVGTextElement,b=t.getBoundingClientRect(),m=t.getScreenCTM()!;return {font:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m.a,m.b),x:b.x,y:b.y,r:b.right,b:b.bottom};}));for(const b of labels){expect(b.font).toBeGreaterThanOrEqual(11);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.r).toBeLessThanOrEqual(page.viewportSize()!.width);expect(b.b).toBeLessThanOrEqual(page.viewportSize()!.height);}
 await fit(page);if(seats===4){await screenshot(page,"four-seat",info.project.name);await expect(page).toHaveScreenshot(`four-seat-${info.project.name}.png`);}
 const mover=state.players[state.currentPlayer]!.id;const source=state.map.provinces.find(p=>state.ownerOf[p.id]===mover&&[...p.borders,...p.seaLanes].some(id=>state.ownerOf[id]!==mover))!;
 const pool=state.reinforcementPool;for(let i=0;i<pool;i++){await country(page,source.id).click();const next=apply(state,{kind:"reinforce",province:source.id,amount:1});if(!next.ok)throw Error(next.error);state=next.state;await expect(page.locator("#reinforcement-pool")).toHaveText(String(pool-i-1));}
 await page.locator("#start-combat-button").click();const combat=apply(state,{kind:"endReinforcement"});if(!combat.ok)throw Error(combat.error);state=combat.state;await fit(page);
 await country(page,source.id).click();const target=attackTargets(state,source.id)[0]!;await country(page,target).click();await expect(page.locator("#attack-button")).toBeEnabled();await fit(page);
 await page.locator("#attack-button").click();const attacked=apply(state,{kind:"attack",from:source.id,to:target});if(!attacked.ok)throw Error(attacked.error);state=attacked.state;
 await page.getByRole("button",{name:"Continue",exact:true}).click();await page.locator("#end-turn-button").click();const next=apply(state,{kind:"endTurn"});if(!next.ok)throw Error(next.error);await expect(page.locator("#turn-title")).toHaveText(`${next.state.players[next.state.currentPlayer]!.name}'s turn`);await fit(page);
 await page.getByRole("button",{name:"New game",exact:true}).click();await expect(page).toHaveURL(/view=game-setup/);await expect(page.getByLabel("Seed",{exact:true})).toHaveValue(String(seed));await expect(page.getByLabel("Human seats")).toHaveValue(String(seats));
});

test("invalid seeds/counts and actual refusal have actionable recovery",async({page})=>{
 await page.goto("/?view=game-setup");for(const value of ["-1","1.5","4294967296","oops",""]){await page.getByLabel("Seed",{exact:true}).fill(value);await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.getByRole("alert")).toContainText("Seed must be a whole number from 0 to 4294967295");await expect(page.locator("[data-country]")).toHaveCount(0);}
 await page.goto("/?view=generated-game&seed=1994&seats=5");await expect(page.getByRole("alert")).toContainText("Choose 2, 3 or 4 human seats");await expect(page.locator("[data-country]")).toHaveCount(0);
 await page.goto("/?view=generated-game&seed=4294967296&seats=2");await expect(page.getByRole("alert")).toContainText("Seed must");await expect(page.locator("[data-country]")).toHaveCount(0);
 await page.goto("/?view=game-setup&seed=1506&seats=2");await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.getByRole("alert")).toContainText("Generation failed");await expect(page.getByRole("alert")).toContainText("Choose another seed");await fit(page);
 await page.getByLabel("Seed",{exact:true}).fill("42");await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.locator("[data-country]")).toHaveCount(46);
});
