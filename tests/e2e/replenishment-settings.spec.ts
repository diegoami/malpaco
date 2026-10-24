import {visitGame,reloadGame,startFromResult} from './shell';
// T114 replaces only the player selector: every old configured-rate save remains exact.
import {expect,test} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {reinforcementIncome} from '../../src/core/reinforcement';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {openSurface} from './shell';
const KEY='malpaco:current-game',PREF='malpaco:next-game-settings';
const read=(p:import('@playwright/test').Page)=>p.evaluate(k=>localStorage.getItem(k),KEY);
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set here'));
for(const width of [390,1280])for(const rate of [1,3,5,7] as const)test(`${width}: legacy divisor ${rate} survives new Settings and reload; only New game selects fixed income`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:width===390?844:800});
 const o={...defaultOptions(),seed:7,reinforcementDivisor:rate},old=serializeVersionedMatch(o,[],GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY);
 await page.addInitScript(([key,pref,text])=>{if(sessionStorage.getItem('legacy-once'))return;sessionStorage.setItem('legacy-once','1');localStorage.setItem(key!,text!);localStorage.setItem(key+'-meta',JSON.stringify({id:'legacy-rate',paused:true}));localStorage.setItem(pref!,JSON.stringify({version:2,computerOpponents:2,reinforcementDivisor:7}));},[KEY,PREF,old]);
 await visitGame(page,'/');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});const original=(await read(page))!;
 await openSurface(page,'menu');const form=page.getByRole('dialog',{name:'Settings',exact:true});await expect(form.getByLabel('Starting armies',{exact:true})).toHaveValue('1-3');await expect(form.getByLabel('Replenishment',{exact:true})).toHaveCount(0);
 await form.getByLabel('Starting armies',{exact:true}).selectOption('1-4');await form.getByLabel('Disasters and production',{exact:true}).selectOption('Off');expect(await read(page)).toBe(original);await page.keyboard.press('Escape');
 await reloadGame(page);await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});expect(await read(page)).toBe(original);const kept=deserializeVersionedMatch(original);expect(kept.state.rules.reinforcementDivisor).toBe(rate);expect(kept.state.events).toBeUndefined();
 await page.locator('#new-game-button').click();await page.locator('#give-up-cancel').click();expect(await read(page)).toBe(original);
 await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await startFromResult(page);
 await expect.poll(async()=>{const raw=await read(page);return raw?deserializeVersionedMatch(raw).identity.rules.id:null;},{timeout:60000}).toBe('island');
 await openSurface(page,'menu');
 const text=(await read(page))!,loaded=deserializeVersionedMatch(text),initial=loaded.initialState!;expect(loaded.options.startingArmiesRange).toBe('1-4');expect(loaded.options.eventFrequency).toBe('Off');expect(loaded.options.seats).toHaveLength(3);expect(loaded.options.reinforcementDivisor).toBeUndefined();
 expect(Object.values(initial.armies).reduce((a,b)=>a+b)).toBe(115);for(const p of initial.players){const income=reinforcementIncome(initial,p.id);expect(income.base).toBe(Math.max(2,Math.floor(income.provinceCount/3)));}
 await reloadGame(page);await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});expect(await read(page)).toBe(text);
});
