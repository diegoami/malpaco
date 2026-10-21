// T81: every country is reachable by name (touch and keyboard), Inspect never acts,
// ambiguous taps ask for a named choice, and the list's Place 1 matches the engine.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {apply} from '../../src/core';
import type {GameState} from '../../src/core';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {readFileSync} from 'node:fs';
import {closeSurface, withSurface} from './shell';

async function start(p:Page,seed=7){
 await p.goto(`/?seed=${seed}&control=manual`);
 await p.getByLabel('Seats',{exact:true}).selectOption('2');for(const n of [1,2])await p.getByLabel(`Seat ${n} control`,{exact:true}).selectOption('human');
 await p.getByRole('button',{name:'Start game',exact:true}).click();await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);await p.mouse.move(0,0);
}
async function state(p:Page):Promise<GameState>{
 const pending=p.waitForEvent('download');await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());
 return deserializeVersionedMatch(readFileSync((await(await pending).path())!,'utf8')).state;
}
const armies=(p:Page)=>p.locator('#geographic-map [data-country]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.getAttribute('data-country'),n.getAttribute('data-armies')])));
async function openList(p:Page,all=false){
 await p.locator('#open-countries').click();await expect(p.locator('#game-focus-drawer')).toHaveAttribute('data-surface','countries');
 if(all)await p.getByRole('button',{name:'All',exact:true}).click();
}

test('every country is listed by name and reachable by keyboard; the list places one army exactly as the engine does',async({page})=>{
 await start(page);
 await openList(page,true);
 const rows=page.locator('[data-country-row]');await expect(rows).toHaveCount(46);
 const mapIds=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-country')).sort());
 expect((await rows.evaluateAll(ns=>ns.map(n=>n.getAttribute('data-country-row')))).sort()).toEqual(mapIds);
 // Legal now lists exactly the active seat's countries during placement.
 await page.getByRole('button',{name:/^Legal now/}).click();
 const before=await state(page),active=before.players[before.currentPlayer]!.id;
 const legal=await page.locator('[data-country-row]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-country-row')));
 expect(legal.sort()).toEqual(before.map.provinces.map(p=>p.id).filter(id=>before.ownerOf[id]===active).sort());
 const id=legal[0]!,expected=apply(before,{kind:'reinforce',province:id,amount:1});if(!expected.ok)throw Error(expected.error);
 await page.locator(`[data-country-row="${id}"]`).focus();await page.keyboard.press('Enter');
 await expect(page.locator(`#geographic-map [data-country="${id}"]`)).toHaveAttribute('data-armies',String(expected.state.armies[id]));
 await closeSurface(page);
 expect((await state(page)).armies).toEqual(expected.state.armies);
});

test('Inspect shows a country without acting; Focus moves only the camera; closing leaves no prose on the map',async({page})=>{
 await start(page);
 const before=await armies(page),camera=await page.locator('#geographic-map').getAttribute('viewBox');
 await openList(page,true);
 const id=await page.locator('[data-country-row]').nth(5).getAttribute('data-country-row');
 await page.getByRole('button',{name:/^Inspect /}).nth(5).click();
 await expect(page.locator('#game-drawer-title')).toHaveText('Inspect');
 const name=(await page.locator(`#geographic-map [data-country="${id}"]`).getAttribute('aria-label'))!.split(',')[0]!;
 await expect(page.locator('#inspected-country')).toHaveText(name);
 await expect(page.locator('#inspected-armies')).toHaveText(before[id!]!);
 await page.getByRole('button',{name:'Focus',exact:true}).click();
 await expect.poll(()=>page.locator('#geographic-map').getAttribute('viewBox')).not.toBe(camera);
 // A neighbour opens its own Inspect; still nothing is played.
 await page.locator('.country-neighbour').first().click();await expect(page.locator('#inspected-country')).not.toHaveText(name);
 expect(await armies(page)).toEqual(before);
 await closeSurface(page);
 await expect(page.locator('.country-picker')).toBeHidden();
 const prose=await page.locator('.game-overlay').evaluate(o=>[...o.querySelectorAll<HTMLElement>('p,h2,h3,dl,li')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'&&!n.closest('.visually-hidden')).map(n=>n.textContent));
 expect(prose).toEqual([]);
});

test('in combat a list choice stages the attack pair without rolling',async({page})=>{
 await start(page);
 // Place the pool, then start combat.
 for(let i=0;i<40&&await page.locator('#placement-pool').isVisible();i++){await openList(page);await page.locator('[data-country-row]').first().click();await closeSurface(page);}
 await page.locator('#start-combat-button').click();
 const before=await state(page);
 // The same open list first offers sources, then that source's targets.
 await openList(page);await page.locator('[data-country-row]').first().click();
 if(await page.locator('#game-focus-drawer').getAttribute('data-surface')!=='countries')await openList(page);
 await expect(page.getByRole('button',{name:/^Legal now/})).toHaveAttribute('aria-pressed','true');
 const target=page.locator('[data-country-row]:not(:disabled)').first();await expect(target).toHaveAttribute('aria-label',/^Target: /);
 await target.click();
 await expect(page.locator('[data-battle-roll]')).toHaveCount(0);
 const after=await state(page);expect(after.history).toHaveLength(before.history.length);expect(after.armies).toEqual(before.armies);
 await expect(page.locator('#geographic-map [data-country].selected')).toHaveCount(1);
});

test.describe('touch',()=>{
 test.use({hasTouch:true});
 test('a tap on a border asks which country, by name, and acts on nothing until chosen',async({page})=>{
  await start(page);
  const before=await armies(page);
  // A screen point on the shared border of two countries.
  const point=await page.locator('#geographic-map').evaluate(svg=>{
   for(const cell of svg.querySelectorAll<SVGGeometryElement>('[data-country] .cell')){
    const id=cell.closest('[data-country]')!.getAttribute('data-country'),m=cell.getScreenCTM()!,n=cell.getTotalLength();
    for(let t=0;t<n;t+=n/60){const q=cell.getPointAtLength(t).matrixTransform(m),here=new Set<string>();
     for(const [dx,dy] of [[6,0],[-6,0],[0,6],[0,-6]])here.add(document.elementFromPoint(q.x+dx!,q.y+dy!)?.closest('[data-country]')?.getAttribute('data-country')??'');
     here.delete('');if(here.size>1&&here.has(id!))return {x:q.x,y:q.y};}
   }
   return null;
  });
  expect(point).not.toBeNull();
  await page.touchscreen.tap(point!.x,point!.y);
  await expect(page.locator('#game-drawer-title')).toHaveText('Which country?');
  const named=page.locator('[data-country-row]');expect(await named.count()).toBeGreaterThan(1);
  for(const label of await named.evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-label'))))expect(label).toMatch(/^(Place 1 army: )?[^:]+, Seat \d, \d+ arm/);
  expect(await armies(page)).toEqual(before);
  // A named choice the active seat may use places exactly one army.
  const usable=page.locator('[data-country-row]:not(:disabled)');
  if(await usable.count()){const id=(await usable.first().getAttribute('data-country-row'))!;await usable.first().tap();
   await expect(page.locator(`#geographic-map [data-country="${id}"]`)).toHaveAttribute('data-armies',String(Number(before[id])+1));}
 });
});
