import {noticeContinue,visitGame,reloadGame,startFromResult} from './shell';
// T100: the scoreboard, kept in this browser. Each player game counts once when it ends: a win,
// an elimination (Lost at once, even if you then watch) or New game's give-up; `?setup` never counts.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {openSurface,withSurface} from './shell';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {emptyScoreboard,recordGame} from '../../src/ui/scoreboard';
import type {GameOutcome} from '../../src/ui/scoreboard';

const ROOT='malpaco:current-game',SCORES='malpaco:scoreboard';
const read=(p:Page,key:string)=>p.evaluate(k=>localStorage.getItem(k),key);
const errors=(p:Page)=>{const seen:string[]=[];p.on('pageerror',e=>seen.push(String(e)));return seen;};
const seedShown=async(p:Page)=>Number((await p.locator('.game-identity').textContent())!.match(/Seed (\d+)/)![1]);
const map=(p:Page)=>expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);
const shots=(name:string,p:Page)=>{mkdirSync('artifacts/T100',{recursive:true});return p.screenshot({path:`artifacts/T100/${name}-390x844.png`,animations:'disabled'});};

/** The engine plays every seat (the human too) on the player's options, up to the last action before the end. */
function beforeEnd(seed:number){
 const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
 const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)throw Error(game.errors.join('; '));
 const states:GameState[]=[game.state];let s=game.state;
 for(let n=0;n<3000&&!s.result;n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;states.push(s);}
 const last=states.at(-2)!;
 return {last,end:s,text:serializeVersionedMatch(options,last.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
}
/** Seed 5: the human's End turn wins by domination. Seed 2: a computer's End turn eliminates the human. */
const WIN=beforeEnd(5),LOSS=beforeEnd(2);
const yours=(s:GameState)=>s.map.provinces.filter(c=>s.ownerOf[c.id]==='seat1').length;

/** Puts records in this browser before the first load only, so a reload sees what the page kept. */
const keepOnce=(p:Page,values:Record<string,string>)=>p.addInitScript(v=>{if(sessionStorage.getItem('t100-kept'))return;sessionStorage.setItem('t100-kept','1');for(const [k,x] of Object.entries(v))localStorage.setItem(k,x);},values);
async function openScoreboard(p:Page){
 await openSurface(p,'menu');await p.getByRole('button',{name:'Scoreboard',exact:true}).click();
 const dialog=p.getByRole('dialog',{name:'Scoreboard'});await expect(dialog).toBeVisible();return dialog;
}
async function closeScoreboard(p:Page){await p.locator('#close-scoreboard').click();await expect(p.getByRole('dialog',{name:'Scoreboard'})).toBeHidden();}
/** The scoreboard as the page shows it: the five totals and the rows' cells. */
async function board(p:Page){
 return withSurface(p,'menu',async()=>{
 const dialog=await openScoreboard(p);
 const totals=await dialog.locator('#scoreboard-totals dd').allTextContents();
 const rows=await dialog.locator('#scoreboard-games tbody tr').evaluateAll(trs=>trs.map(tr=>[...tr.children].map(c=>c.textContent)));
 await closeScoreboard(p);return {totals,rows};
 });
}
async function giveUp(p:Page){
 await openSurface(p,'menu');await p.locator('#new-game-button').click();await p.locator('#give-up-confirm').click();
 const result=p.getByRole('dialog',{name:'You gave up'});await expect(result).toBeVisible();return result;
}
/** End turn wins seed 5; the card drawn for the turn's capture is acknowledged first, then the result shows. */
async function winningEndTurn(p:Page){
 await p.locator('#end-turn-button').click();
 const reward=noticeContinue(p),won=p.getByRole('heading',{name:'You won',exact:true});
 await expect(reward.or(won).first()).toBeVisible();if(await reward.isVisible())await reward.click();
 await expect(won).toBeVisible();
}
const rowOf=(n:number,result:GameOutcome)=>({id:`old-${n}`,date:`2026-09-${String(n).padStart(2,'0')}T10:00:00.000Z`,result,rounds:n,countries:n,seed:500+n});

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','one size: the flow, not the layout');});

test('a give-up adds exactly one Gave up row and the totals change by one; a reload adds no other',async({page})=>{
 const seen=errors(page);await visitGame(page,'/');await map(page);const seed=await seedShown(page);
 expect(await board(page)).toEqual({totals:['0','0','0','0','–'],rows:[]});
 const result=await giveUp(page);
 await expect(result.locator('#give-up-totals')).toHaveText('Won 0 · Lost 0 · Gave up 1');
 // A reload on the result card: the game was recorded, never again.
 await reloadGame(page);await map(page);
 const after=await board(page);expect(after.totals).toEqual(['1','0','0','1','0%']);
 expect(after.rows).toHaveLength(1);expect(after.rows[0]!.slice(1)).toEqual(['Gave up','1',expect.stringMatching(/^\d+$/),String(seed)]);
 await reloadGame(page);await map(page);expect((await board(page)).rows).toHaveLength(1);
 expect(seen).toEqual([]);
});

test('a win adds exactly one Won row, shown with the totals line',async({page})=>{
 test.setTimeout(90_000);const seen=errors(page);expect(WIN.end.winner).toBe('seat1');expect(WIN.end.history.at(-1)).toEqual({kind:'endTurn'});
 await keepOnce(page,{[ROOT]:WIN.text});await visitGame(page,'/');await map(page);expect(await seedShown(page)).toBe(5);
 await winningEndTurn(page);
 await expect(page.locator('#victory-totals')).toHaveText('Won 1 · Lost 0 · Gave up 0');
 expect(await read(page,ROOT)).toBeNull();
 await reloadGame(page);await map(page);
 const after=await board(page);expect(after.totals).toEqual(['1','1','0','0','100%']);
 expect(after.rows.map(r=>r.slice(1))).toEqual([['Won',String(WIN.end.turnNumber),String(yours(WIN.end)),'5']]);
 expect(seen).toEqual([]);
});

test('an elimination adds exactly one Lost row at once, and watching the computers adds no other',async({page})=>{
 test.setTimeout(120_000);const seen=errors(page);expect(LOSS.end.phase).toBe('human-loss');expect(activePlayer(LOSS.last)!.kind).toBe('computer');
 await keepOnce(page,{[ROOT]:LOSS.text,'malpaco:preferences':JSON.stringify({speed:'fast'})});await visitGame(page,'/');await map(page);
 await expect(page.getByRole('heading',{name:'You were eliminated',exact:true})).toBeVisible({timeout:30_000});
 await expect(page.locator('#victory-totals')).toHaveText('Won 0 · Lost 1 · Gave up 0');
 expect((await board(page)).rows.map(r=>r.slice(1))).toEqual([['Lost',String(LOSS.end.turnNumber),'0','2']]);
 await page.getByRole('button',{name:'Watch computers',exact:true}).click();
 // The watched game plays on, and is kept again; neither its play nor a reload records it twice.
 await expect.poll(()=>read(page,ROOT),{timeout:30_000}).not.toBeNull();
 await reloadGame(page);await map(page);
 expect((await board(page)).totals).toEqual(['1','0','1','0','0%']);
 expect(seen).toEqual([]);
});

test('a 21st game drops the oldest row, and the scoreboard card shows the games newest first',async({page})=>{
 let kept=emptyScoreboard();for(let n=1;n<=20;n++)kept=recordGame(kept,rowOf(n,n%3?'lost':'won'));
 await keepOnce(page,{[SCORES]:JSON.stringify(kept)});await visitGame(page,'/');await map(page);const seed=await seedShown(page);
 const before=await board(page);expect(before.rows).toHaveLength(20);expect(before.rows.at(-1)![4]).toBe('501');expect(before.totals).toEqual(['20','6','14','0','30%']);
 await giveUp(page);await startFromResult(page);await map(page);
 const after=await board(page);expect(after.rows).toHaveLength(20);
 expect(after.rows[0]!.slice(1,2).concat(after.rows[0]![4]!)).toEqual(['Gave up',String(seed)]);
 expect(after.rows.at(-1)![4]).toBe('502');expect(after.totals).toEqual(['21','6','14','1','29%']);
 await page.setViewportSize({width:390,height:844});await openScoreboard(page);await shots('scoreboard',page);
});

test('Reset asks first; clearing empties the totals and the list',async({page})=>{
 let kept=emptyScoreboard();for(let n=1;n<=3;n++)kept=recordGame(kept,rowOf(n,n===2?'won':'gave-up'));
 await keepOnce(page,{[SCORES]:JSON.stringify(kept)});await visitGame(page,'/');await map(page);
 const dialog=await openScoreboard(page);await expect(dialog.locator('#scoreboard-games tbody tr')).toHaveCount(3);
 await dialog.getByRole('button',{name:'Reset',exact:true}).click();
 await expect(dialog.getByText('Clear the scoreboard?',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Keep',exact:true}).click();
 await expect(dialog.getByText('Clear the scoreboard?',{exact:true})).toHaveCount(0);await expect(dialog.locator('#scoreboard-games tbody tr')).toHaveCount(3);
 expect(await read(page,SCORES)).not.toBeNull();
 await dialog.getByRole('button',{name:'Reset',exact:true}).click();await dialog.getByRole('button',{name:'Clear',exact:true}).click();
 await expect(dialog.locator('#scoreboard-games')).toHaveCount(0);await expect(dialog.locator('#scoreboard-empty')).toBeVisible();
 await expect(dialog.locator('#scoreboard-totals dd')).toHaveText(['0','0','0','0','–']);
 expect(await read(page,SCORES)).toBeNull();
 await closeScoreboard(page);await reloadGame(page);await map(page);expect(await board(page)).toEqual({totals:['0','0','0','0','–'],rows:[]});
});

test('a corrupt scoreboard starts empty without a page error, and the next game is its first row',async({page})=>{
 const seen=errors(page);await keepOnce(page,{[SCORES]:'{"version":1,"totals":'});await visitGame(page,'/');await map(page);
 expect(await board(page)).toEqual({totals:['0','0','0','0','–'],rows:[]});
 await expect((await giveUp(page)).locator('#give-up-totals')).toHaveText('Won 0 · Lost 0 · Gave up 1');
 expect(JSON.parse((await read(page,SCORES))!).totals).toEqual({won:0,lost:0,gaveUp:1});
 expect(seen).toEqual([]);
});

test('a ?setup game never adds a row: its win shows no totals and keeps no scoreboard',async({page})=>{
 test.setTimeout(90_000);await visitGame(page,'/?setup');
 const old=await page.getByLabel('Load game',{exact:true}).elementHandle();
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'near-win.json',mimeType:'application/json',buffer:Buffer.from(WIN.text)});
 await expect.poll(()=>old!.evaluate(el=>el.isConnected)).toBe(false);await map(page);
 await winningEndTurn(page);
 await expect(page.locator('#victory-totals')).toHaveCount(0);await expect(page.locator('#scoreboard-button')).toHaveCount(0);
 expect(await read(page,SCORES)).toBeNull();
});

test('the result card shows the totals line at phone size',async({page})=>{
 test.setTimeout(90_000);await page.setViewportSize({width:390,height:844});
 let kept=emptyScoreboard();for(let n=1;n<=5;n++)kept=recordGame(kept,rowOf(n,n%2?'lost':'gave-up'));
 await keepOnce(page,{[ROOT]:WIN.text,[SCORES]:JSON.stringify(kept)});await visitGame(page,'/');await map(page);
 await winningEndTurn(page);
 await expect(page.locator('#victory-totals')).toHaveText('Won 1 · Lost 3 · Gave up 2');await shots('result-totals',page);
 const box=(await page.locator('#victory-totals').boundingBox())!;expect(box.x+box.width).toBeLessThanOrEqual(390);
});

test('the give-up dialog is padded like the result card in both stages, with its totals line beside the standings (play-test finding)',async({page})=>{
 await page.setViewportSize({width:390,height:844});await visitGame(page,'/');await map(page);
 const dialog=page.locator('#give-up-dialog');
 /** Every part sits at least 12 px inside the dialog's edges; buttons are 44 px tall. */
 const inset=async()=>{
  // Measured once the dialog's opening animation has settled.
  await dialog.evaluate(d=>Promise.all(d.getAnimations({subtree:true}).map(a=>a.finished)));
  const box=(await dialog.boundingBox())!;
  for(const part of await dialog.locator(':scope > *, .help-actions button').all()){const r=(await part.boundingBox())!;
   expect(r.x-box.x,'left inset').toBeGreaterThanOrEqual(12);expect(box.x+box.width-(r.x+r.width),'right inset').toBeGreaterThanOrEqual(12);}
  for(const button of await dialog.locator('button').all())expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 };
 await openSurface(page,'menu');await page.locator('#new-game-button').click();await expect(dialog).toBeVisible();
 await inset();
 const [yes,no]=[(await page.locator('#give-up-confirm').boundingBox())!,(await page.locator('#give-up-cancel').boundingBox())!];
 expect(no.x-(yes.x+yes.width),'a gap between the buttons').toBeGreaterThanOrEqual(8);
 await page.locator('#give-up-confirm').click();await expect(dialog.getByRole('heading',{name:'You gave up'})).toBeVisible();
 await inset();
 // The standings read as a table: Seat left, the numbers right, and the totals line just above it.
 const align=(sel:string)=>dialog.locator(sel).first().evaluate(n=>getComputedStyle(n).textAlign);
 expect([await align('thead th:first-child'),await align('tbody th'),await align('tbody td')]).toEqual(['left','left','right']);
 const totals=(await dialog.locator('#give-up-totals').boundingBox())!,table=(await dialog.locator('#give-up-standings').boundingBox())!;
 expect(table.y-(totals.y+totals.height)).toBeLessThanOrEqual(24);
 await page.waitForTimeout(300);await shots('give-up-result',page);
});
