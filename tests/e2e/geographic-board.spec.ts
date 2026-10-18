// UNEXECUTED DRAFT. Requires the mounted service/render seams in integration-contract.md.
// Node imports also work when the browser serves the extracted playable artifact.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {activePlayer,apply,attackTargets} from '../../src/core';
import type {Action,GameOptions,GameState} from '../../src/core';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {GEOGRAPHIC_MATCH_IDENTITY,REFERENCE_MATCH_IDENTITY,deserializeVersionedMatch} from '../../src/core/match-save';
import {pinned} from '../core/versioned-match-fixture';
import frozenCorpus from '../../docs/prototypes/new-game/T36/corpus-selection.json' with {type:'json'};
import layoutSupplement from '../../docs/prototypes/new-game/T36/corpus-supplement.json' with {type:'json'};
import {seatLook} from '../../src/ui/palette';

type Corpus={measured:boolean;targetMet:boolean;sourceHashes:Record<string,string>;selection:{seed:number;purpose:string;mapHash:string}[];refusalSeeds:{seed:number;refusalClasses:string[]}[]};
// Optional preflight override ONLY. Bare CI uses the committed measured fixture.
const corpus:Corpus=process.env['GEOGRAPHIC_CORPUS_FILE']?JSON.parse(readFileSync(process.env['GEOGRAPHIC_CORPUS_FILE'],'utf8')):frozenCorpus;
const visualSelection=[...corpus.selection,...layoutSupplement.selection];
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const optionsFor=(seed:number):GameOptions=>({...defaultOptions(),seed,seats:[{kind:'human'},{kind:'human'}],computerStrengths:[]});
function expected(seed:number){const options=optionsFor(seed),r=createGeographicGame(options);if(!r.ok)throw Error(r.errors.join('; '));return {options,...r};}
const country=(p:Page,id:string)=>p.locator(`#geographic-map [data-country="${id}"]`);
const numbers=(s:string)=>[...s.matchAll(/-?(?:\d+\.?\d*|\.\d+)/g)].map(m=>Number(m[0]));
async function setup(p:Page,seed=1994){await p.goto(`/?seed=${seed}&control=manual`);await expect(p.getByRole('button',{name:'Start game',exact:true})).toBeVisible();}
async function start(p:Page,seed:number){await setup(p,seed);await p.getByLabel('Seats',{exact:true}).selectOption('2');for(let n=1;n<=2;n++)await p.getByLabel(`Seat ${n} control`,{exact:true}).selectOption('human');await p.getByRole('button',{name:'Start game',exact:true}).click();await expect(p.locator('#geographic-map')).toBeVisible();}
async function save(p:Page){const pending=p.waitForEvent('download');await p.getByRole('button',{name:'Save game',exact:true}).click();return readFileSync((await(await pending).path())!,'utf8');}
async function upload(p:Page,text:string,success=true){const old=await p.getByLabel('Load game',{exact:true}).elementHandle();await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'resume.json',mimeType:'application/json',buffer:Buffer.from(text)});if(success)await expect.poll(()=>old!.evaluate(n=>n.isConnected)).toBe(false);}
function step(state:GameState,action:Action){const r=apply(state,action);if(!r.ok)throw Error(r.error);return r.state;}
async function check(p:Page,state:GameState){expect(deserializeVersionedMatch(await save(p)).state).toEqual(state);expect(await p.locator('#geographic-map [data-country]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.getAttribute('data-country'),[n.getAttribute('data-owner'),Number(n.getAttribute('data-armies'))]])))).toEqual(Object.fromEntries(state.map.provinces.map(v=>[v.id,[state.ownerOf[v.id],state.armies[v.id]]])));}
async function drawing(p:Page){return p.locator('#geographic-map').evaluate(svg=>({
 countries:[...svg.querySelectorAll<SVGGElement>('[data-country]')].map(g=>({id:g.dataset['country'],d:g.querySelector('.cell')!.getAttribute('d'),x:Number(g.querySelector('.count')!.getAttribute('x')),y:Number(g.querySelector('.count')!.getAttribute('y'))})),
 routes:[...svg.querySelectorAll('.lane')].map(n=>({edge:n.getAttribute('data-edge'),points:n.getAttribute('points')})),
 coasts:[...svg.querySelectorAll('.coast')].map(n=>n.getAttribute('d')),
}));}
async function labels(p:Page){return p.locator('#geographic-map [data-country]').evaluateAll(nodes=>nodes.map(n=>{
 const cell=n.querySelector<SVGGeometryElement>('.cell')!,count=n.querySelector<SVGTextElement>('.count')!,badge=n.querySelector<SVGGeometryElement>('.badge')!;
 const painted=(node:Element)=>{for(let current:Element|null=node;current;current=current.parentElement){const style=getComputedStyle(current);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;}return true;};
 const cellStyle=getComputedStyle(cell);
 const box=count.getBoundingClientRect(),b=badge.getBoundingClientRect(),ctm=cell.getScreenCTM()!,textStyle=getComputedStyle(count),badgeStyle=getComputedStyle(badge);
 const anchor=new DOMPoint(Number(count.getAttribute('x')),Number(count.getAttribute('y'))-5).matrixTransform(count.getScreenCTM()!);
 const hit40=[[-20,-20],[20,-20],[-20,20],[20,20],[0,0]].every(([dx,dy])=>document.elementFromPoint(anchor.x+dx!,anchor.y+dy!)?.closest('[data-country]')===n);
 const corners=[[box.left,box.top],[box.right,box.top],[box.left,box.bottom],[box.right,box.bottom]];
 return {id:n.getAttribute('data-country'),text:count.textContent,owner:n.getAttribute('data-owner'),armies:n.getAttribute('data-armies'),name:n.getAttribute('aria-label'),badge:badge.getAttribute('d'),fill:getComputedStyle(cell).fill,
  cellVisible:painted(cell)&&cell.getTotalLength()>0&&cellStyle.fill!=='none'&&Number(cellStyle.fillOpacity)>0,
  visible:painted(count)&&count.getClientRects().length>0&&textStyle.visibility!=='hidden'&&textStyle.display!=='none'&&Number(textStyle.opacity)>0&&Number(textStyle.fillOpacity)>0,
  badgeVisible:painted(badge)&&badge.getTotalLength()>0&&badgeStyle.fill!=='none'&&Number(badgeStyle.opacity)>0&&Number(badgeStyle.fillOpacity)>0,
  countColor:textStyle.fill,badgeColor:badgeStyle.fill,font:parseFloat(textStyle.fontSize)*Math.hypot(count.getScreenCTM()!.a,count.getScreenCTM()!.b),
  box:{x:box.left,y:box.top,right:box.right,bottom:box.bottom},inBadge:box.left>=b.left&&box.right<=b.right&&box.top>=b.top&&box.bottom<=b.bottom,
  hit40,inViewport:box.left>=0&&box.top>=0&&box.right<=innerWidth&&box.bottom<=innerHeight,contained:corners.every(([x,y])=>cell.isPointInFill(new DOMPoint(x,y).matrixTransform(ctm.inverse()))),
 };
}));}
function luminance(s:string){const rgb=numbers(s);expect(rgb.length).toBeGreaterThanOrEqual(3);const c=rgb.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]!*.2126+c[1]!*.7152+c[2]!*.0722;}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

test('measured corpus fixture is frozen and reproducible',()=>{
 expect(corpus.targetMet).toBe(true);expect(corpus.measured,'freeze requires the real retained sweep, never invented rows').toBe(true);
 expect(corpus.selection).toHaveLength(5);expect(new Set(corpus.selection.map(r=>r.seed)).size).toBe(5);expect(corpus.selection.map(r=>r.seed)).toContain(1994);expect(Object.keys(corpus.sourceHashes).length).toBeGreaterThan(0);
 expect(layoutSupplement.measured).toBe(true);expect(layoutSupplement.selection.map(r=>r.seed)).toEqual([6]);expect(new Set(visualSelection.map(r=>r.seed)).size).toBe(6);
 const shapes:string[]=[];for(const row of visualSelection){const game=expected(row.seed);expect(hash(game.state.map)).toBe(row.mapHash);shapes.push(hash({provinces:game.state.map.provinces.map(p=>({polygon:p.polygon,labelAt:p.labelAt})),coasts:game.geography.islands.map(i=>i.polygon),routes:game.geography.entranceReservations.map(r=>r.points)}));
  const largest=game.state.map.islands.reduce((a,b)=>a.provinces.length>b.provinces.length?a:b),island=game.geography.islands.find(i=>i.id===largest.id)!,center=island.polygon.reduce((sum,p)=>sum+p[1],0)/island.polygon.length/game.geography.unitsPerPixel,diagnostic=layoutSupplement.layoutDiagnostics.find(r=>r.seed===row.seed)!;expect(center).toBeCloseTo(diagnostic.meanVertexCenterYCss,7);
 }expect(new Set(shapes).size).toBeGreaterThan(1);expect(new Set(layoutSupplement.layoutDiagnostics.map(r=>r.family))).toEqual(new Set(['top','middle','bottom']));
});
test('root and unknown view retain the established setup and playback controls',async({page})=>{
 for(const url of ['/','/?view=unknown&seed=1994']){
  await page.goto(url);await expect(page.getByLabel('Seats',{exact:true})).toHaveValue('4');
  for(let n=1;n<=4;n++)await expect(page.getByLabel(`Seat ${n} control`,{exact:true})).toHaveValue(n===1?'human':'computer');
  await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();await expect(page.locator('#reference-map')).toHaveCount(0);
  await expect(page.locator('#game-pause-button')).toBeVisible();await expect(page.locator('#game-speed')).toBeVisible();await expect(page.locator('#game-log-button')).toBeVisible();await expect(page.locator('[data-testid="player-army-total"]')).toHaveCount(4);
 }
});
for(const item of visualSelection)test(`seed ${item.seed} paints actual geography and contained legible army labels`,async({page},info)=>{
 expect(corpus.measured).toBe(true);expect(layoutSupplement.measured).toBe(true);
  const game=expected(item.seed);expect(hash(game.state.map)).toBe(item.mapHash);await start(page,item.seed);await page.mouse.move(0,0);
  const actual=await drawing(page),q=game.geography.unitsPerPixel;expect(actual.countries).toHaveLength(46);
  for(const v of game.state.map.provinces){const row=actual.countries.find(r=>r.id===v.id)!;expect(numbers(row.d!)).toEqual(v.polygon.flatMap(pt=>pt.map(n=>n/q)));expect(row.x).toBeCloseTo(v.labelAt[0]/q,5);expect(row.y-5).toBeCloseTo(v.labelAt[1]/q,5);}
  const paint=await page.locator('#geographic-map .lane,#geographic-map .coast').evaluateAll(ns=>ns.map(n=>{const style=getComputedStyle(n),r=n.getBoundingClientRect();return {visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0,stroke:style.stroke,strokeOpacity:Number(style.strokeOpacity),length:(n as SVGGeometryElement).getTotalLength(),fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};}));for(const row of paint){expect(row.visible).toBe(true);expect(row.stroke).not.toBe('none');expect(row.strokeOpacity).toBeGreaterThan(0);expect(row.length).toBeGreaterThan(0);expect(row.fits).toBe(true);}
  expect(actual.coasts.map(d=>numbers(d!))).toEqual(game.geography.islands.map(i=>i.polygon.flatMap(pt=>pt.map(n=>n/q))));
  const edges=new Set(game.state.map.provinces.flatMap(v=>v.seaLanes.map(id=>[v.id,id].sort().join('|'))));expect(actual.routes).toHaveLength(edges.size);expect(new Set(actual.routes.map(r=>r.edge))).toEqual(edges);
  for(const r of game.geography.entranceReservations)expect(numbers(actual.routes.find(a=>a.edge===[r.from,r.to].sort().join('|'))!.points!)).toEqual(r.points.flatMap(pt=>pt.map(n=>n/q)));
  const rows=await labels(page);for(const row of rows){const seat=game.state.players.findIndex(p=>p.id===row.owner);expect(row.text).toBe(String(game.state.armies[row.id!]));expect(row.armies).toBe(row.text);expect(row.badge).toBe(seatLook(seat).badge);expect(row.name).toContain(game.state.map.provinces.find(p=>p.id===row.id)!.name);expect(row.cellVisible,`${row.id} visible ownership fill`).toBe(true);expect(row.visible).toBe(true);expect(row.badgeVisible).toBe(true);expect(row.inBadge,`${row.id} count fits marker`).toBe(true);expect(row.contained,`${row.id} count inside country`).toBe(true);expect(row.font).toBeGreaterThanOrEqual(14);expect(contrast(row.countColor,row.badgeColor)).toBeGreaterThanOrEqual(4.5);expect(numbers(row.fill).slice(0,3)).toEqual(seatLook(seat).color.slice(1).match(/.{2}/g)!.map(x=>parseInt(x,16)));expect(row.hit40,`${row.id} 40px actual input square`).toBe(true);expect(row.inViewport).toBe(true);}
  for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){const u=rows[a]!.box,v=rows[b]!.box;expect(u.right<=v.x||v.right<=u.x||u.bottom<=v.y||v.bottom<=u.y).toBe(true);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // Names are available through the established accessible/hover/focus treatment;
  // no always-visible name hierarchy is imposed on the owner's army-first design.
  const first=country(page,game.state.map.provinces[0]!.id);await first.hover();await expect(first.locator('.name')).toBeVisible();await first.focus();await expect(first.locator('.name')).toBeVisible();await page.mouse.move(0,0);await page.locator('#game-log-button').focus();
  const out=process.env['GEOGRAPHIC_EVIDENCE_DIR']??'screenshots';mkdirSync(out,{recursive:true});await page.screenshot({path:join(out,`geographic-${item.seed}-${info.project.name}.png`)});
  await page.reload();await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();expect(await drawing(page)).toEqual(actual);
});
// Each edge kind starts fresh so one real exchange cannot invalidate the other case.
for(const kind of ['borders','seaLanes'] as const)test(`painted ${kind} use the core's exact legal targets and exchange`,async({page})=>{
 const game=expected(1994);let state=game.state;const player=activePlayer(state)!;
 const source=state.map.provinces.find(p=>state.ownerOf[p.id]===player.id&&p[kind].some(id=>state.ownerOf[id]!==player.id));if(!source)throw Error(`1994 lacks enemy ${kind}; select a measured corpus seed before freeze`);
 await start(page,1994);while(state.reinforcementPool>0){await country(page,source.id).click();state=step(state,{kind:'reinforce',province:source.id,amount:1});}await page.locator('#start-combat-button').click();state=step(state,{kind:'endReinforcement'});await check(page,state);
 await country(page,source.id).click();const legal=attackTargets(state,source.id).sort();expect(await page.locator('#geographic-map [data-target="true"]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-country')).sort())).toEqual(legal);
 const target=source[kind].find(id=>legal.includes(id));if(!target)throw Error('edge must be legal');
 if(kind==='seaLanes')await expect(page.locator(`#geographic-map .lane[data-edge="${[source.id,target].sort().join('|')}"]`)).toHaveClass(/active/);
 const outsider=state.map.provinces.find(p=>state.ownerOf[p.id]!==player.id&&!legal.includes(p.id));if(!outsider)throw Error('need enemy non-neighbour');await country(page,outsider.id).click();await check(page,state);await expect(page.locator('#battle-status')).not.toBeEmpty();
 await country(page,target).click({modifiers:['Shift']});await check(page,state);await expect(page.locator('#battle-source-name')).toHaveText(source.name);await expect(page.locator('#battle-target-name')).toHaveText(state.map.provinces.find(p=>p.id===target)!.name);
 await country(page,target).click();state=step(state,{kind:'attack',from:source.id,to:target});await check(page,state);
 // Loaded history must reconstruct every action in order with exact country deltas.
 const replay=await save(page);await setup(page);await upload(page,replay);await expect(page.locator('#geographic-map')).toBeVisible();await page.locator('#game-log-button').click();const rows=page.getByRole('dialog',{name:'Game event log'}).locator('[data-event-index]');await expect(rows).toHaveCount(state.history.length+1);let previous=game.state;for(let i=0;i<state.history.length;i++){const next=step(previous,state.history[i]!);const row=rows.nth(i+1);await expect(row).toHaveAttribute('data-event-index',String(i+1));await expect(row).toContainText(`Action ${i+1}`);for(const v of state.map.provinces){const a=previous.armies[v.id]!,b=next.armies[v.id]!;if(a!==b||previous.ownerOf[v.id]!==next.ownerOf[v.id])await expect(row.locator(`[data-region="${v.id}"]`)).toContainText(`${a} → ${b} (${b-a>=0?'+':''}${b-a})`);}previous=next;}expect(previous).toEqual(state);
});
test('geographic replay and reference identity dispatch preserve state, history and pause',async({page})=>{
 await start(page,1994);const game=expected(1994),own=game.state.map.provinces.find(p=>game.state.ownerOf[p.id]===activePlayer(game.state)!.id)!;
 await country(page,own.id).click();const state=step(game.state,{kind:'reinforce',province:own.id,amount:1}),text=await save(page);expect(deserializeVersionedMatch(text).identity).toEqual(GEOGRAPHIC_MATCH_IDENTITY);await check(page,state);const before=await drawing(page);
 await setup(page);await upload(page,text);await expect(page.locator('#geographic-map')).toBeVisible();await check(page,state);expect(await drawing(page)).toEqual(before);
 for(const player of state.players){const total=state.map.provinces.filter(p=>state.ownerOf[p.id]===player.id).reduce((n,p)=>n+state.armies[p.id]!,0);await expect(page.locator(`[data-player="${player.id}"] [data-testid="player-army-total"]`)).toHaveText(`Total armies: ${total}`);}
 await page.locator('#game-pause-button').click();const frozen=await save(page);await country(page,own.id).focus();await page.keyboard.press('Enter');expect(await save(page)).toBe(frozen);await page.locator('#game-log-button').click();const rows=page.getByRole('dialog',{name:'Game event log'}).locator('[data-event-index]');await expect(rows).toHaveCount(2);await expect(rows.last()).toContainText(`Unplaced armies: ${game.state.reinforcementPool} → ${state.reinforcementPool}`);await page.keyboard.press('Escape');await page.locator('#game-pause-button').click();
 await country(page,own.id).click();await check(page,step(state,{kind:'reinforce',province:own.id,amount:1}));
 const bad=JSON.parse(text);bad.boardGenerator.version=99;const stable=await save(page),url=page.url();await upload(page,JSON.stringify(bad),false);await expect(page.getByRole('alert')).toContainText(/Load failed/i);expect(await save(page)).toBe(stable);expect(page.url()).toBe(url);expect(await drawing(page)).toEqual(before);
 const fixture=pinned('placement');await upload(page,fixture.text);await expect(page.locator('#reference-map')).toBeVisible();await expect(page.locator('#geographic-map')).toHaveCount(0);const refText=await save(page),ref=deserializeVersionedMatch(refText);expect(ref.identity).toEqual(REFERENCE_MATCH_IDENTITY);expect(ref.state.history).toEqual(fixture.actions);await setup(page);await upload(page,refText);await expect(page.locator('#reference-map')).toBeVisible();expect(deserializeVersionedMatch(await save(page)).state).toEqual(ref.state);
});
test('invalid seed stays in setup and recovers',async({page})=>{
 await setup(page);await page.getByLabel('Seed',{exact:true}).fill('-1');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toHaveCount(0);expect(await page.getByLabel('Seed',{exact:true}).evaluate(n=>(n as HTMLInputElement).validity.valid)).toBe(false);await page.getByLabel('Seed',{exact:true}).fill('1994');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();
});
// Register only actual measured refusals, with NO test.skip. Zero measured refusals
// is stated in the fixture; typed refusal/retry remains mandatory in UI unit coverage.
for(const refusal of corpus.refusalSeeds.slice(0,1))test(`real measured refusal ${refusal.seed} recovers`,async({page})=>{
 await setup(page,refusal.seed);await page.getByRole('button',{name:'Start game',exact:true}).click();const feedback=page.locator('#geographic-setup form > [role="alert"]');await expect(feedback).toBeVisible();await expect(feedback).toContainText(/another seed/i);await expect(page.locator('#geographic-map')).toHaveCount(0);await page.getByLabel('Seed',{exact:true}).fill('1994');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();
});

