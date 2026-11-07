import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {humanCaptureFixture} from './event-fixture';

async function completeCloseTarget(page:Page):Promise<void>{
 const geometry=await page.locator('#close-game-help').evaluate(button=>{
  const r=button.getBoundingClientRect(),d=button.closest('dialog')!.getBoundingClientRect();
  return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
   dialog:{x:d.x,y:d.y,right:d.right,bottom:d.bottom},viewport:{width:innerWidth,height:innerHeight},
   hits:[.1,.5,.9].flatMap(x=>[.1,.5,.9].map(y=>button.contains(document.elementFromPoint(r.x+r.width*x,r.y+r.height*y))))};
 });
 expect(geometry.width).toBeGreaterThanOrEqual(44);expect(geometry.height).toBeGreaterThanOrEqual(44);
 expect(geometry.dialog.x).toBeGreaterThanOrEqual(0);expect(geometry.dialog.y).toBeGreaterThanOrEqual(0);
 expect(geometry.dialog.right).toBeLessThanOrEqual(geometry.viewport.width);expect(geometry.dialog.bottom).toBeLessThanOrEqual(geometry.viewport.height);
 expect(geometry.x).toBeGreaterThanOrEqual(geometry.dialog.x);expect(geometry.y).toBeGreaterThanOrEqual(geometry.dialog.y);
 expect(geometry.right).toBeLessThanOrEqual(geometry.dialog.right);expect(geometry.bottom).toBeLessThanOrEqual(geometry.dialog.bottom);
 expect(geometry.hits).toEqual(Array(9).fill(true));
}

for(const [width,height] of [[320,568],[390,844],[568,320],[844,390],[1280,800],[1920,1080]] as const){
 for(const mode of ['text','icons','auto'] as const){
  test(`Help close target ${width}x${height} ${mode}: launcher and pending game`,async({page},info)=>{
   await page.setViewportSize({width,height});await page.clock.install();await page.clock.pauseAt(new Date());
   await page.addInitScript(mode=>localStorage.setItem('malpaco:button-labels',mode),mode);
   await page.goto('/');await page.locator('#game-help-button').click();await completeCloseTarget(page);
   await page.locator('dialog[aria-labelledby="game-help-title"]').evaluate(d=>{d.scrollTop=d.scrollHeight;});await completeCloseTarget(page);
   // Real point click avoids the locator's automatic scrolling masking a clipped target.
   let box=(await page.locator('#close-game-help').boundingBox())!;await page.mouse.click(box.x+box.width*.1,box.y+box.height*.1);
   await expect(page.locator('dialog[aria-labelledby="game-help-title"]')).not.toBeVisible();await expect(page.locator('#game-help-button')).toBeFocused();
   const wire=humanCaptureFixture().text;
   await page.evaluate(text=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'help-close',paused:true}));},wire);
   await page.reload();await page.locator('#resume-game').click();await page.locator('#game-help-button').click();await completeCloseTarget(page);
   await page.locator('dialog[aria-labelledby="game-help-title"]').evaluate(d=>{d.scrollTop=d.scrollHeight;});await completeCloseTarget(page);
   await page.screenshot({path:info.outputPath(`help-${width}x${height}-${mode}.png`),animations:'disabled'});
   await page.setViewportSize({width:height,height:width});await completeCloseTarget(page);
   await page.keyboard.press('Escape');await expect(page.locator('dialog[aria-labelledby="game-help-title"]')).not.toBeVisible();await expect(page.locator('#game-help-button')).toBeFocused();
   expect(await page.evaluate(()=>localStorage.getItem('malpaco:current-game'))).toBe(wire);
  });
 }
}

test('Help close target remains reachable in actual fullscreen',async({page},info)=>{
 await page.setViewportSize({width:1920,height:1080});await page.goto('/');
 await page.evaluate(()=>document.documentElement.requestFullscreen());
 expect(await page.evaluate(()=>document.fullscreenElement===document.documentElement)).toBe(true);
 await page.locator('#game-help-button').click();await completeCloseTarget(page);
 await page.screenshot({path:info.outputPath('help-fullscreen.png'),animations:'disabled'});
 const box=(await page.locator('#close-game-help').boundingBox())!;await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await expect(page.locator('dialog[aria-labelledby="game-help-title"]')).not.toBeVisible();await expect(page.locator('#game-help-button')).toBeFocused();
 await page.evaluate(()=>document.exitFullscreen());
});
