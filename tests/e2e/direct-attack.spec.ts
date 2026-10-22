import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {fixture,step,map} from "./battle-fixture";
import {activePlayer,attackTargets,whyNot} from "../../src/core";
import type {GameState} from "../../src/core";
import {deserializeVersionedMatch} from "../../src/core/match-save";
import {logicalState} from "../core/versioned-match-fixture";
import {openSurface,withSurface} from './shell';
test.use({hasTouch:true});
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
const output=process.env["ATTACK_EVIDENCE_DIR"]??"screenshots";
async function save(page:Page){const pending=page.waitForEvent("download");await withSurface(page,'settings',()=>page.getByRole("button",{name:"Save game",exact:true}).click());const text=readFileSync((await (await pending).path())!,"utf8");mkdirSync(output,{recursive:true});writeFileSync(join(mkdtempSync(join(output,"save-")),"match.json"),text);return text;}
async function check(page:Page,state:GameState){const text=await save(page);expect(logicalState(deserializeVersionedMatch(text).state)).toEqual(logicalState(state));expect(await page.locator("[data-country]").evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.getAttribute("data-country"),[n.getAttribute("data-owner"),Number(n.getAttribute("data-armies"))]])))).toEqual(Object.fromEntries(state.map.provinces.map(p=>[p.id,[state.ownerOf[p.id],state.armies[p.id]]])));return text;}
async function shot(page:Page,label:string,project:string){mkdirSync(output,{recursive:true});await page.mouse.move(0,0);await page.screenshot({path:join(output,`${label}-${project}.png`)});}
async function prepare(page:Page,kind:Parameters<typeof fixture>[0]="manual"){
 const f=fixture(kind);await page.clock.install();await page.clock.pauseAt(new Date());await page.goto("/?view=reference-game&control=manual");await page.getByLabel("Seed",{exact:true}).fill(String(f.seed));await page.getByLabel("Seats",{exact:true}).selectOption("2");await page.getByRole("button",{name:"Start game",exact:true}).click();for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator("#start-combat-button").click();return {...f,state:deserializeVersionedMatch(await save(page)).state};
}
// T82: a target activation only stages the pair; the card's Attack button fights one exchange.
async function attack(page:Page,touch=false){await openSurface(page,'actions');const b=page.locator("#single-exchange-button");if(touch)await b.tap();else await b.click();}
async function attackByKey(page:Page,key:string){await openSurface(page,'actions');const b=page.locator("#single-exchange-button");await b.focus();await expect(b).toBeFocused();await page.keyboard.press(key);}
async function context(page:Page,from:string,to:string){await expect(country(page,from)).toHaveAttribute("aria-pressed","true");await openSurface(page,'actions');await expect(page.locator("#battle-source-name")).toHaveText(map.provinces.find(p=>p.id===from)!.name);await openSurface(page,'actions');await expect(page.locator("#battle-target-name")).toHaveText(map.provinces.find(p=>p.id===to)!.name);}
test("mouse enemy activation stages; Attack fights once and repeats without source/target reselection",async({page},info)=>{
 const f=await prepare(page);let state=f.state;await country(page,f.from).click();await check(page,state);await country(page,f.to).click();await check(page,state);await attack(page);state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);await context(page,f.from,f.to);await country(page,f.to).click();await check(page,state);await attack(page);state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);await context(page,f.from,f.to);await page.clock.runFor(3000);await check(page,state);await shot(page,"mouse-repeat",info.project.name);
});
test("keyboard staging and Attack agree with mouse; held-key repeats are ignored and Shift selects only",async({page},info)=>{
 const f=await prepare(page);let state=f.state;await country(page,f.from).focus();await page.keyboard.press("Enter");await country(page,f.to).focus();await page.keyboard.press("Shift+Enter");await check(page,state);await context(page,f.from,f.to);
 await country(page,f.to).focus();await page.keyboard.press("Shift+Space");await check(page,state);
 await country(page,f.to).focus();await expect(country(page,f.to)).toBeFocused();await page.keyboard.press("Space");await check(page,state);await attackByKey(page,"Space");state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);
 for(const key of ["Enter"," "])await country(page,f.to).dispatchEvent("keydown",{key,repeat:true,bubbles:true});await check(page,state);
 await country(page,f.to).focus();await expect(country(page,f.to)).toBeFocused();await page.keyboard.press("Enter");await check(page,state);await attackByKey(page,"Enter");state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);await context(page,f.from,f.to);await shot(page,"keyboard-repeat",info.project.name);
});
test("touch target tap stages; a tapped Attack fights once and repeats",async({page},info)=>{
 const f=await prepare(page);let state=f.state;await country(page,f.from).tap();await country(page,f.to).tap();await check(page,state);await attack(page,true);state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);await country(page,f.to).tap();await check(page,state);await attack(page,true);state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);await context(page,f.from,f.to);await shot(page,"touch-repeat",info.project.name);
});
for(const quantity of ["minimum","intermediate","maximum"] as const)test(`direct capture ${quantity} waits for explicit choice through save/reload/upload`,async({page},info)=>{
 const f=await prepare(page,"capture");let state=f.state;await country(page,f.from).click();let attacks=0;
 while(state.phase==="attack"&&attacks<128){await country(page,f.to).click();await attack(page);state=step(state,{kind:"attack",from:f.from,to:f.to});await check(page,state);attacks++;}
 expect(state.phase).toBe("capture");expect(state.pendingCapture!.max).toBeGreaterThan(2);await context(page,f.from,f.to);
 const pending=await check(page,state);await shot(page,`capture-${quantity}-pending`,info.project.name);
 for(let n=0;n<3;n++)await country(page,f.to).click();await check(page,state);await country(page,f.to).focus();await page.keyboard.press("Enter");await page.keyboard.press("Space");await openSurface(page,'actions');await page.locator("#capture-amount").press("Enter");await page.locator("#single-exchange-button").dispatchEvent("click");await page.clock.runFor(3000);expect(await save(page)).toBe(pending);
 await page.reload();await page.getByLabel("Load game",{exact:true}).setInputFiles({name:"pending.json",mimeType:"application/json",buffer:Buffer.from(pending)});await check(page,state);await context(page,f.from,f.to);await openSurface(page,'actions');await expect(page.locator("#capture-amount")).toHaveAttribute("min",String(state.pendingCapture!.min));await openSurface(page,'actions');await expect(page.locator("#capture-amount")).toHaveAttribute("max",String(state.pendingCapture!.max));
 await openSurface(page,'actions');await page.locator("#capture-amount").fill("0");await page.locator("#confirm-capture-button").dispatchEvent("click");await check(page,state);
 const amount=quantity==="minimum"?state.pendingCapture!.min:quantity==="maximum"?state.pendingCapture!.max:state.pendingCapture!.min+1;
 const before=Object.values(state.armies).reduce((a,b)=>a+b,0);await openSurface(page,'actions');await page.locator("#capture-amount").fill(String(amount));const stale=await page.locator("#confirm-capture-button").elementHandle();await page.locator("#confirm-capture-button").click();state=step(state,{kind:"captureMove",amount});expect(Object.values(state.armies).reduce((a,b)=>a+b,0)).toBe(before);expect(state.armies[f.from]).toBeGreaterThanOrEqual(1);await check(page,state);await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent("click",{bubbles:true})));await check(page,state);await shot(page,`capture-${quantity}-confirmed`,info.project.name);
});
// T97: Fight on and Stop are gone (owner, #244); Shift-click stages the same pair, and nothing
// continues between Fight presses.
test("Shift-click stages the same Fight; each press is one exchange and nothing continues between presses",async({page},info)=>{
 const f=await prepare(page);let state=f.state;await country(page,f.from).click();await country(page,f.to).click({modifiers:["Shift"]});await check(page,state);await context(page,f.from,f.to);await openSurface(page,'actions');await expect(page.locator("#fight-on-button, #stop-battle-button, #battle-stop-threshold")).toHaveCount(0);await page.locator("#single-exchange-button").click();state=step(state,{kind:"attack",from:f.from,to:f.to});await page.clock.runFor(3000);await check(page,state);await openSurface(page,'actions');await expect(page.getByRole("region",{name:"Battle controls",exact:true})).toHaveAttribute("data-running","false");await context(page,f.from,f.to);await page.locator("#single-exchange-button").click();state=step(state,{kind:"attack",from:f.from,to:f.to});await page.clock.runFor(3000);await check(page,state);await shot(page,"fight-presses",info.project.name);
});
test("friendly, distant and one-army inputs refuse attacks with the engine reason",async({page},info)=>{
 const f=await prepare(page);const state=f.state;await country(page,f.from).click();
 const distant=state.map.provinces.find(p=>state.ownerOf[p.id]!==activePlayer(state)!.id&&!attackTargets(state,f.from).includes(p.id))!.id;await country(page,distant).click();await check(page,state);await openSurface(page,'actions');await expect(page.locator("#active-seat-notice")).toHaveText(whyNot(state,f.from,distant));
 const thin=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id&&state.armies[p.id]===1&&[...p.borders,...p.seaLanes].some(id=>state.ownerOf[id]!==activePlayer(state)!.id))!;expect(thin).toBeTruthy();await country(page,thin.id).click();await check(page,state);const enemy=[...thin.borders,...thin.seaLanes].find(id=>state.ownerOf[id]!==activePlayer(state)!.id)!;await country(page,enemy).click();await check(page,state);await openSurface(page,'actions');await expect(page.locator("#active-seat-notice")).toHaveText(whyNot(state,thin.id,enemy));await shot(page,"refused",info.project.name);
});
test("automatic computer attack phase refuses map, touch and keyboard human activations",async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto("/?view=reference-game");await page.getByLabel("Seed",{exact:true}).fill("1994");await page.getByRole("button",{name:"Start game",exact:true}).click();let state=deserializeVersionedMatch(await save(page)).state;
 for(let n=0;state.phase!=="attack"&&n<30;n++){await page.clock.runFor(350);state=deserializeVersionedMatch(await save(page)).state;}
 expect(state.phase).toBe("attack");expect(activePlayer(state)!.kind).toBe("computer");const from=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id&&attackTargets(state,p.id).length>0)!.id,to=attackTargets(state,from)[0]!;const before=await check(page,state);
 await country(page,from).click();await country(page,to).tap();await country(page,to).focus();await page.keyboard.press("Enter");await page.keyboard.press("Space");expect(await save(page)).toBe(before);
});
