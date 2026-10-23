import {visitGame} from './shell';
// T103 (owner, 2026-10-22): the action sits on the country you select. Fight when it can attack:
// press it, tap an enemy, and one round is fought; press it again for another round; select
// another country and the icon moves there. Move when it cannot attack: press it, tap where to,
// and the amount bar opens beside that country, as a capture's does. The last army placed starts
// combat. Every round and move is checked against the engine.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,attackTargets,defaultOptions,friendlySources,friendlyTargets,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';

const ROOT='malpaco:current-game';
const SIZES=[{width:390,height:844},{width:1280,height:800}];
const kept=async(p:Page)=>deserializeVersionedMatch((await p.evaluate(k=>localStorage.getItem(k),ROOT))!).state;
const same=(s:GameState)=>({history:s.history,rng:s.rng,armies:s.armies,ownerOf:s.ownerOf,phase:s.phase,pool:s.reinforcementPool,pendingCapture:s.pendingCapture});

/** The engine plays every seat (the human too) on the player's options, stopping where `stop` says. */
function played(stop:(s:GameState)=>boolean){
 for(let seed=1;seed<200;seed++){
  const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
  const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)continue;
  let s=game.state;
  for(let n=0;n<400&&!s.result&&!stop(s);n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;}
  if(stop(s))return {state:s,text:serializeVersionedMatch(options,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
 }
 throw Error('no such state');
}
const human=(s:GameState)=>activePlayer(s)?.kind==='human';
const mine=(s:GameState)=>s.map.provinces.map(p=>p.id).filter(id=>s.ownerOf[id]===activePlayer(s)!.id);
/** Opens the root page on a kept match. */
async function opened(p:Page,text:string,size:{width:number;height:number}){
 await p.setViewportSize(size);
 await p.addInitScript(([k,v])=>{if(!sessionStorage.getItem('t103'))sessionStorage.setItem('t103','1'),localStorage.setItem(k!,v!);},[ROOT,text]);
 await visitGame(p,'/');await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);
}
/** The nearest distance between two boxes (0 when they touch or overlap). */
const gap=(a:{x:number;y:number;width:number;height:number},b:{x:number;y:number;width:number;height:number})=>Math.hypot(Math.max(b.x-(a.x+a.width),a.x-(b.x+b.width),0),Math.max(b.y-(a.y+a.height),a.y-(b.y+b.height),0));

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','sizes are set per test');});

