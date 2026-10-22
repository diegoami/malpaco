// T85 (A1, A9, A10, A13): setup, files, help and results as focused views at phone, tablet
// and desktop sizes. Loads are exact and retire stale controls, focus lands on a visible control,
// version-1 saves continue in the main file UI, the result details open on request, and the
// Fight on stop point and speed survive a load that opens on a computer turn.
import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {activePlayer,apply,createGame,defaultOptions} from '../../src/core';
import type {Action,GameState} from '../../src/core';
import {deserializeVersionedMatch,serializeMatch,serializeVersionedMatch,REFERENCE_MATCH_IDENTITY} from '../../src/core/match-save';
import {decidedBy} from '../../src/ui/victoryView';
import {pinned} from '../core/versioned-match-fixture';
import {closeSurface,openSurface,withSurface} from './shell';

const SIZES=[{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}] as const;
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);

async function begin(p:Page,path='/?setup'){
 await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto(path);
 await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'savedBlob',blob);return create(blob);};});
}
const fileInput=(p:Page)=>p.getByLabel('Load game',{exact:true});
async function load(p:Page,text:string,name='match.json'){
 const previous=await fileInput(p).elementHandle();
 await fileInput(p).setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);
}
/** In a game the file input lives in the menu card; on the setup screen it is on the page. */
async function loadInGame(p:Page,text:string){await openSurface(p,'settings');await load(p,text);}
async function savedText(p:Page){await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());return p.evaluate(()=>(Reflect.get(window,'savedBlob') as Blob).text());}
const saved=async(p:Page)=>deserializeVersionedMatch(await savedText(p)).state;
async function shot(p:Page,info:TestInfo,name:string){await p.screenshot({path:info.outputPath(`${name}.png`)});}
/** A control is reachable: scrolled into view, inside the viewport, not clipped sideways. */
async function reachable(p:Page,selector:string){
 const el=p.locator(selector).first();await el.scrollIntoViewIfNeeded();await expect(el).toBeVisible();
 expect(await el.evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;}),selector).toBe(true);
}
const noSideScroll=(p:Page)=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
/** The human-loss replay at the first computer turn after a human one, in its v2 form. */
function computerOpener(){
 const f=pinned('human-loss');let s=deserializeVersionedMatch(serializeVersionedMatch(f.options,[],REFERENCE_MATCH_IDENTITY)).state,human=false;
 for(const action of f.actions){const r=apply(s,action);if(!r.ok)throw Error(r.error);s=r.state;if(activePlayer(s)?.kind==='human')human=true;else if(human&&s.phase==='reinforce')return serializeVersionedMatch(f.options,s.history,REFERENCE_MATCH_IDENTITY);}
 throw Error('No computer opener');
}

/** One of the mover's countries that borders an enemy: placing there makes a legal attack. */
const frontline=(s:GameState)=>{const me=activePlayer(s)!.id;return s.map.provinces.find(p=>s.ownerOf[p.id]===me&&p.borders.some(b=>s.ownerOf[b]!==me))!.id;};
const enemyOf=(s:GameState,id:string)=>s.map.provinces.find(p=>p.id===id)!.borders.find(b=>s.ownerOf[b]!==s.ownerOf[id])!;

async function placeAll(p:Page,id:string){
 const left=async()=>await p.locator('#placement-pool').isVisible()?Number(await p.locator('#placement-pool-count').textContent()):0;
 for(let i=0;i<80&&await left()>0;i++)await country(p,id).click();expect(await left()).toBe(0);
}

const focusOnMenu=async(p:Page)=>expect(await p.evaluate(()=>({id:document.activeElement?.id,visible:!!document.activeElement&&(document.activeElement as HTMLElement).getClientRects().length>0}))).toEqual({id:'open-game-menu',visible:true});

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes are set here, so one project suffices'));

