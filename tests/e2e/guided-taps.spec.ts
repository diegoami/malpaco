// T103 (owner, 2026-10-22): beside the country you select, Fight when it can attack (live once a
// target is chosen), else Move when it can move armies, else nothing; a tap never acts by itself.
// Placing the last army starts combat by itself. When the player pauses with no input on their own
// turn, a pulsing arrow points at Fight or Confirm.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,attackTargets,defaultOptions,friendlySources,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {HESITATION_DELAY} from '../../src/ui/hesitationHint';

const ROOT='malpaco:current-game';
const SIZES=[{width:390,height:844},{width:1280,height:800}];
const hint=(p:Page)=>p.locator('.hesitation-hint');
const kept=async(p:Page)=>deserializeVersionedMatch((await p.evaluate(k=>localStorage.getItem(k),ROOT))!).state;
const same=(s:GameState)=>({history:s.history,rng:s.rng,armies:s.armies,ownerOf:s.ownerOf,phase:s.phase,pool:s.reinforcementPool,pendingCapture:s.pendingCapture});

/** The engine plays every seat (the human too) on the player's options, stopping where `stop` says. */
function played(stop:(s:GameState)=>boolean){
 for(let seed=1;seed<200;seed++){
  const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
  const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)continue;
  let s=game.state;
  for(let n=0;n<400&&!s.result&&!stop(s);n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;}
  if(stop(s))return {state:s,text:serializeVersionedMatch(options,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
 }
 throw Error('no such state');
}
const human=(s:GameState)=>activePlayer(s)?.kind==='human';
const mine=(s:GameState)=>s.map.provinces.map(p=>p.id).filter(id=>s.ownerOf[id]===activePlayer(s)!.id);
/** Opens the root page on a kept match, with the page clock under the test's control. */
async function opened(p:Page,text:string,size:{width:number;height:number}){
 await p.setViewportSize(size);await p.clock.install();
 await p.addInitScript(([k,v])=>{if(!sessionStorage.getItem('t103'))sessionStorage.setItem('t103','1'),localStorage.setItem(k!,v!);},[ROOT,text]);
 await p.goto('/');await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);
}
/** Waits out the hesitation delay on the page clock, with no input. */
const hesitate=(p:Page)=>p.clock.runFor(HESITATION_DELAY+200);

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','sizes are set per test');});

