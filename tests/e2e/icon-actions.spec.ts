import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {apply,deserializeVersionedMatch} from '../../src/core';
import type {Action,GameState} from '../../src/core';
const fixtureRoot='docs/prototypes/new-game/';
const input=(name:string)=>readFileSync(fixtureRoot+name,'utf8');
const discoveries=JSON.parse(input('issue180/preflight/discovery.json'));
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function begin(p:Page){
 await p.clock.install({time:new Date('2026-10-19T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-19T12:00:00Z'));
 await p.goto('/');await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'iconSave',blob);return create(blob);};});
}
async function open(p:Page,surface:string){
 const d=p.locator('#game-focus-drawer');if(await d.isVisible()&&await d.getAttribute('data-surface')===surface)return;
 await p.locator('#open-game-'+surface).click();await expect(d).toBeVisible();await expect(d).toHaveAttribute('data-surface',surface);
}
async function close(p:Page){if(await p.locator('#game-focus-drawer').isVisible())await p.locator('#close-game-drawer').click();}
async function load(p:Page,text:string){
 if(await p.locator('#battle-action-rail').count())await open(p,'settings');
 const old=await p.getByLabel('Load game',{exact:true}).elementHandle();await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'icons.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>old!.evaluate(e=>e.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
}
async function save(p:Page){await open(p,'settings');await p.getByRole('button',{name:'Save game',exact:true}).click();const text=await p.evaluate(()=>(Reflect.get(window,'iconSave') as Blob).text());await close(p);return text;}
async function exact(p:Page,state:GameState){expect(deserializeVersionedMatch(await save(p)).state).toEqual(state);}
function next(state:GameState,action:Action){const r=apply(state,action);if(!r.ok)throw Error(r.error);return r.state;}
async function collapse(p:Page){
 for(const id of ['toggle-topbar','toggle-sidebar'])if(await p.locator('#'+id).getAttribute('aria-expanded')==='true')await p.locator('#'+id).click();
 await expect(p.locator('.topbar')).toBeHidden();await expect(p.locator('.panel')).toBeHidden();
}
async function hit(p:Page,id:string){const e=p.locator('#'+id);await expect(e).toBeVisible();await expect(e).toBeEnabled();expect(await e.evaluate(n=>{const r=n.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&!!h&&(n===h||n.contains(h));}),id+' physically reachable').toBe(true);await e.click();}
async function railFits(p:Page){const rail=p.locator('#battle-action-rail');expect(await rail.evaluate(e=>e.scrollHeight<=e.clientHeight+1),'rail needs no scrolling').toBe(true);for(const b of await rail.locator('button:visible').all()){expect(await b.evaluate(n=>{const r=n.getBoundingClientRect(),a=n.closest('#battle-action-rail')!.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=a.top&&r.bottom<=a.bottom&&r.left>=a.left&&r.right<=a.right&&!!h&&(n===h||n.contains(h));}),'every visible rail button physically reachable').toBe(true);}}
async function shot(p:Page,info:TestInfo,name:string){await p.screenshot({path:info.outputPath(name+'.png')});}
function row(host:string,kind:string){return discoveries.find((r:any)=>r.source===(host==='reference'?'T39-legal-pending-raid.json':'geographic-raid-pending-one-human.json')&&r.kind===kind);}
for(const host of ['reference','geographic']){
 test(`${host}: sidebar-only rail places armies and starts combat directly without scrolling`,async({page},info)=>{
  await begin(page);const envelope=JSON.parse(input(`T71/fixtures/${host}-reinforcement.json`));envelope.options.seats=envelope.options.seats.map(()=>({kind:'human'}));envelope.options.computerStrengths=[];const text=JSON.stringify(envelope),before=deserializeVersionedMatch(text);await load(page,text);await hit(page,'toggle-sidebar');await railFits(page);let state=before.state;const owned=state.map.provinces.find(p=>state.ownerOf[p.id]===state.players[state.currentPlayer]!.id)!.id;while(state.reinforcementPool){await country(page,owned).click();state=next(state,{kind:'reinforce',province:owned,amount:1});}await expect(page.locator('#battle-action-rail #start-combat-button')).toBeVisible();await railFits(page);await hit(page,'start-combat-button');state=next(state,{kind:'endReinforcement'});await exact(page,state);await shot(page,info,host+'-sidebar-only-rail');
 });
 test(`${host}: collapsed battle commands, pause and details preserve exact actions and selection`,async({page},info)=>{
  await begin(page);const f=row(host,'attack-running'),text=input('issue180/preflight/fixtures/'+f.fixture),before=deserializeVersionedMatch(text);await load(page,text);await collapse(page);
  await country(page,f.action.from).click();await country(page,f.action.to).click({modifiers:['Shift']});await open(page,'actions');
  const source=await page.locator('#battle-source-name').textContent(),target=await page.locator('#battle-target-name').textContent();await page.locator('#battle-stop-threshold').fill('1');await page.locator('#battle-stop-threshold').press('Tab');
  await page.keyboard.press('Escape');await expect(page.locator('#open-game-actions')).toBeFocused();await open(page,'actions');await expect(page.locator('#battle-source-name')).toHaveText(source!);await expect(page.locator('#battle-target-name')).toHaveText(target!);await expect(page.locator('#battle-stop-threshold')).toHaveValue('1');
  await hit(page,'game-pause-button');await expect(page.locator('#single-exchange-button')).toBeDisabled();await page.locator('#single-exchange-button').evaluate(e=>(e as HTMLButtonElement).click());await exact(page,before.state);await hit(page,'game-pause-button');
  await open(page,'actions');await close(page);await hit(page,'toggle-topbar');await expect(page.locator('#battle-action-rail #fight-on-button')).toBeVisible();await railFits(page);await shot(page,info,host+'-sidebar-only-battle-rail');await hit(page,'fight-on-button');await page.locator('#stop-battle-button').focus();await page.keyboard.press('Enter');const after=next(before.state,f.action);await exact(page,after);
  await open(page,'actions');await hit(page,'single-exchange-button');await exact(page,next(after,f.action));
  await open(page,'details');const history=page.getByRole('list',{name:'Battle log',exact:true});await expect(history.locator('li')).toHaveCount(next(after,f.action).log.filter(e=>e.event!=='game_started').length);await history.evaluate(e=>{e.scrollTop=42;});const reading=await history.evaluate(e=>e.scrollTop);await close(page);await open(page,'settings');await page.locator('#game-speed').selectOption('very-slow');await close(page);await open(page,'details');expect(await history.evaluate(e=>e.scrollTop)).toBe(reading);await shot(page,info,host+'-details');
  await close(page);await hit(page,'game-log-button');await expect(page.getByRole('dialog',{name:'Game event log',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#game-log-button')).toBeFocused();await exact(page,next(after,f.action));
 });
 test(`${host}: collapsed capture retains quantity across surfaces, toggles and pause`,async({page},info)=>{
  await begin(page);const f=row(host,'capture'),text=input('issue180/preflight/fixtures/'+f.fixture),before=deserializeVersionedMatch(text);await load(page,text);await collapse(page);await hit(page,'open-required-action');
  const amount=before.state.pendingCapture!.max;await page.locator('#capture-amount').fill(String(amount));await close(page);await open(page,'cards');await close(page);await open(page,'actions');await expect(page.locator('#capture-amount')).toHaveValue(String(amount));
  await hit(page,'toggle-sidebar');await hit(page,'toggle-sidebar');await open(page,'actions');await expect(page.locator('#capture-amount')).toHaveValue(String(amount));await hit(page,'game-pause-button');await expect(page.locator('#confirm-capture-button')).toBeDisabled();await hit(page,'game-pause-button');await expect(page.locator('#capture-amount')).toHaveValue(String(amount));await shot(page,info,host+'-capture');await hit(page,'confirm-capture-button');await exact(page,next(before.state,{kind:'captureMove',amount}));
 });
 test(`${host}: collapsed friendly draft survives Escape and surface switches until confirmation`,async({page},info)=>{
  await begin(page);const envelope=JSON.parse(input(`T71/fixtures/${host}-friendly-movement.json`));envelope.options.seats=envelope.options.seats.map(()=>({kind:'human'}));envelope.options.computerStrengths=[];const text=JSON.stringify(envelope),before=deserializeVersionedMatch(text),discovery=JSON.parse(input('T71/fixtures/fixture-discovery.json')).results.find((r:any)=>r.host===host),action=discovery.found['friendly-movement'].action;
  await load(page,text);await collapse(page);await open(page,'actions');await hit(page,'start-friendly-move-button');await close(page);await country(page,action.from).click();await country(page,action.to).click();await open(page,'actions');await page.locator('#friendly-move-amount').fill('1');await page.keyboard.press('Escape');await expect(page.locator('#open-game-actions')).toBeFocused();await open(page,'settings');await close(page);await open(page,'actions');await expect(page.locator('#friendly-move-amount')).toHaveValue('1');await shot(page,info,host+'-friendly');await hit(page,'confirm-friendly-move-button');await exact(page,next(before.state,{...action,amount:1}));
 });
 test(`${host}: collapsed card trade and nonmodal Raid use ordinary core actions`,async({page},info)=>{
  await begin(page);const trade=host==='reference'?'T38-legal-Surge-before.json':'geographic-income-before-one-human.json',before=deserializeVersionedMatch(input('T40/fixtures/'+trade));await load(page,input('T40/fixtures/'+trade));await collapse(page);await hit(page,'open-required-action');await page.getByRole('button',{name:/^Surge:/}).click();await exact(page,next(before.state,{kind:'tradeCards',handIndices:[0,1,4]}));
  const raid=host==='reference'?'T39-legal-pending-raid.json':'geographic-raid-pending-one-human.json',pending=deserializeVersionedMatch(input('T40/fixtures/'+raid));await load(page,input('T40/fixtures/'+raid));await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded','false');await expect(page.locator('#toggle-topbar')).toHaveAttribute('aria-expanded','false');await open(page,'cards');await expect(page.locator('#game-focus-drawer')).toHaveAttribute('aria-modal','false');await close(page);await country(page,'province_41').click();await open(page,'cards');await expect(page.getByRole('button',{name:'Confirm raid',exact:true})).toBeEnabled();await hit(page,'game-pause-button');await expect(page.getByRole('button',{name:'Confirm raid',exact:true})).toBeDisabled();await hit(page,'game-pause-button');await shot(page,info,host+'-raid');await page.getByRole('button',{name:'Confirm raid',exact:true}).click();await exact(page,next(pending.state,{kind:'raidTarget',province:'province_41'}));
 });
}
test('collapsed full-hand discard, reward, skip and replacement retain reachable choices and clean surfaces',async({page},info)=>{
 await begin(page);const text=input('T40/fixtures/T37-reshuffle-before-match.json'),before=deserializeVersionedMatch(text),hand=before.state.cards!.hands[before.state.players.find(p=>p.kind==='human')!.id]!;await load(page,text);await collapse(page);await hit(page,'open-required-action');await expect(page.getByRole('button',{name:/^Discard .*\(card /})).toHaveCount(5);await page.getByRole('button',{name:`Discard ${hand[2]} (card 3)`,exact:true}).click();const after=next(before.state,{kind:'discardCard',handIndex:2});await exact(page,after);await hit(page,'open-required-action');await shot(page,info,'discard-reward');await page.getByRole('button',{name:'Continue',exact:true}).click();await exact(page,after);
 const replacement=input('T40/fixtures/T38-legal-Surge-before.json'),fresh=deserializeVersionedMatch(replacement);await load(page,replacement);await expect(page.locator('#game-focus-drawer')).toBeHidden();await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded','false');await hit(page,'open-required-action');await page.getByRole('button',{name:'Skip cards',exact:true}).click();await exact(page,next(fresh.state,{kind:'skipCards'}));
 await open(page,'settings');await page.getByRole('button',{name:'New game',exact:true}).click();await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();await expect(page.locator('#game-focus-drawer')).toHaveCount(0);
});

test('collapsed human-loss and finished choices keep core results reachable',async({page},info)=>{
 await begin(page);const text=input('T40/fixtures/T40-human-loss-450.json'),before=deserializeVersionedMatch(text);expect(before.state.phase).toBe('human-loss');await load(page,text);await collapse(page);await hit(page,'open-required-action');await hit(page,'watch-computers-button');await exact(page,next(before.state,{kind:'watchComputers'}));await load(page,text);await hit(page,'open-required-action');await hit(page,'stop-game-button');await exact(page,next(before.state,{kind:'stopGame'}));await hit(page,'open-required-action');await shot(page,info,'finished-result');await close(page);await open(page,'settings');await page.getByRole('button',{name:'New game',exact:true}).click();await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded','false');await expect(page.locator('#toggle-topbar')).toHaveAttribute('aria-expanded','false');
});
