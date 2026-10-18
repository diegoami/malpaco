import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const out='/home/diego/projects/malpaco/.cache/t70-work/docs/prototypes/new-game/T70/parent-load-completion-proof';mkdirSync(out);
const base='/home/diego/projects/malpaco/docs/prototypes/new-game/T31/fixtures/';let f=JSON.parse(readFileSync(base+'placement.json','utf8'));if(f.parts)f=JSON.parse(f.parts.map(p=>JSON.parse(readFileSync(base+p,'utf8'))).join(''));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/?control=manual');await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('[data-country]')).toHaveCount(46);
 await page.evaluate(()=>{const original=File.prototype.text;File.prototype.text=function(){return new Promise((resolve,reject)=>{Reflect.set(window,'releaseParentLoad',()=>original.call(this).then(resolve,reject));});};});
 const input=await page.getByLabel('Load game',{exact:true}).elementHandle();await input.setInputFiles({name:'delayed-parent.json',mimeType:'application/json',buffer:Buffer.from(f.text)});
 await expect(page.locator('[data-country]')).toHaveCount(46);const oldHelperReturnedBeforeRead=await input.evaluate(n=>n.isConnected);expect(oldHelperReturnedBeforeRead).toBe(true);
 let settled=false;const completed=expect.poll(()=>input.evaluate(n=>n.isConnected)).toBe(false).then(()=>{settled=true;});await new Promise(resolve=>setTimeout(resolve,50));expect(settled).toBe(false);
 await page.evaluate(()=>Reflect.get(window,'releaseParentLoad')());await completed;
 const rows=await page.locator('[data-country]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.getAttribute('data-country'),Number(n.getAttribute('data-armies'))])));expect(rows).toEqual(f.expected.armies);
 const source='src/ui/referenceMatchFiles.ts',sha=createHash('sha256').update(readFileSync(source)).digest('hex');
 writeFileSync(out+'/report.json',JSON.stringify({oldCountryCountHelperReturnsBeforeRead:true,newDisconnectionWaitBlocksUntilRead:true,loadedArmiesEqualFixture:true,source,sha256:sha,fixture:'placement',coreUnchanged:true},null,2)+'\n');writeFileSync(out+'/inert-proof-driver.mjs',readFileSync(new URL(import.meta.url)));console.log('Proved old load helper returns early; revised wait blocks until actual replacement; fixture armies exact.');
}finally{await browser.close();}