for(const size of SIZES){
 test(`${size.width}x${size.height}: Fight or Move appears beside the selected country, and only its press acts`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&(()=>{const m=mine(s),f=friendlySources(s);
   return m.some(id=>attackTargets(s,id).length>0)&&m.some(id=>!attackTargets(s,id).length&&f.includes(id))&&m.some(id=>!attackTargets(s,id).length&&!f.includes(id));})());
  await opened(page,text,size);const m=mine(state),f=friendlySources(state);
  const attacker=m.find(id=>attackTargets(state,id).length>0)!,mover=m.find(id=>!attackTargets(state,id).length&&f.includes(id))!,idle=m.find(id=>!attackTargets(state,id).length&&!f.includes(id))!;
  const country=(id:string)=>page.locator(`[data-country="${id}"]`),action=page.locator('#province-action-button');
  /** The action sits beside the country's count: its nearest edge within a few pixels of the badge. */
  const beside=async(id:string)=>{const a=(await action.boundingBox())!,c=(await country(id).locator('.count').boundingBox())!;
   const dx=Math.max(c.x-(a.x+a.width),a.x-(c.x+c.width),0),dy=Math.max(c.y-(a.y+a.height),a.y-(c.y+c.height),0);expect(Math.hypot(dx,dy)).toBeLessThan(24);};
  await expect(action).toBeHidden();
  // A country with neither: selected, nothing beside it.
  await country(idle).click();await expect(country(idle)).toHaveAttribute('data-selected','true');await expect(action).toBeHidden();
  // A country with only a move: Move beside it; the tap alone did nothing.
  await country(mover).click();await expect(country(mover)).toHaveAttribute('data-selected','true');
  await expect(action).toBeVisible();await expect(action).toHaveAttribute('data-kind','move');await beside(mover);
  await expect(page.locator('#cancel-friendly-move-button')).toBeHidden();expect(same(await kept(page))).toEqual(same(state));
  await action.click();await expect(page.locator('#cancel-friendly-move-button')).toBeVisible();await expect(country(mover)).toHaveAttribute('data-selected','true');
  await expect(action).toBeHidden();expect(same(await kept(page))).toEqual(same(state));
  await page.locator('#cancel-friendly-move-button').click();await expect(page.locator('#cancel-friendly-move-button')).toBeHidden();
  // A country with an attack: Fight beside it, off until a target is chosen, then one press is one exchange.
  await country(attacker).click();await expect(action).toHaveAttribute('data-kind','fight');await expect(action).toBeDisabled();await beside(attacker);
  const target=attackTargets(state,attacker)[0]!;await country(target).click();await expect(action).toBeEnabled();
  expect(same(await kept(page))).toEqual(same(state));
  await action.click();
  const expected=apply(state,{kind:'attack',from:attacker,to:target});if(!expected.ok)throw Error(expected.error);
  await expect.poll(async()=>(await kept(page)).history.length).toBe(expected.state.history.length);
  expect(same(await kept(page))).toEqual(same(expected.state));
  // The corner controls stay where they are.
  await expect(page.locator('#start-friendly-move-button')).toBeVisible();
 });

 test(`${size.width}x${size.height}: the last army starts combat; the hint points at Fight after a pause, and hides on input, pause and computer turns`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='reinforce'&&s.reinforcementPool>0&&s.reinforcementPool<=3&&mine(s).some(id=>attackTargets({...s,phase:'attack'},id).length>0));
  await opened(page,text,size);
  // While armies remain to place, nothing is suggested.
  await hesitate(page);await expect(hint(page)).toBeHidden();
  const me=mine(state),from=me.find(id=>attackTargets({...state,phase:'attack'},id).length>0)!;
  for(let n=0;n<state.reinforcementPool;n++)await page.locator(`[data-country="${from}"]`).click();
  // The last army placed starts combat by itself, as if Start combat were pressed (one engine action).
  await expect.poll(async()=>(await kept(page)).phase).toBe('attack');
  const placed=await kept(page);expect(placed.reinforcementPool).toBe(0);expect(placed.history.at(-1)).toEqual({kind:'endReinforcement'});
  await expect(page.locator('#start-combat-button')).toHaveCount(0);
  const s=await kept(page),to=attackTargets(s,from)[0]!;
  await page.locator(`[data-country="${from}"]`).click();await page.locator(`[data-country="${to}"]`).click();
  await expect(page.locator('#single-exchange-button')).toBeVisible();
  await hesitate(page);await expect(hint(page)).toBeVisible();await expect(hint(page)).toHaveAttribute('data-for','single-exchange-button');
  await page.keyboard.press('Shift');await expect(hint(page)).toBeHidden();
  // Paused: never.
  await page.locator('#game-pause-button').click();await hesitate(page);await expect(hint(page)).toBeHidden();
  await page.locator('#game-pause-button').click();
  // A computer turn: never.
  await page.locator('#cancel-battle-button').click();await page.locator('#end-turn-button').click();
  await expect.poll(async()=>human(await kept(page))).toBe(false);
  await hesitate(page);await expect(hint(page)).toBeHidden();
 });

 test(`${size.width}x${size.height}: the hint points at Confirm while a capture waits`,async({page})=>{
  const {text}=played(s=>human(s)&&!!s.pendingCapture);
  await opened(page,text,size);
  await expect(page.locator('#confirm-capture-button')).toBeVisible();await expect(hint(page)).toBeHidden();
  await hesitate(page);await expect(hint(page)).toBeVisible();await expect(hint(page)).toHaveAttribute('data-for','confirm-capture-button');
  // The arrow sits beside the control and never covers it.
  const arrow=(await hint(page).boundingBox())!,button=(await page.locator('#confirm-capture-button').boundingBox())!;
  expect(arrow.x+arrow.width<=button.x+1||arrow.y+arrow.height<=button.y+1||arrow.y>=button.y+button.height-1).toBe(true);
  await page.locator('#capture-more-button').click();await expect(hint(page)).toBeHidden();
 });
}
