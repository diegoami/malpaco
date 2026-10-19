import {test,expect} from '@playwright/test';
import {generateBoard} from '../../../../../../src/core';
import {writeFileSync} from 'node:fs';
const out=__dirname;const events:any[]=[];const mark=(kind:string,data:any={})=>events.push({kind,time:Date.now(),...data});
const board=(seed:number)=>{const value=generateBoard(seed);if(!value.ok)throw Error('generation failed');return value.map;};
const bounded=async(p:Promise<any>)=>{let id:any;try{return await Promise.race([p,new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('held request did not arrive in 5000ms')),5000)})]);}finally{clearTimeout(id);}};
test('one controlled navigation readiness diagnostic',async({page})=>{
 let active=0;let release:()=>void=()=>{};let arrived:()=>void=()=>{};let held:Promise<void>=Promise.resolve();let click:Promise<any>|undefined;
 const snapshot=async(kind:string)=>mark(kind,{url:page.url(),state:await page.evaluate(()=>document.readyState),names:await page.locator('.country-name').allTextContents()});
 page.on('domcontentloaded',()=>mark('domcontentloaded',{url:page.url()}));page.on('load',()=>mark('load',{url:page.url()}));page.on('pageerror',error=>mark('pageerror',{error:String(error)}));
 await page.route('**/assets/index-*.js',async route=>{if(!active)return route.continue();mark('module-held',{seed:active,url:route.request().url()});arrived();await held;mark('module-released',{seed:active,url:route.request().url()});await route.continue();});
 try{
  await page.goto('/?view=generated-prototype&seed=1994');await expect(page.locator('#generated-prototype')).toBeVisible();expect(await page.locator('.country-name').allTextContents()).toEqual(board(1994).provinces.map(p=>p.name));await snapshot('initial-ready');
  for(const seed of [1,2]){
   active=seed;held=new Promise<void>(resolve=>release=resolve);const arrival=new Promise<void>(resolve=>arrived=resolve);let waitSettled=false;
   await page.getByLabel('Seed',{exact:true}).fill(String(seed));
   const ready=page.waitForURL(new RegExp(`seed=${seed}(?:&|$)`),{waitUntil:'domcontentloaded',timeout:5000}).then(()=>{waitSettled=true;mark('ready-wait-passed',{seed});return {ok:true};},error=>{waitSettled=true;mark('ready-wait-failed',{seed,error:String(error),stack:error.stack});return {ok:false};});
   click=page.getByRole('button',{name:'Generate',exact:true}).click({timeout:15000}).then(()=>mark('original-click-completed',{seed}),error=>{mark('click-error',{seed,error:String(error)});throw error;});
   await bounded(arrival);await expect(page).toHaveURL(new RegExp(`seed=${seed}(?:&|$)`));await snapshot('url-assertion-passed-module-held');expect(waitSettled).toBe(false);
   if(seed===1){
    let failed=false;try{expect(await page.locator('.country-name').allTextContents()).toEqual(board(seed).provinces.map(p=>p.name));}catch(error:any){failed=true;mark('original-ordered-assertion-expected-failure',{seed,error:String(error),stack:error.stack});}expect(failed).toBe(true);
    release();expect((await ready).ok).toBe(true);await click;click=undefined;active=0;
    expect(await page.locator('.country-name').allTextContents()).toEqual(board(seed).provinces.map(p=>p.name));await snapshot('same-ordered-assertion-passed');
    let wrongFailed=false;try{expect(await page.locator('.country-name').allTextContents()).toEqual(['deliberately wrong name']);}catch(error:any){wrongFailed=true;mark('wrong-names-expected-failure',{error:String(error),stack:error.stack});}expect(wrongFailed).toBe(true);
   }else{
    expect((await ready).ok).toBe(false);await snapshot('permanently-held-bounded-negative');release();await click;click=undefined;active=0;
   }
  }
  mark('diagnostic-passed');
 }finally{release();if(click)await click.catch(()=>{});writeFileSync(out+'/events.json',JSON.stringify(events,null,2)+'\n');}
});
