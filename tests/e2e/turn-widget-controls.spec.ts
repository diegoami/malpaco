import {test,expect} from '@playwright/test';
import {humanHandFixture} from './event-fixture';
import {visitGame} from './shell';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const size of [{width:390,height:844},{width:568,height:320},{width:820,height:1180},{width:844,height:390},{width:1280,height:800}])test(`${size.width}: widget sizes and hide preserve map zoom, match and Resume`,async({page})=>{
 const text=humanHandFixture().text;await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());await page.addInitScript(text=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'widget',paused:true}));localStorage.setItem('malpaco:button-labels','text');},text);await visitGame(page,'/');
 const widget=page.locator('#turn-tracker'),smaller=page.getByRole('button',{name:'Make turn widget smaller',exact:true}),larger=page.getByRole('button',{name:'Make turn widget larger',exact:true});await expect(smaller).toBeVisible();
 await page.locator('[data-country]').first().press('+');const zoom=await page.locator('#geographic-map').getAttribute('data-camera-zoom'),normal=(await widget.boundingBox())!.width;
 await smaller.click();const small=(await widget.boundingBox())!.width;expect(small).toBeLessThan(normal);await expect(smaller).toBeDisabled();await larger.click();await larger.click();const large=(await widget.boundingBox())!.width;expect(large).toBeGreaterThan(normal);await expect(larger).toBeDisabled();
 for(const control of await widget.locator('button:visible').all()){const r=(await control.boundingBox())!;expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width);expect(r.y+r.height).toBeLessThanOrEqual(size.height);}
 await page.getByRole('button',{name:'Hide turn widget',exact:true}).click();await expect(page.locator('#turn-widget-content')).toBeHidden();const restore=page.getByRole('button',{name:'Show turn widget',exact:true});await expect(restore).toBeVisible();await expect(restore).toBeFocused();await expect(page.locator('#resume-turn-button')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('malpaco:current-game'))).toBe(text);expect(await page.locator('#geographic-map').getAttribute('data-camera-zoom')).toBe(zoom);
 await page.locator('#resume-turn-button').click();await expect(restore).toBeVisible();await restore.click();await expect(page.locator('#turn-widget-content')).toBeVisible();expect((await widget.boundingBox())!.width).toBe(large);await page.screenshot({path:`artifacts/T159/widget-${size.width}.png`});
});