for(const size of SIZES){
 test(`${size.width}x${size.height}: Fight on the selected country: press, tap an enemy, one round; press again, another; it moves with the selection`,async({page})=>{
  // A target of 2 or more armies cannot fall in one round, so the icon stays for the next.
  const ok=(s:GameState,id:string,t:string)=>s.armies[t]!>=2&&s.armies[id]!>s.armies[t]!+1;
  const {state,text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&mine(s).some(id=>attackTargets(s,id).some(t=>ok(s,id,t)))&&mine(s).filter(id=>attackTargets(s,id).length>0).length>=2);
  await opened(page,text,size);
  const from=mine(state).find(id=>attackTargets(state,id).some(t=>ok(state,id,t)))!,to=attackTargets(state,from).find(t=>ok(state,from,t))!;
  const other=mine(state).find(id=>id!==from&&attackTargets(state,id).length>0)!;
  const country=(id:string)=>page.locator(`[data-country="${id}"]`),action=page.locator('#province-action-button');
  const beside=async(id:string)=>expect(gap((await action.boundingBox())!,(await country(id).locator('.count').boundingBox())!)).toBeLessThan(24);
  await expect(action).toBeHidden();
  await country(from).click();await expect(action).toBeVisible();await expect(action).toHaveAttribute('data-kind','fight');await beside(from);await expect(action).toHaveText('ATTACK');await expect(action.locator('svg')).toHaveCount(0);
  const colours=await action.evaluate((n,id)=>{const c=document.querySelector(`[data-country="${id}"]`)!;return [getComputedStyle(n).backgroundColor,getComputedStyle(c.querySelector('.cell')!).fill,getComputedStyle(c.querySelector('.badge')!).fill];},from);expect(colours[0]).not.toBe(colours[1]);expect(colours[0]).not.toBe(colours[2]);
  const ab=(await action.boundingBox())!,cb=(await country(from).locator('.count').boundingBox())!;expect(ab.x>=0&&ab.x+ab.width<=size.width).toBe(true);expect(ab.x>=cb.x+cb.width||ab.x+ab.width<=cb.x||ab.y>=cb.y+cb.height||ab.y+ab.height<=cb.y).toBe(true);await page.screenshot({path:`artifacts/T117/attack-${size.width}.png`});
  // A press arms Fight; nothing is fought yet.
  await action.click();await expect(action).toHaveAttribute('aria-pressed','true');expect(same(await kept(page))).toEqual(same(state));
  // The tapped enemy is fought at once: one round.
  await country(to).click();await expect(page.locator('#game-focus-drawer')).toBeHidden();await expect(page.locator('#open-required-action')).toBeHidden();
  const one=apply(state,{kind:'attack',from,to});if(!one.ok)throw Error(one.error);
  await expect.poll(async()=>(await kept(page)).history.length).toBe(one.state.history.length);expect(same(await kept(page))).toEqual(same(one.state));
  // The icon is still there: another press is another round on the same target.
  expect(one.state.pendingCapture).toBeUndefined();await expect(action).toBeVisible();await beside(from);
  {
   await action.click();
   const two=apply(one.state,{kind:'attack',from,to});if(!two.ok)throw Error(two.error);
   await expect.poll(async()=>(await kept(page)).history.length).toBe(two.state.history.length);expect(same(await kept(page))).toEqual(same(two.state));
  }
  if(!(await kept(page)).pendingCapture){
   // Another country that can attack: the icon moves there, and is not armed.
   await country(other).click();await expect(action).toHaveAttribute('data-for',other);await expect(action).toHaveAttribute('aria-pressed','false');await beside(other);
  }
 });

 test(`${size.width}x${size.height}: Move on a country that cannot attack: press, tap where to, and the amount bar opens beside it`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&mine(s).some(id=>!attackTargets(s,id).length&&friendlySources(s).includes(id)));
  await opened(page,text,size);
  const source=mine(state).find(id=>!attackTargets(state,id).length&&friendlySources(state).includes(id))!,dest=friendlyTargets(state,source)[0]!;
  const country=(id:string)=>page.locator(`[data-country="${id}"]`),action=page.locator('#province-action-button');
  await country(source).click();await expect(action).toHaveAttribute('data-kind','move');
  expect(gap((await action.boundingBox())!,(await country(source).locator('.count').boundingBox())!)).toBeLessThan(24);
  expect(same(await kept(page))).toEqual(same(state));
  await action.click();await expect(page.locator('#cancel-friendly-move-button')).toBeVisible();
  await country(dest).click();
  const confirm=page.locator('#confirm-friendly-move-button');await expect(confirm).toBeVisible();
  // The amount bar rests beside the destination's count.
  await expect.poll(async()=>gap((await page.locator('#game-focus-drawer').boundingBox())!,(await country(dest).locator('.count').boundingBox())!)).toBeLessThan(24);
  expect(same(await kept(page))).toEqual(same(state));
 });

 test(`${size.width}x${size.height}: Move armies keeps the selected country as the source, and no card stays open with nothing to do`,async({page})=>{
  const {text}=played(s=>{if(!human(s)||!s.pendingCapture)return false;const r=apply(s,{kind:'captureMove',amount:s.pendingCapture.defaultAmount});return r.ok&&friendlySources(r.state).length>0;});
  await opened(page,text,size);
  const drawer=page.locator('#game-focus-drawer');
  await page.locator('#confirm-capture-button').click();
  await expect.poll(async()=>(await kept(page)).pendingCapture).toBeUndefined();
  // After the capture the attack card would hold only Cancel: it closes.
  await expect(drawer).toBeHidden();
  const after=await kept(page),source=friendlySources(after)[0]!;
  await page.locator(`[data-country="${source}"]`).click();await expect(drawer).toBeHidden();
  await page.locator('#start-friendly-move-button').click();
  await expect(page.locator('#cancel-friendly-move-button')).toBeVisible();
  await expect(page.locator(`[data-country="${source}"]`)).toHaveAttribute('data-selected','true');
  expect(same(await kept(page))).toEqual(same(after));
 });

 test(`${size.width}x${size.height}: a capture's amount bar opens beside the captured country`,async({page})=>{
  const {state,text}=played(s=>human(s)&&!!s.pendingCapture);
  await opened(page,text,size);
  await expect(page.locator('#confirm-capture-button')).toBeVisible();
  const at=page.locator(`[data-country="${state.pendingCapture!.to}"] .count`);
  await expect.poll(async()=>gap((await page.locator('#game-focus-drawer').boundingBox())!,(await at.boundingBox())!)).toBeLessThan(24);
 });

 test(`${size.width}x${size.height}: #266: the capture bar covers neither country, a drag moves it for good, and other cards are not anchored`,async({page})=>{
  // The milestone review's case: the first capture the engine reaches (seed 1), its source below its target.
  const {state,text}=played(s=>human(s)&&!!s.pendingCapture);
  await opened(page,text,size);
  const drawer=page.locator('#game-focus-drawer'),count=(id:string)=>page.locator(`[data-country="${id}"] .count`);
  await expect(page.locator('#confirm-capture-button')).toBeVisible();
  const clear=async()=>{const d=(await drawer.boundingBox())!;for(const id of [state.pendingCapture!.from,state.pendingCapture!.to]){const c=(await count(id).boundingBox())!;
   const overlap=Math.max(0,Math.min(d.x+d.width,c.x+c.width)-Math.max(d.x,c.x))*Math.max(0,Math.min(d.y+d.height,c.y+c.height)-Math.max(d.y,c.y));expect(overlap,`${id} under the bar`).toBe(0);}};
  await expect.poll(async()=>(await drawer.getAttribute('data-anchored'))).toBe('true');await clear();
  // A drag moves it, and it stays there over the following frames.
  const grip=(await drawer.locator('.card-grip').boundingBox())!,before=(await drawer.boundingBox())!;
  const dy=before.y+before.height+100<=size.height?100:-100;
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2+dy,{steps:8});await page.mouse.up();
  await page.waitForTimeout(300);
  const after=(await drawer.boundingBox())!;expect(Math.abs(after.y-before.y-dy)).toBeLessThanOrEqual(2);
  await expect(drawer).not.toHaveAttribute('data-anchored','true');
  await page.waitForTimeout(300);expect(Math.abs((await drawer.boundingBox())!.y-after.y)).toBeLessThanOrEqual(1);
  // The menu is never pinned to the country.
  await page.locator('#open-game-menu').click();await expect(drawer).toHaveAttribute('data-surface','menu');
  await expect(drawer).not.toHaveAttribute('data-anchored','true');
 });

 test(`${size.width}x${size.height}: the last army placed starts combat`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='reinforce'&&s.reinforcementPool>0&&s.reinforcementPool<=3);
  await opened(page,text,size);
  const at=mine(state)[0]!;
  for(let n=0;n<state.reinforcementPool;n++)await page.locator(`[data-country="${at}"]`).click();
  await expect.poll(async()=>(await kept(page)).phase).toBe('attack');
  const placed=await kept(page);expect(placed.reinforcementPool).toBe(0);expect(placed.history.at(-1)).toEqual({kind:'endReinforcement'});
  expect(placed.history.length).toBe(state.history.length+state.reinforcementPool+1);
  await expect(page.locator('#start-combat-button')).toHaveCount(0);
 });
}
