import {test,expect} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {islandRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_EVENT_MATCH_IDENTITY} from '../../src/core/match-save';
import {visitGame} from './shell';
import {humanHandFixture} from './event-fixture';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewports'));
const KEY='malpaco:current-game';
function personalTurns(){
 const options={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Off' as const};const made=createGeographicGame(options,islandRules(options),{},2);if(!made.ok)throw Error('map');let state=made.state;
 const games=new Map<number,string>();
 for(let i=0;i<3000&&!state.result&&games.size<3;i++){
  const human=state.players.find(p=>p.kind==='human')!,ended=state.log.filter(e=>e.event==='turn_ended'&&e.player===human.id).length;
  if(state.players[state.currentPlayer]===human&&!games.has(ended))games.set(ended,serializeVersionedMatch(options,state.history,GEOGRAPHIC_EVENT_MATCH_IDENTITY));
  const action=decideComputerAction(computerView(state));if(!action)break;const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }
 if(games.size!==3)throw Error('three personal turns unavailable');return games;
}
test('default has three modes and preserves the chosen mode on reload',async({page})=>{
 await page.goto('/');const choice=page.getByLabel('Button labels',{exact:true});await expect(choice.locator('option')).toHaveText(['Text','Icons','Text 2 turns, then Icons']);await expect(choice).toHaveValue('auto');
 await choice.selectOption('text');await page.reload();await expect(choice).toHaveValue('text');await choice.selectOption('icons');await page.reload();await expect(choice).toHaveValue('icons');
});
test('automatic faces count two personal turns and resume without changing match bytes',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());
 for(const [ended,text] of personalTurns()){
  await page.goto('/');await page.evaluate(({key,text})=>{localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'personal-turns',paused:true}));localStorage.removeItem('malpaco:button-labels');},{key:KEY,text});await page.reload();await page.locator('#resume-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);
  await expect(page.locator('body')).toHaveAttribute('data-button-labels',ended<2?'text':'icons');
  if(ended<2)await expect(page.locator('#new-game-button')).toHaveText(/New game/i);else await expect(page.locator('#new-game-button svg')).toBeVisible();
  expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(text);
 }
});
test('zoom stays icons, redundant controls are removed and the army pool follows Cards',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.clock.install();await page.clock.pauseAt(new Date());
 const loaded=deserializeVersionedMatch(humanHandFixture().text);let state=loaded.state;if(state.phase==='cards'){const next=apply(state,{kind:'skipCards'});if(!next.ok)throw Error(next.error);state=next.state;}
 const text=serializeVersionedMatch(loaded.options,state.history,loaded.identity);await page.addInitScript(({key,text})=>{localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'pool-placement',paused:false}));localStorage.setItem('malpaco:button-labels','text');},{key:KEY,text});await visitGame(page,'/');
 await expect(page.locator('#open-countries')).toHaveCount(0);await expect(page.locator('#start-friendly-move-button')).toHaveCount(0);
 await page.locator('[data-country]').first().press('+');for(const id of ['map-zoom-in','map-zoom-out'])await expect(page.locator('#'+id+' svg')).toBeVisible();
 await expect(page.locator('#placement-pool')).toBeVisible();await expect(page.locator('#open-hand')).toBeVisible();const pool=(await page.locator('#placement-pool').boundingBox())!,cards=(await page.locator('#open-hand').boundingBox())!;expect(pool.x).toBeGreaterThanOrEqual(cards.x+cards.width);await page.screenshot({path:'artifacts/T157/army-text-phone.png'});expect(pool.x+pool.width,JSON.stringify(await page.locator('#game-status').evaluate(el=>[el,...el.children].map(n=>({id:n.id,class:n.className,rect:n.getBoundingClientRect().toJSON(),column:getComputedStyle(n).gridColumn,row:getComputedStyle(n).gridRow,display:getComputedStyle(n).display}))))).toBeLessThanOrEqual(390);
 await page.locator('#open-game-menu').click();await page.getByLabel('Button labels',{exact:true}).selectOption('icons');await page.keyboard.press('Escape');await expect(page.locator('#placement-pool svg')).toBeVisible();await page.screenshot({path:'artifacts/T157/army-icons-phone.png'});
});

test('automatic mode switches after the second personal turn during live play',async({page})=>{
 const loaded=deserializeVersionedMatch(personalTurns().get(1)!);let state=loaded.state;
 for(let i=0;i<500&&state.phase!=='attack';i++){const action=decideComputerAction(computerView(state));if(!action)throw Error('no action');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;}
 expect(state.phase).toBe('attack');const text=serializeVersionedMatch(loaded.options,state.history,loaded.identity);
 await page.clock.install();await page.clock.pauseAt(new Date());await page.addInitScript(({key,text})=>{if(sessionStorage.getItem('live-auto'))return;sessionStorage.setItem('live-auto','1');localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'live-auto',paused:false}));},{key:KEY,text});await visitGame(page,'/');
 await expect(page.locator('body')).toHaveAttribute('data-button-labels','text');await page.locator('#end-turn-button').click();await expect(page.locator('body')).toHaveAttribute('data-button-labels','icons');await expect(page.locator('#new-game-button svg')).toBeVisible();
 await page.clock.runFor(160000);await page.reload();await page.locator('#resume-game').click();await expect(page.locator('body')).toHaveAttribute('data-button-labels','icons');
});
