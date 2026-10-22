// T84 (A7): computer play keeps one notice with Pause and Fast-forward; the running schedule
// matches the no-resize control; speed changes reset no camera or log; Changes recovers the
// opponents' turns; totals match core; long histories keep every entry and the reading position.
import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {activePlayer,apply,armyTotal,computerAction,provincesOf} from '../../src/core';
import type {GameState} from '../../src/core';
import {deserializeVersionedMatch,serializeVersionedMatch,REFERENCE_MATCH_IDENTITY} from '../../src/core/match-save';
import {pinned} from '../core/versioned-match-fixture';
import {closeSurface,openSurface,withSurface} from './shell';
import {COMPUTER_STEP_TIME} from '../../src/ui/computerTurnLoop';

const PHONE={width:390,height:844},LANDSCAPE={width:844,height:390};
const pause=(p:Page)=>p.locator('#game-pause-button');
const notice=(p:Page)=>p.locator('#active-seat-notice');
const forward=(p:Page)=>p.locator('#fast-forward-button');
const viewBox=(p:Page)=>p.locator('svg[data-camera-zoom]').getAttribute('viewBox');

async function begin(p:Page){
 await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto('/?view=reference-game&log');
 await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'savedBlob',blob);return create(blob);};});
}
async function load(p:Page,text:string){
 const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
 await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'history.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
}
async function saved(p:Page):Promise<GameState>{
 await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());
 return deserializeVersionedMatch(await p.evaluate(()=>(Reflect.get(window,'savedBlob') as Blob).text())).state;
}
const step=(s:GameState)=>{const a=computerAction(s);if(!a)throw Error('Expected a computer action');const r=apply(s,a);if(!r.ok)throw Error(r.error);return r.state;};
/** The human-loss replay at the first moment a computer seat has the turn after a human one. */
function computerTurn(){
 const f=pinned('human-loss');let s=deserializeVersionedMatch(serializeVersionedMatch(f.options,[],REFERENCE_MATCH_IDENTITY)).state,humanSeen=false;
 for(const action of f.actions){
  const r=apply(s,action);if(!r.ok)throw Error(r.error);s=r.state;
  if(activePlayer(s)?.kind==='human')humanSeen=true;
  else if(humanSeen&&s.phase==='reinforce')return {text:serializeVersionedMatch(f.options,s.history,REFERENCE_MATCH_IDENTITY),state:s};
 }
 throw Error('No computer turn after a human one');
}
/**
 * T97: the totals left the menu (owner, #244). The map still paints exactly core's armies and
 * countries per seat, and the public hand counts stay for assistive technology.
 */
async function totals(p:Page,s:GameState){
 await openSurface(p,'details');await expect(p.locator('.score-row:visible')).toHaveCount(0);
 for(const player of s.players){
  const painted=await p.locator(`[data-country][data-owner="${player.id}"]`).evaluateAll(ns=>ns.map(n=>Number((n as HTMLElement).dataset['armies'])));
  expect(painted.reduce((a,b)=>a+b,0)).toBe(armyTotal(s,player.id));expect(painted).toHaveLength(provincesOf(s,player.id).length);
 }
 if(s.cards){const counts=p.locator('.card-public-counts');for(const player of s.players)await expect(counts).toContainText(new RegExp(String.raw`${player.id}:\s*${s.cards.hands[player.id]!.length}\b`));}
 await closeSurface(p);
}
async function shot(p:Page,info:TestInfo,name:string){await p.screenshot({path:info.outputPath(`${name}.png`)});}

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports are set here, so one project suffices'));