test('geographic computer playback pauses and cancels stale work on load',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();
 let state=deserializeVersionedMatch(await save(page)).state;
 for(let n=0;n<50&&(activePlayer(state)!.kind!=='computer'||state.phase!=='attack');n++){
  if(activePlayer(state)!.kind==='human'){
   if(state.phase==='reinforce'){const own=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id)!;while(state.reinforcementPool>0){await country(page,own.id).click();state=step(state,{kind:'reinforce',province:own.id,amount:1});}await page.locator('#start-combat-button').click();state=step(state,{kind:'endReinforcement'});}
   if(state.phase==='attack')await page.locator('#end-turn-button').click();
  }else await page.clock.runFor(350);
  state=deserializeVersionedMatch(await save(page)).state;
 }
 expect(activePlayer(state)!.kind).toBe('computer');expect(state.phase).toBe('attack');
 await page.locator('#game-pause-button').click();const frozen=await save(page);await page.clock.runFor(5000);expect(await save(page)).toBe(frozen);
 const id=state.map.provinces[0]!.id;await country(page,id).focus();await page.keyboard.press('Enter');expect(await save(page)).toBe(frozen);await page.locator('#game-log-button').click();await expect(page.getByRole('dialog',{name:'Game event log'})).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('#game-pause-button').click();await page.clock.runFor(350);expect(await save(page)).not.toBe(frozen);
 // Create a known manual replacement, then load while old automatic work is queued.
 const manual=expected(1994);const replacement={format:'malpaco-match',version:2,...GEOGRAPHIC_MATCH_IDENTITY,options:manual.options,actions:[]};await upload(page,JSON.stringify(replacement));await check(page,manual.state);await page.clock.runFor(5000);await check(page,manual.state);
});

