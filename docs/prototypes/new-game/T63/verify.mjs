import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {audit,failures} from './audit.mjs';
import {construct} from './construct.mjs';
const root=dirname(fileURLToPath(import.meta.url));
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/verify-'));
const hash=b=>createHash('sha256').update(b).digest('hex');let report;
try {
 const input=resolve(process.argv[2]??`${root}/board.json`),board=JSON.parse(readFileSync(input));
 report={input,...audit(board)};report.failures=failures(report);
 const reproduced=construct();report.reproduction={};
 for(const [name,bytes] of Object.entries(reproduced)){
  const actual=readFileSync(resolve(root,name));report.reproduction[name]={actual:hash(actual),reproduced:hash(bytes),equal:actual.equals(Buffer.from(bytes))};
  if(!report.reproduction[name].equal)report.failures.push(`Reproduction differs ${name}`);
 }
 report.sourceHashes=Object.fromEntries(['audit.mjs','construct.mjs','render.mjs','verify.mjs','browser.mjs','../T60/render.mjs','../T60/evidence/build-LrdPTV/coast-first.json','../T62/contract.mjs','../T62/parameters.mjs','../T24/contract.mjs','../T24/geometry.mjs','../T24/parameters.mjs'].map(name=>[name,hash(readFileSync(resolve(root,name)))]));
 report.accepted=report.failures.length===0;
}catch(e){report={accepted:false,failures:[e.message]};}
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,failures:report.failures,output},null,2));if(!report.accepted)process.exitCode=1;
