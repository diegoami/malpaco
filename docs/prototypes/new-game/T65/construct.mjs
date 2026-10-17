import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {naturalizeBorders} from './borders.mjs';
import {svg,html} from '../T64/render.mjs';
import {inspect} from '../T62/contract.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.join(root,'../T64/board.json'),input=JSON.parse(fs.readFileSync(source));
const semantics=b=>({...b,provinces:b.provinces.map(({polygon,...p})=>p)});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const board=naturalizeBorders(input),checks=inspect(board);
assert.deepEqual(semantics(board),semantics(input));
assert.deepEqual(checks,{attachment:[],water:[],traceability:[],preserved:[]});
for(let j=0;j<board.provinces.length;j++)for(const q of board.provinces.slice(j+1)){
 const p=board.provinces[j];assert(Math.abs(p.labelAt[0]-q.labelAt[0])>=44||Math.abs(p.labelAt[1]-q.labelAt[1])>=47,'Native selected-label reservation overlap');
}
const files={'board.json':JSON.stringify(board,null,2)+'\n','map.svg':svg(board),'preview.html':html(board)};
if(process.argv[2]==='--check'){
 for(const[name,content]of Object.entries(files))assert.equal(fs.readFileSync(path.join(root,name),'utf8'),content,`Stale generated ${name}`);
 console.log(JSON.stringify({accepted:true,mode:'check',countries:46,islands:9,routes:15,checks}));
}else{
 fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
 const output=process.argv[2]?path.resolve(process.argv[2]):fs.mkdtempSync(path.join(root,'evidence/build-'));
 if(process.argv[2])fs.mkdirSync(output); // Refuse an existing output; evidence is append-only.
 for(const[name,content]of Object.entries(files))fs.writeFileSync(path.join(output,name),content);
 const inputs={'T64-board.json':source,'borders-input.mjs':path.join(root,'borders.mjs'),'render-input.mjs':path.join(root,'../T64/render.mjs'),'construct-input.mjs':fileURLToPath(import.meta.url)};
 for(const[name,file]of Object.entries(inputs))fs.copyFileSync(file,path.join(output,name));
 const report={command:process.argv,accepted:true,checks,semanticIdentity:true,inputHashes:Object.fromEntries(Object.entries(inputs).map(([name,file])=>[name,sha(fs.readFileSync(file))])),outputHashes:Object.fromEntries(Object.entries(files).map(([name,text])=>[name,sha(text)]))};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({accepted:true,output:path.relative(process.cwd(),output),countries:46,islands:9,routes:15,checks}));
}
