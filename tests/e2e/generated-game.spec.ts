import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SEATS } from "../../src/ui/palette";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { createGame, defaultOptions, apply, attackTargets, generateBoard } from "../../src/core";

const test = base.extend<{ errors: void }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", e => { if (e.type() === "error") errors.push(e.text()); });
    await use(); expect(errors, "browser errors").toEqual([]);
  }, { auto: true }],
});

function board(seed: number) { const r = generateBoard(seed); if (!r.ok) throw new Error(r.errors.join(";")); return r.map; }
const map = board(1994);
const pairs = (kind: "borders" | "seaLanes") => [...new Set(map.provinces.flatMap(p=>p[kind].map(q=>[p.id,q].sort().join("|"))))].sort();
const country = (page: Page, id: string) => page.locator(`#generated-game [data-country="${id}"]`);
async function settle(page: Page) { await page.evaluate(async()=>{ await document.fonts.ready; await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished)); }); }
test.beforeEach(async ({page})=>{ await page.goto("/?view=generated-game&seed=1994"); await expect(page.locator("#generated-game")).toBeVisible(); });

test("46 countries and full names are painted, readable, distinct and in the viewport", async ({page}, info)=>{
  await expect(page.locator("[data-country]")).toHaveCount(46);
  for(const p of map.provinces) { await expect(country(page,p.id)).toHaveAttribute("role","button"); await expect(country(page,p.id).locator(".country-name")).toHaveText(p.name); }
  await settle(page);
  const geometry = await page.locator(".country-name, .army-count").evaluateAll(nodes=>nodes.map(node=>{
    const e=node as SVGTextElement, b=e.getBoundingClientRect(), m=e.getScreenCTM()!;
    const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest("[data-country]")?.getAttribute("data-country");
    return {hit,id:e.closest("[data-country]")?.getAttribute("data-country"),text:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height,font:parseFloat(getComputedStyle(e).fontSize)*Math.hypot(m.a,m.b)};
  }));
  const viewport=page.viewportSize()!;
  for(const b of geometry) { expect(b.hit,`${b.id}: name center selects its country`).toBe(b.id); expect(b.font,b.text!).toBeGreaterThanOrEqual(11); expect(b.w).toBeGreaterThan(0); expect(b.x).toBeGreaterThanOrEqual(0); expect(b.y).toBeGreaterThanOrEqual(0); expect(b.x+b.w).toBeLessThanOrEqual(viewport.width); expect(b.y+b.h).toBeLessThanOrEqual(viewport.height); }
  for(let i=0;i<geometry.length;i++) for(let j=i+1;j<geometry.length;j++){const a=geometry[i]!,b=geometry[j]!; expect(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y,`${a.text}/${b.text}: label overlap`).toBe(true);}
  expect(await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}))).toEqual({w:viewport.width,h:viewport.height});
  // Read screenshot pixels, not computed opacity. Sample each region away from
  // labels and compare with sea, then read name contrast separately. [designed]
  // RGB distances 60/100 and 60% painted share reject blank paths and labels;
  // inspected slice.spec.ts's screenshot/canvas reader and MapView label regions.
  const evidenceRoot=process.env["GENERATED_EVIDENCE_DIR"];
  const screenshotDir=evidenceRoot ? mkdtempSync(join(evidenceRoot,"paint-")) : "screenshots";
  const png=(await page.screenshot({path:`${screenshotDir}/painted-${info.project.name}.png`})).toString("base64");
  const palette=Object.fromEntries(SEATS.map((s,i)=>[`seat${i+1}`,s.color.slice(1).match(/../g)!.map(v=>parseInt(v,16))]));
  const pixels=await page.evaluate(async ({png,palette})=>{
    const image=new Image(); image.src=`data:image/png;base64,${png}`; await image.decode(); const c=document.createElement("canvas"); c.width=image.width;c.height=image.height; const ctx=c.getContext("2d",{willReadFrequently:true})!; ctx.drawImage(image,0,0);
    const pixel=(x:number,y:number)=>Array.from(ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data).slice(0,3);
    const dist=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]!));
    const svg=document.querySelector("#generated-map") as unknown as SVGSVGElement; const rect=svg.getBoundingClientRect(); const sea=pixel(rect.left+2,rect.top+2);
    return [...document.querySelectorAll("[data-country]")].map(g=>{
      const p=g.querySelector(".country-shape") as SVGGeometryElement; const t=g.querySelector(".country-name") as SVGTextElement; const name=t.getBoundingClientRect(); const count=g.querySelector(".army-count")!.getBoundingClientRect(); const expected=palette[g.getAttribute("data-owner")!]!; const b=p.getBBox(); const m=p.getScreenCTM()!; let n=0,paint=0;
      for(let x=b.x+3;x<b.x+b.width-3;x+=4) for(let y=b.y+3;y<b.y+b.height-3;y+=4) {if(!p.isPointInFill(new DOMPoint(x,y)))continue; const q=new DOMPoint(x,y).matrixTransform(m); if(q.x>=name.left-2&&q.x<=name.right+2&&q.y>=name.top-2&&q.y<=name.bottom+2)continue; if(q.x>=count.left-2&&q.x<=count.right+2&&q.y>=count.top-2&&q.y<=count.bottom+2)continue; n++; if(dist(pixel(q.x,q.y),expected)<28 && dist(expected,sea)>60)paint++;}
      const contrast=(box:DOMRect)=>{const colours:number[][]=[];for(let x=Math.ceil(box.left);x<box.right;x++)for(let y=Math.ceil(box.top);y<box.bottom;y++)colours.push(pixel(x,y));return Math.hypot(...[0,1,2].map(i=>Math.max(...colours.map(p=>p[i]!))-Math.min(...colours.map(p=>p[i]!))));};
      let countPixels=0,countInk=0;for(let x=Math.ceil(count.left);x<count.right;x++)for(let y=Math.ceil(count.top);y<count.bottom;y++){countPixels++;if(dist(pixel(x,y),[7,25,35])<35)countInk++;}
      return {id:g.getAttribute("data-country"),n,share:paint/n,contrast:contrast(name),countContrast:contrast(count),countInk:countInk/countPixels};
    });
  },{png,palette});
  expect(pixels).toHaveLength(46); for(const p of pixels){expect(p.n,p.id!).toBeGreaterThan(20);expect(p.share,p.id!).toBeGreaterThan(.6);expect(p.contrast,p.id!).toBeGreaterThan(100);expect(p.countContrast,p.id!).toBeGreaterThan(100);expect(p.countInk,p.id!).toBeGreaterThan(.04);}
});


