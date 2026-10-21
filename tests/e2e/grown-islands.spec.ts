// T95: new games grow their islands (geographic/2); the drawn map keeps every 40 px hit square.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {GEOGRAPHIC_V2_MATCH_IDENTITY,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {withSurface} from './shell';

async function start(p:Page,seed:number,humans=2){
 await p.goto(`/?seed=${seed}&control=manual`);await expect(p.getByRole('button',{name:'Start game',exact:true})).toBeVisible();
 await p.getByLabel('Seats',{exact:true}).selectOption(String(Math.max(2,humans)));for(let n=1;n<=Math.max(2,humans);n++)await p.getByLabel(`Seat ${n} control`,{exact:true}).selectOption(n<=humans?'human':'computer');
 await p.getByRole('button',{name:'Start game',exact:true}).click();await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);await p.mouse.move(0,0);
}
async function save(p:Page){const pending=p.waitForEvent('download');await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());return readFileSync((await(await pending).path())!,'utf8');}
/** For each country: do the four corners and centre of a 40 px square at its label hit that country? */
const hits=(p:Page)=>p.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>{
 const c=n.querySelector<SVGTextElement>('.count')!,a=new DOMPoint(Number(c.getAttribute('x')),Number(c.getAttribute('y'))-5).matrixTransform(c.getScreenCTM()!);
 return {id:n.getAttribute('data-country'),ok:[[-20,-20],[20,-20],[-20,20],[20,20],[0,0]].every(([dx,dy])=>document.elementFromPoint(a.x+dx!,a.y+dy!)?.closest('[data-country]')===n)};
}));

for(const seed of [1994,7,42])test(`seed ${seed}: a new game is geographic/2 and every country keeps its 40 px hit square`,async({page})=>{
 await start(page,seed);
 const loaded=deserializeVersionedMatch(await save(page));
 expect(loaded.identity).toEqual(GEOGRAPHIC_V2_MATCH_IDENTITY);expect(loaded.geography?.version).toBe('island-geography-v2');
 const rows=await hits(page);expect(rows).toHaveLength(46);expect(rows.filter(r=>!r.ok).map(r=>r.id)).toEqual([]);
});

test('on a phone the turned map keeps every hit square',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page,7);
 await expect(page.locator('#geographic-map')).toHaveAttribute('data-camera-rotation','90');
 expect((await hits(page)).filter(r=>!r.ok).map(r=>r.id)).toEqual([]);
});

test('a single-human game uses the raid-card stage on v2, and Load restores the same islands',async({page})=>{
 await start(page,42,1);
 const text=await save(page),loaded=deserializeVersionedMatch(text);expect(loaded.identity).toEqual(GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
 const before=await page.locator('#geographic-map [data-country] .cell').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));
 await start(page,7);
 const old=await page.getByLabel('Load game',{exact:true}).elementHandle();
 await withSurface(page,'settings',()=>page.getByLabel('Load game',{exact:true}).setInputFiles({name:'v2.json',mimeType:'application/json',buffer:Buffer.from(text)}));
 await page.waitForFunction(o=>!o?.isConnected,old);
 await expect.poll(()=>page.locator('#geographic-map [data-country] .cell').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')))).toEqual(before);
});
