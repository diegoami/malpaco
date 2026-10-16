import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { contained } from '../T24/geometry.mjs';
import { audit, failures as auditFailures, pair } from './audit.mjs';
const root=dirname(fileURLToPath(import.meta.url)),input=resolve(process.argv[2]??`${root}/preview.html`);
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/browser-'));
const failures=[],completed=[],check=(ok,message)=>{if(!ok)throw Error(message);};
const browser=await chromium.launch({headless:true});
try {
  for(const viewport of [{width:1280,height:800},{width:1920,height:1080},{width:800,height:540}]) {
    const page=await browser.newPage({viewport,acceptDownloads:true});
    page.on('pageerror',e=>failures.push(e.message));page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
    await page.goto(pathToFileURL(input).href);await page.locator('svg').waitFor();
    const board=await page.evaluate(()=>window.REFERENCE_BOARD);
    check(!!board,'Missing embedded reference data');
    if(!board){await page.close();continue;}
    const contractFailures=auditFailures(audit(board));
    if(contractFailures.length){failures.push(`${viewport.width}: embedded board fails contract/identity: ${contractFailures.join('; ')}`);await page.close();continue;}
    check(await page.locator('.country').count()===46,'Expected 46 country buttons');
    const labelRects=[];
    const clickCountry=async p=>{
      const at=await page.locator('svg').evaluate((n,pt)=>{const p=new DOMPoint(...pt).matrixTransform(n.getScreenCTM());return [p.x,p.y];},p.labelAt);
      await page.mouse.click(...at);
    };
    for(const p of board.provinces) {
      const node=page.locator(`[data-id="${p.id}"]`);
      const boxes=await node.evaluate(n=>{
        const label=n.querySelector('.country-label'),rect=label.getBoundingClientRect(),inverse=n.ownerSVGElement.getScreenCTM().inverse();
        const corners=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(inverse);return [p.x,p.y];});
        const ctm=n.ownerSVGElement.getScreenCTM(),count=n.querySelector('.count');
        const visible=node=>{for(let p=node;p&&p.nodeType===1;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;};
        return {corners,rect:rect.toJSON(),countVisible:visible(count)&&count.getBoundingClientRect().width>0&&count.getBoundingClientRect().height>0,labelVisible:visible(label),countPx:parseFloat(getComputedStyle(count).fontSize)*ctm.a};
      });
      labelRects.push({id:p.id,...boxes.rect});
      check(boxes.labelVisible&&boxes.countVisible,`${viewport.width}: invisible label/count ${p.id}`);
      const hit=await node.evaluate((n,at)=>[-20,20].flatMap(dx=>[-20,20].map(dy=>{const v=new DOMPoint(at[0]+dx,at[1]+dy).matrixTransform(n.ownerSVGElement.getScreenCTM());return document.elementFromPoint(v.x,v.y)?.closest('.country')?.dataset.id===n.dataset.id;})),p.labelAt);
      check(hit.every(Boolean),`${viewport.width}: actual 40px hit square clipped/intercepted ${p.id}`);
      check(contained(boxes.corners,p.polygon),`${viewport.width}: label outside ${p.name}`);
      check(boxes.countPx>=14-.01,`${viewport.width}: count text below 14px ${p.name}`);
      check((await node.locator('.name').allTextContents()).join(' ')===p.name,`Rendered name changed ${p.id}`);
      check(await node.locator('.count').textContent()===`${p.owner==='seat1'?'1':'2'} · ${p.armies}`,`Rendered owner/armies changed ${p.id}`);
      check(await node.locator('.cell').getAttribute('d')==='M'+p.polygon.map(q=>q.join(',')).join('L')+'Z',`Rendered polygon differs ${p.id}`);
      check(await node.locator('.cell').getAttribute('fill')===(p.owner==='seat1'?'#4d91ba':'#d99a55'),`Rendered ownership differs ${p.id}`);
      check(await node.locator('.centre').count()===(p.production?1:0),`Rendered production marker differs ${p.id}`);
      await clickCountry(p);
      const expected=[...p.borders,...p.seaLanes].sort();
      check(isDeepStrictEqual(await page.locator('.lane.active').evaluateAll(ns=>ns.map(n=>n.dataset.edge).sort()),board.routes.filter(r=>r.from===p.id||r.to===p.id).map(r=>pair(r.from,r.to)).sort()),`${viewport.width}: active routes mismatch ${p.id}`);
      check(await page.locator('.lane.active').evaluateAll(ns=>ns.every(n=>{const s=getComputedStyle(n);return s.stroke==='rgb(255, 247, 191)'&&parseFloat(s.strokeWidth)>=2&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0;})),`${viewport.width}: active routes not visibly highlighted ${p.id}`);
      const actual=await page.locator('.neighbor').evaluateAll(ns=>ns.map(n=>n.dataset.id).sort());
      check(isDeepStrictEqual(actual,expected),`${viewport.width}: click neighbours mismatch ${p.id}`);
      check(await page.locator('.neighbor .cell').evaluateAll(ns=>ns.every(n=>{const s=getComputedStyle(n);return s.stroke==='rgb(245, 220, 130)'&&parseFloat(s.strokeWidth)>=1.5;})),`${viewport.width}: visible neighbour styling missing ${p.id}`);
      check(await node.locator('.cell').evaluate(n=>{const s=getComputedStyle(n);return s.stroke==='rgb(255, 247, 191)'&&parseFloat(s.strokeWidth)>=2&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0;}),`${viewport.width}: visible selected styling missing ${p.id}`);
      check(await node.getAttribute('aria-pressed')==='true',`${viewport.width}: click selection missing ${p.id}`);
      const other=board.provinces[(board.provinces.indexOf(p)+1)%46];
      await clickCountry(other);await node.focus();await page.keyboard.press('Space');
      check(await node.getAttribute('aria-pressed')==='true',`${viewport.width}: Space selection missing ${p.id}`);
      await clickCountry(other);await node.focus();await page.keyboard.press('Enter');
      check(await node.getAttribute('aria-pressed')==='true',`${viewport.width}: Enter selection missing ${p.id}`);
      check(isDeepStrictEqual(await page.locator('.neighbor').evaluateAll(ns=>ns.map(n=>n.dataset.id).sort()),expected),`${viewport.width}: keyboard neighbours mismatch ${p.id}`);
      check(isDeepStrictEqual(await page.locator('.lane.active').evaluateAll(ns=>ns.map(n=>n.dataset.edge).sort()),board.routes.filter(r=>r.from===p.id||r.to===p.id).map(r=>pair(r.from,r.to)).sort()),`${viewport.width}: keyboard routes mismatch ${p.id}`);
    }
    await page.locator(`[data-id="${board.provinces[0].id}"]`).focus();
    for(let j=1;j<=46;j++){await page.keyboard.press('ArrowRight');check(await page.locator(`[data-id="${board.provinces[j%46].id}"]`).evaluate(n=>n===document.activeElement),`Arrow focus cannot reach country ${j%46}`);}
    for(const [key,index] of [['ArrowLeft',45],['ArrowDown',0],['ArrowUp',45]]){await page.keyboard.press(key);check(await page.locator(`[data-id="${board.provinces[index].id}"]`).evaluate(n=>n===document.activeElement),`Focus ${key} failed`);}
    for(let a=0;a<labelRects.length;a++)for(let b=a+1;b<labelRects.length;b++) {
      const u=labelRects[a],v=labelRects[b];
      check(!(u.left<v.right&&u.right>v.left&&u.top<v.bottom&&u.bottom>v.top),`${viewport.width}: labels overlap ${u.id}/${v.id}`);
    }
    const rendered=await page.locator('.lane').evaluateAll(ns=>ns.map(n=>({edge:n.dataset.edge,points:n.getAttribute('points')})));
    check(isDeepStrictEqual(rendered,board.routes.map(r=>({edge:pair(r.from,r.to),points:r.points.map(p=>p.join(',')).join(' ')}))),'Rendered sea paths differ from contract');
    check(await page.locator('.port').count()===board.routes.length*2,'Missing coast endpoint markers');
    check(isDeepStrictEqual(await page.locator('.port').evaluateAll(ns=>ns.map(n=>[Number(n.getAttribute('cx')),Number(n.getAttribute('cy'))])),board.routes.flatMap(r=>[r.points[0],r.points.at(-1)])),'Rendered coast endpoint markers differ');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),'Viewport overflow');
    await page.locator('[data-id="province_20"]').focus();await page.keyboard.press('Enter');
    await page.screenshot({path:resolve(output,`board-${viewport.width}x${viewport.height}.png`)});
    const expectedExport=await page.locator('svg').evaluate(n=>new XMLSerializer().serializeToString(n));
    const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;await file.saveAs(resolve(output,`map-${viewport.width}.svg`));
    check(readFileSync(resolve(output,`map-${viewport.width}.svg`),'utf8')===expectedExport,'Export differs from actual map');
    await page.locator('#inspect').click();check(await page.locator('#inspector').isVisible(),'Topology inspector unreachable');
    check(await page.locator('#inspect').getAttribute('aria-expanded')==='true','Inspector ARIA state missing');
    await page.locator('#inspect').click();check(!(await page.locator('#inspector').isVisible()),'Topology inspector cannot close');
    for(const names of [['South rest','Fort town'],['Rock bay','Upper ridge']]){
      const ids=names.map(name=>board.provinces.find(p=>p.name.toLowerCase()===name.toLowerCase())?.id);
      const route=board.routes.find(r=>pair(r.from,r.to)===pair(...ids));check(!!route,'Missing corrected link '+names.join('/'));
      if(route){await page.locator(`[data-id="${ids[0]}"]`).focus();await page.keyboard.press('Enter');
       const clip=await page.locator('svg').evaluate((n,points)=>{const pts=points.map(pt=>new DOMPoint(...pt).matrixTransform(n.getScreenCTM()));const pad=70,x=Math.max(0,Math.min(...pts.map(p=>p.x))-pad),y=Math.max(0,Math.min(...pts.map(p=>p.y))-pad);return {x,y,width:Math.min(innerWidth-x,Math.max(...pts.map(p=>p.x))-x+pad),height:Math.min(innerHeight-y,Math.max(...pts.map(p=>p.y))-y+pad)};},route.points);
       await page.screenshot({path:resolve(output,`${names[0].replaceAll(' ','-')}-${viewport.width}.png`),clip});}
    }
    completed.push({viewport,countriesClicked:board.provinces.map(p=>p.id),countriesKeyboard:board.provinces.map(p=>p.id)});
    await page.close();
  }
} catch(error){failures.push(error.stack??error.message);} finally {await browser.close();}
if(completed.length!==3&&!failures.length)failures.push('All three viewports were not completed');
writeFileSync(resolve(output,'report.json'),JSON.stringify({accepted:!failures.length,failures,input,completed},null,2)+'\n');
console.log(JSON.stringify({accepted:!failures.length,failures,output},null,2));
if(failures.length)process.exitCode=1;
