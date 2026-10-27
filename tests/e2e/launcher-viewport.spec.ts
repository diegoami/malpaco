import {expect,test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set per test'));
for(const size of [{width:360,height:640},{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}])test(`${size.width}x${size.height}: Start and Resume stay above viewport-contained settings`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/?seed=7');const key='malpaco:seed-game:7';
 const fit=async(primary:string)=>{
  const box=(await page.locator('#game-launcher').boundingBox())!,r=(await page.locator(primary).boundingBox())!,v=page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(v.width+1);expect(box.y+box.height).toBeLessThanOrEqual(v.height+1);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(v.height);expect(r.height).toBeGreaterThanOrEqual(44);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(v.width);
  if(await page.locator('#game-launcher .game-settings').isVisible()){const settings=(await page.locator('#game-launcher .game-settings').boundingBox())!;expect(r.y+r.height).toBeLessThanOrEqual(settings.y);}
 };
 await fit('#start-game');mkdirSync('artifacts/T148',{recursive:true});await page.screenshot({path:`artifacts/T148/launcher-initial-${size.width}.png`});await page.clock.runFor(6000);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
 for(const select of await page.locator('#game-launcher select').all()){await select.focus();await expect(select).toBeFocused();const r=(await select.boundingBox())!;expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(size.height);expect(r.height).toBeGreaterThanOrEqual(44);}
 await page.getByLabel('Combat rules',{exact:true}).selectOption('legacy');await fit('#start-game');mkdirSync('artifacts/T148',{recursive:true});await page.screenshot({path:`artifacts/T148/launcher-${size.width}.png`});
 await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);const saved=await page.evaluate(k=>localStorage.getItem(k),key);expect(JSON.parse(saved!).rules.id).toBe('island');
 await page.reload();await expect(page.locator('#resume-game')).toBeVisible();await fit('#resume-game');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
 await page.setViewportSize(size.width<600?{width:844,height:390}:{width:360,height:640});await fit('#resume-game');await page.setViewportSize(size);await fit('#resume-game');
 await page.locator('#configure-new-game').click();await fit('#start-game');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
 await page.locator('#resume-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
});
