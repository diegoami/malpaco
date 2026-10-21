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

const PHONE={width:390,height:844},LANDSCAPE={width:844,height:390};
const pause=(p:Page)=>p.locator('#game-pause-button');
const notice=(p:Page)=>p.locator('#active-seat-notice');
const forward=(p:Page)=>p.locator('#fast-forward-button');
const viewBox=(p:Page)=>p.locator('svg[data-camera-zoom]').getAttribute('viewBox');

async function begin(p:Page){
 await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto('/?view=reference-game');
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
/** Every total in the menu card matches core: armies, countries and public hand counts. */
async function totals(p:Page,s:GameState){
 await openSurface(p,'details');
 for(const player of s.players){
  const row=p.locator(`.score-row[data-player="${player.id}"]`);
  await expect(row.locator('[data-testid="player-army-total"]')).toHaveText(`Total armies: ${armyTotal(s,player.id)}`);
  await expect(row).toContainText(`${provincesOf(s,player.id).length} provinces`);
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
 await page.clock.runFor(350);await page.setViewportSize(LANDSCAPE);await page.clock.runFor(350);await page.setViewportSize(PHONE);await page.clock.runFor(350);
 expect((await saved(page)).history).toEqual(control.history);
 // The notice never fades during computer play.
 await expect(notice(page)).toBeVisible();await expect(forward(page)).toBeVisible();
 // Speed is reachable mid-turn and resets neither the camera nor the battle log's reading position.
 await page.locator('#game-pause-button').click();const box=await viewBox(page);
 await openSurface(page,'details');const log=page.locator('.log-card .log');const reading=await log.evaluate(n=>n.scrollTop);
 await withSurface(page,'settings',()=>page.locator('#game-speed').selectOption('slow'));
 expect(await log.evaluate(n=>n.scrollTop)).toBe(reading);await closeSurface(page);
 await expect.poll(()=>viewBox(page)).toBe(box);
 // Paused exactly: no action, no Fast-forward, Pause still in reach.
 await expect(forward(page)).toHaveCount(0);const frozen=await saved(page);await page.clock.runFor(10_000);expect(await saved(page)).toEqual(frozen);
 await page.locator('#game-pause-button').click();await page.clock.runFor(525);expect((await saved(page)).history).toEqual(step(frozen).history);
});

test('Fast-forward plays only the computer seats, ends on the human turn, and Changes recovers their turns',async({page},info)=>{
 await page.setViewportSize(LANDSCAPE);await begin(page);const start=computerTurn();await load(page,start.text);
 let control=start.state;while(activePlayer(control)?.kind==='computer'&&control.phase!=='human-loss'&&control.phase!=='finished')control=step(control);
 await forward(page).click();await expect(notice(page)).toContainText('fast-forward');await expect(forward(page)).toHaveCount(0);
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
 // The same view stays in the menu card after the notice is gone.
 await withSurface(page,'settings',()=>expect(page.locator('#game-changes-button')).toBeVisible());
});

for(const size of [PHONE,LANDSCAPE,{width:1280,height:800}])test(`a long history keeps every entry, its reading position and the newest emphasis at ${size.width}×${size.height}`,async({page},info)=>{
 await page.setViewportSize(size);await begin(page);const f=pinned('human-loss');await load(page,f.text);const s=await saved(page);
 await totals(page,s);
 await openSurface(page,'details');const log=page.locator('.log-card .log');
 const entries=s.log.filter(e=>e.event!=='game_started').length;await expect(log.locator('li')).toHaveCount(entries);
 expect(await log.evaluate(n=>n.scrollHeight>n.clientHeight)).toBe(true);
 // Newest last and emphasized; the oldest is not.
 const weight=(i:number)=>log.locator('li').nth(i).evaluate(n=>getComputedStyle(n).fontWeight);
 expect(await weight(entries-1)).toBe('600');expect(await weight(0)).not.toBe('600');
 // Read an older entry, then rotate and close/reopen the card: the same entry stays at the top.
 await log.evaluate(n=>{n.scrollTop=Math.floor((n.scrollHeight-n.clientHeight)/3);});
 const top=()=>log.evaluate(n=>{const r=n.getBoundingClientRect();return [...n.children].findIndex(li=>li.getBoundingClientRect().bottom>r.top+1);});
 const first=await top();
 await page.setViewportSize({width:size.height,height:size.width});await expect.poll(top).toBe(first);
 await closeSurface(page);await openSurface(page,'details');await expect.poll(top).toBe(first);
 await page.setViewportSize(size);await expect.poll(top).toBe(first);
 await shot(page,info,`long-history-${size.width}x${size.height}`);
 // The full event log keeps every action too.
 await withSurface(page,'settings',()=>page.locator('#game-log-button').click());
 await expect(page.locator('dialog.game-event-log .game-event')).toHaveCount(s.history.length+1);
});
