import {expect,test} from '@playwright/test';
import {deserializeVersionedMatch,friendlySources,friendlyTargets} from '../../src/core';
import {pinned} from '../core/versioned-match-fixture';
import {begin,load,savedText,next,exactly} from './helpers/release';
import {openSurface,reachableInCard} from './shell';

test('short-height friendly picker keeps Confirm and Cancel reachable without committing a draft',async({page},info)=>{
 test.skip(info.project.name!=='1280x800','sizes set here');
 const fixture=pinned('move-ready'),state=deserializeVersionedMatch(fixture.text).state;
 const from=friendlySources(state)[0]!,to=friendlyTargets(state,from)[0]!;
 await begin(page,'/?view=reference-game&control=manual');await load(page,fixture.text);
 await page.locator('#start-friendly-move-button').click();
 for(const id of [from,to]){const country=page.locator(`[data-country="${id}"]`);await country.focus();await country.press('Enter');}
 await openSurface(page,'actions');await page.locator('#friendly-move-amount').fill('1');const before=await savedText(page);
 for(const size of [{width:320,height:200},{width:640,height:240},{width:640,height:400}]){
  await page.setViewportSize(size);await page.clock.runFor(200);await openSurface(page,'actions');
  for(const id of ['friendly-move-min-button','friendly-move-less-button','friendly-move-amount','friendly-move-more-button','friendly-move-max-button','confirm-friendly-move-button','cancel-friendly-move-button']){
   const control=page.locator('#'+id);await reachableInCard(control);expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const confirm=(await page.locator('#confirm-friendly-move-button').boundingBox())!;
  for(const control of await page.locator('.amount-adjust > *').all()){
   const box=(await control.boundingBox())!;expect(confirm.x).toBeGreaterThanOrEqual(box.x+box.width);expect(confirm.y).toBeLessThanOrEqual(box.y+1);expect(confirm.y+confirm.height).toBeGreaterThanOrEqual(box.y+box.height-1);
  }
  await expect(page.locator('#friendly-move-amount')).toHaveValue('1');await page.screenshot({path:info.outputPath(`friendly-${size.width}x${size.height}.png`)});
 }
 await page.setViewportSize({width:1280,height:800});expect(await savedText(page)).toBe(before);await openSurface(page,'actions');
 await page.locator('#confirm-friendly-move-button').click();await exactly(page,next(state,{kind:'friendlyMove',from,to,amount:1}));
});
