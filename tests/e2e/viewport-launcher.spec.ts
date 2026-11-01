import {expect,test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const viewport of [{width:820,height:1180},{width:1180,height:820},{width:1024,height:600},{width:1280,height:800}])test(`launcher fits ${viewport.width}x${viewport.height} without scrolling`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/?seed=7');
 const launcher=page.locator('#game-launcher');await expect(launcher).toBeVisible();
 const metrics=await launcher.evaluate(el=>{const fields=el.querySelector<HTMLElement>('.game-settings')!,grid=fields.firstElementChild!;return {card:el.scrollHeight-el.clientHeight,fields:fields.scrollHeight-fields.clientHeight,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length};});
 expect(metrics.card).toBeLessThanOrEqual(1);expect(metrics.fields).toBeLessThanOrEqual(1);expect(metrics.columns).toBe(2);
 for(const field of await launcher.locator('select,label,#start-game').all()){
  const r=(await field.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(viewport.width);expect(r.y+r.height).toBeLessThanOrEqual(viewport.height);
 }
 for(const select of await launcher.locator('select').all())expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
 mkdirSync('artifacts/T156',{recursive:true});await page.screenshot({path:`artifacts/T156/launcher-${viewport.width}x${viewport.height}.png`});
});
