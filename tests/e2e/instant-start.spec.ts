// T96: the root page starts a game at once (one human against three computers, a random seed),
// keeps it in localStorage after every action, resumes it on a refresh, and gives it up on New game.
import {expect,test} from '@playwright/test';
import type {Browser,Page} from '@playwright/test';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {openSurface} from './shell';

const KEY='malpaco:current-game';
const record=(p:Page)=>p.evaluate(key=>localStorage.getItem(key),KEY);
const seedShown=async(p:Page)=>Number((await p.locator('.game-identity').textContent())!.match(/Seed (\d+)/)![1]);
const errors=(p:Page)=>{const seen:string[]=[];p.on('pageerror',e=>seen.push(String(e)));return seen;};
async function opened(p:Page,path='/'){await p.goto(path);await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);}
/** A fresh browser profile: nothing kept, so the root page starts a new game. */
async function freshSeed(browser:Browser){const context=await browser.newContext();const p=await context.newPage();await opened(p);const seed=await seedShown(p);await context.close();return seed;}
test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','one size: the flow, not the layout');});

test('the root page is a game at once: 46 countries, one human and three Normal computers, no setup and no files',async({page})=>{
 const seen=errors(page);await opened(page);
 await expect(page.locator('#geographic-setup, .setup-card form, #geographic-seed')).toHaveCount(0);
 const kept=deserializeVersionedMatch((await record(page))!);
 expect(kept.options.seats.map(s=>s.kind)).toEqual(['human','computer','computer','computer']);
 expect(kept.options.computerStrengths).toEqual(['Normal','Normal','Normal']);
 expect([kept.options.dominationWin,kept.options.roundLimit,kept.options.names]).toEqual([true,null,'seed']);
 expect(kept.options.seed).toBe(await seedShown(page));
 await openSurface(page,'settings');
 await expect(page.getByRole('button',{name:'Save game',exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Load game',{exact:true})).toHaveCount(0);
 await expect(page.locator('#reference-load-game-file,#reference-save-game')).toHaveCount(0);
 expect(seen).toEqual([]);
});

test('two fresh loads give different seeds, and ?seed=7 gives seed 7 without replacing the kept game',async({browser,page})=>{
 const seeds=[await freshSeed(browser),await freshSeed(browser)];expect(seeds[0]).not.toBe(seeds[1]);
 await opened(page);const kept=await record(page);
 await opened(page,'/?seed=7');expect(await seedShown(page)).toBe(7);
 expect(await record(page)).toBe(kept);
});

/**
 * The player's game on seed 7, played by the engine up to the human seat placing armies, as the
 * root page keeps it. The resume check then never waits on a random seed's computer turns (a CI
 * run once timed out there, #268).
 */
function keptPlacing(){
 const options:GameOptions={...defaultOptions(),seed:7,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
 const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)throw Error(game.errors.join('; '));
 let s:GameState=game.state;
 const placing=(x:GameState)=>activePlayer(x)?.kind==='human'&&['cards','reinforce'].includes(x.phase)&&x.reinforcementPool>1;
 for(let n=0;n<500&&!placing(s);n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;}
 if(!placing(s))throw Error('no placing state on seed 7');
 return serializeVersionedMatch(options,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
}

test('a refresh resumes the identical match: the same record, history, RNG and board',async({page})=>{
 const seen=errors(page);
 await page.addInitScript(([k,v])=>{if(!sessionStorage.getItem('kept'))sessionStorage.setItem('kept','1'),localStorage.setItem(k!,v!);},[KEY,keptPlacing()]);
 await opened(page);
 const before=deserializeVersionedMatch((await record(page))!).state,me=activePlayer(before)!.id;
 expect(before.reinforcementPool).toBeGreaterThan(1);
 const own=before.map.provinces.find(c=>before.ownerOf[c.id]===me)!.id;
 await page.locator(`[data-country="${own}"]`).click();
 // In the cards phase the placement also closes that phase, so it may add two actions.
 await expect.poll(async()=>deserializeVersionedMatch((await record(page))!).state.armies[own]).toBe(before.armies[own]!+1);
 const text=(await record(page))!,state=deserializeVersionedMatch(text).state;
 expect(state.history.length).toBeGreaterThan(before.history.length);
 await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 expect(await seedShown(page)).toBe(deserializeVersionedMatch(text).options.seed);
 const after=deserializeVersionedMatch((await record(page))!).state;
 expect({history:after.history,rng:after.rng,armies:after.armies,ownerOf:after.ownerOf,phase:after.phase,pool:after.reinforcementPool})
  .toEqual({history:state.history,rng:state.rng,armies:state.armies,ownerOf:state.ownerOf,phase:state.phase,pool:state.reinforcementPool});
 await expect(page.locator(`[data-country="${own}"] .count`)).toHaveText(String(state.armies[own]));
 expect(seen).toEqual([]);
});

test('New game asks first, shows the given-up result, then starts a different seed',async({page})=>{
 await opened(page);const first=await seedShown(page);
 await openSurface(page,'settings');await page.locator('#new-game-button').click();
 const dialog=page.getByRole('dialog',{name:'Give up this game?'});await expect(dialog).toBeVisible();
 // Keep playing changes nothing.
 await page.locator('#give-up-cancel').click();await expect(dialog).toBeHidden();expect(await seedShown(page)).toBe(first);
 await openSurface(page,'settings');await page.locator('#new-game-button').click();
 await page.locator('#give-up-confirm').click();
 const result=page.getByRole('dialog',{name:'You gave up'});await expect(result).toBeVisible();
 await expect(result.locator('#give-up-standings tbody tr')).toHaveCount(4);
 expect(await record(page)).toBeNull();
 await page.keyboard.press('Escape');await expect(result).toBeVisible();
 await page.locator('#give-up-new-game').click();
 await expect.poll(()=>seedShown(page).catch(()=>first)).not.toBe(first);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 expect(deserializeVersionedMatch((await record(page))!).options.seed).toBe(await seedShown(page));
});

test('a corrupt record starts a fresh game without an error',async({page})=>{
 const seen=errors(page);await opened(page);
 for(const text of ['{not json','{"format":"malpaco-match","version":2,"actions":"nope"}']){
  await page.evaluate(([key,value])=>localStorage.setItem(key!,value!),[KEY,text]);
  await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  const kept=await record(page);expect(kept).not.toBe(text);expect(()=>deserializeVersionedMatch(kept!)).not.toThrow();
 }
 expect(seen).toEqual([]);
});

test('?view=reference-game still opens Nine Isles',async({page})=>{
 await page.goto('/?view=reference-game');await expect(page.locator('#reference-setup')).toBeVisible();
 await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#reference-map')).toBeVisible();
});
