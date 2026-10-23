import {expect,test} from '@playwright/test';
import {eventFixture} from './event-fixture';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {islandRules} from '../../src/core/state';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_EVENT_MATCH_IDENTITY} from '../../src/core/match-save';
import type {Page} from '@playwright/test';
const KEY='malpaco:current-game',META=KEY+'-meta';
const read=(p:Page,k=KEY)=>p.evaluate(k=>localStorage.getItem(k),k);
async function open(p:Page,text:string){
 await p.clock.install();await p.clock.pauseAt(new Date());
 await p.addInitScript(([key,text])=>{if(sessionStorage.getItem('world-once'))return;sessionStorage.setItem('world-once','1');localStorage.setItem(key!,text!);localStorage.setItem(key+'-meta',JSON.stringify({id:'world-fixture',paused:false}));},[KEY,text]);
 await p.goto('/?log');await expect(p.locator('[data-country]')).toHaveCount(46,{timeout:60000});
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set per test'));
for(const width of [390,1280])for(const kind of ['storm','revolt','shift','harvest'] as const)test(`${kind}/${width}: exact event changes, fold, rotation/reload, acknowledgement and kept game`,async({page})=>{
 test.setTimeout(180000);const f=eventFixture(kind),e=f.state.events!.latest!;await page.setViewportSize({width,height:width===390?844:800});await open(page,f.text);
 const card=page.locator('#world-event-card');await expect(card).toBeVisible();await expect(card.locator('[data-event-country]')).toHaveCount(e.changes.length);
 for(const c of e.changes){const row=card.locator(`[data-event-country="${c.id}"]`);await expect(row).toContainText(f.state.map.provinces.find(p=>p.id===c.id)!.name);if(kind==='storm'||kind==='harvest')await expect(row).toContainText(`${c.armiesBefore} → ${c.armiesAfter}`);await expect(page.locator(`[data-country="${c.id}"]`)).toHaveAttribute('data-armies',String(c.armiesAfter));}
 await expect(page.locator('[data-world-event="true"]')).toHaveCount(e.changes.length);await expect(page.locator('[data-country] .centre:visible')).toHaveCount(3);
 const before=(await read(page))!;expect(deserializeVersionedMatch(before).state).toEqual(f.state);await page.clock.runFor(20000);expect(await read(page)).toBe(before);
 await page.screenshot({path:`artifacts/T43/${kind}-${width}.png`,animations:'disabled'});
 await page.locator('#fold-world-event').click();await expect(page.locator('#open-world-event')).toBeVisible();await expect(page.locator('#open-world-event')).toBeFocused();await page.clock.runFor(20000);expect(await read(page)).toBe(before);
 if(width===390){await page.locator('#open-game-menu').click();await page.locator('#game-log-button').click();await expect(page.locator('dialog.game-event-log')).toContainText(`World event: ${kind}`);await page.keyboard.press('Escape');}
 await page.setViewportSize({width:844,height:390});await page.reload();await expect(page.locator('#acknowledge-world-event')).toBeVisible({timeout:60000});expect(await read(page)).toBe(before);
 await page.locator('#acknowledge-world-event').click();await expect(card).toBeHidden();expect(await read(page)).toBe(before);expect(JSON.parse((await read(page,META))!).eventAck).toBe(e.sequence);
 await page.reload();await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});await expect(card).toBeHidden();expect(await read(page)).toBe(before);
});
test('Off has no centre or event UI and saves the chosen fixed-income rules',async({page})=>{
 test.setTimeout(90000);const o={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Off' as const},r=createGeographicGame(o,islandRules(o),{},2);if(!r.ok)throw Error(r.errors.join());
 const text=serializeVersionedMatch(o,[],GEOGRAPHIC_EVENT_MATCH_IDENTITY);await open(page,text);await page.locator('#game-pause-button').click();await expect(page.locator('[data-country] .centre:visible')).toHaveCount(0);await expect(page.locator('[data-world-event="true"]')).toHaveCount(0);await expect(page.locator('#world-event-card')).toBeHidden();expect(deserializeVersionedMatch((await read(page))!).state.rules.events?.frequency).toBe('Off');
});
test('native Back folds without acknowledging; background and Continue cannot release explicit Resume',async({page})=>{
 test.setTimeout(120000);await page.addInitScript(()=>{Reflect.set(window,'active',true);Reflect.set(window,'required',false);Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'active'),requiresResume:()=>Reflect.get(window,'required'),acknowledgeResume:()=>{if(!Reflect.get(window,'active'))return false;Reflect.set(window,'required',false);return true;}});});
 const f=eventFixture('harvest');await open(page,f.text);await expect(page.locator('#acknowledge-world-event')).toBeVisible();const before=(await read(page))!;
 expect(await page.evaluate(()=>!window.dispatchEvent(new Event('malpaco:native-back',{cancelable:true})))).toBe(true);await expect(page.locator('#open-world-event')).toBeVisible();expect(JSON.parse((await read(page,META))!).eventAck??0).toBe(0);
 await page.evaluate(()=>{Reflect.set(window,'active',false);Reflect.set(window,'required',true);window.dispatchEvent(new Event('malpaco:native-background'));Reflect.set(window,'active',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});
 await page.locator('#open-world-event').click();await page.locator('#acknowledge-world-event').click();await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');await page.clock.runFor(20000);expect(await read(page)).toBe(before);
 await page.locator('#game-pause-button').click();await page.clock.runFor(20000);expect(deserializeVersionedMatch((await read(page))!).state.history.length).toBeGreaterThan(f.state.history.length);
});