for(const size of SIZES)test(`setup and files fit at ${size.width}×${size.height}, also above a keyboard; a load error is read in place`,async({page},info)=>{
 await page.setViewportSize(size);await begin(page);
 for(const keyboard of [false,true]){
  // [designed] A soft keyboard takes about half the height.
  if(keyboard)await page.setViewportSize({width:size.width,height:Math.round(size.height/2)});
  for(const selector of ['#geographic-seed','#geographic-seats','#geographic-control-1','#geographic-domination','#geographic-round-limit','#geographic-names','button[type="submit"]','#reference-load-game-file'])await reachable(page,selector);
  expect(await noSideScroll(page)).toBe(true);
 }
 // The native file input is wide enough for its chosen file name (#51 R2).
 expect(await fileInput(page).evaluate(n=>n.getBoundingClientRect().width)).toBeGreaterThanOrEqual(200);
 await fileInput(page).setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"not":"a game"}')});
 await expect(page.locator('.match-error[role="alert"]')).toContainText('Load failed');await reachable(page,'.match-error[role="alert"]');
 await shot(page,info,`setup-${size.width}x${size.height}`);
});

test('a load is exact, retires the old match\'s controls and leaves focus on the visible menu icon (#195)',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await begin(page);
 await load(page,pinned('placement').text);await expect(page.locator('[data-country]')).toHaveCount(46);
 await focusOnMenu(page);
 const first=await saved(page),own=first.map.provinces.find(p=>first.ownerOf[p.id]===activePlayer(first)!.id)!.id;
 const stale=await country(page,own).elementHandle();
 // Load a different match from the menu card's file input.
 const next=pinned('move-ready');await loadInGame(page,next.text);
 expect(await savedText(page)).toBe(next.text);
 await focusOnMenu(page);
 // The old board's country is detached; activating it changes nothing.
 await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(await savedText(page)).toBe(next.text);
 // The menu file input fits its card at phone width (#51 R2).
 await openSurface(page,'settings');
 expect(await fileInput(page).evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('#game-focus-drawer')!.getBoundingClientRect();return r.width>=200&&r.right<=d.right+1&&r.left>=d.left-1;})).toBe(true);
 await shot(page,info,'files-in-menu');
});

test('loading on the Nine Isles route also leaves focus on the menu icon (#195)',async({page})=>{
 await begin(page,'/?view=reference-game');await load(page,pinned('placement').text);await focusOnMenu(page);
 await openSurface(page,'settings');await load(page,pinned('move-ready').text);await focusOnMenu(page);
});

test('a version-1 save loads into continued play from the main file UI and saves back unchanged (A13)',async({page})=>{
 const options={...defaultOptions(),seed:7,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
 const origin=createGame(options);if(!origin.ok)throw Error(origin.errors.join(';'));
 let s=origin.state;const actions:Action[]=[];
 const own=s.map.provinces.find(p=>s.ownerOf[p.id]===activePlayer(s)!.id)!.id;
 for(let i=0;i<2;i++){const a:Action={kind:'reinforce',province:own,amount:1};const r=apply(s,a);if(!r.ok)throw Error(r.error);s=r.state;actions.push(a);}
 expect(s.reinforcementPool).toBeGreaterThan(0);
 const v1=serializeMatch(options,actions);expect(JSON.parse(v1).version).toBe(1);
 await begin(page);await load(page,v1,'old.json');
 await expect(page.locator('[data-country]')).toHaveCount(s.map.provinces.length);
 // Saved back as version 1, byte for byte.
 expect(await savedText(page)).toBe(v1);
 // Continued play: the next legal action from the page equals the engine's.
 const next:Action={kind:'reinforce',province:own,amount:1};await country(page,own).click();
 const r=apply(s,next);if(!r.ok)throw Error(r.error);
 expect(await savedText(page)).toBe(serializeMatch(options,r.state.history));
});

test('the elimination card keeps Watch and a labelled Stop game; result details open on request; no winner badge (A10, #132)',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await begin(page);
 const f=pinned('human-loss');await load(page,f.text);
 const stop=page.locator('#stop-game-button');await openSurface(page,'actions');
 await expect(page.locator('#watch-computers-button')).toBeVisible();await expect(stop).toBeVisible();
 await expect(stop.locator('.card-icon-caption')).toHaveText('Stop game');await expect(stop).toHaveAccessibleName('Stop game');
 await expect(page.locator('.result-title')).not.toContainText('wins');
 expect(await page.locator('.panel .turn svg.chip').count()).toBe(0);
 await page.locator('#result-details-button').click();
 await expect(page.locator('#victory-details')).toContainText(`Seed${f.options.seed}`);
 await expect(page.locator('#victory-details')).toContainText('Record');
 // Through the whole card: open standings and details, rotate; Stop game keeps its label.
 await page.locator('#result-standings-button').click();await page.setViewportSize({width:844,height:390});
 await expect(stop.locator('.card-icon-caption')).toHaveText('Stop game');
 await shot(page,info,'elimination-details');
 await stop.click();await openSurface(page,'actions');await expect(page.locator('#victory-reason')).toBeVisible();
 // The details stay open from the elimination card into the result.
 await expect(page.locator('#result-new-game-button')).toBeVisible();await expect(page.locator('#victory-details')).toBeVisible();
});

