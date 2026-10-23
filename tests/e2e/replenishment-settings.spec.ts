import {expect,test} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {raidCardsRules} from '../../src/core/state';
import {reinforcementIncome} from '../../src/core/reinforcement';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {openSurface} from './shell';
const KEY='malpaco:current-game',PREF='malpaco:next-game-settings';
const read=(p:import('@playwright/test').Page,k:string)=>p.evaluate(k=>localStorage.getItem(k),k);
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set per test'));
for(const width of [390,1280])test(`${width}: rate changes only the next game, all four rates resume with their immutable rule`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:width===390?844:800});
 const o={...defaultOptions(),seed:7},g=createGeographicGame(o,raidCardsRules(o),{},2);if(!g.ok)throw Error(g.errors.join());
 const old=serializeVersionedMatch(o,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
 await page.addInitScript(([key,pref,text])=>{if(sessionStorage.getItem('rates-once'))return;sessionStorage.setItem('rates-once','1');localStorage.setItem(key!,text!);localStorage.setItem(key+'-meta',JSON.stringify({id:'old-rates',paused:true}));localStorage.setItem(pref!,JSON.stringify({version:1,computerOpponents:2}));},[KEY,PREF,old]);
 await page.goto('/');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});const original=(await read(page,KEY))!;
 await openSurface(page,'menu');
 const dialog=page.getByRole('dialog',{name:'Settings',exact:true}),rate=dialog.getByLabel('Replenishment',{exact:true}),count=dialog.getByLabel('Computer opponents',{exact:true});
 await expect(rate).toHaveValue('3');await expect(count).toHaveValue('2');await expect(dialog).not.toContainText('Minimum 2');
 await expect.poll(()=>rate.evaluate(n=>n.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 await rate.selectOption('7');expect(await read(page,KEY)).toBe(original);
 await page.keyboard.press('Escape');await page.reload();await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});expect(await read(page,KEY)).toBe(original);
 for(const [i,value] of [1,3,5,7].entries()){
  const pause=page.locator('#game-pause-button');if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
  await openSurface(page,'menu');
  await rate.selectOption(String(value));await count.selectOption(String(i%3+1));await expect(rate).toHaveValue(String(value));
  if(i===0)await page.screenshot({path:`artifacts/T110-browser/rates-${width}.png`,animations:'disabled'});
  await dialog.getByRole('button',{name:'Return to map',exact:true}).click();
  await openSurface(page,'menu');await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await page.locator('#give-up-new-game').click();
  await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});
  await expect.poll(async()=>deserializeVersionedMatch((await read(page,KEY))!).options.reinforcementDivisor).toBe(value);
  if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
  const saved=(await read(page,KEY))!,loaded=deserializeVersionedMatch(saved);
  expect(loaded.identity.rules).toEqual({id:'configurable-cards',version:1});expect(loaded.options.seats.length).toBe(i%3+2);
  for(const p of loaded.state.players){const income=reinforcementIncome(loaded.state,p.id);expect(income.base).toBe(Math.max(2,Math.floor(income.provinceCount/value)));expect(income.total).toBe(income.base+income.islandBonus);}
  await page.reload();await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});expect(await read(page,KEY)).toBe(saved);
 }
});
