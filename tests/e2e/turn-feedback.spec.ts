import {visitGame} from './shell';
import {expect,test} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {islandRules} from '../../src/core/state';
import {computerAction} from '../../src/core/computer';
import {apply} from '../../src/core/rules';
import {serializeVersionedMatch,GEOGRAPHIC_EVENT_MATCH_IDENTITY} from '../../src/core/match-save';
import type {Page} from '@playwright/test';
async function begin(page:Page){await page.clock.install();await page.clock.pauseAt(new Date());await visitGame(page,'/?seed=7');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});}
async function untilEffect(page:Page,kind:string){for(let n=0;n<400;n++){if(await page.locator('#geographic-map').getAttribute('data-computer-feedback')===kind)return;await page.clock.runFor(120);}throw Error('No '+kind+' effect');}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set here'));
for(const [width,height] of [[390,844],[844,390],[1280,800]])test(`${width}: public colour tracker, placement tween, fighting feedback and Blue Your turn`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:width!,height:height!});await begin(page);
 const tracker=page.locator('#turn-tracker');await expect(tracker).toBeVisible();await expect(tracker.locator('.turn-row')).toHaveCount(4);await expect(tracker).toHaveAttribute('data-active-seat','seat2');
 await untilEffect(page,'reinforce');const gain=page.locator('.computer-reinforce').first(),before=Number(await gain.getAttribute('data-feedback-before')),after=Number(await gain.getAttribute('data-feedback-after'));expect(after).toBeGreaterThan(before);expect(Number(await gain.locator('.count').textContent())).toBeLessThan(after);
 await page.clock.runFor(325);const mid=Number(await gain.locator('.count').textContent());expect(mid).toBeGreaterThanOrEqual(before);expect(mid).toBeLessThan(after);
 await untilEffect(page,'attack');await expect(page.locator('.computer-attacker')).toHaveCount(1);await expect(page.locator('.computer-defender')).toHaveCount(1);expect(await page.locator('.computer-attacker .ring').evaluate(n=>getComputedStyle(n).stroke)).not.toBe('none');expect(await page.locator('.computer-defender .ring').evaluate(n=>getComputedStyle(n).stroke)).not.toBe('none');await page.screenshot({path:`artifacts/T115/fighting-${width}.png`,animations:'disabled'});
 await untilEffect(page,'captureMove');const trail=page.locator('.computer-transfer-trail');await expect(trail).toHaveCount(1);expect(await trail.evaluate(n=>(n as SVGGeometryElement).getTotalLength())).toBeGreaterThan(0);const dot=page.locator('.computer-troop').first(),prior=await dot.evaluate(n=>[n.getAttribute('cx'),n.getAttribute('cy')]);await page.clock.runFor(130);expect(await dot.evaluate(n=>[n.getAttribute('cx'),n.getAttribute('cy')])).not.toEqual(prior);
 await page.locator('#open-game-menu').click();await expect(page.locator('#turn-guidance-title')).toHaveText('Paused');await expect(page.locator('#geographic-map')).toHaveAttribute('data-computer-feedback','');
 const paints=await page.locator('[data-country]').evaluateAll(ns=>ns.map(n=>[n.getAttribute('data-armies'),n.querySelector('.count')!.textContent]));expect(paints.every(([a,b])=>a===b)).toBe(true);
 await page.keyboard.press('Escape');await page.clock.runFor(160000);
 await expect(tracker).toHaveAttribute('data-active-seat','seat1');await expect(page.locator('#turn-guidance-title')).toHaveText('Your turn');await expect(page.locator('#turn-instruction')).toHaveText('Place armies');await expect(tracker.locator('[data-turn-player="seat1"] .turn-pointer')).toHaveText('➜');const a=(await tracker.boundingBox())!,b=(await page.locator('#placement-pool').boundingBox())!;expect(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y).toBe(true);await page.screenshot({path:`artifacts/T115/your-turn-${width}.png`,animations:'disabled'});
});
test('placement, attack and move instructions follow the human phase without forcing a move',async({page})=>{
 test.setTimeout(120000);let text='',own='';
 for(let seed=0;seed<10&&!text;seed++){
  const o={...defaultOptions(),seed,islandRules:1 as const,eventFrequency:'Off' as const},made=createGeographicGame(o,islandRules(o),{},2);if(!made.ok)continue;let s=made.state;
  for(let n=0;n<1000&&s.players[s.currentPlayer]!.kind==='computer';n++){const r=apply(s,computerAction(s)!);if(!r.ok)throw Error(r.error);s=r.state;}
  if(s.phase==='cards'){const r=apply(s,{kind:'skipCards'});if(!r.ok)continue;s=r.state;}
  const id=s.map.provinces.find(p=>s.ownerOf[p.id]===s.players[s.currentPlayer]!.id&&[...p.borders,...p.seaLanes].some(id=>s.ownerOf[id]!==s.ownerOf[p.id]&&s.armies[p.id]!+s.reinforcementPool>s.armies[id]!))?.id;
  if(id){own=id;text=serializeVersionedMatch(o,s.history,GEOGRAPHIC_EVENT_MATCH_IDENTITY);}
 }
 if(!text)throw Error('No ordinary human placement fixture');await page.addInitScript(text=>{localStorage.setItem('malpaco:current-game',text);},text);await visitGame(page,'/');await expect(page.locator('#turn-instruction')).toHaveText('Place armies',{timeout:60000});
 const pool=Number(await page.locator('#placement-pool-count').textContent());for(let n=0;n<pool;n++)await page.locator(`[data-country="${own}"]`).press('Enter');await expect(page.locator('#turn-instruction')).toHaveText('Execute attacks');await page.locator('#start-friendly-move-button').click();await expect(page.locator('#turn-instruction')).toHaveText('Move armies');
});
test('reduced motion shows final values with static feedback and no animated movement layer',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await begin(page);await untilEffect(page,'reinforce');const gain=page.locator('.computer-reinforce').first();expect(await gain.locator('.count').textContent()).toBe(await gain.getAttribute('data-armies'));await expect(page.locator('.computer-action-layer')).toHaveCount(0);
});
