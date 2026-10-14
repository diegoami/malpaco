import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { generateBoard } from "../../src/core";

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
const country = (page: Page, id: string) => page.locator(`#generated-prototype [data-country="${id}"]`);
async function settle(page: Page) { await page.evaluate(async()=>{ await document.fonts.ready; await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished)); }); }
test.beforeEach(async ({page})=>{ await page.goto("/?view=generated-prototype&seed=1994"); await expect(page.locator("#generated-prototype")).toBeVisible(); });

test("46 countries and full names are painted, readable, distinct and in the viewport", async ({page}, info)=>{
  await expect(page.locator("[data-country]")).toHaveCount(46);
  for(const p of map.provinces) { await expect(country(page,p.id)).toHaveAttribute("role","button"); await expect(country(page,p.id).locator(".country-name")).toHaveText(p.name); }
  await settle(page);
  const geometry = await page.locator(".country-name").evaluateAll(nodes=>nodes.map(node=>{
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
  const pixels=await page.evaluate(async png=>{
    const image=new Image(); image.src=`data:image/png;base64,${png}`; await image.decode(); const c=document.createElement("canvas"); c.width=image.width;c.height=image.height; const ctx=c.getContext("2d",{willReadFrequently:true})!; ctx.drawImage(image,0,0);
    const pixel=(x:number,y:number)=>Array.from(ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data).slice(0,3);
    const dist=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]!));
    const svg=document.querySelector("#generated-map") as unknown as SVGSVGElement; const rect=svg.getBoundingClientRect(); const sea=pixel(rect.left+2,rect.top+2);
    return [...document.querySelectorAll("[data-country]")].map(g=>{
      const p=g.querySelector(".country-shape") as SVGGeometryElement; const t=g.querySelector(".country-name") as SVGTextElement; const name=t.getBoundingClientRect(); const expected=(getComputedStyle(p).fill.match(/[\d.]+/g)??[]).slice(0,3).map(Number); const b=p.getBBox(); const m=p.getScreenCTM()!; let n=0,paint=0;
      for(let x=b.x+3;x<b.x+b.width-3;x+=4) for(let y=b.y+3;y<b.y+b.height-3;y+=4) {if(!p.isPointInFill(new DOMPoint(x,y)))continue; const q=new DOMPoint(x,y).matrixTransform(m); if(q.x>=name.left-2&&q.x<=name.right+2&&q.y>=name.top-2&&q.y<=name.bottom+2)continue; n++; if(dist(pixel(q.x,q.y),expected)<28 && dist(expected,sea)>60)paint++;}
      const colours:number[][]=[]; for(let x=Math.ceil(name.left);x<name.right;x++)for(let y=Math.ceil(name.top);y<name.bottom;y++)colours.push(pixel(x,y));
      const ranges=[0,1,2].map(i=>Math.max(...colours.map(p=>p[i]!))-Math.min(...colours.map(p=>p[i]!)));
      return {id:g.getAttribute("data-country"),n,share:paint/n,contrast:Math.hypot(...ranges)};
    });
  },png);
  expect(pixels).toHaveLength(46); for(const p of pixels){expect(p.n,p.id!).toBeGreaterThan(20);expect(p.share,p.id!).toBeGreaterThan(.6);expect(p.contrast,p.id!).toBeGreaterThan(100);}
});

