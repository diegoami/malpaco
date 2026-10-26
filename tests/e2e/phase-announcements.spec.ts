import {test,expect} from '@playwright/test';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {visitGame} from './shell';
import {nextGameOptions,defaultNextGameSettings} from '../../src/ui/nextGameSettings';
import {defenderIslandRules} from '../../src/core/combat-presets';
const ROOT='malpaco:current-game';
function humanPlacement(){
 const options={...defaultOptions(),seed:7,seats:[{kind:'human' as const},{kind:'computer' as const},{kind:'computer' as const},{kind:'computer' as const}],computerStrengths:['Normal' as const,'Normal' as const,'Normal' as const],dominationWin:true,roundLimit:null,names:'seed' as const};
 const made=createGeographicGame(options,raidCardsRules(options),{},2);if(!made.ok)throw Error('fixture generation');let state=made.state;
 for(let n=0;n<2000&&!state.result;n++){
  if(activePlayer(state)?.kind==='human'&&state.phase==='reinforce'&&state.reinforcementPool>0){
   const country=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id&&p.borders.some(id=>state.ownerOf[id]===activePlayer(state)!.id));
   if(country)return {state,country:country.id,raw:serializeVersionedMatch(options,state.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
  }
  const action=decideComputerAction(computerView(state));if(!action)break;const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }
 throw Error('No human placement fixture');
}
const human=humanPlacement();
const humanStart=(()=>{
 for(let seed=0;seed<30;seed++){
  const options=nextGameOptions(seed,defaultNextGameSettings()),made=createGeographicGame(options,defenderIslandRules(options),{},2);
  if(made.ok&&activePlayer(made.state)?.kind==='human')return seed;
 }
 throw Error('No human-first fresh seed');
})();
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports set per case'));
for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:800}])test(`${size.width}: fresh countdown gates play, centers translucent feedback and pauses safely`,async({page},info)=>{
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(()=>{Reflect.set(window,'active',true);Reflect.set(window,'needsResume',false);Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'active'),requiresResume:()=>Reflect.get(window,'needsResume'),acknowledgeResume:()=>{if(!Reflect.get(window,'active'))return false;Reflect.set(window,'needsResume',false);return true;}});});
 await page.goto('/?seed=7');await page.locator('#start-game').click();
 const banner=page.locator('#phase-announcement'),key='malpaco:seed-game:7';await expect(banner).toHaveText(/Game begins in 3/);
 const before=await page.evaluate(k=>localStorage.getItem(k),key);expect(before).toBeTruthy();
 const country=page.locator('[data-country]').first();await country.focus();await country.press('Enter');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 const box=(await banner.boundingBox())!;expect(Math.abs(box.x+box.width/2-size.width/2)).toBeLessThan(2);expect(Math.abs(box.y+box.height/2-size.height/2)).toBeLessThan(2);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
 expect(await banner.evaluate(n=>getComputedStyle(n).backgroundColor)).toMatch(/0\.78\)/);
 await page.screenshot({path:info.outputPath(`countdown-${size.width}.png`)});
 await page.clock.runFor(1000);await expect(banner).toHaveText(/Game begins in 2/);
 await page.evaluate(()=>{Reflect.set(window,'active',false);Reflect.set(window,'needsResume',true);window.dispatchEvent(new Event('malpaco:native-background'));});
 await page.clock.runFor(5000);await expect(banner).toBeHidden();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 await page.evaluate(()=>{Reflect.set(window,'active',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});await page.clock.runFor(5000);await expect(banner).toBeHidden();
 await page.locator('#resume-turn-button').click();await expect(banner).toHaveText(/Game begins in 2/);await page.clock.runFor(1000);await expect(banner).toHaveText(/Game begins in 1/);await page.clock.runFor(1000);await expect(banner).toHaveText(/Orange is moving/);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 await page.screenshot({path:info.outputPath(`turn-${size.width}.png`)});
 // Loading the same kept game never replays a fresh countdown.
 await page.reload();await page.locator('#resume-game').click();await expect(page.locator('#geographic-map')).toBeVisible();await expect(banner).toHaveAttribute('data-kind','phase');
});
test('retained human phase fades without an action, then placement/attack/move messages follow real input',async({page},info)=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.addInitScript(([key,raw])=>localStorage.setItem(key!,raw!),[ROOT,human.raw]);await visitGame(page,'/');
 const banner=page.locator('#phase-announcement');await expect(banner).toHaveText(/Your turn to place armies/);await expect(banner).toHaveAttribute('data-kind','phase');
 expect(await page.evaluate(k=>localStorage.getItem(k),ROOT)).toBe(human.raw);
 await page.clock.runFor(2999);await expect(banner).toBeVisible();await page.clock.runFor(1);await expect(banner).toBeHidden();expect(await page.evaluate(k=>localStorage.getItem(k),ROOT)).toBe(human.raw);
 const country=page.locator(`[data-country="${human.country}"]`);for(let n=0;n<human.state.reinforcementPool;n++){await country.focus();await country.press('Enter');}
 await expect(banner).toHaveText(/Your turn to attack/);await page.screenshot({path:info.outputPath('human-attack.png')});
 await page.locator('#start-friendly-move-button').click();await expect(banner).toHaveText(/Your turn to move/);await page.screenshot({path:info.outputPath('human-move.png')});
 const before=await page.evaluate(k=>localStorage.getItem(k),ROOT);await page.clock.runFor(3000);await expect(banner).toBeHidden();expect(await page.evaluate(k=>localStorage.getItem(k),ROOT)).toBe(before);
});
test('fresh human countdown rejects otherwise legal placement until the last beat',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(`/?seed=${humanStart}`);await page.locator('#start-game').click();
 const banner=page.locator('#phase-announcement'),key=`malpaco:seed-game:${humanStart}`;
 await expect(banner).toHaveText(/Game begins in 3/);const before=await page.evaluate(k=>localStorage.getItem(k),key);
 const own=page.locator('[data-country][data-owner="seat1"]').first();
 for(const elapsed of [0,1000,1000,999]){await page.clock.runFor(elapsed);await own.focus();await own.press('Enter');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);}
 await page.clock.runFor(1);await expect(banner).toHaveText(/Your turn to place armies/);
 const ready=await page.evaluate(k=>localStorage.getItem(k),key);await own.focus();await own.press('Enter');expect(await page.evaluate(k=>localStorage.getItem(k),key)).not.toBe(ready);
});
