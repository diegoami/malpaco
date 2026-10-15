import { readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync,readdirSync,openSync,closeSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const out=process.argv[2],mode=process.argv[3]??"full";
if(!out||existsSync(out))throw Error("Pass a fresh evidence directory");mkdirSync(out,{recursive:true});
const dir="docs/prototypes/computer";
const fixtures=Object.fromEntries(readdirSync(dir).filter(f=>f.startsWith("src__")&&f.endsWith(".txt")).map(f=>[f.slice(0,-4).replaceAll("__","/"),`${dir}/${f}`]));
const saved=new Map(Object.keys(fixtures).map(f=>[f,existsSync(f)?readFileSync(f):null]));
const regression="tests/e2e/match-save.spec.ts",regressionBytes=readFileSync(regression);saved.set(regression,regressionBytes);
const records=[],hash=b=>b===null?null:createHash("sha256").update(b).digest("hex");
function run(name,command,green){const fd=openSync(`${out}/${name}.txt`,"wx");let r;try{r=spawnSync("sh",["-c",command],{env:{...process.env,COMPUTER_EVIDENCE_DIR:out},stdio:["ignore",fd,fd]});}finally{closeSync(fd);}records.push({name,command,exit:r.status});console.log(name,r.status);if((r.status===0)!==green)throw Error(`${name}: unexpected exit ${r.status}`);}
const unit="npx vitest run tests/core/computer.test.ts",browser="npx playwright test tests/e2e/computer.spec.ts --workers=2";
try{
 run("baseline-unit",unit,false);
 if(mode!=="unit"){
  // Provide the absent import only while probing the absent setup control, so
  // the browser fails on real missing UI rather than a bundler import failure.
  writeFileSync("src/core/computer.ts",readFileSync(fixtures["src/core/computer.ts"]));
  run("baseline-browser","npx playwright test tests/e2e/computer.spec.ts --grep 'setup offers computer opponents' --workers=2",false);
 }
 for(const[f,p]of Object.entries(fixtures))writeFileSync(f,readFileSync(p));
 // T17's only obsolete assertion was rejecting a valid computer-seat save.
 const old="JSON.stringify({version:1,options:defaultOptions(),actions:[]})";
 if(!regressionBytes.toString().includes(old))throw Error("obsolete T17 assertion missing");
 writeFileSync(regression,regressionBytes.toString().replace(old,"JSON.stringify({version:1,options:defaultOptions(),actions:[{kind:'teleport'}]})"));
 run("candidate-unit",unit,true);run("candidate-build","npm run build",true);
 if(mode!=="unit"){
  run("candidate-browser",browser,true);
  run("affected-goldens","npx playwright test tests/e2e/generated-game.spec.ts tests/e2e/game-setup.spec.ts --workers=2 --update-snapshots",true);
  run("all-unit","npm test",true);run("all-browser","npx playwright test --workers=2",true);
  const file="src/ui/app.ts",original=readFileSync(file);
  const mutations=[
   ["automation","if (this.disposed || this.computerTimer !== null || !this.isComputerTurn()) return;","return;", "setup clicks"],
   ["input-gating",'if (this.state.phase === "finished" || this.isComputerTurn()) return;', 'if (this.state.phase === "finished") return;', "setup clicks"],
   ["cancellation","if (this.computerTimer !== null) clearTimeout(this.computerTimer);","// cancellation omitted", "load replacement"]
  ];
  for(const[name,old,next,focus]of mutations){if(!original.toString().includes(old))throw Error(`mutation missing ${name}`);try{writeFileSync(file,original.toString().replace(old,next));run(`mutant-${name}`,`${browser} --grep '${focus}'`,false);}finally{writeFileSync(file,original);}}
  run("restored-browser",browser,true);
 }
}finally{
 for(const[f,b]of saved){if(b===null){if(existsSync(f))unlinkSync(f);}else writeFileSync(f,b);}
 writeFileSync(`${out}/manifest.json`,JSON.stringify({mode,records,restored:[...saved].map(([file,b])=>({file,before:hash(b),after:hash(existsSync(file)?readFileSync(file):null)}))},null,2)+"\n",{flag:"wx"});
}
