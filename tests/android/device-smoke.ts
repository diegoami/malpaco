import {expect} from '@playwright/test';
import {_android as android} from 'playwright';
import type {Page} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {activePlayer,apply} from '../../src/core';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';

const config=JSON.parse(process.argv[2]!) as {apk:string;serial:string;out:string;adb:string};
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
const kept=async(page:Page)=>{const text=await page.evaluate(k=>localStorage.getItem(k),key);if(!text)throw Error('No kept seed-1 match');return deserializeVersionedMatch(text).state;};
const snapshot=async(page:Page)=>JSON.stringify(await kept(page));
const screen=(name:string)=>writeFileSync(join(config.out,name+'.png'),execFileSync(config.adb,['-s',config.serial,'exec-out','screencap','-p']));

adb(['install','-r',config.apk]);
adb(['shell','svc','wifi','disable']);adb(['shell','svc','data','disable']);
adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
let connection=await attach(),page=connection.page;
const errors:string[]=[];const watch=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};watch(page);
try {
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 check('bundled first launch offline shows 46 countries');screen('first-launch');
 const origin=await page.evaluate(()=>location.origin);
 const seed=await page.evaluate(()=>{for(let n=1;n<=10000;n++)if(!localStorage.getItem('malpaco:seed-game:'+n))return n;throw Error('No unused diagnostic seed');});
 metadata.seed=seed;key='malpaco:seed-game:'+seed;
 await page.goto(origin+'/?seed='+seed);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
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
    await page.locator('#province-action-button').click();
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
 adb(['shell','settings','put','system','accelerometer_rotation','0']);adb(['shell','settings','put','system','user_rotation','1']);
 await expect.poll(()=>page.evaluate(()=>innerWidth>innerHeight),{timeout:15000}).toBe(true);
 expect(await snapshot(page)).toBe(pending);await expect(page.locator('#confirm-capture-button')).toBeVisible();
 check('rotation retains the exact pending capture');screen('capture-landscape');
 adb(['shell','am','force-stop',app]);
 adb(['shell','am','start','-n',app+'/io.github.diegoami.malpaco.MainActivity']);
 connection=await attach();page=connection.page;watch(page);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 // Relaunch opens root; the per-seed test match remains in its independent slot.
 const restartedOrigin=await page.evaluate(()=>location.origin);await page.goto(restartedOrigin+'/?seed='+seed);
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
 if(page.isClosed()){connection=await attach();page=connection.page;watch(page);}
 await page.goto(restartedOrigin+'/?seed='+seed);
 await expect(page.locator('#confirm-capture-button')).toBeVisible({timeout:60000});
 expect(await snapshot(page)).toBe(pending);check('Back does not confirm the pending capture; navigation behavior recorded');
 expect(errors).toEqual([]);check('no JavaScript or console errors during checked flows');
 writeFileSync(join(config.out,'REPORT.json'),JSON.stringify(metadata,null,2)+'\n');
} catch(error) {
 writeFileSync(join(config.out,'REPORT.json'),JSON.stringify({...metadata,error:String(error)},null,2)+'\n');
 throw error;
} finally {
 await device?.close();
 adb(['shell','settings','put','system','user_rotation','0']);adb(['shell','settings','put','system','accelerometer_rotation','1']);
}
