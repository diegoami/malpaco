import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/capture-'));
const study=JSON.parse(readFileSync(resolve(process.argv[2]??resolve(root,'study.json'))));
const failures=[],captures=[],browser=await chromium.launch({headless:true});
try{
  if(study.entries.filter(e=>e.role==='candidate').length<2)failures.push('Need two candidate views');
  for(const viewport of [{width:1280,height:800},{width:800,height:540}])for(const entry of study.entries){
    const page=await browser.newPage({viewport});page.on('pageerror',e=>failures.push(`${entry.id}: ${e.message}`));
    await page.goto(pathToFileURL(resolve(root,entry.html)).href);await page.locator('svg').first().waitFor();
    const board=JSON.parse(readFileSync(resolve(root,entry.board)));
    const count=await page.locator('[data-id]').count();if(count!==46)failures.push(`${entry.id}: expected46 rendered regions, got${count}`);
    const name=`${entry.id}-${viewport.width}x${viewport.height}.png`;await page.screenshot({path:resolve(output,name)});captures.push(name);
    for(const [a,b] of [['South rest','Fort town'],['Rock bay','Upper ridge']]){
      const ids=[a,b].map(name=>board.provinces.find(p=>p.name===name).id);
      const boxes=await Promise.all(ids.map(id=>page.locator(`[data-id="${id}"]`).boundingBox()));
      if(boxes.some(b=>!b)){failures.push(`${entry.id}: missing closeup region`);continue;}
      const x=Math.max(0,Math.min(...boxes.map(r=>r.x))-12),y=Math.max(0,Math.min(...boxes.map(r=>r.y))-12);
      const right=Math.min(viewport.width,Math.max(...boxes.map(r=>r.x+r.width))+12),bottom=Math.min(viewport.height,Math.max(...boxes.map(r=>r.y+r.height))+12);
      const name=`${entry.id}-${a.replaceAll(' ','-')}-${viewport.width}.png`;await page.screenshot({path:resolve(output,name),clip:{x,y,width:right-x,height:bottom-y}});captures.push(name);
    }
    await page.close();
  }
}catch(error){failures.push(error.stack??error.message);}finally{await browser.close();}
writeFileSync(resolve(output,'report.json'),JSON.stringify({accepted:!failures.length,failures,captures},null,2)+'\n');
console.log(JSON.stringify({accepted:!failures.length,failures,output},null,2));if(failures.length)process.exitCode=1;
