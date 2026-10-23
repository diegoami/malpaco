import {expect} from '@playwright/test';
import {_android as android} from 'playwright';
import type {Page} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {activePlayer,apply,defaultOptions,raidCardsRules} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';

const config=JSON.parse(process.argv[2]!) as {apk:string;serial:string;out:string;adb:string;mode?:string};
const app='io.github.diegoami.malpaco.debug';
let key='';
const adb=(args:string[])=>execFileSync(config.adb,['-s',config.serial,...args],{encoding:'utf8',timeout:120000}).trim();
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const metadata={apk:config.apk,apkSha256:createHash('sha256').update(readFileSync(config.apk)).digest('hex'),serial:config.serial,
 android:adb(['shell','getprop','ro.build.version.release']),api:adb(['shell','getprop','ro.build.version.sdk']),
 webview:adb(['shell','dumpsys','webviewupdate']),seed:0,checks:[] as string[],observations:{} as Record<string,unknown>};
const check=(name:string)=>{metadata.checks.push(name);console.log('PASS',name);};
let device: Awaited<ReturnType<typeof android.devices>>[number]|undefined;
async function attach(){
 if(!device){
  const devices=await android.devices({omitDriverInstall:true});
  const selected=devices.find(d=>d.serial()===config.serial);
  if(!selected)throw Error('Requested Android device is not available: '+config.serial);
  device=selected;
 }
 let pid='';
 await expect.poll(()=>{try{pid=adb(['shell','pidof',app]);return pid;}catch{return '';}},{timeout:30000}).not.toBe('');
 const webview=await device.webView({pkg:app,socketName:'webview_devtools_remote_'+pid},{timeout:30000});
 return {page:await webview.page()};
}
/** Exercise explicit entry on the real bundled WebView, including after process restart. */
async function enter(p:Page){
 await expect(p.locator('#game-launcher,#geographic-map').first()).toBeVisible({timeout:60000});
 const launcher=p.locator('#game-launcher');
 if(await launcher.count())await launcher.locator(await launcher.getAttribute('data-mode')==='saved'?'#resume-game':'#start-game').click();
 await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
}
async function visit(p:Page,url:string){await p.goto(url);await enter(p);}
const kept=async(page:Page)=>{const text=await page.evaluate(k=>localStorage.getItem(k),key);if(!text)throw Error('No kept seed-1 match');return deserializeVersionedMatch(text).state;};
const snapshot=async(page:Page)=>JSON.stringify(await kept(page));
const screen=(name:string)=>writeFileSync(join(config.out,name+'.png'),execFileSync(config.adb,['-s',config.serial,'exec-out','screencap','-p']));

