// T88 (A8–A11): keyboard order and visible focus, arrow keys within every overlay icon group,
// Escape back to a visible opener, map keys that only select, no repeat-key or drag actions,
// and touch-sized controls. ARIA presence here is not a screen-reader pass (DEVICE-REPORT).
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {activePlayer} from '../../src/core';
import type {GameState} from '../../src/core';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {pinned} from '../core/versioned-match-fixture';
import {closeSurface,openSurface,withSurface} from './shell';

const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function start(p:Page,size={width:390,height:844}){
 await p.setViewportSize(size);await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto('/?seed=7&control=manual');await p.getByRole('button',{name:'Start game',exact:true}).click();
 await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);
}
async function saved(p:Page):Promise<GameState>{const d=p.waitForEvent('download');await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());return deserializeVersionedMatch(readFileSync((await(await d).path())!,'utf8')).state;}
const focused=(p:Page)=>p.evaluate(()=>{const e=document.activeElement as HTMLElement|null;if(!e||e===document.body)return null;
 const s=getComputedStyle(e),r=e.getBoundingClientRect();
 return {id:e.id,country:e.dataset['country']??null,visible:r.width>0&&r.height>0,ring:(s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none'||e.matches(':focus-visible')&&getComputedStyle(e.querySelector('.cell')??e).strokeWidth!==''};});
/** The mover's frontline country, placed up to strength and into combat with one target staged. */
async function stageAttack(p:Page){
 let s=await saved(p);const me=activePlayer(s)!.id,from=s.map.provinces.find(c=>s.ownerOf[c.id]===me&&c.borders.some(b=>s.ownerOf[b]!==me))!;
 for(let i=0;i<80&&Number(await p.locator('#placement-pool-count').textContent().catch(()=>'0'))>0;i++)await country(p,from.id).click();
 await p.locator('#start-combat-button').click();s=await saved(p);
 const to=from.borders.find(b=>s.ownerOf[b]!==me)!;await country(p,from.id).click();await country(p,to).click();await openSurface(p,'actions');
 return {from:from.id,to,state:s};
}

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes are set here, so one project suffices'));

test('Tab reaches every corner control and the countries, each with a visible focus ring, without acting',async({page})=>{
 await start(page);const before=await saved(page);
 const seen:Record<string,boolean>={};let countries=0;
 for(let i=0;i<70;i++){await page.keyboard.press('Tab');const f=await focused(page);if(!f)continue;
  if(f.country)countries++;else if(f.id)seen[f.id]=f.visible&&f.ring;}
 for(const id of ['open-game-menu','game-pause-button','open-countries','map-fit','game-info-button'])expect(seen[id],id).toBe(true);
 expect(countries).toBeGreaterThan(10);
 expect((await saved(page)).history).toEqual(before.history);
});

test('zoom has single-pointer and keyboard paths at Fit; once zoomed, Zoom and Focus join the tab order',async({page})=>{
 await start(page);const s=await saved(page),id=s.map.provinces[0]!.id;
 const zoom=()=>page.locator('svg[data-camera-zoom]').getAttribute('data-camera-zoom').then(Number);
 // Single pointer: Countries, Inspect, Focus.
 await page.locator('#open-countries').click();await page.getByRole('button',{name:'All',exact:true}).click();
 await page.locator(`[data-key="inspect:${id}"]`).click();await page.locator(`[data-key="focus:${id}"]`).click();
 await expect.poll(zoom).toBeGreaterThan(1);await expect(page.locator('#map-zoom-in')).toBeVisible();
 await page.locator('#map-fit').click();await expect.poll(zoom).toBe(1);
 // Keyboard: + on a focused country zooms, 0 fits.
 await country(page,id).focus();await page.keyboard.press('+');await expect.poll(zoom).toBeGreaterThan(1);
 await page.locator('#map-zoom-in').focus();await expect(page.locator('#map-zoom-in')).toBeFocused();
 await country(page,id).focus();await page.keyboard.press('0');await expect.poll(zoom).toBe(1);
 expect((await saved(page)).history).toEqual(s.history);
});

test('arrow keys and Home/End move within each overlay icon group and never act',async({page})=>{
 await start(page);const {state}=await stageAttack(page);
 for(const group of ['#game-focus-drawer .battle-actions','.map-camera-controls','#battle-action-rail']){
  const buttons=page.locator(`${group} button:visible:not([disabled])`);const n=await buttons.count();expect(n,group).toBeGreaterThan(1);
  await buttons.first().focus();
  const at=()=>page.evaluate(g=>{const bs=[...document.querySelectorAll<HTMLButtonElement>(`${g} button`)].filter(b=>!b.disabled&&b.getClientRects().length);return bs.indexOf(document.activeElement as HTMLButtonElement);},group);
  await page.keyboard.press('ArrowRight');expect(await at(),`${group} right`).toBe(1);
  await page.keyboard.press('End');expect(await at(),`${group} end`).toBe(n-1);
  await page.keyboard.press('ArrowRight');expect(await at(),`${group} wraps`).toBe(0);
  await page.keyboard.press('ArrowLeft');expect(await at(),`${group} left`).toBe(n-1);
  await page.keyboard.press('Home');expect(await at(),`${group} home`).toBe(0);
 }
 expect((await saved(page)).history).toEqual(state.history);
});

test('Escape closes the top overlay and returns focus to its visible opener; a required choice stays pending',async({page})=>{
 await start(page);
 for(const [opener,surface] of [['#open-game-menu','menu'],['#open-countries','countries'],['#game-info-button','info']] as const){
  await page.locator(opener).click();await expect(page.locator('#game-focus-drawer')).toHaveAttribute('data-surface',surface);
  await page.keyboard.press('Escape');await expect(page.locator('#game-focus-drawer')).toBeHidden();
  expect(await page.evaluate(()=>`#${document.activeElement?.id}`)).toBe(opener);
 }
 // A pending capture: Escape folds its card; the choice stays and its strip returns to it.
 await page.goto('/?view=reference-game&control=manual');
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'c.json',mimeType:'application/json',buffer:Buffer.from(pinned('pending-capture').text)});
 await expect(page.locator('#confirm-capture-button')).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.locator('#game-folded-choice')).toBeVisible();await page.locator('#open-required-action').click();await expect(page.locator('#confirm-capture-button')).toBeVisible();
});

test('map keys only place one army or select; key auto-repeat never acts; a drag across countries never acts',async({page})=>{
 await start(page);let s=await saved(page);
 const me=activePlayer(s)!.id,own=s.map.provinces.find(c=>s.ownerOf[c.id]===me)!.id,pool=s.reinforcementPool;
 const key=(repeat:boolean)=>country(page,own).evaluate((n,r)=>n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:r,bubbles:true})),repeat);
 await key(true);await key(true);s=await saved(page);expect(s.reinforcementPool).toBe(pool);
 await key(false);s=await saved(page);expect(s.reinforcementPool).toBe(pool-1);
 // Drag: press on a country, move well past the tap slop, release over another.
 const box=(await country(page,own).locator('.cell').boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+60,{steps:6});await page.mouse.up();
 expect((await saved(page)).history).toEqual(s.history);
});

test('during attack, Enter on the map only stages; Attack acts once',async({page})=>{
 await start(page);const {from,to,state}=await stageAttack(page);await closeSurface(page);
 await country(page,to).focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
 expect((await saved(page)).history).toEqual(state.history);
 await openSurface(page,'actions');await page.locator('#single-exchange-button').focus();await page.keyboard.press('Enter');
 const after=await saved(page);expect(after.history).toHaveLength(state.history.length+1);expect(after.history.at(-1)).toMatchObject({kind:'attack',from,to});
});

for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}])test(`touch targets: standalone controls at least 44×44 at ${size.width}×${size.height}`,async({page})=>{
 await start(page,size);await stageAttack(page);
 const small=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('.game-overlay button, .map-camera-controls button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>({id:b.id||b.getAttribute('aria-label'),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})).filter(b=>b.w<43.5||b.h<43.5));
 expect(small).toEqual([]);
});