test('a round-limit result names the criterion that decided it (#132)',async({page})=>{
 await begin(page);const f=pinned('round-limit');await load(page,f.text);const s=await saved(page);
 expect(s.result?.reason).toBe('round-limit');
 await openSurface(page,'actions');await expect(page.locator('#victory-reason')).toContainText(decidedBy(s.result!.standings));
});

test('Help & icon names opens from the menu with one matching visible and accessible name (R6, #61)',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await begin(page);await load(page,pinned('placement').text);
 await openSurface(page,'settings');const button=page.locator('#game-help-button');
 await expect(button).toHaveText('Help & icon names');await expect(button).toHaveAccessibleName('Help & icon names');
 await button.click();
 const dialog=page.getByRole('dialog',{name:'Help & icon names'});await expect(dialog).toBeVisible();
 for(const name of ['Menu','Pause','Fast-forward','Fit','Countries','Attack','Fight on','Return','Changes'])await expect(dialog.locator('.game-help-icons li strong',{hasText:new RegExp(`^${name}$`)})).toHaveCount(1);
 expect(await dialog.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
 await shot(page,info,'help');
 await page.locator('#close-game-help').click();await expect(dialog).toBeHidden();
});

test('the Fight on stop point and speed survive a load that opens on a computer turn (#136 b)',async({page})=>{
 test.setTimeout(60_000);
 await begin(page,'/?view=reference-game');await page.getByRole('button',{name:'Start game',exact:true}).click();
 // The seeded first seat may be a computer: fast-forward to the human turn.
 if(await page.locator('#fast-forward-button').isVisible()){await page.locator('#fast-forward-button').click();await page.clock.runFor(60_000);}
 // Place every army, start combat and stage a legal pair, then set the stop point and speed.
 const s=await saved(page),from=frontline(s);
 await placeAll(page,from);
 await page.locator('#start-combat-button').click();
 await country(page,from).click();await country(page,enemyOf(s,from)).click();await openSurface(page,'actions');
 await page.locator('#battle-stop-threshold').fill('5');await page.locator('#battle-stop-threshold').press('Enter');
 await page.locator('#battle-speed').selectOption('slow');
 await expect(page.locator('#battle-stop-threshold')).toHaveValue('5');
 await closeSurface(page);
 // A load that opens on a computer turn: the preferences hold there and on the next human turn.
 await loadInGame(page,computerOpener());
 await withSurface(page,'settings',()=>expect(page.locator('#game-speed')).toHaveValue('slow'));
 await page.locator('#fast-forward-button').click();await page.clock.runFor(60_000);
 const t=await saved(page);expect(activePlayer(t)!.kind).toBe('human');
 const src=frontline(t);
 await placeAll(page,src);
 await page.locator('#start-combat-button').click();
 await country(page,src).click();await country(page,enemyOf(t,src)).click();await openSurface(page,'actions');
 await expect(page.locator('#battle-stop-threshold')).toHaveValue('5');await expect(page.locator('#battle-speed')).toHaveValue('slow');
});
