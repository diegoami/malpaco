import {test,expect} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {apply,deserializeVersionedMatch} from '../../../../../src/core';
const owned='docs/prototypes/new-game/issue180/preflight';
const discoveries=JSON.parse(readFileSync(owned+'/discovery.json','utf8'));
async function load(p:Page,text:string){const old=await p.getByLabel('Load game',{exact:true}).elementHandle();await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'legal.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect.poll(()=>old!.evaluate(e=>e.isConnected)).toBe(false);}
async function save(p:Page){await p.getByRole('button',{name:'Save game',exact:true}).click();return p.evaluate(()=>(Reflect.get(window,'preflightSave') as Blob).text());}
async function measure(p:Page,info:TestInfo,label:string){const data=await p.evaluate(()=>{
 const rect=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const describe=(el:Element)=>({selector:el.classList.contains('action')?'.action':el.id?'#'+el.id:'.'+el.classList[0],rect:rect(el),scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,scrollTop:el.scrollTop,overflowY:getComputedStyle(el).overflowY});
 const shown=(el:Element)=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
 const controls=[...document.querySelectorAll('.battle-controls button,.battle-controls input,.battle-controls select,.card-interactions button,#end-turn-button,#game-pause-button,#game-speed,#panel-detail,[data-testid="player-army-total"],#game-log-button')].filter(shown).map(el=>{
  const r=el.getBoundingClientRect(),a=el.closest('.action')?.getBoundingClientRect(),parents=[];let node=el.parentElement;while(node){const s=getComputedStyle(node),b=node.getBoundingClientRect();if(['hidden','auto','scroll','clip'].includes(s.overflowY)||['hidden','auto','scroll','clip'].includes(s.overflowX))parents.push({selector:node.id||node.className,rect:rect(node),clips:r.top<b.top-1||r.bottom>b.bottom+1||r.left<b.left-1||r.right>b.right+1});node=node.parentElement;}
  const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {...describe(el),enabled:!(el as HTMLButtonElement).disabled,fitsViewport:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,fitsAction:!a||(r.top>=a.top-1&&r.bottom<=a.bottom+1&&r.left>=a.left-1&&r.right<=a.right+1),parents,hit:!!hit&&(hit===el||el.contains(hit))};
 });
 return {viewport:{width:innerWidth,height:innerHeight},document:{scrollTop:document.documentElement.scrollTop,scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight},areas:['.panel','.panel>.action','.battle-controls','.panel>.log-card','.log'].map(s=>document.querySelector(s)).filter((e):e is Element=>!!e).map(describe),controls};
 });await p.screenshot({path:info.outputPath(label+'.png'),fullPage:true});return {label,...data};}
async function physicalClick(p:Page,id:string){const el=p.locator('#'+id);const b=await el.boundingBox();if(!b)throw Error('missing '+id);const good=await el.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&(e===hit||e.contains(hit))&&r.bottom<=innerHeight;});if(!good||!await el.isEnabled())return false;await p.mouse.click(b.x+b.width/2,b.y+b.height/2);return true;}
test('complete human battle controls stay simultaneously visible without outer scrolling',async({page},info)=>{
 test.setTimeout(120000);await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));await page.goto('/');await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{Reflect.set(window,'preflightSave',b);return create(b);};});
 const samples=[],checks=[];
 for(const source of ['geographic-raid-pending-one-human.json','T39-legal-pending-raid.json'])for(const mode of ['compact','detailed']){
  let anchor:any;
  for(const kind of ['attack-empty','attack-hand','attack-running','capture']){
   const row=discoveries.find((r:any)=>r.source===source&&r.kind===kind);if(!row)throw Error('Missing '+source+kind);
   const text=readFileSync(owned+'/fixtures/'+row.fixture,'utf8'),before=deserializeVersionedMatch(text);await load(page,text);await page.locator('#panel-detail').selectOption(mode);
   const frozen=await save(page);await page.locator('#panel-detail').selectOption(mode==='compact'?'detailed':'compact');await page.locator('#panel-detail').selectOption(mode);checks.push({label:mode+kind+' mode preserves exact state',ok:await save(page)===frozen});
   if(kind.startsWith('attack')){await page.locator(`[data-country="${row.action.from}"]`).click();await page.locator(`[data-country="${row.action.to}"]`).click({modifiers:['Shift']});}
   const label=source.replace('.json','')+'-'+mode+'-'+kind,sample=await measure(page,info,label);samples.push(sample);const area=sample.areas.find(a=>a.selector==='.action')!.rect;anchor??=area;checks.push({label:label+' stable action bounds',ok:Math.abs(area.height-anchor.height)<1&&Math.abs(area.y-anchor.y)<1});
   const log=page.getByRole('list',{name:'Battle log',exact:true}),rows=log.locator('li'),events=before.state.log.filter(e=>e.event!=='game_started');checks.push({label:label+' complete history',ok:await rows.count()===events.length});
   if(kind==='attack-running'){
    const old=await rows.allTextContents();await log.evaluate(e=>{e.scrollTop=42;});const reading=await log.evaluate(e=>e.scrollTop);await page.locator('#panel-detail').selectOption(mode==='compact'?'detailed':'compact');await page.locator('#panel-detail').selectOption(mode);checks.push({label:label+' mode retains older reading position',ok:await log.evaluate(e=>e.scrollTop)===reading});await page.locator('#battle-stop-threshold').fill('1');await page.locator('#battle-stop-threshold').press('Tab');
    const clicked=await physicalClick(page,'fight-on-button');checks.push({label:label+' enabled Attack clickable without scroll',ok:clicked});
    if(clicked){samples.push(await measure(page,info,label+'-running'));checks.push({label:label+' enabled Stop clickable without scroll',ok:await physicalClick(page,'stop-battle-button')});const result=apply(before.state,row.action);if(!result.ok)throw Error(result.error);checks.push({label:label+' exact attack state/RNG',ok:JSON.stringify(deserializeVersionedMatch(await save(page)).state)===JSON.stringify(result.state)});checks.push({label:label+' history/read position retained',ok:await log.evaluate(e=>e.scrollTop)===reading&&JSON.stringify((await rows.allTextContents()).slice(0,old.length))===JSON.stringify(old)});
     // A second ordinary exchange checks bottom-follow independently of the older-reader case.
     await log.evaluate(e=>{e.scrollTop=e.scrollHeight;});if(await page.locator('#single-exchange-button').isEnabled()){await physicalClick(page,'single-exchange-button');checks.push({label:label+' bottom follow',ok:await log.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<=1)});}
    }
    await log.evaluate(e=>{e.scrollTop=0;});checks.push({label:label+' oldest history readable',ok:await rows.first().evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement!.getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1;})});
   }
   if(kind==='capture'){const clicked=await physicalClick(page,'confirm-capture-button');checks.push({label:label+' capture clickable without scroll',ok:clicked});if(clicked){const amount=before.state.pendingCapture!.defaultAmount,r=apply(before.state,{kind:'captureMove',amount});if(!r.ok)throw Error(r.error);checks.push({label:label+' exact capture state/RNG',ok:JSON.stringify(deserializeVersionedMatch(await save(page)).state)===JSON.stringify(r.state)});}}
  }
  const choiceFile=source.startsWith('geographic')?'geographic-income-before-one-human.json':'T38-legal-Surge-before.json';await load(page,readFileSync('docs/prototypes/new-game/T40/fixtures/'+choiceFile,'utf8'));await page.locator('#panel-detail').selectOption(mode);samples.push(await measure(page,info,source+'-'+mode+'-card-choice'));const choice=page.getByRole('button',{name:'Skip cards',exact:true});checks.push({label:source+mode+' mandatory card choice enabled',ok:await choice.isEnabled()});
 }
 writeFileSync(info.outputPath('metrics.json'),JSON.stringify({samples,checks},null,2)+'\n');
 // ALL modes and phases have evidence before fit assertions are evaluated.
 for(const s of samples){for(const c of s.controls){expect.soft(c.fitsViewport,s.label+c.selector+' viewport').toBe(true);expect.soft(c.fitsAction,s.label+c.selector+' action').toBe(true);expect.soft(c.parents.every(p=>!p.clips),s.label+c.selector+' clipping').toBe(true);expect.soft(c.hit,s.label+c.selector+' hit target').toBe(true);}for(const a of s.areas.filter(a=>['.panel','.action','.battle-controls'].includes(a.selector))){expect.soft(a.rect.bottom,s.label+a.selector+' panel viewport').toBeLessThanOrEqual(s.viewport.height+1);expect.soft(a.scrollHeight,s.label+a.selector+' no shared scrolling').toBeLessThanOrEqual(a.clientHeight+1);}}
 for(const c of checks)expect.soft(c.ok,c.label).toBe(true);
});
