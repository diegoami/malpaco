import {expect,test} from '@playwright/test';
import {visitGame} from './shell';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set by test'));
for(const [width,height] of [[390,844],[844,390],[1280,800],[320,640]])test(`${width}: readable turn rows, spaced capitals and Settings directly under its button`,async({page})=>{
 await page.setViewportSize({width:width!,height:height!});await page.clock.install();await page.clock.pauseAt(new Date());await visitGame(page,'/?seed=7');
 const pause=page.locator('#game-pause-button');if(await pause.isVisible())await pause.click();
 const tracker=page.locator('#turn-tracker'),settings=page.locator('#open-game-menu');
 expect(await tracker.locator('.turn-row').first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(18);
 expect(await page.locator('#turn-guidance-title').evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(20);
 for(const b of await page.locator('.primary-command.game-text-command').all()){const style=await b.evaluate(n=>({font:parseFloat(getComputedStyle(n).fontSize),spacing:parseFloat(getComputedStyle(n).letterSpacing)}));expect(style.font).toBeGreaterThanOrEqual(20);expect(style.spacing).toBeGreaterThanOrEqual(.6);}
 await settings.click();const dialog=page.locator('#game-focus-drawer');await expect(dialog).toBeVisible();
 const a=(await settings.boundingBox())!,b=(await dialog.boundingBox())!;expect(b.y-a.y-a.height).toBeGreaterThanOrEqual(4);expect(b.y-a.y-a.height).toBeLessThanOrEqual(12);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width!);expect(b.y+b.height).toBeLessThanOrEqual(height!);
 for(const n of await dialog.locator('.next-game-setting label,.next-game-setting select').all()){const s=await n.evaluate(n=>({font:parseFloat(getComputedStyle(n).fontSize),caps:getComputedStyle(n).textTransform}));expect(s.font).toBeGreaterThanOrEqual(22);expect(s.caps).toBe('uppercase');}
 await page.screenshot({path:`artifacts/T117-readability/settings-${width}.png`});await page.keyboard.press('Escape');await page.screenshot({path:`artifacts/T117-readability/tracker-${width}.png`});
});
