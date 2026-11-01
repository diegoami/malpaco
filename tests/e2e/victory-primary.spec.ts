import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {visitGame} from './shell';
const KEY='malpaco:current-game',SCORES='malpaco:scoreboard';
let cached:{text:string;last:GameState}|undefined;
function winning(){
 if(cached)return cached;
 const options={...defaultOptions(),seed:5,names:'seed' as const,dominationWin:true,roundLimit:null};
 const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)throw Error(game.errors.join('; '));
 let state=game.state,last=state;
 for(let n=0;n<3000&&!state.result;n++){
  last=state;const action=decideComputerAction(computerView(state));if(!action)throw Error('No legal fixture action');const r=apply(state,action);if(!r.ok)throw Error(r.error);state=r.state;
 }
 const end=apply(last,{kind:'endTurn'});if(!end.ok||end.state.winner!=='seat1')throw Error('Expected a legal human win by End turn');
 cached={text:serializeVersionedMatch(options,last.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY),last};return cached;
}
async function start(page:Page,mode:string){
 const f=winning();await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,mode,eventAck})=>{
  if(sessionStorage.getItem('victory-primary'))return;sessionStorage.setItem('victory-primary','1');
  localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'victory-primary',paused:false,eventAck,eventMarksCleared:eventAck}));localStorage.setItem('malpaco:button-labels',mode);
 },{text:f.text,mode,eventAck:f.last.events?.sequence??0});
 await visitGame(page,'/');await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(100);
 await page.locator('#end-turn-button').click();await page.clock.runFor(3000);
 await expect(page.locator('.victory-result .result-title')).toHaveText('You won');
}
async function reachable(page:Page,size:{width:number;height:number}){
 const b=page.locator('#result-new-game-button');await b.scrollIntoViewIfNeeded();const r=(await b.boundingBox())!;
 expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width);expect(r.y+r.height).toBeLessThanOrEqual(size.height);expect(r.height).toBeGreaterThanOrEqual(56);
 expect(await b.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&n.contains(hit);})).toBe(true);
 return r;
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const size of [{width:390,height:844},{width:568,height:320},{width:820,height:1180},{width:1280,height:800}])for(const mode of ['text','icons','auto'])test(`${size.width} ${mode}: winning has a full-width primary New game, with exact-once score and explicit next start`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize(size);await start(page,mode);
 const primary=page.locator('#result-new-game-button'),row=page.locator('.victory-new-game');
 await expect(row).toBeVisible();await expect(primary).toHaveAccessibleName('New game');const r=await reachable(page,size),parent=(await row.boundingBox())!;
 expect(r.width).toBeGreaterThanOrEqual(parent.width-1);
 for(const id of ['result-standings-button','result-details-button']){
  const b=(await page.locator('#'+id).boundingBox())!;expect(r.width).toBeGreaterThan(b.width+16);expect(r.y+r.height).toBeLessThanOrEqual(b.y);
 }
 const title=(await page.locator('.victory-result .result-title').boundingBox())!;expect(title.y).toBeGreaterThanOrEqual(0);expect(title.y+title.height).toBeLessThanOrEqual(size.height);
 if(await page.locator('body').getAttribute('data-button-labels')==='text')await expect(primary).toHaveText(/New game/i);else await expect(primary.locator('svg')).toBeVisible();
 await page.screenshot({path:`artifacts/T165/victory-${size.width}-${mode}.png`});
 const scores=await page.evaluate(k=>localStorage.getItem(k),SCORES);expect(JSON.parse(scores!).totals).toEqual({won:1,lost:0,gaveUp:0});expect(JSON.parse(scores!).recent).toHaveLength(1);
 await page.locator('#result-standings-button').click();await page.locator('#result-details-button').click();await reachable(page,size);
 await page.locator('#close-result-card').click();await expect(primary).toBeHidden();await page.locator('#open-required-action').click();await reachable(page,size);
 if(mode==='text'){await primary.focus();await page.keyboard.press('Enter');}else await primary.click();
 await expect(page.locator('#game-launcher')).toBeVisible();await expect(page.locator('#start-game')).toBeVisible();await expect(page.locator('#geographic-map')).toHaveCount(0);expect(await page.evaluate(k=>localStorage.getItem(k),SCORES)).toBe(scores);
 await page.reload();await expect(page.locator('#game-launcher')).toBeVisible();expect(await page.evaluate(k=>localStorage.getItem(k),SCORES)).toBe(scores);
});
