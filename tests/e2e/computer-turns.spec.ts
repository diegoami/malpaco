// T101 (owner, 2026-10-22): computer turns are quick and quiet. While a computer plays, the only
// controls on screen are Pause, Fast-forward and the speed choice (a corner control); the menu,
// Fit, Focus and Countries come back on your turn or with a pause. Each computer's turn shows one
// notice, and a round of the three Normal computers on the reference seed takes at most 12 s.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {activePlayer,apply,computerAction} from '../../src/core';
import {deserializeVersionedMatch} from '../../src/core/match-save';

const SIZES=[{width:390,height:844},{width:844,height:390},{width:1280,height:800}] as const;
const SEED_KEY='malpaco:seed-game:7';
const computerActive=(p:Page)=>p.locator('.panel').getAttribute('data-computer-active');
const shots=(name:string,p:Page)=>{if(p.viewportSize()!.width!==390)return;mkdirSync('artifacts/T101',{recursive:true});return p.screenshot({path:`artifacts/T101/${name}-390x844.png`});};
/** Every control a player can see or reach by pointer now, by id (the map's countries aside). */
const visibleControls=(p:Page)=>p.evaluate(()=>[...document.querySelectorAll<HTMLElement>('button, select, input, a[href]')]
 .filter(n=>n.getClientRects().length>0&&n.checkVisibility({visibilityProperty:true,opacityProperty:true})&&!n.closest('.visually-hidden, .game-store, dialog:not([open])'))
 .map(n=>n.id||n.getAttribute('aria-label')||n.textContent!.trim()).sort());
const SPEED_CONTROLS=['fast-forward-button','game-pause-button','game-speed'];
/** The notices shown, in order, as their titles change. */
async function watchNotices(p:Page){
 await p.addInitScript(()=>{
  const seen:string[]=[];Reflect.set(window,'noticeTitles',seen);
  const note=()=>{const n=document.querySelector<HTMLElement>('#active-seat-notice');const t=n&&!n.hidden?n.querySelector('.game-notice-title')?.textContent??'':'';if(t&&seen.at(-1)!==t)seen.push(t);};
  new MutationObserver(note).observe(document,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 });
}
const notices=(p:Page)=>p.evaluate(()=>Reflect.get(window,'noticeTitles') as string[]);

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','the sizes are set per test');});

for(const size of SIZES)test.describe(`${size.width}×${size.height}`,()=>{
 test.use({viewport:size});

 test('while a computer plays only Pause, Fast-forward and the speed choice are on screen; a pause brings the menu back; one notice per computer turn',async({page})=>{
  test.setTimeout(150_000);await watchNotices(page);
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-22T12:00:00Z'));
  // Seed 7 opens on Orange's turn: the three computers play before you.
  await page.goto('/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  expect(await computerActive(page)).toBe('true');
  await expect(page.locator('#game-speed')).toHaveValue('normal');
  let steps=0;
  for(;steps<600&&await computerActive(page)==='true';steps++){
   expect(await visibleControls(page),'controls during a computer turn').toEqual(SPEED_CONTROLS);
   // The notice is a status line: no buttons on it.
   await expect(page.locator('#active-seat-notice button')).toHaveCount(0);
   if(steps===3){
    await shots('computer-turn',page);
    await page.locator('#game-speed').screenshot({path:'artifacts/T101/speed-control-390x844.png'}).catch(()=>{});
    if(size.width===390)await page.locator('.game-corner-end').screenshot({path:'artifacts/T101/corner-speed-control-390x844.png'});
    // Pausing brings back the menu and the camera icons; Fast-forward waits.
    await page.locator('#game-pause-button').click();
    for(const id of ['#open-game-menu','#map-fit','#open-countries'])await expect(page.locator(id)).toBeVisible();
    await expect(page.locator('#fast-forward-button')).toBeHidden();
    await page.locator('#open-game-menu').click();await expect(page.locator('#game-focus-drawer')).toHaveAttribute('data-surface','menu');
    await expect(page.locator('#game-focus-drawer #game-speed')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.locator('#game-pause-button').click();
    for(const id of ['#open-game-menu','#map-fit','#open-countries'])await expect(page.locator(id)).toBeHidden();
   }
   await page.clock.runFor(120);
  }
  expect(await computerActive(page)).toBe('false');
  // Your turn: the menu and camera icons return, Fast-forward goes.
  for(const id of ['#open-game-menu','#map-fit','#open-countries'])await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('#fast-forward-button')).toBeHidden();
  const titles=await notices(page);
  expect(titles.slice(0,3),'one notice per computer turn').toEqual(["Orange's turn","Green's turn","Purple's turn"]);
  expect(titles.slice(3)).toHaveLength(1);expect(titles[3]).toMatch(/^Your turn/);
 });

 test('the computers show no pair, outline or name; only counts and colours change',async({page})=>{
  test.setTimeout(120_000);
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-22T12:00:00Z'));
  await page.goto('/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  const marked=()=>page.locator('#geographic-map').evaluate(map=>map.querySelectorAll('[data-country].selected, [data-country].target, [data-country].pending, [data-country][data-selected="true"], [data-country][data-target="true"], .lane.active').length+map.querySelectorAll('.name-top:not([display="none"])').length);
  let changes=0,last='';
  for(let n=0;n<600&&await computerActive(page)==='true';n++){
   expect(await marked(),'a computer action marks the map').toBe(0);
   const paint=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(x=>`${x.getAttribute('data-owner')}:${x.getAttribute('data-armies')}`).join());
   if(paint!==last){changes++;last=paint;}
   await page.clock.runFor(120);
  }
  expect(changes,'the counts and colours change').toBeGreaterThan(10);
 });
});

test('a round of three Normal computers on seed 7 takes at most 12 s of real time and plays the same actions',async({page})=>{
 test.setTimeout(120_000);await page.setViewportSize({width:1280,height:800});
 await page.goto('/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 const start=Date.now();expect(await computerActive(page)).toBe('true');
 await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','false',{timeout:60_000});
 const elapsed=Date.now()-start;
 mkdirSync('artifacts/T101',{recursive:true});test.info().annotations.push({type:'computer round',description:`${elapsed} ms`});console.log(`T101 computer round at Normal on seed 7: ${elapsed} ms`);
 // The kept record holds the round: the engine oracle plays the same computer actions.
 const loaded=deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),SEED_KEY))!);
 let state=loaded.initialState!;
 while(activePlayer(state)?.kind==='computer'){const r=apply(state,computerAction(state)!);if(!r.ok)throw Error(r.error);state=r.state;}
 // Your turn may open with a Cards phase that has no set, which passes by itself (one skipCards).
 expect(loaded.state.history.slice(0,state.history.length)).toEqual(state.history);
 expect(loaded.state.history.slice(state.history.length).every(a=>a.kind==='skipCards')).toBe(true);expect(loaded.state.history.length-state.history.length).toBeLessThanOrEqual(1);
 expect(state.history.length).toBeGreaterThan(30);
 expect(elapsed,'a computer round at Normal').toBeLessThanOrEqual(12_000);
});
