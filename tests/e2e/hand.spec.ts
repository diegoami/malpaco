// T104 (owner, 2026-10-22): "I do not have a way to see my cards". A corner button carries your hand
// count and opens the list; after a draw the reward card shows your whole hand, the new card marked;
// a set is played from the list at the start of your turn. Every check is against the engine.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {classifyCardSet} from '../../src/core/cards';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';

const ROOT='malpaco:current-game';
const SIZES=[{width:390,height:844},{width:1280,height:800}];
const kept=async(p:Page)=>deserializeVersionedMatch((await p.evaluate(k=>localStorage.getItem(k),ROOT))!).state;
const same=(s:GameState)=>({history:s.history,rng:s.rng,armies:s.armies,ownerOf:s.ownerOf,phase:s.phase,pool:s.reinforcementPool,cards:s.cards});
const human=(s:GameState)=>activePlayer(s)?.kind==='human';
const hand=(s:GameState)=>s.cards?.hands[s.players.find(p=>p.kind==='human')!.id]??[];
const hasSet=(s:GameState)=>{const h=hand(s);for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++)if(classifyCardSet([h[i]!,h[j]!,h[k]!]))return true;return false;};

/** The engine plays every seat (the human too) on the player's options, stopping where `stop` says. */
function played(stop:(s:GameState)=>boolean,limit=1500){
 for(let seed=1;seed<300;seed++){
  const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
  const game=createGeographicGame(options,raidCardsRules(options),{},2);if(!game.ok)continue;
  let s=game.state;
  for(let n=0;n<limit&&!s.result&&!stop(s);n++){const r=apply(s,decideComputerAction(computerView(s))!);if(!r.ok)throw Error(r.error);s=r.state;}
  if(stop(s))return {state:s,text:serializeVersionedMatch(options,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY)};
 }
 throw Error('no such state');
}
async function opened(p:Page,text:string,size:{width:number;height:number}){
 await p.setViewportSize(size);
 await p.addInitScript(([k,v])=>{if(!sessionStorage.getItem('t104'))sessionStorage.setItem('t104','1'),localStorage.setItem(k!,v!);},[ROOT,text]);
 await p.goto('/');await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);
}

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','sizes are set per test');});

for(const size of SIZES){
 test(`${size.width}x${size.height}: the Cards button shows your hand count and opens your cards, which close by ×, Escape and a second tap`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&hand(s).length>=2);
  await opened(page,text,size);
  const button=page.locator('#open-hand'),dialog=page.locator('#hand-dialog'),cards=hand(state);
  await expect(button).toBeVisible();await expect(button.locator('.hand-count')).toHaveText(String(cards.length));
  await expect(button).toHaveAttribute('aria-label',`Your cards: ${cards.length}`);
  await button.click();await expect(dialog).toBeVisible();
  await expect(dialog.locator('#hand-list li')).toHaveText([...cards]);
  await page.locator('#close-hand').click();await expect(dialog).toBeHidden();
  await button.click();await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
  await button.click();await expect(dialog).toBeVisible();await button.click();await expect(dialog).toBeHidden();
  // Looking changes nothing; no other seat's cards are listed anywhere.
  expect(same(await kept(page))).toEqual(same(state));
  await expect(page.locator('.hand-list li')).toHaveCount(cards.length);
 });

 test(`${size.width}x${size.height}: no cards, no button; and none during a computer turn`,async({page})=>{
  const {text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&hand(s).length===0);
  await opened(page,text,size);
  await expect(page.locator('#open-hand')).toBeHidden();
  const {text:later}=played(s=>!human(s)&&s.phase==='attack'&&hand(s).length>0);
  const other=await page.context().newPage();await opened(other,later,size);
  await expect(other.locator('#open-hand')).toBeHidden();
 });

 test(`${size.width}x${size.height}: after a draw, the reward card lists your whole hand with the new card marked`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='attack'&&!s.pendingCapture&&s.capturedThisTurn&&hand(s).length<4&&!s.cards?.pendingDiscard);
  await opened(page,text,size);
  await page.locator('#end-turn-button').click();
  const drawn=apply(state,{kind:'endTurn'});if(!drawn.ok)throw Error(drawn.error);
  const after=hand(drawn.state),list=page.locator('#reward-hand li');
  await expect(list).toHaveText(after.map((kind,i)=>i===after.length-1?`${kind} · new`:kind));
  await expect(list.nth(after.length-1)).toHaveAttribute('data-new','true');
  await expect(page.getByRole('button',{name:'Continue'})).toBeVisible();
 });

 test(`${size.width}x${size.height}: a set is played from your cards at the start of your turn`,async({page})=>{
  const {state,text}=played(s=>human(s)&&s.phase==='cards'&&hasSet(s),4000);
  await opened(page,text,size);
  await page.locator('#open-hand').click();
  const play=page.locator('#hand-dialog .hand-plays button').first();await expect(play).toBeVisible();
  const before=await kept(page);expect(same(before)).toEqual(same(state));
  await play.click();await expect(page.locator('#hand-dialog')).toBeHidden();
  await expect.poll(async()=>(await kept(page)).history.length).toBe(state.history.length+1);
  const traded=(await kept(page)).history.at(-1)!;expect(traded.kind).toBe('tradeCards');
  const oracle=apply(state,traded);if(!oracle.ok)throw Error(oracle.error);
  expect(same(await kept(page))).toEqual(same(oracle.state));
 });
}
