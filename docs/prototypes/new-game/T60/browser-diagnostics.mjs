import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {contained} from '../T24/geometry.mjs';
const root=dirname(fileURLToPath(import.meta.url)),study=JSON.parse(readFileSync(resolve(root,'study.json'))),output=mkdtempSync(resolve(root,'evidence/browser-'));
const browser=await chromium.launch({headless:true}),failures=[],results=[];
try {
 for(const viewport of [{width:800,height:540},{width:1280,height:800}]) {
  for(const entry of study.entries) {
   const page=await browser.newPage({viewport});page.on('pageerror',e=>failures.push({entry:entry.id,error:e.message}));
   await page.goto(pathToFileURL(resolve(root,entry.html)).href);
   const board=JSON.parse(readFileSync(resolve(root,entry.board))),labels=await page.locator('.country').evaluateAll(nodes=>nodes.map(n=>{const b=n.querySelector('.country-label').getBBox();return {id:n.dataset.id,box:[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]],countFont:getComputedStyle(n.querySelector('.count')).fontSize};}));
   const outside=labels.filter(l=>!contained(l.box,board.provinces.find(p=>p.id===l.id).polygon)).map(l=>board.provinces.find(p=>p.id===l.id).name);
   const p=board.provinces.find(p=>p.name==='South rest');await page.locator(`[data-id="${p.id}"]`).click();
   const selected=await page.locator('.country.selected').getAttribute('data-id'),neighbours=await page.locator('.country.neighbor').count(),active=await page.locator('.lane.active').count();
   if(selected!==p.id||neighbours!==p.borders.length+p.seaLanes.length||active!==p.seaLanes.length)failures.push({entry:entry.id,kind:'Selection mismatch',selected,neighbours,active});
   results.push({id:entry.id,viewport,renderedLabelBoxesOutsideCountry:outside,countFonts:[...new Set(labels.map(l=>l.countFont))],selected,neighbours,active});await page.close();
  }
  const page=await browser.newPage({viewport});await page.goto(pathToFileURL(resolve(root,study.gates)).href);await page.screenshot({path:resolve(output,`gates-${viewport.width}x${viewport.height}.png`)});results.push({id:'gates',viewport,pairedMarkers:await page.locator('.gate-label').count()});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1100,height:940}});
 await page.goto(pathToFileURL(resolve(root,'comparison.html')).href);
 for(const id of ['baseline','coast-first','contact-dual','gates','ports-only']) {
  await page.locator(`button[data-map="${id}"]`).click();
  const expected={baseline:'Baseline · T59','coast-first':'A · Coast-first templates','contact-dual':'B · Graph contact dual',gates:'C · Explicit paired shore gates','ports-only':'D · Ports-only ablation'}[id];
  await expect(page.frameLocator('#map').locator('h1')).toHaveText(expected);
  await expect(page.frameLocator('#map').locator('.country')).toHaveCount(46);
  await expect(page.frameLocator('#map').locator('.lane')).toHaveCount(15);
 }
 await page.locator('button[data-map="coast-first"]').click();await expect(page.frameLocator('#map').locator('h1')).toHaveText('A · Coast-first templates');
 await page.screenshot({path:resolve(output,'comparison.png'),fullPage:true});results.push({id:'comparison',workingViews:5,frame:[800,540]});await page.close();
} catch(error){failures.push({error:error.stack??error.message});}finally{await browser.close();}
writeFileSync(resolve(output,'report.json'),JSON.stringify({accepted:!failures.length,failures,results},null,2)+'\n');console.log(JSON.stringify({accepted:!failures.length,output,failures},null,2));if(failures.length)process.exitCode=1;
