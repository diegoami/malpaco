import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
const base=path.dirname(new URL(import.meta.url).pathname),variant=process.argv[2],dir=path.join(base,variant),now=()=>performance.timeOrigin+performance.now();await fs.mkdir(dir);
const r={variant,legacyValue:process.env.PLAYWRIGHT_LEGACY_SCREENSHOT??null,launchOptions:{headless:true,args:['--disable-gpu'],timeout:10000},viewport:{width:1280,height:800},start:now(),operations:[]};let browser,context,page;
const save=()=>fs.writeFile(path.join(dir,'result.json'),JSON.stringify(r,null,2)+'\n');
const snapshot=()=>page.evaluate(()=>{const b=document.querySelector('button'),rect=b?.getBoundingClientRect();return {visibility:document.visibilityState,focus:document.hasFocus(),date:Date.now(),performance:performance.now(),paint:performance.getEntriesByType('paint').map(e=>({name:e.name,startTime:e.startTime})),clicks:document.body.dataset.clicks??'0',rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null};});
const op=async(name,fn)=>{const row={name,start:now()};r.operations.push(row);try{row.value=await fn();row.status='passed';}catch(e){row.status='FAILED';row.error={message:e.message,stack:e.stack};}finally{row.end=now();await save();}};
try{
 browser=await chromium.launch(r.launchOptions);context=await browser.newContext({viewport:r.viewport});page=await context.newPage();const cdp=await browser.newBrowserCDPSession();r.browser=await cdp.send('Browser.getVersion');try{r.commandline=await cdp.send('Browser.getBrowserCommandLine');}catch(e){r.commandlineError=e.message;}
 const html='<!doctype html><meta charset="utf-8"><title>Minimal native paint probe</title><style>body{margin:32px;font-family:sans-serif}button{width:180px;height:48px;font-size:18px}</style><button onclick="document.body.dataset.clicks=String(Number(document.body.dataset.clicks||0)+1)">Static button</button>';
 r.html=html;await op('goto',()=>page.goto('data:text/html;base64,'+Buffer.from(html).toString('base64'),{timeout:5000}));r.before=await snapshot();
 await op('ordinary-click-5000ms',()=>page.getByRole('button',{name:'Static button',exact:true}).click({timeout:5000}));
 await op('two-native-RAF-5000ms',async()=>{let timer;try{return await Promise.race([page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(a=>requestAnimationFrame(b=>resolve({first:a,second:b}))))),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Node deadline twoRAF5000ms')),5000);})]);}finally{clearTimeout(timer);}});
 await op('screenshot-5000ms',async()=>{await page.screenshot({path:path.join(dir,'static-page.png'),timeout:5000});return 'static-page.png';});r.after=await snapshot();
}catch(e){r.fatal={message:e.message,stack:e.stack};}
finally{if(context)await context.close();if(browser)await browser.close();r.closed=true;r.end=now();await save();}
if(r.fatal)process.exitCode=1;
