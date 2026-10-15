import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
const out=process.argv[2];if(!out||existsSync(out))throw Error("Pass a fresh evidence directory");mkdirSync(out,{recursive:true});
const dir="docs/prototypes/match-save";
const fixtures={"src/core/match-save.ts":"core","src/ui/app.ts":"app","src/ui/generatedGame.ts":"game","src/styles.css":"styles"};
const saved=new Map(Object.keys(fixtures).map(f=>[f,existsSync(f)?readFileSync(f):null]));const records=[];
const hash=b=>b===null?null:createHash("sha256").update(b).digest("hex");
function run(name,command,green){const r=spawnSync("sh",["-c",command],{encoding:"utf8",env:{...process.env,MATCH_SAVE_EVIDENCE_DIR:out},maxBuffer:20e6});writeFileSync(`${out}/${name}.txt`,(r.stdout??"")+(r.stderr??""),{flag:"wx"});records.push({name,command,exit:r.status});console.log(name,r.status);if((r.status===0)!==green)throw Error(`${name}: unexpected ${r.status}`);}
const unit="npx vitest run tests/core/match-save.test.ts",browser="npx playwright test tests/e2e/match-save.spec.ts --workers=2";
try{
 run("baseline-unit",unit,false);
 writeFileSync("src/core/match-save.ts",readFileSync(`${dir}/core.mock.txt`));
 run("baseline-browser",browser,false);
 for(const[f,fixture]of Object.entries(fixtures))writeFileSync(f,(f==="src/styles.css"?saved.get(f).toString():"")+readFileSync(`${dir}/${fixture}.mock.txt`,"utf8"));
 run("mock-unit",unit,true);run("mock-build","npm run build",true);run("mock-browser",browser,true);
 // Only existing generated/setup snapshots may change for the added local controls.
 run("mock-affected-goldens","npx playwright test tests/e2e/generated-game.spec.ts tests/e2e/game-setup.spec.ts --workers=2 --update-snapshots",true);
 run("mock-all-unit","npm test",true);run("mock-all-browser","npx playwright test --workers=2",true);
 const path="src/core/match-save.ts",original=readFileSync(path);
 const mutants=[
 ["replay-omitted","state = result.state;","// omitted state replay"],
 ["illegal-accepted","if (!result.ok) throw new SaveFormatError(`Cannot replay action ${i + 1}: ${result.error}. Choose an intact game file.`, `actions[${i}]`);","if (!result.ok) continue;"]
 ];
 for(const[name,old,next]of mutants){if(!original.toString().includes(old))throw Error(`mutation missing ${name}`);try{writeFileSync(path,original.toString().replace(old,next));run(`mutant-${name}`,unit,false);}finally{writeFileSync(path,original);}}
 run("restored-unit",unit,true);run("restored-browser",browser,true);
}finally{
 for(const[f,b]of saved){if(b===null){if(existsSync(f))unlinkSync(f);}else writeFileSync(f,b);}
 writeFileSync(`${out}/manifest.json`,JSON.stringify({records,restored:[...saved].map(([file,b])=>({file,before:hash(b),after:hash(existsSync(file)?readFileSync(file):null)}))},null,2)+"\n",{flag:"wx"});
}
