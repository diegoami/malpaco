import {chromium} from 'playwright';
import fs from 'node:fs';
const output=process.argv[2];
if(!output||!fs.existsSync(output))throw Error('Pass a retained probe directory');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 for(const name of ['outward-amplitude-12','signed-amplitude-4']){
  await page.goto('file://'+process.cwd()+'/'+output+'/'+name+'.html');
  await page.screenshot({path:output+'/'+name+'.png'});
 }
}finally{await browser.close();}
