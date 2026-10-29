import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {visitGame,activate} from './shell';
import {humanCaptureFixture,eventFixture,eightArmyDrawFixture} from './event-fixture';
import {reserveFixture} from '../helpers/reserve-fixtures';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import {apply} from '../../src/core/rules';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';

const images=process.env['MANUAL_CAPTURE_DIR']??'artifacts/T151/capture';
const key='malpaco:current-game';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','manual uses explicit desktop/phone viewports'));
async function retained(page:Page,text:string,paused=false){
 await page.clock.install({time:new Date('2026-10-29T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-29T12:00:00Z'));
 await page.addInitScript(({text,key,paused})=>{if(sessionStorage.getItem('manual-fixture'))return;sessionStorage.setItem('manual-fixture','1');localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'manual-example',paused}));},{text,key,paused});
 await visitGame(page,'/');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});
}
async function shot(page:Page,name:string){await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(100);await page.mouse.move(0,0);mkdirSync(images,{recursive:true});await page.screenshot({path:join(images,name+'.png'),animations:'disabled'});}

test('current Help explains complete play and links a readable illustrated manual',async({page})=>{
 await retained(page,reserveFixture(46).text);const before=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.locator('#game-help-button').click();const help=page.locator('dialog.game-help[open]');
 for(const text of ['at most one set of three','three wilds alone','Protection automatically','one adjacent friendly transfer','900 pixels','35 of 46','three seconds of unpaused play'])await expect(help).toContainText(text);
 await expect(page.locator('#game-help-combat-rules')).toHaveText('Legacy: tied rolls reroll.');
 const link=page.locator('#full-player-manual');await expect(link).toHaveAttribute('href','/manual/index.html');
 const manual=await page.context().newPage();await manual.goto('/manual/index.html');await expect(manual.getByRole('heading',{level:1})).toHaveText('Malpaco player manual');await expect(manual.locator('main img')).toHaveCount(8);
 for(const img of await manual.locator('main img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(n=>(n as HTMLImageElement).complete&&(n as HTMLImageElement).naturalWidth>0)).toBe(true);}
 await manual.setViewportSize({width:390,height:844});expect(await manual.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);await manual.close();
});

test('capture launcher and map illustrations through real entry controls',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/');await expect(page.locator('#start-game')).toBeVisible();await shot(page,'launcher');
});
test('capture attack and phone illustrations from a retained legal position',async({page})=>{
 const f=humanCaptureFixture(),loaded=deserializeVersionedMatch(f.text),pending=f.state.pendingCapture!;
 const text=serializeVersionedMatch(loaded.options,loaded.state.history.slice(0,-1),loaded.identity);
 await retained(page,text);await page.clock.runFor(3000);await shot(page,'map');
 await activate(page.locator(`[data-country="${pending.from}"]`));await page.locator(`[data-country="${pending.to}"]`).press('Shift+Enter');await expect(page.locator('#province-action-button')).toBeVisible();await shot(page,'attack');
 const phone=await page.context().browser()!.newPage({viewport:{width:390,height:844}});
 try{await retained(phone,text);await phone.clock.runFor(3000);await activate(phone.locator(`[data-country="${pending.from}"]`));await phone.locator(`[data-country="${pending.to}"]`).press('Shift+Enter');await expect(phone.locator('#province-action-button')).toHaveAccessibleName(/Attack/);await shot(phone,'phone');}finally{await phone.close();}
});
test('capture pending move-in illustration without confirming troops',async({page})=>{
 await retained(page,humanCaptureFixture().text);await page.clock.runFor(3000);await expect(page.locator('#confirm-capture-button')).toBeVisible();await shot(page,'capture');
});
test('capture your actual cards',async({page})=>{
 const f=eightArmyDrawFixture(),loaded=deserializeVersionedMatch(f.text);let state=f.after;
 for(let n=0;n<5000&&!state.result&&state.players[state.currentPlayer]!.kind==='computer';n++){const action=decideComputerAction(computerView(state));if(!action)throw Error('No action before manual hand');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;}
 expect(state.players[state.currentPlayer]!.kind).toBe('human');await retained(page,serializeVersionedMatch(loaded.options,state.history,loaded.identity),true);await page.locator('#open-hand').click();await expect(page.locator('#hand-dialog')).toBeVisible();await shot(page,'cards');
});
test('capture the exact storm notice before its timeout',async({page})=>{
 await retained(page,eventFixture('storm').text);await expect(page.locator('#world-event-card')).toBeVisible();await shot(page,'event');
});
test('capture the expanded result and available actions',async({page})=>{
 test.setTimeout(120000);const f=reserveFixture(46);let state=f.state;
 for(let n=0;n<20000&&!state.result;n++){const action=decideComputerAction(computerView(state));if(!action)throw Error('No action for manual result');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;}
 expect(state.result).toBeDefined();await retained(page,serializeVersionedMatch(f.options,state.history,f.identity));await expect(page.locator('#result-new-game-button')).toBeVisible();await shot(page,'results');
});
