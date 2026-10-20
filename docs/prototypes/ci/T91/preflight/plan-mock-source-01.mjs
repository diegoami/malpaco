import {readFileSync,appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {classifyChanges} from './policy.mjs';
let mode='full';
try{
 const git=(...a)=>{const r=spawnSync('git',a,{encoding:'utf8'});if(r.status!==0)throw Error('git metadata');return r.stdout.trim();};
 if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),head=git('rev-parse','HEAD'),parents=git('rev-list','--parents','-n','1','HEAD').split(' ');
  if(head===process.env.GITHUB_SHA&&parents.length===3&&parents[1]===event.pull_request.base.sha&&parents[2]===event.pull_request.head.sha){
   const r=spawnSync('git',['diff','--no-renames','--name-status','-z',parents[1],head],{encoding:'utf8'});if(r.status!==0)throw Error('diff');const values=r.stdout.split('\0');if(values.pop()!=='')throw Error('incomplete diff');
   const files=[];for(let i=0;i<values.length;i+=2){if(!values[i+1])throw Error('bad diff');files.push({filename:values[i+1],status:({A:'added',M:'modified',D:'removed'})[values[i]]});}
   mode=classifyChanges({eventName:'pull_request',files,changedFiles:files.length,complete:true});
  }
 }
}catch{mode='full';}
appendFileSync(process.env.GITHUB_OUTPUT,'mode='+mode+'\n');console.log(mode);
