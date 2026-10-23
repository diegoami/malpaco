import {expect,test} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {raidCardsRules} from '../../src/core/state';
import {serializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {openSurface} from './shell';
const KEY='malpaco:current-game';
const PREF='malpaco:next-game-settings';
// [designed] Map restore is setup: match the 60 s budget used by the balance/native acceptance.
// Cold presentation startup can exceed Playwright's default 5 s before the assertions begin.
const read=(page:import('@playwright/test').Page,key:string)=>page.evaluate(k=>localStorage.getItem(k),key);
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set by test'));
for(const width of [390,1280])test(`${width}: Settings changes only the next game; refresh, cancelled give-up and 1–3 opponents preserve the current match`,async({page})=>{
 test.setTimeout(150000);await page.setViewportSize({width,height:width===390?844:800});
 const options={...defaultOptions(),seed:7},old=createGeographicGame(options,raidCardsRules(options),{},2);if(!old.ok)throw Error(old.errors.join());
 const text=serializeVersionedMatch(options,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
 await page.addInitScript(([k,t])=>{if(sessionStorage.getItem('settings-once'))return;sessionStorage.setItem('settings-once','1');localStorage.setItem(k!,t!);localStorage.setItem(k+'-meta',JSON.stringify({id:'settings-old-game',paused:true}));},[KEY,text]);
 await page.goto('/');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const before=(await read(page,KEY))!;await openSurface(page,'menu');


 const dialog=page.getByRole('dialog',{name:'Settings',exact:true});await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('Applies to the next game');
 const opponents=dialog.getByLabel('Computer opponents',{exact:true});await expect(opponents).toHaveValue('3');
 await expect.poll(()=>opponents.evaluate(n=>n.getBoundingClientRect().height),{message:'opponent selector touch target'}).toBeGreaterThanOrEqual(44);
 await opponents.selectOption('1');expect(await read(page,KEY)).toBe(before);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 await expect(page.locator('#open-game-menu')).toBeFocused();
 await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 expect(await read(page,KEY)).toBe(before);await openSurface(page,'menu');
 await expect(opponents).toHaveValue('1');
 await page.screenshot({path:`artifacts/T107-browser/settings-${width}.png`,animations:'disabled'});
 await dialog.getByRole('button',{name:'Return to map',exact:true}).click();
 await openSurface(page,'menu');await page.locator('#new-game-button').click();await page.locator('#give-up-cancel').click();
 expect(await read(page,KEY)).toBe(before);
 for(const count of [1,2,3]){
  if(count!==1){
   const pause=page.locator('#game-pause-button');if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
   await openSurface(page,'menu');await opponents.selectOption(String(count));await dialog.getByRole('button',{name:'Return to map',exact:true}).click();
  }
  await openSurface(page,'menu');await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await page.locator('#give-up-new-game').click();
  await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  await expect.poll(async()=>deserializeVersionedMatch((await read(page,KEY))!).options.seats.length).toBe(count+1);
  const loaded=deserializeVersionedMatch((await read(page,KEY))!);
  expect(loaded.options.seats.map(s=>s.kind)).toEqual(['human',...Array(count).fill('computer')]);
  expect(loaded.options.computerStrengths).toEqual(Array(count).fill('Normal'));
  const pause=page.locator('#game-pause-button');if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
  const kept=(await read(page,KEY))!;await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  expect(await read(page,KEY)).toBe(kept);expect(deserializeVersionedMatch(kept).options.seats.length).toBe(count+1);
 }
 expect(JSON.parse((await read(page,PREF))!).computerOpponents).toBe(3);expect(errors).toEqual([]);
});

test('a failed settings write reports the error, restores the saved choice and leaves the current game intact',async({page})=>{
 await page.goto('/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 await page.locator('#game-pause-button').click();
 const key='malpaco:seed-game:7',before=(await read(page,key))!;
 await page.evaluate(pref=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===pref)throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v);};},PREF);
 await openSurface(page,'menu');
 const dialog=page.getByRole('dialog',{name:'Settings',exact:true});
 await dialog.getByLabel('Computer opponents',{exact:true}).selectOption('1');
 await expect(dialog.getByRole('alert')).toContainText('Could not keep these settings');
 await expect(dialog.getByLabel('Computer opponents',{exact:true})).toHaveValue('3');
 expect(await read(page,key)).toBe(before);expect(await read(page,PREF)).toBeNull();
});
