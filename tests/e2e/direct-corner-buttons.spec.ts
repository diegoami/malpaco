import {visitGame} from './shell';
import {expect,test} from '@playwright/test';
const KEY='malpaco:seed-game:7';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set here'));
for(const [width,height] of [[390,844],[844,390],[1280,800],[320,640]])test(`${width}: New game, Settings and Help open directly at top left`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:width!,height:height!});await visitGame(page,'/?seed=7');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});
 const pause=page.locator('#game-pause-button');if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
 const safe=width===390?18:0;if(safe)await page.addStyleTag({content:':root{--safe-left:18px;--safe-right:18px;--safe-top:12px;--safe-bottom:12px}'});
 expect(await page.locator('.lane').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).strokeDasharray==='none'))).toBe(true);
 const saved=await page.evaluate(k=>localStorage.getItem(k),KEY);
 const group=page.locator('#game-status'),fresh=group.locator('#new-game-button'),settings=group.locator('#open-game-menu'),help=group.locator('#game-help-button');
 for(const [button,name] of [[fresh,'New game'],[settings,'Settings'],[help,'Help']] as const){await expect(button).toBeVisible();await expect(button).toHaveAccessibleName(name);await expect(button.locator('svg')).toHaveCount(0);await expect(button).toHaveText(name);expect(await button.evaluate(n=>parseInt(getComputedStyle(n).fontWeight))).toBeGreaterThanOrEqual(800);await button.hover();await expect(button).toHaveAttribute('title',name);}
 const boxes=[];for(const button of [fresh,settings,help,pause,page.getByLabel('Game speed',{exact:true})]){const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(safe);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width!-safe);boxes.push(b);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i]!,b=boxes[j]!;expect(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)<=0||Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)<=0).toBe(true);}
 await settings.click();const form=page.getByRole('dialog',{name:'Settings',exact:true});await expect(form.getByLabel('Computer opponents',{exact:true})).toBeVisible();await expect(form.getByLabel('Starting armies',{exact:true})).toBeVisible();
 await expect(form).not.toContainText('Applies to the next game');await expect(form).not.toContainText('Minimum 2');await expect.poll(()=>form.getByLabel('Starting armies',{exact:true}).evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(18);
 const fits=await form.getByLabel('Starting armies',{exact:true}).evaluate(select=>{const n=select as HTMLSelectElement,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')!;ctx.font=getComputedStyle(n).font;return n.getBoundingClientRect().width>=ctx.measureText(n.selectedOptions[0]!.textContent!).width+24;});expect(fits,'selected starting-army value is fully readable').toBe(true);
 await form.getByLabel('Computer opponents',{exact:true}).selectOption('1');expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);await page.screenshot({path:`artifacts/T112/settings-${width}.png`,animations:'disabled'});await page.keyboard.press('Escape');await expect(settings).toBeFocused();
 await help.click();await expect(page.locator('dialog.game-help[open]')).toBeVisible();await expect(page.locator('dialog.game-help[open]')).toContainText('next game');await expect(page.locator('dialog.game-help[open]')).toContainText('minimum of 2');await page.keyboard.press('Escape');
 await fresh.click();await expect(page.locator('#give-up-cancel')).toBeVisible();await page.locator('#give-up-cancel').click();expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);
 await page.screenshot({path:`artifacts/T112/top-left-${width}.png`,animations:'disabled'});
});
