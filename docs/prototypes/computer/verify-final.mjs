import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
const out=process.argv[2];if(!out||existsSync(out))throw Error("Pass a fresh evidence directory");mkdirSync(out,{recursive:true});
const file="src/ui/app.ts",original=readFileSync(file),records=[];
const hash=b=>createHash("sha256").update(b).digest("hex");
function run(name,command,green){const fd=openSync(`${out}/${name}.txt`,"wx");let r;try{r=spawnSync("sh",["-c",command],{env:{...process.env,COMPUTER_EVIDENCE_DIR:out},stdio:["ignore",fd,fd]});}finally{closeSync(fd);}records.push({name,command,exit:r.status});console.log(name,r.status);if((r.status===0)!==green)throw Error(`${name}: unexpected exit ${r.status}`);}
const unit="npx vitest run tests/core/computer.test.ts",browser="npx playwright test tests/e2e/computer.spec.ts --workers=2";
try{
 run("computer-unit",unit,true);run("computer-browser",browser,true);
 run("all-unit","npm test",true);run("build","npm run build",true);run("all-browser","npx playwright test --workers=2",true);
 const mutations=[
  ["automation","if (this.disposed || this.computerTimer !== null || !this.isComputerTurn()) return;","return;","setup clicks"],
  ["input-gating",'if (this.state.phase === "finished" || this.isComputerTurn()) return;','if (this.state.phase === "finished") return;',"setup clicks"],
  ["cancellation","if (this.computerTimer !== null) clearTimeout(this.computerTimer);","// cancellation omitted","load replacement"]
 ];
 for(const[name,old,next,focus]of mutations){if(!original.toString().includes(old))throw Error(`mutation missing ${name}`);try{writeFileSync(file,original.toString().replace(old,next));run(`mutant-${name}`,`${browser} --grep '${focus}'`,false);}finally{writeFileSync(file,original);}}
 run("restored-browser",browser,true);
}finally{
 writeFileSync(file,original);
 writeFileSync(`${out}/manifest.json`,JSON.stringify({records,restored:{file,before:hash(original),after:hash(readFileSync(file))}},null,2)+"\n",{flag:"wx"});
}
