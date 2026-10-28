import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {defaultOptions,victoryRules,createReferenceGame,createGeographicGame,serializeVersionedMatch} from '../../src/core';
import {REFERENCE_MATCH_IDENTITY,GEOGRAPHIC_V2_MATCH_IDENTITY} from '../../src/core/match-save';
import {referenceMap} from '../../src/core/reference-map';
import {withSurface,startGameIfNeeded} from './shell';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports set per case'));
for(const size of [{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}])for(const host of ['geographic','reference'])test(`${host} ${size.width}x${size.height}`,async({page})=>{
 const out='screenshots/T146-centers';mkdirSync(out,{recursive:true});
 const options={...defaultOptions(),seed:7,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
 const game=host==='reference'?createReferenceGame(referenceMap,options,victoryRules(options)):createGeographicGame(options,victoryRules(options),{},2);if(!game.ok)throw Error(game.errors.join(';'));
 const text=serializeVersionedMatch(options,[],host==='reference'?REFERENCE_MATCH_IDENTITY:GEOGRAPHIC_V2_MATCH_IDENTITY);
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/?setup');await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'centers.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.locator('[data-country]')).toHaveCount(46);await page.clock.runFor(4000);
 const measure=()=>page.locator('[data-country] .centre:visible').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),c=n.closest('[data-country]')!,a=c.querySelector('.count')!.getBoundingClientRect();return {id:c.getAttribute('data-country'),height:r.height,width:r.width,armyHeight:a.height,pointerEvents:getComputedStyle(n).pointerEvents,overlapsArmy:[...document.querySelectorAll('[data-country] .count')].some(other=>{const b=other.getBoundingClientRect();return r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top})};}));
 const stars=await measure();expect(stars.map(s=>s.id).sort()).toEqual([...game.state.productionCentres].sort());
 await page.screenshot({path:`${out}/${host}-${size.width}.png`});writeFileSync(`${out}/${host}-${size.width}.json`,JSON.stringify(stars,null,2));
 for(const star of stars){expect(star.height).toBeGreaterThanOrEqual(14);expect(star.height).toBeGreaterThan(star.armyHeight);expect(star.pointerEvents).toBe('none');expect(star.overlapsArmy).toBe(false);}
 await page.locator('[data-country]').first().focus();await page.keyboard.press('+');await page.clock.runFor(200);await page.keyboard.press('0');await page.clock.runFor(200);expect(await measure()).toEqual(stars);
 const download=page.waitForEvent('download');await withSurface(page,'settings',()=>page.getByRole('button',{name:'Save game',exact:true}).click());expect(readFileSync((await(await download).path())!,'utf8')).toBe(text);
});

for(const count of [72,96])for(const size of [{width:390,height:844},{width:844,height:390}])test(`${count} regions ${size.width}x${size.height}: centers avoid all army numbers`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/?seed=7');await page.getByLabel('Map size',{exact:true}).selectOption(String(count));await startGameIfNeeded(page);await expect(page.locator('[data-country]')).toHaveCount(count);await page.evaluate(()=>document.fonts.ready);
 const clear=async()=>{const stars=await page.locator('.centre:visible').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {height:r.height,overlaps:[...document.querySelectorAll('[data-country] .count')].some(a=>{const b=a.getBoundingClientRect();return r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top})};}));expect(stars).toHaveLength(3);for(const star of stars){expect(star.height).toBeGreaterThanOrEqual(14);expect(star.overlaps).toBe(false);}};
 await clear();const before=await page.evaluate(()=>localStorage.getItem('malpaco:seed-game:7'));await page.locator('#map-fit').click();await clear();expect(await page.evaluate(()=>localStorage.getItem('malpaco:seed-game:7'))).toBe(before);
 mkdirSync('screenshots/T146-centers',{recursive:true});await page.screenshot({path:`screenshots/T146-centers/large-${count}-${size.width}.png`});
});
