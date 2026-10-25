import {visitGame,reloadGame,startFromResult} from './shell';
import {expect,test} from '@playwright/test';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {openSurface} from './shell';
const KEY='malpaco:current-game';
const text=(p:import('@playwright/test').Page)=>p.evaluate(k=>localStorage.getItem(k),KEY);
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set here'));
for(const width of [390,1280])test(`${width}: all starting ranges and real event frequencies snapshot only into the next game`,async({page})=>{
 test.setTimeout(300000);await page.setViewportSize({width,height:width===390?844:800});await visitGame(page,'/');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});
 for(const range of ['1-2','1-3','1-4'])for(const frequency of ['Off','Rare','Normal','Often']){
  await openSurface(page,'menu');const before=(await text(page))!,prior=deserializeVersionedMatch(before);
  await openSurface(page,'menu');const form=page.getByRole('dialog',{name:'Settings',exact:true});await form.getByLabel('Starting armies',{exact:true}).selectOption(range);await form.getByLabel('Disasters and production',{exact:true}).selectOption(frequency);await form.getByLabel('Computer opponents',{exact:true}).selectOption('1');
  expect(await text(page)).toBe(before);await page.keyboard.press('Escape');await page.locator('#new-game-button').click();await page.locator('#give-up-cancel').click();expect(await text(page)).toBe(before);
  await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await startFromResult(page);await expect.poll(async()=>{const raw=await text(page);return raw?deserializeVersionedMatch(raw).options.seed!==prior.options.seed:false;},{timeout:60000}).toBe(true);
  await openSurface(page,'menu');const saved=(await text(page))!,loaded=deserializeVersionedMatch(saved),s=loaded.initialState!,maximum=Number(range.at(-1));
  expect(loaded.identity.rules).toEqual({id:'island-defender',version:1});expect(loaded.options.startingArmiesRange).toBe(range);expect(loaded.options.eventFrequency).toBe(frequency);expect(loaded.options.seats).toHaveLength(2);expect(s.rules.events?.frequency).toBe(frequency);expect(s.rules.reinforcementDivisor).toBeUndefined();
  expect(Object.values(s.armies).every(n=>n>=1&&n<=maximum)).toBe(true);expect(Object.values(s.armies).reduce((a,b)=>a+b)).toBe(46*(1+maximum)/2);
  await reloadGame(page);await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});expect(await text(page)).toBe(saved);
 }
 await openSurface(page,'menu');await page.screenshot({path:`artifacts/T43/settings-${width}.png`,animations:'disabled'});
});
