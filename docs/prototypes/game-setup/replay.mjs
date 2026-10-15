import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
const out=process.argv[2];if(!out||existsSync(out))throw Error("Pass fresh evidence directory");mkdirSync(out,{recursive:true});
const dir="docs/prototypes/game-setup";
const fixtures={"src/main.ts":"main","src/ui/generatedGame.ts":"game","src/ui/palette.ts":"palette","src/styles.css":"styles"};
const saved=new Map(Object.keys(fixtures).map(f=>[f,existsSync(f)?readFileSync(f):null]));const records=[];
const hash=b=>b===null?null:createHash("sha256").update(b).digest("hex");
function run(name,command,green){const r=spawnSync("sh",["-c",command],{encoding:"utf8",env:{...process.env,SETUP_EVIDENCE_DIR:out},maxBuffer:20e6});writeFileSync(`${out}/${name}.txt`,(r.stdout??"")+(r.stderr??""),{flag:"wx"});records.push({name,command,exit:r.status});console.log(name,r.status);if((r.status===0)!==green)throw Error(`${name}: unexpected ${r.status}`);}
const browser="npx playwright test tests/e2e/game-setup.spec.ts --workers=2";
try{
 run("baseline-unit","npx vitest run tests/ui/game-setup.test.ts",false);
 run("baseline-browser",browser,false);
 for(const [f,fixture] of Object.entries(fixtures))writeFileSync(f,(f==="src/styles.css"?saved.get(f).toString():"")+readFileSync(`${dir}/${fixture}.mock.txt`,"utf8"));
 run("mock-unit","npx vitest run tests/ui/game-setup.test.ts",true);
 run("mock-browser",browser+" --update-snapshots",true);
 run("mock-build","npm run build",true);run("mock-all-unit","npm test",true);
 run("mock-all-browser","npx playwright test --workers=2",true);
 const path="src/ui/generatedGame.ts",original=readFileSync(path);
 const mutants=[
 ["seed", "const { seed, seats } = settings;", "const { seats } = settings; const seed = 1994;"],
 ["seats", "const { seed, seats } = settings;", "const { seed } = settings; const seats = 2;"]
 ];
 for(const [name,old,next] of mutants){if(!original.toString().includes(old))throw Error(`mutation missing ${name}`);try{writeFileSync(path,original.toString().replace(old,next));run(`mutant-${name}`,browser+' --grep "settings start exact"',false);}finally{writeFileSync(path,original);}}
 run("restored-browser",browser,true);
}finally{
 for(const[f,b]of saved){if(b===null){if(existsSync(f))unlinkSync(f);}else writeFileSync(f,b);}
 writeFileSync(`${out}/manifest.json`,JSON.stringify({records,restored:[...saved].map(([file,b])=>({file,before:hash(b),after:hash(existsSync(file)?readFileSync(file):null)}))},null,2)+"\n",{flag:"wx"});
}
