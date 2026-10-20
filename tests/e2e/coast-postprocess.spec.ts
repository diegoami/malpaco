import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import type expectedType from "../../fixtures/new-game/T64/acceptance/board.json";
const expected:typeof expectedType=JSON.parse(readFileSync(new URL("../../fixtures/new-game/T64/acceptance/board.json",import.meta.url),"utf8"));
import type originalType from "../../fixtures/new-game/T63/board.json";
const original:typeof originalType=JSON.parse(readFileSync(new URL("../../fixtures/new-game/T63/board.json",import.meta.url),"utf8"));
import {fixture,step} from "./battle-fixture";
import {deserializeVersionedMatch} from "../../src/core/match-save";
import {logicalState} from "../core/versioned-match-fixture";
const root=process.env["COAST_EVIDENCE_DIR"]??"screenshots";
const country=(page:Page,id:string)=>page.locator(`[data-id="${id}"]`);
function output(label:string){mkdirSync(root,{recursive:true});return mkdtempSync(join(root,label+"-"));}
async function shot(page:Page,dir:string,name:string){await page.mouse.move(0,0);await page.screenshot({path:join(dir,name+".png")});}
async function closeups(page:Page,dir:string,prefix:string){for(const [index,name]of[[7,"cliff"],[8,"great"]] as const)await page.locator(".coast").nth(index).screenshot({path:join(dir,`${prefix}-${name}.png`)});}
const playablePaint:typeof expectedType=JSON.parse(readFileSync(new URL("../../fixtures/new-game/T65/board.json",import.meta.url),"utf8"));
async function painted(page:Page,expectedPaint=expected){
 const expected=expectedPaint;
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
 const captions=await page.locator(".island-name").evaluateAll(nodes=>nodes.map(node=>{
  const b=(node as SVGGraphicsElement).getBBox(),coasts=[...node.closest("svg")!.querySelectorAll<SVGGeometryElement>(".coast")];
  const onLand=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height],[b.x+b.width/2,b.y+b.height/2]].some(([x,y])=>coasts.some(c=>c.isPointInFill(new DOMPoint(x,y))));
  const intersects=(a:DOMPoint,bp:DOMPoint)=>{
   let low=0,high=1;
   for(const [origin,delta,min,max]of[[a.x,bp.x-a.x,b.x-1,b.x+b.width+1],[a.y,bp.y-a.y,b.y-1,b.y+b.height+1]]){
    if(delta===0){if(origin!<min!||origin!>max!)return false;continue;}
    const t1=(min!-origin!)/delta!,t2=(max!-origin!)/delta!;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));
   }
   return low<=high;
  };
  const onRoute=[...node.closest("svg")!.querySelectorAll<SVGPolylineElement>(".lane")].some(line=>{const points=line.points;for(let j=1;j<points.numberOfItems;j++){const a=points.getItem(j-1),c=points.getItem(j);if(intersects(new DOMPoint(a.x,a.y),new DOMPoint(c.x,c.y)))return true;}return false;});
  return{text:node.textContent,onLand,onRoute,inFrame:b.x>=0&&b.y>=0&&b.x+b.width<=800&&b.y+b.height<=460};
 }));
 expect(captions).toHaveLength(9);expect(captions.filter(c=>c.onLand||c.onRoute||!c.inFrame),"island captions need unobstructed water space").toEqual([]);
 const labels=await page.locator(".country-label").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom};}));
 const viewport=page.viewportSize()!;for(const b of labels){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(viewport.width);expect(b.bottom).toBeLessThanOrEqual(viewport.height);}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i]!,b=labels[j]!;expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,`labels ${i}/${j} overlap`).toBe(true);}
}
for(const viewport of [{width:800,height:540},{width:1280,height:800},{width:1920,height:1080}])test(`standalone geography is painted and all46countries selectable at ${viewport.width}x${viewport.height}`,async({page},info)=>{
 const dir=output(`standalone-${viewport.width}-${info.project.name}`),errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await page.setViewportSize(viewport);
 await page.setContent(readFileSync(new URL("../../fixtures/new-game/T63/preview.html",import.meta.url),"utf8"));await shot(page,dir,"before-T63");await closeups(page,dir,"before-coast");
 await page.setContent(readFileSync(new URL("../../fixtures/map-1994/preview.html",import.meta.url),"utf8"));await shot(page,dir,"approved-T22-reference");
 await page.setContent(readFileSync(new URL("../../fixtures/new-game/T64/preview.html",import.meta.url),"utf8"));try{await painted(page);}finally{await shot(page,dir,"after-opening");await closeups(page,dir,"after-coast");}
 for(const p of expected.provinces){await country(page,p.id).click();await expect(country(page,p.id)).toHaveAttribute("aria-pressed","true");expect(await page.locator(".country.neighbor").evaluateAll(nodes=>nodes.map(n=>(n as SVGGElement).dataset["id"]).sort())).toEqual([...p.borders,...p.seaLanes].sort());const collisions=await page.locator(".country-label").evaluateAll(nodes=>{const boxes=nodes.map(n=>n.getBoundingClientRect());return boxes.flatMap((a,j)=>boxes.slice(j+1).flatMap((b,k)=>a.right>b.left&&b.right>a.left&&a.bottom>b.top&&b.bottom>a.top?[[j,j+k+1]]:[]));});expect(collisions,`selected ${p.id}: labels overlap`).toEqual([]);}
 await country(page,expected.provinces[0]!.id).focus();await page.keyboard.press("Space");await expect(country(page,expected.provinces[0]!.id)).toHaveAttribute("aria-pressed","true");
 await shot(page,dir,"selected");expect(errors).toEqual([]);
});
test("playable geography uses new paint/hit positions and ordinary deterministic attacks while saves keep canonical map",async({page},info)=>{
 const dir=output(`playable-${info.project.name}`),f=fixture("manual"),errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();
 try{await painted(page,playablePaint);}finally{await shot(page,dir,"opening");await closeups(page,dir,"coast");}
 for(const p of expected.provinces){await expect(country(page,p.id).locator(".centre")).toHaveAttribute("x",String(p.labelAt[0]!-25));await expect(country(page,p.id).locator(".centre")).toHaveAttribute("y",String(p.labelAt[1]!-10));}
 for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();
 const save=async()=>{const event=page.waitForEvent("download");await page.getByRole("button",{name:"Save game",exact:true}).click();const text=readFileSync((await(await event).path())!,"utf8");writeFileSync(join(dir,"save-"+Date.now()+".json"),text);return deserializeVersionedMatch(text).state;};
 let state=await save();await country(page,f.from).click();await country(page,f.to).click();state=step(state,{kind:"attack",from:f.from,to:f.to});expect(logicalState(await save())).toEqual(logicalState(state));
 expect(state.map.provinces.map(p=>p.polygon)).toEqual(original.provinces.map(p=>p.polygon));
 expect(state.map.provinces.map(p=>p.labelAt)).toEqual(original.provinces.map(p=>p.labelAt));
 await expect(country(page,f.from)).toHaveAttribute("aria-pressed","true");await shot(page,dir,"direct-attack");expect(errors).toEqual([]);
});
