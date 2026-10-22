import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
import {pinned} from "../core/versioned-match-fixture";
import type {TestInfo} from "@playwright/test";
import {build} from "vite";
import {countLabel,seatLook,SEAT_NAMES} from "../../src/ui/palette";

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
 for(const r of rows){expect(r.text).toBe(r.army);expect(r.label).toMatch(new RegExp(`, (You|${SEAT_NAMES[players.indexOf(r.owner)]}), ${r.army} armies$`));expect(r.label).not.toMatch(/Seat \d/);expect(r.nameSize).toBeLessThanOrEqual(r.countSize*.7);expect(r.nameWeight).toBeLessThan(r.countWeight);expect(r.nameVisible).toBe(false);expect(r.shape).toBe(seatLook(players.indexOf(r.owner)).badge);}
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
 try{await opening(touch);const node=touch.locator("[data-country]").first();const label=await node.getAttribute("aria-label");const box=await node.boundingBox();expect(box).not.toBeNull();await touch.touchscreen.tap(box!.x+box!.width/2,box!.y+box!.height/2);await expect(node).toHaveAttribute("aria-label",/, (You|Blue|Orange|Green|Purple), \d+ armies/);expect(label).toBeTruthy();await expect(node.locator(".name").first()).toBeVisible();await shot(touch,"touch",info.project.name);}finally{await context.close();}
});

// T87 (A, B, E): the real geographic map view at phone, tablet and desktop Fit. Small regions
// carry nonsequential 2-digit, 3-digit and compact >999 counts with exact accessible values;
// every count is at least 14 px, sits in a badge centred on its own country, and its paint
// never takes a tap from that country; source, candidate and chosen target differ without hue.
const SIZES=[{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}] as const;
const SEED=7;
let bundle:{js:string;css:string};


type View={selected:string|null;target:string|null;targets:string[]};
async function mount(page:Page,armies:Record<string,number>,view:View){
 await page.setContent(`<!doctype html><html><head><style>${bundle.css}</style></head><body></body></html>`);
 await page.addScriptTag({content:bundle.js});
 const mounted=await page.evaluate(([a,v,seed])=>(window as unknown as {MapHarness:{mount:(s:number,a:Record<string,number>,v:View)=>{ids:string[]}}}).MapHarness.mount(seed,a,v),[armies,view,SEED] as const);
 // The camera fits once it has measured the board.
 await expect.poll(()=>page.locator('#geographic-map').getAttribute('viewBox')).not.toBeNull();await page.waitForTimeout(150);
 return mounted.ids;
}
/** The five smallest countries on screen, smallest first. */
const smallest=(page:Page)=>page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>{const r=n.querySelector('.cell')!.getBoundingClientRect();return {id:(n as HTMLElement).dataset['country']!,area:r.width*r.height};}).sort((a,b)=>a.area-b.area).slice(0,5).map(c=>c.id));
async function fitShot(page:Page,info:TestInfo,name:string){await page.screenshot({path:info.outputPath(`${name}.png`)});}

