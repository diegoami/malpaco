import {expect,test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports set per case'));
for(const size of [{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}])test(`${size.width}x${size.height}: compact mobile icons resize without losing names, counters or saved play`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?seed=7');
 const mode=async(ids:string[])=>{for(const id of ids){const b=page.locator('#'+id);await expect(b).toBeVisible();
  if(page.viewportSize()!.width<=900){await expect(b).toHaveClass(/game-mobile-command/);await expect(b.locator('svg')).toHaveCount(1);const r=(await b.boundingBox())!;expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.width).toBeLessThanOrEqual(56);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(page.viewportSize()!.width);}
  else {await expect(b).not.toHaveClass(/game-mobile-command/);await expect(b.locator('svg')).toHaveCount(0);expect((await b.textContent())!.trim()).not.toBe('');}
 }};
 await mode(['start-game']);await expect(page.locator('#start-game')).toHaveAccessibleName('Start game');await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);await page.clock.runFor(3000);
 await mode(['new-game-button','open-game-menu']);await expect(page.locator('#new-game-button')).toHaveAccessibleName('New game');
 await expect(page.locator('button.game-mobile-command[hidden]:visible')).toHaveCount(0);
 await page.locator('#open-game-menu').press('Enter');await expect(page.locator('.next-game-setting label').first()).toBeVisible();
 const key='malpaco:seed-game:7',before=await page.evaluate(k=>localStorage.getItem(k),key),counter=page.locator('#open-hand .hand-count');await expect(counter).toHaveCount(1);const count=await counter.textContent();
 mkdirSync('artifacts/T147',{recursive:true});await page.screenshot({path:`artifacts/T147/settings-${size.width}.png`});
 await page.setViewportSize(size.width<=900?{width:1280,height:800}:{width:390,height:844});await mode(['new-game-button','open-game-menu']);expect(await counter.textContent()).toBe(count);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 await page.setViewportSize(size);await mode(['new-game-button','open-game-menu']);await page.keyboard.press('Escape');await page.screenshot({path:`artifacts/T147/board-${size.width}.png`});expect(errors).toEqual([]);
});
