import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';
import * as c from '../../src/core';
import type {Action,GameState,LoadedVersionedMatch} from '../../src/core';
import {fixture,input,step,prefix,lastHumanHandoff,humanReturnHandoff,discardPrefix,spectator,settleNoSet} from './computer-cards-fixtures';
const cards=(p:Page)=>p.getByRole('region',{name:'Cards',exact:true});
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function begin(p:Page,url='/'){await p.clock.install({time:new Date('2026-10-18T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));await p.goto(url);}
async function nativeSave(p:Page){const event=p.waitForEvent('download');await p.getByRole('button',{name:'Save game',exact:true}).click();const path=await(await event).path();if(!path)throw Error('Native download missing');return readFileSync(path,'utf8');}
async function saved(p:Page){return c.deserializeVersionedMatch(await nativeSave(p));}
async function load(p:Page,text:string){const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'computer-cards.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);}
async function exact(p:Page,original:LoadedVersionedMatch,state:GameState){const actual=await saved(p);expect(actual.identity).toEqual(original.identity);expect(actual.options).toEqual(original.options);expect(actual.geography).toEqual(original.geography);expect(actual.state).toEqual(state);return actual;}
async function slow(p:Page){await p.getByLabel('Game speed',{exact:true}).selectOption('very-slow');}
async function noReward(p:Page){await expect(p.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);await expect(cards(p)).not.toContainText(/You drew|Card drawn/i);}
async function essentials(p:Page){for(const el of [p.locator('#game-pause-button'),p.getByLabel('Game speed',{exact:true}),p.getByRole('button',{name:'Game event log',exact:true})])await expect(el).toBeVisible();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function totals(p:Page,s:GameState){for(const player of s.players){const n=s.map.provinces.filter(x=>s.ownerOf[x.id]===player.id).reduce((sum,x)=>sum+s.armies[x.id]!,0);await expect(p.locator(`[data-player="${player.id}"] [data-testid="player-army-total"]`)).toHaveText(`Total armies: ${n}`);}}
async function capture(p:Page,info:TestInfo,label:string){await p.screenshot({path:info.outputPath(`${label}.png`),fullPage:true});}
/** One timed computer action; allow only the fixed-human's synchronous no-set pass
 * as an additional action. Oracle never calls computerAction/decision policy. */
async function advance(p:Page,loaded:LoadedVersionedMatch,before:GameState,known?:readonly Action[]){
 await p.clock.runFor(2000);const actual=await saved(p),suffix=actual.state.history.slice(before.history.length);
 expect(actual.identity).toEqual(loaded.identity);expect(actual.options).toEqual(loaded.options);expect(actual.state.history.slice(0,before.history.length)).toEqual(before.history);expect(suffix.length).toBeGreaterThanOrEqual(1);expect(suffix.length).toBeLessThanOrEqual(2);
 if(known&&before.history.length<known.length)expect(suffix[0]).toEqual(known[before.history.length]);
 let expected=step(before,suffix[0]!);expected=settleNoSet(expected);expect(actual.state).toEqual(expected);expect(actual.state.computerRngs).toEqual(before.computerRngs);return {state:actual.state,action:suffix[0]!};
}
async function humanPlacement(p:Page,loaded:LoadedVersionedMatch,s:GameState){
 expect(c.activePlayer(s)!.kind).toBe('human');
 if(s.phase==='cards'){await p.getByRole('button',{name:'Skip cards',exact:true}).click();s=step(s,{kind:'skipCards'});}
 expect(s.phase).toBe('reinforce');expect(s.reinforcementPool).toBeGreaterThan(0);const own=c.provincesOf(s,c.activePlayer(s)!.id)[0]!;await country(p,own).click();s=step(s,{kind:'reinforce',province:own,amount:1});await exact(p,loaded,s);return s;
}

// The existing Playwright projects supply 1280x800 and1920x1080; no config override.
test('geographic setup enables cards only for zero/one human with explicit wording and exact identity',async({page},info)=>{
 test.setTimeout(90000);await begin(page);
 for(const humans of [0,1,2,4]){
  await page.goto('/?seed=1994');await expect(page.locator('.setup-card')).toContainText('Cards are enabled with zero or one human seat. Games with two or more human seats play without cards.');
  await page.getByLabel('Seats',{exact:true}).selectOption('4');for(let n=1;n<=4;n++)await page.getByLabel(`Seat ${n} control`,{exact:true}).selectOption(n<=humans?'human':'computer');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();
  const actual=await saved(page);expect(actual.options.seed).toBe(1994);expect(actual.options.seats.filter(x=>x.kind==='human')).toHaveLength(humans);
  expect(actual.identity).toEqual({boardGenerator:{id:'geographic',version:1},rules:{id:humans<=1?'cards':'victory',version:humans<=1?3:1},actionSchemaVersion:humans<=1?5:2});
  const generated=c.createGeographicGame(actual.options,humans<=1?c.raidCardsRules(actual.options):undefined);if(!generated.ok)throw Error(generated.errors.join('; '));const expected=humans<=1?settleNoSet(generated.state):generated.state;
  expect(actual.state).toEqual(expected);expect(actual.geography).toEqual(generated.geography);expect(actual.state.rules.cards).toBe(humans<=1?'raid-v1':undefined);if(humans>=2)await expect(cards(page)).toBeHidden();await totals(page,actual.state);await essentials(page);await capture(page,info,`setup-${humans}-human`);
 }
});

test('explicit manual geography and reference compatibility keep their historical identities',async({page})=>{
 await begin(page);
 for(const [url,board] of [['/?control=manual&seed=1994','geographic'],['/?view=reference-game&control=manual&seed=1994','fixed-reference']] as const){await page.goto(url);await page.getByRole('button',{name:'Start game',exact:true}).click();const actual=await saved(page);expect(actual.identity).toEqual({boardGenerator:{id:board,version:1},rules:{id:'victory',version:1},actionSchemaVersion:2});expect(actual.state.cards).toBeUndefined();expect(actual.state.history).toEqual([]);await page.clock.runFor(6000);expect((await saved(page)).state).toEqual(actual.state);}
});

test('three consecutive computers perform literal Raid decisions and reach the correct human-loss choices',async({page},info)=>{
 test.setTimeout(90000);await begin(page);const start=lastHumanHandoff();expect(start.loaded.state.history).toHaveLength(415);await load(page,start.text);await exact(page,start.loaded,start.loaded.state);await slow(page);let s=start.loaded.state;const seats=new Set<string>();let trades=0,targets=0,discards=0;
 for(let n=0;n<4*(2*s.map.provinces.length+6);n++){
  if(s.phase==='human-loss'||s.phase==='finished')break;expect(c.activePlayer(s)!.kind).toBe('computer');seats.add(c.activePlayer(s)!.id);await noReward(page);
  const before=s,result=await advance(page,start.loaded,s,start.known);s=result.state;
  if(result.action.kind==='tradeCards'){trades++;if(before.history.length===429)expect(result.action).toEqual({kind:'tradeCards',handIndices:[1,2,4]});}
  if(result.action.kind==='raidTarget'){targets++;if(before.history.length===430){expect(result.action).toEqual({kind:'raidTarget',province:'province_30'});expect(before.armies.province_30).toBe(22);expect(s.armies.province_30).toBe(5);}}
  if(result.action.kind==='discardCard'){discards++;expect(result.action.handIndex).toBe(0);}await noReward(page);
 }
 expect([...seats]).toEqual(['seat2','seat3','seat4']);expect(trades).toBe(1);expect(targets).toBe(1);expect(discards).toBe(0);expect(s.phase).toBe('human-loss');expect(s.history).toHaveLength(450);expect(s.players.find(x=>x.kind==='human')!.eliminated).toBe(true);expect(s.history.slice(429,431)).toEqual([{kind:'tradeCards',handIndices:[1,2,4]},{kind:'raidTarget',province:'province_30'}]);
 await totals(page,s);await essentials(page);
 for(const mode of ['compact','detailed']){
  await page.getByRole('combobox',{name:'Panel detail',exact:true}).selectOption(mode);await expect(page.getByRole('heading',{name:'The human game has ended',exact:true})).toBeVisible();
  for(const name of ['Watch computers','Stop game']){const button=page.getByRole('button',{name,exact:true});await expect(button).toBeVisible();await expect(button).toBeEnabled();expect(await button.evaluate(node=>{const r=node.getBoundingClientRect(),a=node.closest('.action')!.getBoundingClientRect();return r.left>=a.left-1&&r.right<=a.right+1&&r.top>=a.top-1&&r.bottom<=a.bottom+1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})).toBe(true);}
  await capture(page,info,`computer-raid-human-loss-${mode}`);await exact(page,start.loaded,s);
 }
 await page.clock.runFor(6000);await exact(page,start.loaded,s);await info.attach('raid-computer-action-counts',{body:JSON.stringify({computers:[...seats],trades,targets,discards}),contentType:'application/json'});
});

test('three consecutive computers discard oldest cards and return a living human to actual board placement',async({page},info)=>{
 test.setTimeout(90000);await begin(page);const start=humanReturnHandoff();expect(start.loaded.state.history).toHaveLength(576);await load(page,start.text);await exact(page,start.loaded,start.loaded.state);await slow(page);let s=start.loaded.state,discards=0,returned=false;const seats=new Set<string>();
 for(let n=0;n<4*(2*s.map.provinces.length+6);n++){
  if(c.activePlayer(s)!.kind==='human'){returned=true;break;}expect(['finished','human-loss']).not.toContain(s.phase);seats.add(c.activePlayer(s)!.id);await noReward(page);const result=await advance(page,start.loaded,s,start.known);s=result.state;
  if(result.action.kind==='discardCard'){discards++;expect(result.action).toEqual({kind:'discardCard',handIndex:0});}await noReward(page);
 }
 expect(returned).toBe(true);expect(seats.size).toBeGreaterThanOrEqual(2);expect(discards).toBeGreaterThanOrEqual(2);expect(c.activePlayer(s)!.id).toBe('seat1');expect(c.activePlayer(s)!.eliminated).toBe(false);expect(s.history).toHaveLength(615);expect(s.phase).toBe('reinforce');expect(s.history[614]).toEqual({kind:'skipCards'});
 await totals(page,s);await essentials(page);s=await humanPlacement(page,start.loaded,s);expect(s.history).toHaveLength(616);expect(s.history.at(-1)).toEqual({kind:'reinforce',province:'province_4',amount:1});await capture(page,info,'computer-discard-living-human-return');await info.attach('human-return-action-counts',{body:JSON.stringify({computers:[...seats],discards}),contentType:'application/json'});
});

test('real computer pending discard chooses oldest index zero before drawing and needs no human reward',async({page},info)=>{
 await begin(page);const before=discardPrefix();await load(page,before.text);await exact(page,before.loaded,before.loaded.state);await slow(page);const expected=step(before.loaded.state,{kind:'discardCard',handIndex:0});expect(before.loaded.state.cards!.hands[c.activePlayer(before.loaded.state)!.id]).toHaveLength(5);
 await noReward(page);const result=await advance(page,before.loaded,before.loaded.state);expect(result.action).toEqual({kind:'discardCard',handIndex:0});expect(result.state).toEqual(settleNoSet(expected));await noReward(page);await totals(page,result.state);await capture(page,info,'computer-oldest-discard');
});

test('human acknowledgement blocks computers through pause/speed changes and resumes at exactly two seconds',async({page},info)=>{
 await begin(page);const before=fixture('T37-reshuffle-before-match');await load(page,input('T37-reshuffle-before-match'));const own=c.activePlayer(before.state)!.id,kind=before.state.cards!.hands[own]![2]!;await page.getByRole('button',{name:`Discard ${kind} (card 3)`,exact:true}).click();const drawn=step(before.state,{kind:'discardCard',handIndex:2});await exact(page,before,drawn);expect(c.activePlayer(drawn)!.kind).toBe('computer');const more=page.getByRole('button',{name:'Continue',exact:true});await expect(more).toBeVisible();
 await page.locator('#game-pause-button').click();await slow(page);await expect(more).toBeDisabled();await page.clock.runFor(6000);await exact(page,before,drawn);await page.locator('#game-pause-button').click();await expect(more).toBeEnabled();await page.clock.runFor(6000);await exact(page,before,drawn);await capture(page,info,'human-reward-barrier');
 await more.click();await exact(page,before,drawn);await expect(more).toHaveCount(0);await page.clock.runFor(1999);await exact(page,before,drawn);await page.clock.runFor(1);const after=(await saved(page)).state;expect(after.history).toHaveLength(drawn.history.length+1);const action=after.history.at(-1)!;expect(action.kind).toBe('reinforce');expect(after).toEqual(step(drawn,action));await totals(page,after);
});

test('native pending Raid/discard saves reload exactly, pause holds, and spectator cards progress privately',async({page})=>{
 await begin(page);const pending=fixture('policy-raid-pending'),discard=discardPrefix();
 for(const item of [{text:input('policy-raid-pending'),loaded:pending},{text:discard.text,loaded:discard.loaded},spectator()]){
  await load(page,item.text);await exact(page,item.loaded,item.loaded.state);const downloaded=await nativeSave(page);await page.locator('#game-pause-button').click();await slow(page);await page.clock.runFor(6000);await exact(page,item.loaded,item.loaded.state);
  await load(page,downloaded);await exact(page,item.loaded,item.loaded.state);await slow(page);await noReward(page);const result=await advance(page,item.loaded,item.loaded.state);expect(result.action.kind).toBe(item.loaded.state.cards!.pendingRaid?'raidTarget':'discardCard');await noReward(page);
  if(item.loaded.options.seats.every(x=>x.kind==='computer')){await expect(cards(page).locator('[aria-label="Your hand"]')).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Your cards',exact:true})).not.toBeVisible();}
 }
});

test('load/new game cancel old computer timers and detached human reward callbacks',async({page})=>{
 await begin(page);const human=fixture('T40-geographic-opening'),humanState=settleNoSet(human.state);
 await load(page,input('policy-raid-pending'));await slow(page);await load(page,input('T40-geographic-opening'));await exact(page,human,humanState);await page.clock.runFor(6000);await exact(page,human,humanState);
 const before=fixture('T37-reshuffle-before-match'),own=c.activePlayer(before.state)!.id,kind=before.state.cards!.hands[own]![2]!;await load(page,input('T37-reshuffle-before-match'));await page.getByRole('button',{name:`Discard ${kind} (card 3)`,exact:true}).click();const old=await page.getByRole('button',{name:'Continue',exact:true}).elementHandle();await load(page,input('T40-geographic-opening'));await old!.evaluate(el=>(el as HTMLButtonElement).click());await page.clock.runFor(6000);await exact(page,human,humanState);
 await load(page,input('policy-raid-pending'));await page.getByRole('button',{name:'New game',exact:true}).click();await expect(page.getByRole('heading',{name:'New geographic game',exact:true})).toBeVisible();await page.clock.runFor(6000);await expect(page.locator('[data-country]')).toHaveCount(0);
});

test('automatic card actions preserve complete chronological log, upward reading, totals and public event history',async({page},info)=>{
 await begin(page);const loaded=fixture('policy-raid-pending');await load(page,input('policy-raid-pending'));await slow(page);const log=page.getByRole('list',{name:'Battle log',exact:true}),rows=log.locator(':scope > li');await expect(rows).toHaveCount(loaded.state.log.filter(x=>x.event!=='game_started').length);const initialRows=await rows.allTextContents();expect(initialRows.length).toBeGreaterThan(7);expect(await log.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);await log.evaluate(el=>{el.scrollTop=20;});const reading=await log.evaluate(el=>el.scrollTop);
 const result=await advance(page,loaded,loaded.state);let s=result.state;expect(result.action).toEqual({kind:'raidTarget',province:'province_30'});await expect(rows).toHaveCount(s.log.filter(x=>x.event!=='game_started').length);expect((await rows.allTextContents()).slice(0,initialRows.length)).toEqual(initialRows);expect(Math.abs(await log.evaluate(el=>el.scrollTop)-reading)).toBeLessThanOrEqual(1);
 for(const mode of ['detailed','compact']){await page.getByRole('combobox',{name:'Panel detail',exact:true}).selectOption(mode);expect(Math.abs(await log.evaluate(el=>el.scrollTop)-reading)).toBeLessThanOrEqual(1);await totals(page,s);await essentials(page);}
 await log.evaluate(el=>{el.scrollTop=el.scrollHeight;});const tick=await advance(page,loaded,s);s=tick.state;expect(await log.evaluate(el=>{const previous=el.scrollTop;el.scrollTop=el.scrollHeight;const max=el.scrollTop;el.scrollTop=previous;return Math.abs(previous-max);})).toBeLessThanOrEqual(1);await totals(page,s);
 await page.locator('#game-pause-button').click();await page.clock.runFor(6000);await exact(page,loaded,s);await page.getByRole('button',{name:'Game event log',exact:true}).click();const events=page.getByRole('list',{name:'All game events',exact:true});await expect(events.locator('[data-event-index]')).toHaveCount(s.history.length+1);await expect(events).toContainText('Trade cards');await expect(events).toContainText('Raid target');await expect(events).toContainText('Skip cards');await expect(events).not.toContainText(/You drew/i);await capture(page,info,'automatic-public-log');await page.keyboard.press('Escape');
});