test("all island bonuses and exact border/sea connections, click and keyboard selection",async({page})=>{
  await expect(page.locator("[data-island]")).toHaveCount(9);
  for(const i of map.islands) { const title=page.locator(`[data-island="${i.id}"]`); await expect(title).toContainText(i.name); await expect(title).toContainText(String(i.bonus)); }
  for(const [kind,field] of [["border","borders"],["sea","seaLanes"]] as const){
    const edges=page.locator(`[data-connection="${kind}"]`);
    expect(await edges.evaluateAll(nodes=>nodes.map(n=>[n.getAttribute("data-from"),n.getAttribute("data-to")].sort().join("|")).sort())).toEqual(pairs(field));

    // [designed] endpoint within its declared country or within 6 screen pixels
    // of its coast permits boundary-clipped lines; inspected SVGGeometryElement
    // placement in MapView. Endpoints are measured, not inferred from attributes.
    const anchors=await edges.evaluateAll(nodes=>nodes.map(node=>{
      const line=node as SVGGeometryElement;
      return ["from","to"].map((side,index)=>{
        const id=line.getAttribute(`data-${side}`)!;
        const shape=document.querySelector(`[data-country="${id}"] .country-shape`) as SVGGeometryElement;
        const endpoint=line.getPointAtLength(index===0?0:line.getTotalLength()).matrixTransform(line.getScreenCTM()!);
        const local=endpoint.matrixTransform(shape.getScreenCTM()!.inverse());
        if(shape.isPointInFill(local))return true;
        const length=shape.getTotalLength(); let distance=Infinity;
        for(let t=0;t<=length;t+=1){const q=shape.getPointAtLength(t).matrixTransform(shape.getScreenCTM()!);distance=Math.min(distance,Math.hypot(endpoint.x-q.x,endpoint.y-q.y));}
        return distance<=6;
      });
    }));
    for(const anchored of anchors)expect(anchored,`${kind}: edge endpoints belong to declared countries`).toEqual([true,true]);
    // SVG stroke-only paths may have zero-width/height bounding boxes. Inspect
    // painted stroke eligibility and length instead of DOM box visibility.
    const strokes=await edges.evaluateAll(nodes=>nodes.map(node=>{
      const path=node as SVGGeometryElement, style=getComputedStyle(path);
      let visible=true;
      for(let e:Element|null=path;e;e=e.parentElement){const s=getComputedStyle(e);if(s.display==="none"||s.visibility!=="visible"||Number(s.opacity)===0)visible=false;}
      return visible && path.getTotalLength()>0 && style.stroke!=="none" && Number(style.strokeOpacity)>0 && parseFloat(style.strokeWidth)>0;
    }));
    expect(strokes.every(Boolean),`${kind}: drawable visible strokes`).toBe(true);
  }
  await expect(page.locator('[data-connection="sea"]')).toHaveCount(16);
  // Distinct styles must convey sea versus border even before selection.
  const style=async(kind:string)=>page.locator(`[data-connection="${kind}"]`).first().evaluate(e=>({stroke:getComputedStyle(e).stroke,dash:getComputedStyle(e).strokeDasharray}));
  expect(await style("sea")).not.toEqual(await style("border"));
  for(const [index,p] of map.provinces.entries()) {
    const c=country(page,p.id); if(index%3===0)await c.click(); else {await c.focus(); await page.keyboard.press(index%3===1?"Enter":"Space");await expect(c).toBeFocused();}
    await expect(c).toHaveAttribute("aria-pressed","true"); await expect(page.locator("#selected-country")).toHaveText(`${p.name} (${p.id})`);
    for(const [kind,ids] of [["border",p.borders],["sea",p.seaLanes]] as const) {
      const items=page.locator(`#selected-neighbours [data-neighbour-kind="${kind}"]`);
      expect((await items.allTextContents()).sort()).toEqual(ids.map(id=>`${map.provinces.find(q=>q.id===id)!.name} (${id})`).sort());
    }
    expect(await page.locator('[data-country][data-neighbour="true"]').evaluateAll(ns=>ns.map(n=>n.getAttribute("data-country")).sort())).toEqual([...p.borders,...p.seaLanes].sort());
    expect(await page.locator('[data-connection][data-highlighted="true"]').evaluateAll(ns=>ns.map(n=>[n.getAttribute("data-from"),n.getAttribute("data-to")].sort().join("|")).sort())).toEqual([...p.borders,...p.seaLanes].map(id=>[p.id,id].sort().join("|")).sort());
  }
});

test("editable seeds, reload stability, actual generation failure and retry",async({page})=>{
  for(const seed of [1,2,3,7,42,1994]) {
    await page.getByLabel("Seed",{exact:true}).fill(String(seed)); await page.getByRole("button",{name:"Generate",exact:true}).click(); await expect(page).toHaveURL(new RegExp(`seed=${seed}(?:&|$)`));
    expect(await page.locator(".country-name").allTextContents()).toEqual(board(seed).provinces.map(p=>p.name));
  }
  const before=await page.locator("#generated-map").innerHTML(); await page.reload(); await expect(page.locator("#generated-map")).toHaveJSProperty("innerHTML",before);
  await page.getByLabel("Seed",{exact:true}).fill("1506");await page.getByRole("button",{name:"Generate",exact:true}).click();await expect(page.getByRole("alert")).toContainText(/generation.*failed/i); await expect(page.locator("[data-country]")).toHaveCount(0);
  await page.getByRole("button",{name:"Retry",exact:true}).click();await expect(page.getByRole("alert")).toBeVisible();await expect(page.getByLabel("Seed",{exact:true})).toHaveValue("1506");
  await page.getByLabel("Seed",{exact:true}).fill("1994");await page.getByRole("button",{name:"Generate",exact:true}).click();await expect(page.getByRole("alert")).toHaveCount(0);await expect(page.locator("[data-country]")).toHaveCount(46);
});

test("golden: settled opt-in generated preview",async({page})=>{await page.mouse.move(1,1);await settle(page);await expect(page.locator("#generated-prototype")).toHaveScreenshot("generated-preview.png");});