test('computer play keeps the notice with Pause and Fast-forward; the schedule matches the no-resize control',async({page},info)=>{
 await page.setViewportSize(PHONE);await begin(page);const start=computerTurn();await load(page,start.text);
 await expect(notice(page)).toBeVisible();await expect(forward(page)).toBeVisible();await expect(pause(page)).toBeVisible();
 await shot(page,info,'computer-notice-portrait');
 // The control: three computer actions at normal pace, with no resize.
 let control=start.state;for(let i=0;i<3;i++)control=step(control);
 // T101: Normal waits COMPUTER_STEP_TIME (120 ms) before each computer action.
 await page.clock.runFor(COMPUTER_STEP_TIME);await page.setViewportSize(LANDSCAPE);await page.clock.runFor(COMPUTER_STEP_TIME);await page.setViewportSize(PHONE);await page.clock.runFor(COMPUTER_STEP_TIME);
 expect((await saved(page)).history).toEqual(control.history);
 // The notice never fades during computer play.
 await expect(notice(page)).toBeVisible();await expect(forward(page)).toBeVisible();
 // Speed is reachable mid-turn and does not reset the camera (T97: the menu's battle log is gone; T101: it sits beside Pause).
 await page.locator('#game-pause-button').click();const box=await viewBox(page);
 await page.locator('#game-speed').selectOption('slow');
 await expect.poll(()=>viewBox(page)).toBe(box);
 // Paused exactly: no action, no Fast-forward, Pause still in reach.
 await expect(forward(page)).toBeHidden();const frozen=await saved(page);await page.clock.runFor(10_000);expect(await saved(page)).toEqual(frozen);
 await page.locator('#game-pause-button').click();await page.clock.runFor(525);expect((await saved(page)).history).toEqual(step(frozen).history);
});

test('Fast-forward plays only the computer seats, ends on the human turn, and Changes recovers their turns',async({page},info)=>{
 await page.setViewportSize(LANDSCAPE);await begin(page);const start=computerTurn();await load(page,start.text);
 let control=start.state;while(activePlayer(control)?.kind==='computer'&&control.phase!=='human-loss'&&control.phase!=='finished')control=step(control);
 // T101: the notice stays the seat's one notice; Fast-forward shows pressed while it runs.
 await forward(page).click();await expect(notice(page)).toContainText(/'s turn/);await expect(forward(page)).toHaveAttribute('aria-pressed','true');
 const steps=control.history.length-start.state.history.length;
 await page.clock.runFor(40*steps+40);
 const after=await saved(page);expect(after.history).toEqual(control.history);
 // Changes: the complete event log, opened at the opponents' first action with exactly their actions marked.
 await expect(page.locator('#open-changes')).toBeVisible();await shot(page,info,'changes-notice');
 await page.locator('#open-changes').click();
 const dialog=page.locator('dialog.game-event-log');await expect(dialog).toBeVisible();
 await expect(dialog.locator('.game-event')).toHaveCount(after.history.length+1);
 const marked=await dialog.locator('.game-event.since').evaluateAll(ns=>ns.map(n=>Number((n as HTMLElement).dataset['eventIndex'])));
 const leftAt=after.history.length-steps;
 expect(marked).toEqual(Array.from({length:steps},(_,i)=>leftAt+i+1));
 await shot(page,info,'changes-log');
 await page.keyboard.press('Escape');
 // Fast-forward ends at the human turn: nothing more happens there.
 await page.clock.runFor(10_000);expect((await saved(page)).history).toEqual(control.history);
 await totals(page,after);
 // The same view stays behind the menu's history icon after the notice is gone (T97).
 await withSurface(page,'settings',()=>page.locator('#game-log-button').click());await expect(dialog).toBeVisible();
 expect(await dialog.locator('.game-event.since').evaluateAll(ns=>ns.map(n=>Number((n as HTMLElement).dataset['eventIndex'])))).toEqual(marked);
});

// T97: the menu's battle log, its newest-entry emphasis and its reading offset are gone (owner,
// #244); the history is the event log card, which keeps every action and scrolls at every size.
for(const size of [PHONE,LANDSCAPE,{width:1280,height:800}])test(`a long history keeps every entry at ${size.width}×${size.height}`,async({page},info)=>{
 await page.setViewportSize(size);await begin(page);const f=pinned('human-loss');await load(page,f.text);const s=await saved(page);
 await totals(page,s);
 await withSurface(page,'settings',()=>page.locator('#game-log-button').click());
 const dialog=page.locator('dialog.game-event-log');await expect(dialog.locator('.game-event')).toHaveCount(s.history.length+1);
 expect(await dialog.evaluate(n=>n.scrollHeight>n.clientHeight&&n.getBoundingClientRect().bottom<=innerHeight&&n.getBoundingClientRect().right<=innerWidth)).toBe(true);
 await page.setViewportSize({width:size.height,height:size.width});await expect(dialog.locator('.game-event')).toHaveCount(s.history.length+1);
 expect(await dialog.evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight&&n.getBoundingClientRect().right<=innerWidth)).toBe(true);
 await shot(page,info,`long-history-${size.width}x${size.height}`);
});
