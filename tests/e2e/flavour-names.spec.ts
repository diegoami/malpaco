// T94: regional flavour names chosen at setup, shown on the map and kept by Save and Load.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {THEMES,THEME_LABELS,NAME_THEMES} from '../../src/core/flavour-names';
import {withSurface} from './shell';

async function setup(p:Page,seed=1994){await p.goto(`/?seed=${seed}&control=manual`);await expect(p.getByRole('button',{name:'Start game',exact:true})).toBeVisible();}
async function start(p:Page,theme:string){
 await p.getByLabel('Seats',{exact:true}).selectOption('2');for(let n=1;n<=2;n++)await p.getByLabel(`Seat ${n} control`,{exact:true}).selectOption('human');
 await p.getByLabel('Place names',{exact:true}).selectOption(theme);
 await p.getByRole('button',{name:'Start game',exact:true}).click();await expect(p.locator('#geographic-map')).toBeVisible();
}
const names=(p:Page)=>p.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-label')!.split(',')[0]!));

test('setup offers By seed and the five themes; a chosen theme names every country from its towns',async({page})=>{
 await setup(page);
 expect(await page.getByLabel('Place names',{exact:true}).locator('option').allTextContents()).toEqual(['By seed',...NAME_THEMES.map(t=>THEME_LABELS[t])]);
 await start(page,'mediterranean');
 const towns=new Set(THEMES.mediterranean.flatMap(i=>i.towns)),shown=await names(page);
 expect(shown).toHaveLength(46);expect(new Set(shown).size).toBe(46);
 for(const name of shown)expect(towns.has(name),name).toBe(true);
 // A name is painted on focus, never at rest.
 const first=page.locator('#geographic-map [data-country]').first();
 await expect(first.locator('.name')).toBeHidden();await first.focus();await expect(first.locator('.name')).toHaveText(shown[0]!);
});

test('Save and Load keep the theme and its names',async({page})=>{
 await setup(page);await start(page,'pacific');
 const before=await names(page);
 const pending=page.waitForEvent('download');await withSurface(page,'settings',()=>page.getByRole('button',{name:'Save game',exact:true}).click());
 const text=readFileSync((await(await pending).path())!,'utf8');expect(JSON.parse(text).options.names).toBe('pacific');
 await setup(page,7);await start(page,'caribbean');expect(await names(page)).not.toEqual(before);
 const old=await page.getByLabel('Load game',{exact:true}).elementHandle();
 await withSurface(page,'settings',()=>page.getByLabel('Load game',{exact:true}).setInputFiles({name:'pacific.json',mimeType:'application/json',buffer:Buffer.from(text)}));
 await page.waitForFunction(o=>!o?.isConnected,old);
 await expect.poll(()=>names(page)).toEqual(before);
});
