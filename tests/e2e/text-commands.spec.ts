import {expect,test} from '@playwright/test';
import {visitGame} from './shell';
const KEY='malpaco:seed-game:7';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set here'));
for(const [width,height] of [[320,640],[390,844],[844,390],[1280,800]])test(`${width}: text-only commands remain available during AI without playback controls`,async({page})=>{
 await page.setViewportSize({width:width!,height:height!});await page.clock.install();await page.clock.pauseAt(new Date());await visitGame(page,'/?seed=7');
 for(const id of ['#game-pause-button','#fast-forward-button','#game-speed'])await expect(page.locator(id)).toBeHidden();
 for(const id of ['#new-game-button','#open-game-menu','#game-help-button'])await expect(page.locator(id)).toBeVisible();
 await expect(page.locator('button svg,button img')).toHaveCount(0);await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','true');
 await page.locator('#open-game-menu').click();const raw=await page.evaluate(k=>localStorage.getItem(k),KEY);
 await page.clock.runFor(3000);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(raw);
 await expect(page.locator('#turn-guidance-title')).toHaveText('Paused');await expect(page.locator('button svg,button img')).toHaveCount(0);
 await page.screenshot({path:`artifacts/T119/settings-${width}.png`});await page.keyboard.press('Escape');
 await page.clock.runFor(1400);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).not.toBeNull();
 await page.locator('#game-help-button').click();await expect(page.locator('dialog.game-help[open]')).toBeVisible();await expect(page.locator('button svg,button img')).toHaveCount(0);await page.keyboard.press('Escape');
 await page.screenshot({path:`artifacts/T119/commands-${width}.png`});
});
test('native background requires contextual Resume; Settings cannot release it',async({page})=>{
 await page.addInitScript(()=>{Reflect.set(window,'hostActive',true);Reflect.set(window,'hostResume',false);Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'hostActive'),requiresResume:()=>Reflect.get(window,'hostResume'),acknowledgeResume:()=>{if(!Reflect.get(window,'hostActive'))return false;Reflect.set(window,'hostResume',false);return true;}});});
 await page.clock.install();await page.clock.pauseAt(new Date());await visitGame(page,'/?seed=7');await expect(page.locator('#resume-turn-button')).toBeHidden();
 await page.evaluate(()=>{Reflect.set(window,'hostActive',false);Reflect.set(window,'hostResume',true);window.dispatchEvent(new Event('malpaco:native-background'));});
 const raw=await page.evaluate(k=>localStorage.getItem(k),KEY);await expect(page.locator('#resume-turn-button')).toBeVisible();
 await page.evaluate(()=>{Reflect.set(window,'hostActive',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});
 await page.locator('#open-game-menu').click();await page.keyboard.press('Escape');await page.clock.runFor(5000);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(raw);
 await page.locator('#resume-turn-button').click();await expect(page.locator('#resume-turn-button')).toBeHidden();expect(await page.evaluate(()=>Reflect.get(window,'hostResume'))).toBe(false);
 await page.clock.runFor(2000);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('malpaco:seed-game-meta:7')??'{}').paused)).toBe(false);
});
