import {test,expect} from '@playwright/test';
import {humanCaptureFixture} from './event-fixture';

const destinations=[['GitHub repository','https://github.com/diegoami/malpaco'],['Releases and downloads','https://github.com/diegoami/malpaco/releases']] as const;
for(const [width,height] of [[390,844],[568,320],[1920,1080]] as const){
 test(`project and download links ${width}x${height} preserve the live game`,async({page,context})=>{
  await page.setViewportSize({width,height});await page.clock.install();await page.clock.pauseAt(new Date());
  // Exercise real popup navigation without requiring an external service in the suite.
  await context.route('https://github.com/diegoami/malpaco**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Project destination</title>'}));
  await page.goto('/');
  for(const playing of [false,true]){
   const wire=playing?humanCaptureFixture().text:null;
   if(wire){await page.evaluate(text=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'project-links',paused:true}));},wire);await page.reload();await page.locator('#resume-game').click();}
   const gameUrl=page.url();await page.locator('#game-help-button').click();
   for(const [name,url] of destinations){
    const link=page.getByRole('dialog',{name:'Help & icon names',exact:true}).getByRole('link',{name,exact:true});
    await expect(link).toHaveAttribute('href',url);await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');
    const opened=context.waitForEvent('page');await link.click();const popup=await opened;await popup.waitForLoadState();expect(popup.url()).toBe(url);await popup.close();
    expect(page.url()).toBe(gameUrl);expect(await page.evaluate(()=>localStorage.getItem('malpaco:current-game'))).toBe(wire);
   }
   const manualLink=page.locator('#full-player-manual');const href=await manualLink.getAttribute('href');expect(href).toMatch(/\/manual\/index\.html$/);
   const manual=await context.newPage();await manual.goto(new URL(href!,page.url()).href);
   for(const [name,url] of destinations)await expect(manual.getByRole('link',{name,exact:true})).toHaveAttribute('href',url);
   await manual.close();await page.locator('#close-game-help').click();expect(await page.evaluate(()=>localStorage.getItem('malpaco:current-game'))).toBe(wire);
  }
 });
}
