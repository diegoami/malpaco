import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {humanCaptureFixture} from './event-fixture';
import {input,TRADE_CASES} from './cards-fixtures';
import {visitGame} from './shell';
import {apply} from '../../src/core/rules';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';

const KEY='malpaco:current-game';
const ENTRY=process.env['END_TURN_ENTRY']??'/';
let cached:ReturnType<typeof humanCaptureFixture>|undefined;
function humanTurn(){
 if(cached)return cached;
 const f=humanCaptureFixture(),loaded=deserializeVersionedMatch(f.text);let state=f.state;
 for(let n=0;n<5000&&!state.result;n++){
  const player=state.players[state.currentPlayer]!;
  if(player.kind==='human'&&state.phase==='attack'&&!state.pendingCapture&&state.log.filter(e=>e.event==='turn_ended'&&e.player===player.id).length>=2){
   const end=apply(state,{kind:'endTurn'});if(end.ok&&!end.state.result)return cached={state,text:serializeVersionedMatch(loaded.options,state.history,loaded.identity)};
  }
  const action=decideComputerAction(computerView(state));if(!action)break;const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }throw Error('No legal nonwinning human turn after Auto transition');
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const mode of ['text','icons','auto'])test(`${mode}: selected local End turn artwork and legal keyboard handoff`,async({page})=>{
 const f=humanTurn();await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,mode,eventAck})=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'end-turn-art',paused:false,eventAck,eventMarksCleared:eventAck}));localStorage.setItem('malpaco:button-labels',mode);},{text:f.text,mode,eventAck:f.state.events?.sequence??0});
 await visitGame(page,ENTRY);await expect(page.locator('[data-country]')).toHaveCount(46);
 if(mode==='auto')await expect(page.locator('body')).toHaveAttribute('data-button-labels','icons');
 const button=page.locator('#end-turn-button');await expect(button).toHaveAccessibleName('End turn');
 for(const size of [{width:390,height:844},{width:568,height:320},{width:820,height:1180},{width:1280,height:800}]){
  await page.setViewportSize(size);const r=(await button.boundingBox())!;expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x+r.width).toBeLessThanOrEqual(size.width);expect(r.y+r.height).toBeLessThanOrEqual(size.height);
  if(mode!=='text'){
   const image=button.locator('svg image');await expect(image).toHaveCount(1);
   const href=await image.getAttribute('href'),response=await page.request.get(new URL(href!,page.url()).href);expect(response.ok()).toBe(true);
   expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(createHash('sha256').update(readFileSync('public/third-party/oxygen/games-endturn.svg')).digest('hex'));
  }
  if(mode==='icons'&&(size.width===390||size.width===1280))await page.screenshot({path:`artifacts/T168/end-turn-${size.width}.png`});
 }
 await page.locator('#game-help-button').click();const help=page.locator('dialog.game-help[open]');await expect(help.locator('[data-icon="end-turn"] image')).toHaveCount(1);const notice=help.getByRole('link',{name:'Oxygen icon credits and licence'});await expect(notice).toHaveAttribute('href',/third-party\/oxygen\/index.html$/);expect((await page.request.get(new URL((await notice.getAttribute('href'))!,page.url()).href)).ok()).toBe(true);await page.locator('#close-game-help').click();
 const before=(await page.evaluate(k=>localStorage.getItem(k),KEY))!,loaded=deserializeVersionedMatch(before),expected=apply(loaded.state,{kind:'endTurn'});expect(expected.ok).toBe(true);
 await button.focus();await page.keyboard.press('Enter');
 await expect.poll(async()=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state.history.length).toBe(loaded.state.history.length+1);
 const after=deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state;expect(after.history.at(-1)).toEqual({kind:'endTurn'});if(expected.ok)expect(after.rng).toEqual(expected.state.rng);
});
for(const fixture of ['capture','cards'])test(`End turn cannot bypass required ${fixture}`,async({page})=>{
 const wire=input(TRADE_CASES[0].file).trim(),f=fixture==='capture'?humanCaptureFixture():{text:wire,state:deserializeVersionedMatch(wire).state};await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,eventAck})=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'pending-end-turn',paused:false,eventAck,eventMarksCleared:eventAck}));localStorage.setItem('malpaco:button-labels','icons');},{text:f.text,eventAck:f.state.events?.sequence??0});
 await page.goto('/');await page.locator('#resume-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);await page.clock.runFor(3000);
 if(fixture==='capture')await expect(page.locator('#confirm-capture-button')).toBeVisible();else await expect(page.getByRole('button',{name:'Skip cards',exact:true})).toBeVisible();
 const before=await page.evaluate(k=>localStorage.getItem(k),KEY),button=page.locator('#end-turn-button');
 expect(await button.isVisible()&&await button.isEnabled()).toBe(false);
 await button.dispatchEvent('click');expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(before);
});