adb(['install','-r',config.apk]);
adb(['shell','svc','wifi','disable']);adb(['shell','svc','data','disable']);
adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
let connection=await attach(),page=connection.page;
const errors:string[]=[];const watch=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};watch(page);
try {
 await enter(page);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 check('bundled first launch offline shows 46 countries');screen('first-launch');
 if(config.mode==='lifecycle'){
  expect(await page.evaluate(()=>typeof Reflect.get(window,'MalpacoHost')?.requiresResume)).toBe('function');
  const origin=await page.evaluate(()=>location.origin);
  const count=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('malpaco:next-game-settings')??'null')?.computerOpponents??3;}catch{return 3;}});
  let selected=0;
  for(let seed=7;seed<200;seed++){
   const slot='malpaco:seed-game:'+seed;if(await page.evaluate(k=>localStorage.getItem(k)!==null,slot))continue;
   const o={...defaultOptions(),seed,seats:[{kind:'human' as const},...Array.from({length:count},()=>({kind:'computer' as const}))],computerStrengths:Array.from({length:count},()=> 'Normal' as const)};
   const made=createGeographicGame(o,raidCardsRules(o),{},2);if(made.ok&&activePlayer(made.state)?.kind==='computer'){selected=seed;break;}
  }
  if(!selected)throw Error('No fresh computer-first diagnostic seed');
  metadata.observations.computerDiagnosticSeed=selected;
  await visit(page,origin+'/?seed='+selected);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  await page.locator('#game-speed').selectOption('very-slow');
  if(await page.locator('#game-pause-button').getAttribute('aria-label')==='Resume game')await page.locator('#game-pause-button').click();
  const slot='malpaco:seed-game:'+selected,meta='malpaco:seed-game-meta:'+selected;
  const initial=(await page.evaluate(k=>localStorage.getItem(k),slot))!;
  await wait(2200);await expect(page.locator('.panel')).toHaveAttribute('data-computer-active','true');
  adb(['shell','input','keyevent','KEYCODE_HOME']);
  await expect.poll(async()=>JSON.parse((await page.evaluate(k=>localStorage.getItem(k),meta))!).paused,{timeout:15000}).toBe(true);
  const saved=(await page.evaluate(k=>localStorage.getItem(k),slot))!;
  expect(deserializeVersionedMatch(saved).state.history.length).toBeGreaterThan(deserializeVersionedMatch(initial).state.history.length);
  const state=deserializeVersionedMatch(saved).state;
  const paint=await page.locator('[data-country]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.getAttribute('data-country'),n.getAttribute('data-armies')])));
  expect(paint).toEqual(Object.fromEntries(state.map.provinces.map(p=>[p.id,String(state.armies[p.id])])));
  await wait(600);expect(await page.evaluate(k=>localStorage.getItem(k),slot)).toBe(saved);
  adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
  await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
  await wait(600);expect(await page.evaluate(k=>localStorage.getItem(k),slot)).toBe(saved);
  await device?.close();device=undefined;adb(['shell','am','force-stop',app]);adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
  connection=await attach();page=connection.page;watch(page);await enter(page);
  await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  await visit(page,origin+'/?seed='+selected);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
  expect(await page.evaluate(()=>Reflect.get(window,'MalpacoHost').requiresResume())).toBe(true);
  expect(await page.evaluate(k=>localStorage.getItem(k),slot)).toBe(saved);
  check('native resume requirement and paused computer replay survive process restart');
  writeFileSync(join(config.out,'background-computer.json'),saved);screen('computer-paused-after-return');
  check('real Android Home force-keeps a partial computer turn; return stays paused');
  await page.locator('#game-speed').selectOption('fast');await page.locator('#game-pause-button').click();
  expect(await page.evaluate(()=>Reflect.get(window,'MalpacoHost').requiresResume())).toBe(false);
  check('explicit Resume clears the native resume requirement');
 }

 const origin=await page.evaluate(()=>location.origin);
 const seed=await page.evaluate(()=>{for(let n=1;n<=10000;n++)if(!localStorage.getItem('malpaco:seed-game:'+n))return n;throw Error('No unused diagnostic seed');});
 metadata.seed=seed;key='malpaco:seed-game:'+seed;
 await visit(page,origin+'/?seed='+seed);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 if(await page.locator('#game-pause-button').getAttribute('aria-label')==='Resume game')await page.locator('#game-pause-button').click();
 await expect.poll(async()=>activePlayer(await kept(page))?.kind,{timeout:60000}).toBe('human');
 let capture=false;
 for(let n=0;n<500;n++){
  const state=await kept(page);
  if(state.pendingCapture){capture=true;break;}
  if(activePlayer(state)?.kind!=='human'){
   await expect.poll(async()=>activePlayer(await kept(page))?.kind,{timeout:60000}).toBe('human');continue;
  }
  const action=decideComputerAction(computerView(state));if(!action)throw Error('No ordinary policy action');
  const before=state.history.length;
  switch(action.kind){
   case 'skipCards':{
    const skip=page.getByRole('button',{name:'Skip cards',exact:true});
    if(await skip.isVisible())await skip.click();
    else {
     const own=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id)!;
     await page.locator(`[data-country="${own.id}"]`).click();
    }
    break;
   }
   case 'reinforce':await page.locator(`[data-country="${action.province}"]`).click();break;
   case 'endReinforcement':await page.locator('#start-combat-button').click();break;
   case 'attack':{
    await page.locator(`[data-country="${action.from}"]`).click();
    await expect(page.locator(`[data-country="${action.from}"]`)).toHaveAttribute('data-selected','true');
    await expect(page.locator('#geographic-map .country.target')).toHaveCount(0);
    await page.locator('#province-action-button').click();
    await expect(page.locator('#province-action-button')).toHaveAttribute('aria-pressed','true');
    expect((await kept(page)).history).toEqual(state.history);
    await page.locator(`[data-country="${action.to}"]`).click();
    const expected=apply(state,action);if(!expected.ok)throw Error(expected.error);
    await expect.poll(async()=>JSON.stringify((await kept(page)).history)).toBe(JSON.stringify(expected.state.history));
    break;
   }
   case 'friendlyMove':case 'endTurn':{
    const continueButton=page.getByRole('button',{name:'Continue',exact:true});
    if(await continueButton.isVisible())await continueButton.click();
    await page.locator('#end-turn-button').click();break;
   }
   default:throw Error('Unexpected action before first capture: '+action.kind);
  }
  await expect.poll(async()=>(await kept(page)).history.length,{timeout:15000}).toBeGreaterThan(before);
 }
 if(!capture)throw Error('No human capture reached with ordinary controls');
 check('ordinary placement and combat reach a human capture; exchanges match engine');
 await expect(page.locator('#confirm-capture-button')).toBeVisible();
 const pending=await snapshot(page);
 writeFileSync(join(config.out,'pending-capture.json'),(await page.evaluate(k=>localStorage.getItem(k),key))!);
 screen('capture-portrait');
 if(config.mode==='lifecycle'){
  const url=page.url(),amount=await page.locator('#capture-amount').inputValue();
  await page.locator('#open-game-menu').click();adb(['shell','input','keyevent','KEYCODE_BACK']);
  await expect(page.locator('#game-focus-drawer')).toBeHidden();expect(page.url()).toBe(url);
  await page.locator('#open-required-action').click();adb(['shell','input','keyevent','KEYCODE_BACK']);
  await expect(page.locator('#open-required-action')).toBeVisible();expect(await snapshot(page)).toBe(pending);expect(page.url()).toBe(url);
  await page.locator('#open-required-action').click();await expect(page.locator('#capture-amount')).toHaveValue(amount);
  check('real Back dismisses the menu and folds capture without navigation or confirmation');
  await page.locator('#open-game-menu').click();await page.locator('#game-help-button').click();
  adb(['shell','input','keyevent','KEYCODE_HOME']);
  await expect.poll(async()=>JSON.parse((await page.evaluate(k=>localStorage.getItem(k),'malpaco:seed-game-meta:'+seed))!).paused,{timeout:15000}).toBe(true);
  adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);adb(['shell','input','keyevent','KEYCODE_BACK']);
  await expect(page.locator('dialog.game-help[open]')).toHaveCount(0);
  await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');expect(await snapshot(page)).toBe(pending);
  check('Help dismissal after background cannot release the native pause');
  await page.locator('#game-pause-button').click();if(!await page.locator('#confirm-capture-button').isVisible())await page.locator('#open-required-action').click();
 }

 adb(['shell','settings','put','system','accelerometer_rotation','0']);adb(['shell','settings','put','system','user_rotation','1']);
 await expect.poll(()=>page.evaluate(()=>innerWidth>innerHeight),{timeout:15000}).toBe(true);
 expect(await snapshot(page)).toBe(pending);await expect(page.locator('#confirm-capture-button')).toBeVisible();
 check('rotation retains the exact pending capture');screen('capture-landscape');
 await device?.close();device=undefined;adb(['shell','am','force-stop',app]);
 adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
 connection=await attach();page=connection.page;watch(page);await enter(page);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 // Relaunch opens root; the per-seed test match remains in its independent slot.
 const restartedOrigin=await page.evaluate(()=>location.origin);await visit(page,restartedOrigin+'/?seed='+seed);
 await expect(page.locator('#confirm-capture-button')).toBeVisible({timeout:60000});
 expect(await snapshot(page)).toBe(pending);check('force-stop/relaunch retains the exact pending seed game');screen('capture-restarted');
 adb(['shell','input','keyevent','KEYCODE_HOME']);await wait(500);
 metadata.observations.backgroundVisibility=await page.evaluate(()=>document.visibilityState);
 metadata.observations.backgroundMeta=await page.evaluate(k=>localStorage.getItem(k),'malpaco:seed-game-meta:'+seed);
 adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
 expect(await snapshot(page)).toBe(pending);check('background/foreground does not resolve the pending choice');
 await page.locator('#open-game-menu').click();
 const backUrlBefore=page.url();adb(['shell','input','keyevent','KEYCODE_BACK']);await wait(500);
 metadata.observations.back={urlBefore:backUrlBefore,urlAfter:page.isClosed()?null:page.url(),menuStillVisible:page.isClosed()?null:await page.locator('#game-focus-drawer').isVisible()};
 adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
 if(page.isClosed()){connection=await attach();page=connection.page;watch(page);await enter(page);}
 const target=restartedOrigin+'/?seed='+seed;
 if(page.url()!==target)await visit(page,target);
 if(!await page.locator('#confirm-capture-button').isVisible()&&await page.locator('#open-required-action').isVisible())await page.locator('#open-required-action').click();
 await expect(page.locator('#confirm-capture-button')).toBeVisible({timeout:60000});
 expect(await snapshot(page)).toBe(pending);check('Back does not confirm the pending capture; navigation behavior recorded');

 if(config.mode==='lifecycle'){
  // A reload may have reopened the choice. Fold it, then Back at the map.
  if(await page.locator('#game-focus-drawer').isVisible()){adb(['shell','input','keyevent','KEYCODE_BACK']);await expect(page.locator('#open-required-action')).toBeVisible();}
  adb(['shell','input','keyevent','KEYCODE_BACK']);
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'MalpacoHost').isActive()),{timeout:15000}).toBe(false);
  const url=page.url();adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
  await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
  expect(page.url()).toBe(url);expect(await snapshot(page)).toBe(pending);
  check('Back at the map backgrounds the app and return requires Resume');screen('back-map-return-paused');
 }
 expect(errors).toEqual([]);check('no JavaScript or console errors during checked flows');
 writeFileSync(join(config.out,'REPORT.json'),JSON.stringify(metadata,null,2)+'\n');
} catch(error) {
 writeFileSync(join(config.out,'REPORT.json'),JSON.stringify({...metadata,error:String(error)},null,2)+'\n');
 throw error;
} finally {
 await device?.close();
 adb(['shell','settings','put','system','user_rotation','0']);adb(['shell','settings','put','system','accelerometer_rotation','1']);
}
