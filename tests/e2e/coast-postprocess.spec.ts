import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import type expectedType from "../../docs/prototypes/new-game/T64/acceptance/board.json";
const expected:typeof expectedType=JSON.parse(readFileSync(new URL("../../docs/prototypes/new-game/T64/acceptance/board.json",import.meta.url),"utf8"));
import type originalType from "../../docs/prototypes/new-game/T63/board.json";
const original:typeof originalType=JSON.parse(readFileSync(new URL("../../docs/prototypes/new-game/T63/board.json",import.meta.url),"utf8"));
import {fixture,step} from "./battle-fixture";
import {deserializeVersionedMatch} from "../../src/core/match-save";
import {logicalState} from "../core/versioned-match-fixture";
const root=process.env["COAST_EVIDENCE_DIR"]??"screenshots";
const country=(page:Page,id:string)=>page.locator(`[data-id="${id}"]`);
function output(label:string){mkdirSync(root,{recursive:true});return mkdtempSync(join(root,label+"-"));}
async function shot(page:Page,dir:string,name:string){await page.mouse.move(0,0);await page.screenshot({path:join(dir,name+".png")});}
async function painted(page:Page){
 await expect(page.locator(".country")).toHaveCount(46);
 expect(await page.locator(".coast").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("d")))).toEqual(expected.islands.map(i=>"M"+i.polygon.map(p=>p.join(",")).join("L")+"Z"));
 for(const p of expected.provinces)await expect(country(page,p.id).locator(".cell")).toHaveAttribute("d","M"+p.polygon.map(q=>q.join(",")).join("L")+"Z");
 expect(await page.locator(".lane").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("points")))).toEqual(expected.routes.map(r=>r.points.map(p=>p.join(",")).join(" ")));
 const hits=await page.evaluate((board)=>board.provinces.map(p=>{
  const group=document.querySelector<SVGGElement>(`[data-id="${p.id}"]`)!,shape=group.querySelector<SVGGeometryElement>(".cell")!,matrix=shape.getScreenCTM()!;
  const [x,y]=p.labelAt,point=new DOMPoint(x!,y!).matrixTransform(matrix);
  const hit=document.elementFromPoint(point.x,point.y)?.closest(".country")?.getAttribute("data-id");
  const corners=[[-20,-20],[-20,20],[20,-20],[20,20]].every(([dx,dy])=>shape.isPointInFill(new DOMPoint(x!+dx!,y!+dy!)));
  return{id:p.id,hit,corners};
 }),expected);
 expect(hits.filter(p=>p.hit!==p.id||!p.corners)).toEqual([]);
 const labels=await page.locator(".country-label").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom};}));
 const viewport=page.viewportSize()!;for(const b of labels){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(viewport.width);expect(b.bottom).toBeLessThanOrEqual(viewport.height);}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i]!,b=labels[j]!;expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,`labels ${i}/${j} overlap`).toBe(true);}
}
for(const viewport of [{width:800,height:540},{width:1280,height:800},{width:1920,height:1080}])test(`standalone geography is painted and all46countries selectable at ${viewport.width}x${viewport.height}`,async({page},info)=>{
 const dir=output(`standalone-${viewport.width}-${info.project.name}`),errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await page.setViewportSize(viewport);
 await page.setContent(readFileSync(new URL("../../docs/prototypes/new-game/T63/preview.html",import.meta.url),"utf8"));await shot(page,dir,"before-T63");
 await page.setContent(readFileSync(new URL("../../docs/prototypes/map-1994/preview.html",import.meta.url),"utf8"));await shot(page,dir,"approved-T22-reference");
 await page.setContent(readFileSync(new URL("../../docs/prototypes/new-game/T64/preview.html",import.meta.url),"utf8"));await painted(page);await shot(page,dir,"after-opening");
 for(const p of expected.provinces){await country(page,p.id).click();await expect(country(page,p.id)).toHaveAttribute("aria-pressed","true");expect(await page.locator(".country.neighbor").evaluateAll(nodes=>nodes.map(n=>(n as SVGGElement).dataset["id"]).sort())).toEqual([...p.borders,...p.seaLanes].sort());}
 await country(page,expected.provinces[0]!.id).focus();await page.keyboard.press("Space");await expect(country(page,expected.provinces[0]!.id)).toHaveAttribute("aria-pressed","true");
 await shot(page,dir,"selected");expect(errors).toEqual([]);
});
test("playable geography uses new paint/hit positions and ordinary deterministic attacks while saves keep canonical map",async({page},info)=>{
 const dir=output(`playable-${info.project.name}`),f=fixture("manual"),errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/?control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();
 try{await painted(page);}finally{await shot(page,dir,"opening");}
 for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();
 const save=async()=>{const event=page.waitForEvent("download");await page.getByRole("button",{name:"Save game",exact:true}).click();const text=readFileSync((await(await event).path())!,"utf8");writeFileSync(join(dir,"save-"+Date.now()+".json"),text);return deserializeVersionedMatch(text).state;};
 let state=await save();await country(page,f.from).click();await country(page,f.to).click();state=step(state,{kind:"attack",from:f.from,to:f.to});expect(logicalState(await save())).toEqual(logicalState(state));
 expect(state.map.provinces.map(p=>p.polygon)).toEqual(original.provinces.map(p=>p.polygon));
 await expect(country(page,f.from)).toHaveAttribute("aria-pressed","true");await shot(page,dir,"direct-attack");expect(errors).toEqual([]);
});