test("exact topology, bonuses and initial createGame ownership and counts",async({page})=>{
 const r=createGame({...defaultOptions(),seed:1994,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]});if(!r.ok)throw Error("fixture refused");
 for(const p of r.state.map.provinces){const g=country(page,p.id);await expect(g).toHaveAttribute("data-owner",r.state.ownerOf[p.id]!);await expect(g).toHaveAttribute("data-armies",String(r.state.armies[p.id]));await expect(g.locator(".army-count")).toHaveText(`${r.state.players.findIndex(x=>x.id===r.state.ownerOf[p.id])+1} · ${r.state.armies[p.id]}`);}
 await expect(page.locator("[data-island]")).toHaveCount(9);for(const i of map.islands)await expect(page.locator(`[data-island="${i.id}"]`)).toContainText(`${i.name}  /  +${i.bonus}`);
 for(const [kind,field] of [["border","borders"],["sea","seaLanes"]] as const){
 const edges=page.locator(`[data-connection="${kind}"]`);expect(await edges.evaluateAll(ns=>ns.map(n=>[n.getAttribute("data-from"),n.getAttribute("data-to")].sort().join("|")).sort())).toEqual(pairs(field));
 expect(await edges.evaluateAll(ns=>ns.every(n=>{const line=n as SVGGeometryElement;return ["from","to"].every((side,i)=>{const shape=document.querySelector(`[data-country="${line.getAttribute(`data-${side}`)}"] .country-shape`) as SVGGeometryElement;const p=line.getPointAtLength(i?line.getTotalLength():0).matrixTransform(line.getScreenCTM()!).matrixTransform(shape.getScreenCTM()!.inverse());return shape.isPointInFill(p);});}))).toBe(true);
 expect(await edges.evaluateAll(ns=>ns.every(n=>{const p=n as SVGGeometryElement,s=getComputedStyle(p);return p.getTotalLength()>0&&s.stroke!=="none"&&Number(s.strokeOpacity)>0;}))).toBe(true);
 }
});
test("placement clicks, keyboard selection, real apply attack and seat handoff",async({page})=>{
 const r=createGame({...defaultOptions(),seed:1994,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]});if(!r.ok)throw Error("fixture refused");let state=r.state;
 const mover=state.players[state.currentPlayer]!.id;
 const source=state.map.provinces.find(p=>state.ownerOf[p.id]===mover&&[...p.borders,...p.seaLanes].some(id=>state.ownerOf[id]!==mover))!;
 const pool=state.reinforcementPool;
 await expect(page.locator("#start-combat-button")).toBeDisabled();
 for(let i=0;i<pool;i++){await country(page,source.id).click();const a=apply(state,{kind:"reinforce",province:source.id,amount:1});if(!a.ok)throw Error(a.error);state=a.state;await expect(page.locator("#reinforcement-pool")).toHaveText(String(pool-i-1));}
 await expect(country(page,source.id).locator(".army-count")).toContainText(String(state.armies[source.id]));
 await page.locator("#start-combat-button").click();const combat=apply(state,{kind:"endReinforcement"});if(!combat.ok)throw Error(combat.error);state=combat.state;
 await country(page,source.id).focus();await page.keyboard.press("Enter");await expect(country(page,source.id)).toBeFocused();await expect(country(page,source.id)).toHaveAttribute("aria-pressed","true");
 const target=attackTargets(state,source.id)[0]!;expect(target).toBeTruthy();await country(page,target).click();await page.locator("#attack-button").click();
 const result=apply(state,{kind:"attack",from:source.id,to:target});if(!result.ok)throw Error(result.error);state=result.state;
 await expect(page.locator("#result-dialog")).toBeVisible();await expect(page.locator("#result-dialog .verdict")).toBeVisible();
 for(const id of [source.id,target]){await expect(country(page,id)).toHaveAttribute("data-armies",String(state.armies[id]));await expect(country(page,id)).toHaveAttribute("data-owner",state.ownerOf[id]!);}
 await page.getByRole("button",{name:"Continue",exact:true}).click();await page.locator("#end-turn-button").click();const next=apply(state,{kind:"endTurn"});if(!next.ok)throw Error(next.error);
 await expect(page.locator("#turn-title")).toHaveText(`${next.state.players[next.state.currentPlayer]!.name}'s turn`);await expect(page.locator("#reinforcement-pool")).toHaveText(String(next.state.reinforcementPool));
});
test("refusal is visible and accessible seed/retry recovers",async({page})=>{
 await page.getByLabel("Seed",{exact:true}).fill("1506");await page.getByRole("button",{name:"Generate",exact:true}).click();await expect(page.getByRole("alert")).toContainText(/generation failed/i);await expect(page.locator("[data-country]")).toHaveCount(0);
 await page.getByRole("button",{name:"Retry",exact:true}).click();await expect(page.getByRole("alert")).toBeVisible();await expect(page.getByLabel("Seed",{exact:true})).toHaveValue("1506");
 await page.getByLabel("Seed",{exact:true}).fill("1994");await page.getByRole("button",{name:"Generate",exact:true}).click();await expect(page.locator("[data-country]")).toHaveCount(46);await expect(page.getByRole("alert")).toHaveCount(0);
});
test("golden: generated gameplay opening",async({page})=>{await settle(page);await expect(page.locator("#generated-game")).toHaveScreenshot("generated-game.png");});


test("seat cards keep all text inside the gameplay panel", async ({ page }) => {
  await settle(page);
  const fit = await page.locator(".score-num, .score-name, .turn-title, .turn-sub").evaluateAll(elements =>
    elements.map(element => {
      const card = element.closest(".card")!.getBoundingClientRect();
      const panel = element.closest(".panel")!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      const lines = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
      return {
        text: element.textContent,
        title: element.classList.contains("turn-title"),
        lineCount: lines.length,
        fits: lines.every(rect => rect.left >= Math.max(card.left, panel.left, 0)
          && rect.right <= Math.min(card.right, panel.right, window.innerWidth)
          && rect.top >= Math.max(card.top, panel.top, 0)
          && rect.bottom <= Math.min(card.bottom, panel.bottom, window.innerHeight)),
      };
    }),
  );
  expect(fit.length).toBeGreaterThan(0);
  for (const text of fit) {
    expect(text.fits, `${text.text}: text clipped by its card or panel`).toBe(true);
    if (text.title) expect(text.lineCount, `${text.text}: turn title stays on one line`).toBe(1);
  }
});