test.describe('T87 annotation hierarchy',()=>{
 test.beforeAll(async()=>{
  const out=await build({configFile:false,logLevel:'silent',build:{write:false,cssCodeSplit:false,lib:{entry:'tests/e2e/harness/map-harness.ts',formats:['iife'],name:'MapHarness',fileName:()=>'harness.js'}}});
  const files=(Array.isArray(out)?out[0]!:out as {output:{fileName:string;code?:string;source?:string|Uint8Array}[]}).output;
  const text=(end:string)=>{const f=files.find(f=>f.fileName.endsWith(end)) as unknown as {code?:string;source?:unknown};return String(f.code??f.source);};
  bundle={js:text('.js'),css:text('.css')};
 });
 test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes are set here, so one project suffices'));
for(const size of SIZES)test(`counts, badges and selection states read at Fit at ${size.width}×${size.height}`,async({page},info)=>{
 await page.setViewportSize(size);
 // First pass finds the smallest regions; the second gives them the hard counts.
 const ids=await mount(page,{},{selected:null,target:null,targets:[]});
 const small=await smallest(page),counts=[48,7,1250,315,23999];
 const armies=Object.fromEntries(small.map((id,i)=>[id,counts[i]!]));
 const [source,target,candidate]=ids.filter(id=>!small.includes(id)) as [string,string,string];
 await mount(page,armies,{selected:source,target,targets:[target,candidate]});
 const read=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>{
  const count=n.querySelector<SVGTextElement>('.count')!,badge=n.querySelector<SVGGraphicsElement>('.badge')!,cell=n.querySelector<SVGGeometryElement>('.cell')!;
  const b=badge.getBoundingClientRect(),t=count.getBoundingClientRect(),m=count.getScreenCTM()!;
  const cx=b.x+b.width/2,cy=b.y+b.height/2,centre=new DOMPoint(cx,cy).matrixTransform(cell.getScreenCTM()!.inverse());
  return {id:(n as HTMLElement).dataset['country']!,label:n.getAttribute('aria-label')!,text:count.textContent!,
   px:parseFloat(getComputedStyle(count).fontSize)*Math.hypot(m.a,m.b),
   inBadge:t.left>=b.left-0.5&&t.right<=b.right+0.5&&t.top>=b.top-0.5&&t.bottom<=b.bottom+0.5,
   onLand:cell.isPointInFill(centre),hit:document.elementFromPoint(cx,cy)?.closest('[data-country]')===n};
 }));
 expect(read).toHaveLength(46);
 for(const c of read){
  const exact=armies[c.id];
  if(exact!==undefined){expect(c.text,c.id).toBe(countLabel(exact));expect(c.label,c.id).toContain(`${exact} armies`);}
  expect(c.px,`${c.id} count px`).toBeGreaterThanOrEqual(14-0.01);
  expect(c,`${c.id} badge`).toMatchObject({inBadge:true,onLand:true,hit:true});
 }
 // The compact counts are short; the exact value stays in the accessible name.
 expect(read.find(c=>c.id===small[4])!.text).toBe('23k');expect(read.find(c=>c.id===small[2])!.text).toBe('1.2k');
 // Source, candidate and chosen target: pattern and mark, not hue alone.
 const style=(id:string)=>page.locator(`[data-country="${id}"]`).evaluate(n=>{const ring=getComputedStyle(n.querySelector('.ring')!),mark=getComputedStyle(n.querySelector('.target-mark')!);return {ring:ring.stroke!=='none',dashed:ring.strokeDasharray!=='none',mark:mark.display!=='none',pressed:n.getAttribute('aria-pressed')};});
 expect(await style(source)).toEqual({ring:true,dashed:false,mark:false,pressed:'true'});
 expect(await style(candidate)).toEqual({ring:true,dashed:true,mark:false,pressed:'false'});
 expect(await style(target)).toEqual({ring:true,dashed:false,mark:true,pressed:'false'});
 expect(await style(small[0]!)).toEqual({ring:false,dashed:false,mark:false,pressed:'false'});
 await fitShot(page,info,`fit-${size.width}x${size.height}`);
});

test('reduced motion: no transitions on the map',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
 const ids=await mount(page,{},{selected:null,target:null,targets:[]});
 // The global reduced-motion rule shortens every transition to a near-zero duration.
 expect(await page.locator(`[data-country="${ids[0]}"] .cell`).evaluate(n=>parseFloat(getComputedStyle(n).transitionDuration))).toBeLessThan(0.01);
 await page.emulateMedia({reducedMotion:'no-preference'});
 expect(await page.locator(`[data-country="${ids[0]}"] .cell`).evaluate(n=>parseFloat(getComputedStyle(n).transitionDuration))).toBeGreaterThan(0.1);
});
});

test("the active country's name is drawn above every country: hover, focus and selection (owner report, 0.2.0 candidate)",async({page},info)=>{
 test.skip(info.project.name!=='1280x800','one size suffices');
 await page.goto('/?seed=7&control=manual');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 const top=page.locator('#geographic-map .name-top');
 const state=()=>top.evaluate(t=>({name:t.querySelector('.name')!.textContent,shown:t.getAttribute('display')!=='none'&&getComputedStyle(t.querySelector('.name')!).display!=='none',last:t.parentElement!.lastElementChild===t}));
 await page.mouse.move(0,0);expect((await state()).shown).toBe(false);
 const ids=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>(n as HTMLElement).dataset['country']!));
 const name=(id:string)=>page.locator(`[data-country="${id}"] .name`).textContent();
 // Hover: the copy is the last thing painted, so no later country covers it.
 await page.locator(`[data-country="${ids[3]}"] .badge`).hover({force:true});
 expect(await state()).toEqual({name:await name(ids[3]!),shown:true,last:true});
 // Keyboard focus, with the pointer away.
 await page.mouse.move(0,0);await page.locator(`[data-country="${ids[5]}"]`).focus();
 expect(await state()).toEqual({name:await name(ids[5]!),shown:true,last:true});
 await page.locator(`[data-country="${ids[5]}"]`).blur();expect((await state()).shown).toBe(false);
});
