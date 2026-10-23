import {expect,test} from '@playwright/test';
import {eightArmyDrawFixture} from './event-fixture';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {visitGame} from './shell';
const KEY='malpaco:current-game';
async function draw(page:import('@playwright/test').Page){const f=eightArmyDrawFixture();await page.clock.install();await page.clock.pauseAt(new Date());await page.addInitScript(([key,text])=>{localStorage.setItem(key!,text!);localStorage.setItem(key+'-meta',JSON.stringify({id:'numeric-draw',paused:false}));},[KEY,f.text]);await visitGame(page,'/');await page.locator('#end-turn-button').click();await expect(page.locator('.private-card-reward')).toHaveText('You drew 8 armies.');return f;}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set by test'));
for(const width of [390,1280])test(`${width}: numeric draw notice closes at three seconds without changing the drawn card or adding an army bonus`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:width===390?844:800});const f=await draw(page),raw=await page.evaluate(k=>localStorage.getItem(k),KEY);expect(deserializeVersionedMatch(raw!).state).toEqual(f.after);
 await expect(page.locator('#reward-hand [data-new="true"] .card-tile-name')).toHaveText('ARMIES');await page.screenshot({path:`artifacts/T121/draw-${width}.png`});await page.clock.runFor(2999);await expect(page.locator('.private-card-reward')).toBeVisible();await page.clock.runFor(1);await expect(page.locator('.private-card-reward')).toBeHidden();await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','true');expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(raw);
});
test('the draw deadline cannot release a native pause and restarts after explicit Resume',async({page})=>{
 test.setTimeout(120000);await page.addInitScript(()=>{Reflect.set(window,'active',true);Reflect.set(window,'required',false);Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'active'),requiresResume:()=>Reflect.get(window,'required'),acknowledgeResume:()=>{if(!Reflect.get(window,'active'))return false;Reflect.set(window,'required',false);return true;}});});await draw(page);
 await page.evaluate(()=>{Reflect.set(window,'active',false);Reflect.set(window,'required',true);window.dispatchEvent(new Event('malpaco:native-background'));Reflect.set(window,'active',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});const before=await page.evaluate(k=>localStorage.getItem(k),KEY);
 await page.clock.runFor(8000);await expect(page.locator('.private-card-reward')).toBeVisible();await expect(page.locator('#resume-turn-button')).toBeVisible();expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(before);
 await page.locator('#resume-turn-button').click();await page.clock.runFor(2999);await expect(page.locator('.private-card-reward')).toBeVisible();await page.clock.runFor(1);await expect(page.locator('.private-card-reward')).toBeHidden();
});
for(const width of [390,1280])test(`${width}: the placement badge spells out armies on the active player's colour`,async({page})=>{
 await page.setViewportSize({width,height:width===390?844:800});await page.clock.install();await page.clock.pauseAt(new Date());await visitGame(page,'/?seed=0');const pool=page.locator('#placement-pool');await expect(pool).toBeVisible();const n=Number(await page.locator('#placement-pool-count').textContent());expect(n).toBeGreaterThan(0);await expect(pool).toHaveText(`${n} ${n===1?'ARMY':'ARMIES'}`);await expect(pool.locator('svg')).toHaveCount(0);
 const background=await pool.evaluate(n=>getComputedStyle(n).backgroundColor),seat=await page.locator('.turn-row[data-current="true"] .turn-colour-mark path').evaluate(n=>getComputedStyle(n).fill);expect(background).toBe(seat);const a=(await pool.boundingBox())!,b=(await page.locator('#turn-tracker').boundingBox())!;expect(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y).toBe(true);await page.screenshot({path:`artifacts/T121/armies-${width}.png`});
});
