import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {mkdirSync,mkdtempSync,readFileSync} from "node:fs";
import {join} from "node:path";
import type fixtureData from "../../docs/prototypes/new-game/T63/board.json";
const raw:typeof fixtureData=JSON.parse(readFileSync(new URL("../../docs/prototypes/new-game/T63/board.json",import.meta.url),"utf8"));
import {createReferenceGame} from "../../src/core/reference-game";
import {defaultOptions,apply,attackTargets} from "../../src/core";
import type {GameMap,Province} from "../../src/core";
import {nextAction,policyFor,ACTION_BUDGET} from "../helpers/complete-game";
const map:GameMap={id:"reference-coast-first-a",name:"Nine Isles",bounds:raw.bounds,provinces:raw.provinces as unknown as readonly Province[],islands:raw.islands};
function opening(){const r=createReferenceGame(map,{...defaultOptions(),seed:1994,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]});if(!r.ok)throw Error(r.errors.join(";"));return r.state;}
const country=(page:Page,id:string)=>page.locator(`[data-country="${id}"]`);
async function setup(page:Page){await page.goto("/?view=reference-game");await expect(page.getByRole("heading",{name:"New reference game",exact:true})).toBeVisible();await page.getByLabel("Seed",{exact:true}).fill("1994");await page.getByLabel("Human seats").selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.locator("#reference-game")).toBeVisible();}
async function capture(page:Page,name:string,project:string){const root=process.env["REFERENCE_EVIDENCE_DIR"]??"screenshots";mkdirSync(root,{recursive:true});const dir=mkdtempSync(join(root,"reference-"));await page.mouse.move(0,0);await page.screenshot({path:join(dir,`${name}-${project}.png`)});}
async function panelTextFits(page:Page){
 // [designed] One CSS pixel for rectangle rounding, as in the existing complete-game fit guard.
 const boxes=await page.evaluate(()=>[...document.querySelectorAll(".panel .score-num,.panel .score-name,.panel .turn-title,.panel .turn-sub,.panel .step-value,.panel button")].map(n=>{
  const range=document.createRange();range.selectNodeContents(n);const lines=[...range.getClientRects()];const panel=n.closest(".panel")!.getBoundingClientRect(),card=(n.closest(".card")??n.parentElement)!.getBoundingClientRect();
  return {text:n.textContent,visible:lines.length>0,fits:lines.every(b=>b.left>=Math.max(0,panel.left,card.left)-1&&b.right<=Math.min(innerWidth,panel.right,card.right)+1&&b.top>=Math.max(0,panel.top,card.top)-1&&b.bottom<=Math.min(innerHeight,panel.bottom,card.bottom)+1)};
 })).then(rows=>rows.filter(r=>r.visible));
 expect(boxes.length).toBeGreaterThan(4);expect(boxes.filter(b=>!b.fits)).toEqual([]);
}
test("reference setup paints exact A geometry, routes, live counts and reachable controls",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await setup(page);const state=opening();
 await expect(page.locator("[data-country]")).toHaveCount(46);
 for(const p of map.provinces){const n=country(page,p.id);await expect(n.locator(".country-shape")).toHaveAttribute("d","M"+p.polygon.map(q=>q.join(",")).join("L")+"Z");await expect(n).toHaveAttribute("data-owner",state.ownerOf[p.id]!);await expect(n).toHaveAttribute("data-armies",String(state.armies[p.id]));await expect(n.locator(".army-count")).toHaveText(`${state.players.findIndex(q=>q.id===state.ownerOf[p.id])+1} · ${state.armies[p.id]}`);}
 expect(await page.locator(".lane").evaluateAll(ns=>ns.map(n=>({edge:(n as SVGElement).dataset["edge"],points:n.getAttribute("points")})))).toEqual(raw.routes.map(r=>({edge:[r.from,r.to].sort().join("|"),points:r.points.map(p=>p.join(",")).join(" ")})));
 const text=await page.locator(".country-label").evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect(),count=n.querySelector(".army-count")!,s=getComputedStyle(count),m=(count as SVGGraphicsElement).getScreenCTM()!;return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height,countPx:parseFloat(s.fontSize)*Math.hypot(m.a,m.b),display:s.display,opacity:s.opacity};}));
 const v=page.viewportSize()!;for(const t of text){expect(t.width).toBeGreaterThan(0);expect(t.height).toBeGreaterThan(0);expect(t.countPx).toBeGreaterThanOrEqual(14-.01);expect(t.display).not.toBe("none");expect(Number(t.opacity)).toBeGreaterThan(0);expect(t.x).toBeGreaterThanOrEqual(0);expect(t.y).toBeGreaterThanOrEqual(0);expect(t.right).toBeLessThanOrEqual(v.width);expect(t.bottom).toBeLessThanOrEqual(v.height);}
 for(let i=0;i<text.length;i++)for(let j=i+1;j<text.length;j++){const a=text[i]!,b=text[j]!;expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,"labels overlap").toBe(true);}
 for(const id of ["start-combat-button","end-turn-button","attack-button","new-game-button"]){await expect(page.locator(`#${id}`)).toBeVisible();const b=await page.locator(`#${id}`).boundingBox();expect(b).not.toBeNull();expect(b!.x+b!.width).toBeLessThanOrEqual(v.width);expect(b!.y+b!.height).toBeLessThanOrEqual(v.height);}
 const first=country(page,map.provinces[0]!.id),second=country(page,map.provinces[1]!.id);await first.focus();
 for(const[key,target]of [["ArrowRight",second],["ArrowLeft",first],["ArrowDown",second],["ArrowUp",first]] as const){await page.keyboard.press(key);await expect(target).toBeFocused();}await first.evaluate(n=>(n as SVGElement).blur());
 await panelTextFits(page);await capture(page,"opening",info.project.name);await expect(page.locator("#reference-game")).toHaveScreenshot("reference-game.png");
 for(const seats of [3,4]){await page.locator("#new-game-button").click();await page.getByLabel("Human seats").selectOption(String(seats));await page.getByRole("button",{name:"Start game",exact:true}).click();await expect(page.locator("[data-player]")).toHaveCount(seats);for(const id of ["start-combat-button","end-turn-button","attack-button","new-game-button"]){const b=await page.locator(`#${id}`).boundingBox();expect(b).not.toBeNull();expect(b!.x+b!.width).toBeLessThanOrEqual(v.width);expect(b!.y+b!.height).toBeLessThanOrEqual(v.height);}await panelTextFits(page);await capture(page,`${seats}-seats`,info.project.name);}
 expect(errors).toEqual([]);
});
test("ordinary reference clicks place, attack, hand off and replay legally to a winner",async({page},info)=>{
 test.setTimeout(240000);const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await page.emulateMedia({reducedMotion:"reduce"});await setup(page);
 let state=opening();const policy=policyFor(state);let actions=0,attacks=0,handoffs=0,placements=0;
 while(state.phase!=="finished"&&actions<ACTION_BUDGET){
  const action=nextAction(state,policy),r=apply(state,action);if(!r.ok)throw Error(r.error);
  if(action.kind==="reinforce"){await country(page,action.province).click();placements++;await expect(page.locator("#reinforcement-pool")).toHaveText(String(r.state.reinforcementPool));await expect(country(page,action.province).locator(".army-count")).toHaveText(`${r.state.players.findIndex(p=>p.id===r.state.ownerOf[action.province])+1} · ${r.state.armies[action.province]}`);}
  else if(action.kind==="endReinforcement")await page.locator("#start-combat-button").click();
  else if(action.kind==="endTurn"){await page.locator("#end-turn-button").click();handoffs++;await expect(page.locator("#turn-title")).toHaveText(`${r.state.players[r.state.currentPlayer]!.name}'s turn`);}
  else if(action.kind==="attack"){
   const from=country(page,action.from);if(attacks===0){await from.focus();await page.keyboard.press("Enter");await expect(from).toHaveAttribute("aria-pressed","true");}else if(await from.getAttribute("aria-pressed")!=="true")await from.click();
   expect(await page.locator('[data-target="true"]').evaluateAll(ns=>ns.map(n=>(n as SVGElement).dataset["country"]).sort())).toEqual([...attackTargets(state,action.from)].sort());
   // Integration guard: legal target markers must correspond to painted outlines.
   await expect.poll(async()=>await page.locator('[data-target="true"] .cell').evaluateAll(ns=>ns.every(n=>{const s=getComputedStyle(n);return s.stroke==="rgb(245, 220, 130)"&&parseFloat(s.strokeWidth)>=1.5&&Number(s.opacity)>0;}))).toBe(true);
   await country(page,action.to).click();await page.locator("#attack-button").click();await expect(page.locator("#result-dialog")).toBeVisible();
   for(const id of [action.from,action.to]){await expect(country(page,id)).toHaveAttribute("data-owner",r.state.ownerOf[id]!);await expect(country(page,id)).toHaveAttribute("data-armies",String(r.state.armies[id]));await expect(country(page,id).locator(".army-count")).toHaveText(`${r.state.players.findIndex(p=>p.id===r.state.ownerOf[id])+1} · ${r.state.armies[id]}`);}
   if(attacks===0)await capture(page,"first-attack",info.project.name);attacks++;await page.getByRole("button",{name:"Continue",exact:true}).click();
  }
  else throw new Error(`Unexpected legacy action: ${action.kind}`);
  state=r.state;actions++;
 }
 expect(actions).toBeLessThan(ACTION_BUDGET);expect(placements).toBeGreaterThan(0);expect(attacks).toBeGreaterThan(0);expect(handoffs).toBeGreaterThan(0);expect(state.phase).toBe("finished");expect(state.winner).toBe(policy.conqueror);
 const winner=state.players.find(p=>p.id===state.winner)!;await expect(page.locator("#turn-title")).toHaveText(`${winner.name} conquers the sea`);await expect(page.locator(`#attack-button`)).toBeDisabled();await expect(page.locator("#new-game-button")).toBeEnabled();await panelTextFits(page);await capture(page,"winner",info.project.name);
 await page.locator("#new-game-button").click();await expect(page.getByRole("heading",{name:"New reference game",exact:true})).toBeVisible();await expect(page.getByLabel("Seed",{exact:true})).toHaveValue("1994");
 console.log(JSON.stringify({project:info.project.name,actions,attacks,handoffs,placements,winner:state.winner}));expect(errors).toEqual([]);
});
