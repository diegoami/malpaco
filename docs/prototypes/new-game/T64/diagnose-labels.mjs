import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {html} from './render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const output=fs.mkdtempSync(path.join(root,'evidence/label-diagnose-'));
const board=JSON.parse(fs.readFileSync(path.join(root,'acceptance/board.json')));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:540}}),results=[];
 await page.setContent(html(board));
 for(const id of ['province_41','province_16']){
  await page.locator(`[data-id="${id}"]`).click();
  results.push({activated:id,labels:await page.evaluate(()=>({focused:document.activeElement?.getAttribute('data-id'),nodes:[...document.querySelectorAll('.country')].filter(n=>['province_41','province_16'].includes(n.dataset.id)).map(n=>{
   const label=n.querySelector('.country-label'),b=label.getBBox();return{id:n.dataset.id,selected:n.classList.contains('selected'),hover:n.matches(':hover'),focus:n.matches(':focus'),font:getComputedStyle(n.querySelector('.name')).font,bounds:{x:b.x,y:b.y,width:b.width,height:b.height},countY:n.querySelector('.count').getAttribute('y')};
  })}))});
  await page.screenshot({path:path.join(output,id+'.png')});
 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(results,null,2)+'\n');
 fs.copyFileSync(fileURLToPath(import.meta.url),path.join(output,'script-input.mjs'));
 console.log(JSON.stringify({output,results}));
}finally{await browser.close();}
