import {chromium,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';

if(process.platform!=='win32')throw Error('The acceptance smoke must run on real Windows.');
const root=resolve('.'),config=JSON.parse(await readFile('artifacts/windows/build-output.json','utf8'));
const output=config.output,evidence=join(output,'smoke');await mkdir(evidence,{recursive:true});
const receipts=[];let active,activePage;
function powershell(phase,args=[]){
 // Match the hosted runner's PowerShell 7 module environment; Windows PowerShell 5
 // cannot load the inherited Microsoft.PowerShell.Security module (#466 first run).
 const text=execFileSync('pwsh.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(root,'tools/windows/install-smoke.ps1'),'-Phase',phase,'-Output',output,...args],{encoding:'utf8',env:process.env});
 const receipt=JSON.parse(text.trim());receipts.push(receipt);return receipt;
}
async function connect(){
 const deadline=Date.now()+60000;let last;
 while(Date.now()<deadline){
  try{return await chromium.connectOverCDP('http://127.0.0.1:9222');}catch(error){last=error;await new Promise(r=>setTimeout(r,250));}
 }
 throw last;
}
async function launch(path){
 process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9222';
 active=powershell('Launch',['-Executable',path]);
 const browser=await connect();const context=browser.contexts()[0];if(!context)throw Error('No app context');
 // WebView2 exposes its CDP browser endpoint before creating the first page target.
 const page=context.pages().find(p=>p.url().includes('tauri.localhost'))??context.pages()[0]??await context.waitForEvent('page',{timeout:30000});
 await page.waitForLoadState();activePage=page;
 active.window=powershell('RootWindow',['-AppProcessId',String(active.pid)]).handle;
 return {browser,context,page};
}
async function stop(browser){
 // Close the actual application window, as a user would. Release CDP separately.
 powershell('Close',['-AppProcessId',String(active.pid),'-GameWindowHandle',String(active.window)]);
 // Prove normal exit before disconnecting the debugger; debugger shutdown must
 // never make an otherwise broken app-close check pass.
 powershell('WaitStopped',['-AppProcessId',String(active.pid)]);active=undefined;
 await browser.close().catch(()=>{});
}
const wire=page=>page.evaluate(()=>localStorage.getItem('malpaco:current-game'));
try{
 const installed=powershell('Install');
 const signature=powershell('Inspect',['-Executable',installed.installedExe]);
 expect(signature.signature).toBe('NotSigned');expect(signature.productVersion).toContain(config.version);
 let app=await launch(installed.shortcut);let {page,context}=app;
 await expect(page.locator('#start-game')).toBeVisible();await expect(page.locator('#game-version')).toContainText(config.version);
 await page.getByLabel('Computer opponents',{exact:true}).selectOption('1');
 await page.getByLabel('Computer turn speed',{exact:true}).selectOption('very-fast');
 await page.clock.install();await page.clock.pauseAt(new Date());
 // No remote game content or development server is needed. Browser links are checked separately.
 const remote=[];page.on('request',r=>{const u=new URL(r.url());if(['http:','https:'].includes(u.protocol)&&u.hostname!=='tauri.localhost')remote.push(r.url());});
 await context.setOffline(true);
 await page.locator('#start-game').click();await expect(page.locator('#geographic-game')).toBeVisible();
 // A fresh game may begin with a computer. Drive the real UI scheduler until the
 // first human placement, rather than treating a hidden zero pool as an app failure.
 await page.clock.runFor(3500);
 for(let beats=0;beats<60&&!await page.locator('#placement-pool').isVisible();beats++)await page.clock.runFor(1000);
 await expect(page.locator('#phase-announcement')).toHaveAttribute('data-kind','phase');
 const started=await wire(page);expect(started).toBeTruthy();
 await expect(page.locator('#placement-pool')).toBeVisible();
 await page.getByRole('button',{name:/, You, \d+ armies$/}).first().click();
 await expect.poll(()=>wire(page)).not.toBe(started);const kept=await wire(page);expect(kept).toBeTruthy();
 await writeFile(join(evidence,'kept-game.json'),kept);
 await page.locator('#game-help-button').click();const close=page.locator('#close-game-help');await expect(close).toBeVisible();
 const geometry=await close.evaluate(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,viewport:[innerWidth,innerHeight],hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
 expect(geometry.x).toBeGreaterThanOrEqual(0);expect(geometry.y).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.viewport[0]);expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewport[1]);expect(geometry.hit).toBe(true);expect(geometry.w).toBeGreaterThanOrEqual(44);expect(geometry.h).toBeGreaterThanOrEqual(44);
 await page.screenshot({path:join(evidence,'installed-help.png')});
 const opened=context.waitForEvent('page');await page.locator('#full-player-manual').click();const manual=await opened;
 await expect(manual).toHaveURL(/\/manual\/index\.html$/);
 await expect(manual.getByRole('heading',{level:1})).toHaveText('Malpaco player manual');await expect(manual.locator('main img')).toHaveCount(8);
 for(const img of await manual.locator('main img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(n=>n.complete&&n.naturalWidth>0)).toBe(true);}
 await manual.screenshot({path:join(evidence,'bundled-manual.png')});
 const documentClosed=manual.waitForEvent('close');powershell('CloseDocument',['-AppProcessId',String(active.pid),'-GameWindowHandle',String(active.window)]);await documentClosed;
 expect(await wire(page)).toBe(kept);await close.click();expect(remote).toEqual([]);await context.setOffline(false);
 // The exact HTTPS destinations must leave the app; main URL and saved game stay intact.
 await page.locator('#game-help-button').click();
 for(const [id,url] of [['github-repository','https://github.com/diegoami/malpaco'],['github-releases','https://github.com/diegoami/malpaco/releases']]){
  const before=page.url();await expect(page.locator('#'+id)).toHaveAttribute('href',url);powershell('ExternalBrowserReady');await page.locator('#'+id).click();
  powershell('ExternalBrowser',['-Url',url]);
  await expect(page.locator('dialog[aria-labelledby="game-help-title"]')).toBeVisible();expect(page.url()).toBe(before);expect(await wire(page)).toBe(kept);
 }
 receipts.push({phase:'offline-game-and-help',geometry,noRemoteGameRequests:true,manualImages:8,controlledClock:true,opponents:1,computerSpeed:'very-fast',savedGameSha256:createHash('sha256').update(kept).digest('hex'),webview:await app.browser.version()});
 await stop(app.browser);
 app=await launch(installed.shortcut);page=app.page;await expect(page.locator('#resume-game')).toBeVisible();expect(await wire(page)).toBe(kept);await page.screenshot({path:join(evidence,'installed-relaunch.png')});await stop(app.browser);
 powershell('Reinstall');app=await launch(installed.shortcut);await expect(app.page.locator('#resume-game')).toBeVisible();expect(await wire(app.page)).toBe(kept);await stop(app.browser);
 powershell('Uninstall');
 app=await launch(join(output,config.portable));page=app.page;await expect(page.locator('#resume-game')).toBeVisible();expect(await wire(page)).toBe(kept);await page.locator('#resume-game').click();await expect(page.locator('#geographic-game')).toBeVisible();await page.screenshot({path:join(evidence,'portable.png')});await stop(app.browser);
 receipts.push({phase:'portable-after-uninstall',passed:true,sharedUserDataSurvives:true,applicationInstallationRequired:false});
 await writeFile(join(evidence,'REPORT.json'),JSON.stringify({passed:true,sourceCommit:config.sourceCommit,version:config.version,receipts,limits:['Hosted Windows 2022 smoke; physical Windows 10/11 and SmartScreen acceptance remain owner checks.','Same-version reinstall is tested; no prior official Windows version exists to test an upgrade from.','External link dispatch preserves the app; default-browser page rendering is not asserted.']},null,2)+'\n');
}catch(error){
 if(activePage)await activePage.screenshot({path:join(evidence,'failure.png')}).catch(()=>{});
 let targets;try{targets=await (await fetch('http://127.0.0.1:9222/json/list')).json();}catch(targetError){targets={error:String(targetError)};}
 await writeFile(join(evidence,'REPORT.json'),JSON.stringify({passed:false,sourceCommit:config.sourceCommit,receipts,targets,error:String(error),stack:error.stack},null,2)+'\n');throw error;
}finally{
 if(active)powershell('Stop',['-AppProcessId',String(active.pid)]);
}