// Select an actual ordinary-action fixture from measured seed1994. No state
// snapshot or test-only browser entry point is introduced. The accepted first
// exchange must really leave another scheduled legal exchange, rather than
// assuming a target's initial stack survives combat.
function queuedBattle(game:ReturnType<typeof expected>){
 const initial=game.state,player=activePlayer(initial)!;
 for(const source of initial.map.provinces.filter(p=>initial.ownerOf[p.id]===player.id)){
  let state=initial;const actions:Action[]=[];
  if(state.reinforcementPool>0){const placement:Action={kind:'reinforce',province:source.id,amount:state.reinforcementPool};actions.push(placement);state=step(state,placement);}
  const start:Action={kind:'endReinforcement'};actions.push(start);state=step(state,start);
  for(const target of attackTargets(state,source.id)){
   const attack:Action={kind:'attack',from:source.id,to:target},first=apply(state,attack);
   if(!first.ok||first.state.phase!=='attack'||first.state.armies[source.id]!<=1||!attackTargets(first.state,source.id).includes(target))continue;
   const second=apply(first.state,attack);if(!second.ok)continue;
   return {from:source.id,to:target,state,actions,first:first.state,second:second.state};
  }
 }
 throw Error('Measured seed1994 has no first exchange that leaves a queued legal exchange; select a different measured corpus fixture before freeze');
}
test('geographic continuous battle pauses/resumes and cancels stale work on load/new game',async({page},info)=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await setup(page);
 const game=expected(1994),fixture=queuedBattle(game);
 const payload=JSON.stringify({format:'malpaco-match',version:2,...GEOGRAPHIC_MATCH_IDENTITY,options:game.options,actions:fixture.actions});
 await info.attach('queued-battle-fixture',{body:Buffer.from(JSON.stringify({seed:1994,from:fixture.from,to:fixture.to,actions:fixture.actions},null,2)),contentType:'application/json'});
 const begin=async()=>{
  await upload(page,payload);await check(page,fixture.state);await country(page,fixture.from).click();await country(page,fixture.to).click({modifiers:['Shift']});
  await page.locator('#battle-stop-threshold').fill('1');await page.locator('#battle-stop-threshold').press('Tab');await page.locator('#fight-on-button').click();
  await expect(page.getByRole('region',{name:'Battle controls',exact:true})).toHaveAttribute('data-running','true');await check(page,fixture.first);
 };
 await begin();await page.locator('#game-pause-button').click();const frozen=await save(page);await page.clock.runFor(5000);expect(await save(page)).toBe(frozen);
 await country(page,fixture.to).focus();await page.keyboard.press('Enter');expect(await save(page)).toBe(frozen);
 await page.locator('#game-pause-button').click();await page.clock.runFor(400);await check(page,fixture.second);
 // Load replaces a live continuous scheduler. Waiting must not append old work.
 await begin();const replacement=JSON.stringify({format:'malpaco-match',version:2,...GEOGRAPHIC_MATCH_IDENTITY,options:game.options,actions:[]});await upload(page,replacement);await check(page,game.state);await page.clock.runFor(5000);await check(page,game.state);
 // New game also disposes an active scheduler; only setup remains after waiting.
 await begin();await page.getByRole('button',{name:'New game',exact:true}).click();await page.clock.runFor(5000);await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();await expect(page.locator('#geographic-map')).toHaveCount(0);
});
