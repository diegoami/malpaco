import {visitGame,reloadGame,startFromResult} from './shell';
// T100: sessions persist in this browser. A `?seed=N` game keeps its own record, Pause and speed
// survive a reload, a pending capture reopens, and a new page of the same browser resumes the game.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {openSurface} from './shell';

const ROOT='malpaco:current-game';
const read=(p:Page,key:string)=>p.evaluate(k=>localStorage.getItem(k),key);
const errors=(p:Page)=>{const seen:string[]=[];p.on('pageerror',e=>seen.push(String(e)));return seen;};
const seedShown=async(p:Page)=>Number((await p.locator('.game-identity').textContent())!.match(/Seed (\d+)/)![1]);
async function opened(p:Page,path='/'){await visitGame(p,path);await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);}
const loaded=async(p:Page,key:string)=>deserializeVersionedMatch((await read(p,key))!).state;
/** Runs the computers forward until the human seat is placing armies (as instant-start.spec does). */
async function humanPlacing(p:Page,key:string){
 await expect.poll(async()=>{
  const text=await read(p,key);const state=text?deserializeVersionedMatch(text).state:null;
  if(state&&activePlayer(state)?.kind==='human'&&['cards','reinforce'].includes(state.phase)&&state.reinforcementPool>0&&await p.locator('#placement-pool').isVisible()&&await p.locator('#turn-guidance-title').textContent()==='Your turn')return true;
  const forward=p.locator('#fast-forward-button');if(await forward.isVisible())await forward.click().catch(()=>{});
  return false;
 },{timeout:90_000}).toBe(true);
 return loaded(p,key);
}
/** Places one army on a country of yours and waits until the record holds it. */
async function placeOne(p:Page,key:string){
 const before=await humanPlacing(p,key),me=activePlayer(before)!.id,own=before.map.provinces.find(c=>before.ownerOf[c.id]===me)!.id;
 await p.locator(`[data-country="${own}"]`).click();
 await expect.poll(async()=>(await loaded(p,key)).armies[own]).toBe(before.armies[own]!+1);
 return loaded(p,key);
}
const same=(s:GameState)=>({history:s.history,rng:s.rng,armies:s.armies,ownerOf:s.ownerOf,phase:s.phase,pool:s.reinforcementPool,pendingCapture:s.pendingCapture});

/** The engine plays every seat (the human too) on the player's options, stopping where `stop` says. */
function played(seed:number,stop:(s:GameState)=>boolean){
 const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
 const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)throw Error(game.errors.join('; '));
 let s=game.state;
 for(let n=0;n<3000&&!s.result&&!stop(s);n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;}
 if(!stop(s))throw Error('no such state');
 return {state:s,text:serializeVersionedMatch(options,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
}
/** Puts a record in this browser before the first load only, so a reload sees what the page kept. */
const keepOnce=(p:Page,values:Record<string,string>)=>p.addInitScript(v=>{if(sessionStorage.getItem('t100-kept'))return;sessionStorage.setItem('t100-kept','1');for(const [k,x] of Object.entries(v))localStorage.setItem(k,x);},values);

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','one size: the flow, not the layout');});

test('a ?seed=7 game resumes after a reload with the same history and RNG, and the root game is untouched',async({page})=>{
 test.setTimeout(150_000);const seen=errors(page);
 await opened(page);await opened(page,'/?seed=7');const root=await read(page,ROOT);expect(root).not.toBeNull();
 const key='malpaco:seed-game:7',meta='malpaco:seed-game-meta:7';
 const before=await placeOne(page,key),id=JSON.parse((await read(page,meta))!).id;
 expect(deserializeVersionedMatch((await read(page,key))!).options.seed).toBe(7);
 await reloadGame(page);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);expect(await seedShown(page)).toBe(7);
 // Your placement turn waits for you, so the resumed game is exactly the kept one.
 expect(same(await loaded(page,key))).toEqual(same(before));
 expect(JSON.parse((await read(page,meta))!).id).toBe(id);
 expect(await read(page,ROOT)).toBe(root);
 expect(seen).toEqual([]);
});

