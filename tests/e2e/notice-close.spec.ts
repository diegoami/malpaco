import {expect,test} from '@playwright/test';
import {eventFixture,queuedEventFixture,humanCaptureFixture} from './event-fixture';
import {visitGame,reloadGame} from './shell';
const KEY='malpaco:current-game',META=KEY+'-meta';
const read=(p:import('@playwright/test').Page,k=KEY)=>p.evaluate(k=>localStorage.getItem(k),k);
async function boot(p:import('@playwright/test').Page,text:string,ack=0){
 await p.clock.install();await p.clock.pauseAt(new Date());await p.addInitScript(([key,text,ack])=>{if(sessionStorage.getItem('notice-once'))return;sessionStorage.setItem('notice-once','1');localStorage.setItem(key!,text!);localStorage.setItem(key+'-meta',JSON.stringify({id:'notice-close',paused:false,eventAck:Number(ack),eventMarksCleared:Number(ack)}));},[KEY,text,String(ack)]);await visitGame(p,'/');
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set in test'));
for(const width of [390,1280])test(`${width}: event X closes and acknowledges once without a second button or a new rule action`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:width===390?844:800});const f=eventFixture('harvest');await boot(page,f.text);const card=page.locator('#world-event-card');await expect(card).toBeVisible();const before=await read(page);
 await page.locator('#fold-world-event').click();await expect(card).toBeHidden();await expect(page.locator('#acknowledge-world-event')).toBeHidden();expect(await read(page)).toBe(before);expect(JSON.parse((await read(page,META))!).eventAck).toBe(f.state.events!.sequence);
 await reloadGame(page);await expect(card).toBeHidden();await page.screenshot({path:`artifacts/T120/closed-${width}.png`});
});
test('card-draw X continues to the queued world notice; its X finishes acknowledgement without advancing the engine',async({page})=>{
 test.setTimeout(120000);const f=queuedEventFixture();await boot(page,f.text,f.before.events?.sequence??0);await page.locator('#end-turn-button').click();await expect(page.locator('.private-card-reward')).toBeVisible();await expect(page.locator('#world-event-card')).toBeHidden();
 const before=await read(page);await page.locator('#fold-card').click();await expect(page.locator('.private-card-reward')).toBeHidden();await expect(page.locator('#world-event-card')).toBeVisible();expect(await read(page)).toBe(before);
 await page.locator('#fold-world-event').click();await expect(page.locator('#world-event-card')).toBeHidden();expect(await read(page)).toBe(before);
});

test('X on a troop amount card does not confirm a move or advance history',async({page})=>{
 const text=humanCaptureFixture().text;await boot(page,text);const amount=page.locator('#capture-amount');await expect(amount).toBeVisible();const value=await amount.inputValue(),before=await read(page);
 await page.locator('#fold-card').click();await expect(page.locator('#game-focus-drawer')).toBeHidden();await page.clock.runFor(4000);expect(await read(page)).toBe(before);
 await page.locator('#open-required-action').click();await expect(amount).toHaveValue(value);await expect(page.locator('#confirm-capture-button')).toBeVisible();expect(await read(page)).toBe(before);
});
test('Escape closes an event once without releasing the native background pause',async({page})=>{
 test.setTimeout(120000);await page.addInitScript(()=>{Reflect.set(window,'active',true);Reflect.set(window,'required',false);Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'active'),requiresResume:()=>Reflect.get(window,'required'),acknowledgeResume:()=>{Reflect.set(window,'required',false);return true;}});});
 const f=eventFixture('harvest');await boot(page,f.text);await page.evaluate(()=>{Reflect.set(window,'active',false);Reflect.set(window,'required',true);window.dispatchEvent(new Event('malpaco:native-background'));Reflect.set(window,'active',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});
 const before=await read(page);await page.keyboard.press('Escape');await expect(page.locator('#world-event-card')).toBeHidden();await expect(page.locator('#resume-turn-button')).toBeVisible();await page.clock.runFor(4000);expect(await read(page)).toBe(before);expect(JSON.parse((await read(page,META))!).eventAck).toBe(f.state.events!.sequence);expect(await page.evaluate(()=>Reflect.get(window,'required'))).toBe(true);
});
