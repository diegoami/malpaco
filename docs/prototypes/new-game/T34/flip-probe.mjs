// Disposable T34 construction witness, after acceptance was locked. No production mutation.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {inspect} from '../T62/contract.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),out=fs.mkdtempSync(path.join(root,'evidence/flip-probe-'));
const input=JSON.parse(fs.readFileSync(path.join(root,'../T64/board.json'))),key=p=>JSON.stringify(p),owners=new Map(),edges=new Map();
for(const p of input.provinces)for(const[j,a]of p.polygon.entries()){
 if(!owners.has(key(a)))owners.set(key(a),[]);owners.get(key(a)).push(p.id);
 const b=p.polygon[(j+1)%p.polygon.length],k=[key(a),key(b)].sort().join('|');if(!edges.has(k))edges.set(k,{a,b,countries:[]});edges.get(k).countries.push(p.id);
}
const reports=[];
for(const edge of edges.values()){
 const{a,b,countries}=edge;if(countries.length!==2||owners.get(key(a)).length!==3||owners.get(key(b)).length!==3)continue;
 const r=owners.get(key(a)).find(id=>!countries.includes(id)),s=owners.get(key(b)).find(id=>!countries.includes(id));if(r===s)continue;
 if([r,s].some(id=>{const p=input.provinces.find(p=>p.id===id);return p.borders.length>=4||p.borders.length+p.seaLanes.length>=5;}))continue;
 const mid=a.map((x,j)=>(x+b[j])/2),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),snap=p=>p.map(x=>Math.round(x*1024)/1024);
 for(const half of [.125,.25,.5])for(const ro of [false,true])for(const so of [false,true]){
  const c=snap([mid[0]-dy/len*half,mid[1]+dx/len*half]),d=snap([mid[0]+dy/len*half,mid[1]-dx/len*half]);
  const board=structuredClone(input);
  for(const p of board.provinces){
   if(countries.includes(p.id)){const cross=dx*(p.labelAt[1]-a[1])-dy*(p.labelAt[0]-a[0]),v=cross>0?c:d;let used=false;p.polygon=p.polygon.flatMap(q=>{if(key(q)!==key(a)&&key(q)!==key(b))return[q];if(used)return[];used=true;return[v];});p.borders=p.borders.filter(id=>!countries.includes(id));}
   if(p.id===r||p.id===s){const old=p.id===r?a:b,reverse=p.id===r?ro:so;p.polygon=p.polygon.flatMap(q=>key(q)===key(old)?(reverse?[d,c]:[c,d]):[q]);p.borders.push(p.id===r?s:r);}
  }
  const checks=inspect(board),accepted=Object.values(checks).every(a=>!a.length),name=`candidate-${reports.length}.json`;
  fs.writeFileSync(path.join(out,name),JSON.stringify({edge:{a,b,countries,r,s},half,ro,so,accepted,checks,board},null,2)+'\n',{flag:'wx'});reports.push({name,accepted,edge:{a,b,countries,r,s},half,ro,so,checks});
  if(accepted)break;
 }
}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({command:process.argv,reports,accepted:reports.filter(r=>r.accepted).length},null,2)+'\n');console.log(JSON.stringify({out,accepted:reports.filter(r=>r.accepted).map(r=>({name:r.name,edge:r.edge,half:r.half,ro:r.ro,so:r.so})),total:reports.length}));