test('#260: New game on a ?seed page moves the page to the new seed, keeps that game for a reload, and leaves the root game alone',async({page})=>{
 test.setTimeout(150_000);const seen=errors(page);
 await opened(page);await opened(page,'/?seed=7');const root=await read(page,ROOT),seven=await read(page,'malpaco:seed-game:7');
 await openSurface(page,'settings');await page.locator('#new-game-button').click();
 await page.locator('#give-up-confirm').click();await startFromResult(page);
 await expect.poll(()=>seedShown(page).catch(()=>7)).not.toBe(7);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 const fresh=await seedShown(page),key=`malpaco:seed-game:${fresh}`;
 expect(new URL(page.url()).searchParams.get('seed')).toBe(String(fresh));
 const before=await placeOne(page,key);
 await reloadGame(page);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 expect(await seedShown(page)).toBe(fresh);
 expect(same(await loaded(page,key))).toEqual(same(before));
 expect(await read(page,ROOT)).toBe(root);
 // The given-up seed 7 game is not kept for a later visit.
 expect(await read(page,'malpaco:seed-game:7')).not.toBe(seven);
 expect(seen).toEqual([]);
});

test('a Settings-paused game opens paused after reload and resumes only from its turn widget',async({page})=>{
 test.setTimeout(120_000);const seen=errors(page);await opened(page);
 await page.locator('#open-game-menu').click();const kept=(await read(page,ROOT))!;
 await reloadGame(page);await expect(page.locator('#resume-turn-button')).toBeVisible();await expect(page.locator('#turn-guidance-title')).toHaveText('Paused');
 await page.waitForTimeout(3000);expect(await read(page,ROOT)).toBe(kept);
 await page.locator('#resume-turn-button').click();await expect(page.locator('#resume-turn-button')).toBeHidden();
 await reloadGame(page);await expect(page.locator('#resume-turn-button')).toBeHidden();
 const before=deserializeVersionedMatch(kept),after=deserializeVersionedMatch((await read(page,ROOT))!);expect(after.options).toEqual(before.options);expect(after.state.history.slice(0,before.state.history.length)).toEqual(before.state.history);
 expect(seen).toEqual([]);
});

test('a pending capture survives a reload: its card is open and the engine state is the same',async({page})=>{
 test.setTimeout(90_000);const seen=errors(page);
 const capture=played(5,s=>s.phase==='capture'&&activePlayer(s)?.kind==='human'&&!!s.pendingCapture);
 await keepOnce(page,{[ROOT]:capture.text});
 for(let n=0;n<2;n++){
  if(n)await reloadGame(page);else await visitGame(page,'/');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  await expect(page.locator('#game-focus-drawer')).toBeVisible();await expect(page.locator('#game-focus-drawer')).toHaveAttribute('data-surface','actions');
  await expect(page.getByRole('button',{name:'Confirm move-in',exact:true})).toBeVisible();
  expect(same(await loaded(page,ROOT))).toEqual(same(capture.state));
 }
 // The reopened card still completes the capture.
 await page.getByRole('button',{name:'Confirm move-in',exact:true}).click();
 await expect.poll(async()=>(await loaded(page,ROOT)).history.length).toBeGreaterThan(capture.state.history.length);
 expect((await loaded(page,ROOT)).history.at(capture.state.history.length)?.kind).toBe('captureMove');
 expect(seen).toEqual([]);
});

test('a new page in the same browser (a restart) resumes the root game',async({context,page})=>{
 test.setTimeout(150_000);await opened(page);
 const state=await placeOne(page,ROOT),seed=await seedShown(page);
 await page.close();
 const again=await context.newPage();const seen=errors(again);await opened(again);
 expect(await seedShown(again)).toBe(seed);
 expect((await loaded(again,ROOT)).history.slice(0,state.history.length)).toEqual(state.history);
 expect(seen).toEqual([]);
});
