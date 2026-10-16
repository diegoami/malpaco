import { readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { audit, failures } from './audit.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const input=resolve(process.argv[2]??`${root}/board.json`);
const parent=resolve(root,'evidence');mkdirSync(parent,{recursive:true});
const output=mkdtempSync(resolve(parent,'verify-'));
let report;
try {
  const bytes=readFileSync(input),board=JSON.parse(bytes);
  report={input,sha256:createHash('sha256').update(bytes).digest('hex'),...audit(board)};
  report.failures=failures(report);report.accepted=!report.failures.length;
} catch(error) {report={accepted:false,failures:[error.message]};}
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,failures:report.failures,output},null,2));
if(!report.accepted)process.exitCode=1;
