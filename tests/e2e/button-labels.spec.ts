import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {humanCaptureFixture,humanHandFixture} from './event-fixture';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import {visitGame,activate,reloadGame} from './shell';
const KEY='malpaco:current-game';
async function shot(page:Page,name:string){mkdirSync('artifacts/T152',{recursive:true});await page.mouse.move(0,0);await page.screenshot({path:`artifacts/T152/${name}.png`,animations:'disabled'});}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewports'));
async function battle(page:Page){
 const f=humanCaptureFixture(),loaded=deserializeVersionedMatch(f.text),text=serializeVersionedMatch(loaded.options,loaded.state.history.slice(0,-1),loaded.identity);
 await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({key,text})=>{if(sessionStorage.getItem('button-label-fixture'))return;sessionStorage.setItem('button-label-fixture','1');localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'button-label-test',paused:false}));},{key:KEY,text});
 await visitGame(page,'/');await page.clock.runFor(3000);return {text,from:f.state.pendingCapture!.from,to:f.state.pendingCapture!.to};
}
async function mode(page:Page,value:'text'|'icons'){
 await page.locator('#open-game-menu').click();const choice=page.getByLabel('Button labels',{exact:true});await expect(choice).toBeVisible();await choice.selectOption(value);await page.keyboard.press('Escape');
}
test('launcher offers a persistent Icons/Text preference without starting a game',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.setViewportSize({width:390,height:844});await page.goto('/');const choice=page.getByLabel('Button labels',{exact:true});await expect(choice).toHaveValue('text');
 await choice.selectOption('icons');await expect(page.locator('#start-game svg')).toBeVisible();await expect(page.locator('[data-country]')).toHaveCount(0);
 await page.reload();await expect(choice).toHaveValue('icons');await choice.selectOption('text');await expect(page.locator('#start-game')).toHaveText(/Start game/i);
 await choice.selectOption('icons');await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});await page.clock.runFor(3000);
 await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await page.locator('#give-up-new-game').click();await expect(choice).toHaveValue('icons');await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});await expect(page.locator('#new-game-button svg')).toBeVisible();
});
test('dual map actions honor Text through updates, resizes and reload; Icons switch immediately without changing the match',async({page})=>{
 const f=await battle(page);await activate(page.locator(`[data-country="${f.from}"]`));
 const attack=page.locator('#province-action-button'),move=page.locator('#province-move-button');await expect(attack).toHaveAttribute('data-both','true');
 await expect(attack).toHaveText(/Attack/i);await expect(move).toHaveText(/Move/i);const desktop=await attack.evaluate(n=>parseFloat(getComputedStyle(n).fontSize));
 await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);await expect(attack).toHaveText(/Attack/i);await expect(move).toHaveText(/Move/i);
 const phone=await attack.evaluate(n=>({font:parseFloat(getComputedStyle(n).fontSize),width:n.getBoundingClientRect().width}));expect(phone.font).toBeLessThan(desktop);expect(phone.width).toBeLessThan(120);
 for(const id of ['start-friendly-move-button','end-turn-button']){const r=(await page.locator('#'+id).boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(390);}
 for(const size of [{width:320,height:640},{width:844,height:390}]){await page.setViewportSize(size);await page.clock.runFor(100);for(const b of [attack,move]){await expect(b).toHaveText(/Attack|Move/i);const r=(await b.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width);expect(r.height).toBeGreaterThanOrEqual(44);}}
 await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);
 await shot(page,'text-map-phone');
 await page.locator(`[data-country="${f.to}"]`).press('Shift+Enter');await expect(attack).toHaveText(/Attack/i);
 await mode(page,'icons');await activate(page.locator(`[data-country="${f.from}"]`));await expect(attack.locator('svg')).toBeVisible();await expect(move.locator('svg')).toBeVisible();
 for(const id of ['start-friendly-move-button','end-turn-button'])await expect(page.locator('#'+id+' svg')).toBeVisible();
 await page.clock.runFor(100);await shot(page,'icons-map-phone');
 for(const b of [attack,move]){const r=(await b.boundingBox())!;expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(390);}
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);await reloadGame(page);await activate(page.locator(`[data-country="${f.from}"]`));await expect(attack.locator('svg')).toBeVisible();
 await mode(page,'text');await activate(page.locator(`[data-country="${f.from}"]`));await expect(attack).toHaveText(/Attack/i);await expect(move).toHaveText(/Move/i);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});
test('failed display-preference write restores the kept selection and preserves match data',async({page})=>{
 const f=await battle(page);await page.locator('#open-game-menu').click();const choice=page.getByLabel('Button labels',{exact:true});
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota');};});await choice.selectOption('icons');await expect(choice).toHaveValue('text');await expect(page.getByRole('alert').filter({hasText:/button|display/i})).toBeVisible();expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});

test('#400: phone Move and End turn show visible glyphs on a real human attack turn',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>localStorage.setItem('malpaco:button-labels','icons'));const f=await battle(page);
 for(const id of ['start-friendly-move-button','end-turn-button']){const b=page.locator('#'+id);await expect(b).toBeVisible();await expect(b).toHaveAccessibleName(/Move|End turn/i);await expect(b.locator('svg')).toBeVisible();}
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});

for(const value of ['text','icons'] as const)test(`${value}: command faces survive a complete computer turn`,async({page})=>{
 await battle(page);await mode(page,value);
 const before=deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state;
 await page.locator('#end-turn-button').click();
 await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','true');
 for(let n=0;n<600&&await page.locator('.panel').getAttribute('data-computer-active')==='true';n++)await page.clock.runFor(120);
 await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','false');
 const after=deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state;
 expect(after.turnNumber).toBeGreaterThan(before.turnNumber);
 await expect(page.locator('body')).toHaveAttribute('data-button-labels',value);
 const command=page.locator('#new-game-button');
 if(value==='icons')await expect(command.locator('svg')).toBeVisible();else await expect(command).toHaveText(/New game/i);
 await page.locator('#open-game-menu').click();await expect(page.getByLabel('Button labels',{exact:true})).toHaveValue(value);
});

for(const size of [{width:320,height:640},{width:844,height:390},{width:1280,height:800}])test(`${size.width}: Text controls fit with the Cards counter visible`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());const f=humanHandFixture();
 await page.addInitScript(({key,text})=>{localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'text-hand',paused:true}));},{key:KEY,text:f.text});await visitGame(page,'/');
 await mode(page,'text');const tracker=(await page.locator('#turn-tracker').boundingBox())!;
 for(const id of ['new-game-button','open-game-menu','game-help-button','open-hand']){const b=page.locator('#'+id);await expect(b).toBeVisible();const r=(await b.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width);expect(r.y+r.height).toBeLessThanOrEqual(tracker.y);expect(r.height).toBeGreaterThanOrEqual(44);}
 await expect(page.locator('#open-hand .hand-count')).toHaveText('1');
 await shot(page,`text-hand-${size.width}`);
});
