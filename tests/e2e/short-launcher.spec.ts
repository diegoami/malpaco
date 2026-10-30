import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const KEY='malpaco:seed-game:7';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit short viewports'));
async function visibleInLauncher(page:Page,selector:string){
 const bounds=await page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();let portTop=0,portBottom=innerHeight;for(let p=n.parentElement;p;p=p.parentElement)if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowY)){const b=p.getBoundingClientRect();portTop=Math.max(portTop,b.top+p.clientTop);portBottom=Math.min(portBottom,b.top+p.clientTop+p.clientHeight);}return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,portTop,portBottom};});
 expect(bounds.top).toBeGreaterThanOrEqual(bounds.portTop-1);expect(bounds.bottom).toBeLessThanOrEqual(bounds.portBottom+1);expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function settingsByKeyboard(page:Page){
 const selects=page.locator('#game-launcher select');await selects.first().focus();
 for(let n=0;n<await selects.count();n++){
  const select=selects.nth(n);await expect(select).toBeFocused();const id=await select.getAttribute('id');
  await visibleInLauncher(page,'#'+id);await visibleInLauncher(page,`#game-launcher label[for="${id}"]`);
  expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  if(n+1<await selects.count())await page.keyboard.press('Tab');
 }
 expect(await page.locator('#game-launcher').evaluate(n=>n.scrollTop)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
for(const size of [{width:568,height:320},{width:640,height:360},{width:740,height:360},{width:844,height:390}])for(const mode of ['text','icons'] as const)test(`${size.width}x${size.height} ${mode}: whole launcher scrolls with focused labels, explicit Start and exact Resume`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());await page.addInitScript(value=>localStorage.setItem('malpaco:button-labels',value),mode);await page.goto('/?seed=7');
 await visibleInLauncher(page,'#start-game');const card=(await page.locator('#game-launcher').boundingBox())!;expect(card.y+card.height).toBeLessThanOrEqual(size.height);await page.clock.runFor(6000);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBeNull();
 mkdirSync('artifacts/T153',{recursive:true});await page.screenshot({path:`artifacts/T153/initial-${size.width}-${mode}.png`});
 await settingsByKeyboard(page);await page.screenshot({path:`artifacts/T153/focused-${size.width}-${mode}.png`});await page.locator('#start-game').focus();await visibleInLauncher(page,'#start-game');await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);
 const saved=await page.evaluate(k=>localStorage.getItem(k),KEY);await page.reload();await visibleInLauncher(page,'#resume-game');expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);
 await page.locator('#configure-new-game').click();await settingsByKeyboard(page);await expect(page.getByLabel('Button labels',{exact:true})).toHaveValue(mode);
 await page.setViewportSize({width:390,height:844});await page.locator('#start-game').focus();await visibleInLauncher(page,'#start-game');await page.setViewportSize(size);await settingsByKeyboard(page);
 for(const primary of ['#start-game','#resume-game']){await page.locator(primary).focus();await visibleInLauncher(page,primary);}
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);await page.locator('#resume-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);
});
