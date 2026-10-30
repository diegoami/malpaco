import {spawnSync,execFileSync} from 'node:child_process';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {manualFiles} from './render.mjs';

const selected=['launcher','map','phone','attack','capture','cards','event','results'];
const output=resolve('artifacts/player-manual'),capture=resolve('artifacts/T151/capture');
// The first run has no curated images yet: capture tests do not visit the guide.
const args=['playwright','test','tests/e2e/player-manual.spec.ts','--project=1280x800','--workers=1','--grep','capture'];
const result=spawnSync('npx',args,{stdio:'inherit',env:{...process.env,MANUAL_CAPTURE_DIR:capture}});
if(result.status!==0)process.exit(result.status??1);
mkdirSync('docs/manual-images',{recursive:true});
for(const name of selected)cpSync(`${capture}/${name}.png`,`docs/manual-images/${name}.png`);
mkdirSync(output,{recursive:true});
for(const f of manualFiles()){const name=f.name.replace(/^manual\//,'');mkdirSync(resolve(output,name,'..'),{recursive:true});writeFileSync(resolve(output,name),f.content);}
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest={schema:1,version:JSON.parse(readFileSync('package.json','utf8')).version,sourceCommit:sha,capturedAt:new Date().toISOString(),dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0,
 command:'npm run manual:refresh',browser:execFileSync('npx',['playwright','--version'],{encoding:'utf8'}).trim(),viewport:{desktop:[1280,800],phone:[390,844]},
 sources:Object.fromEntries(['docs/play.md','src/ui/help.ts','src/ui/buttonLabels.ts','src/ui/nextGameSettings.ts','src/ui/gameLauncher.ts','src/ui/provinceAction.ts','src/ui/textCommands.ts','src/ui/referenceBattleGame.ts','src/styles.css','tests/e2e/player-manual.spec.ts','tests/e2e/event-fixture.ts','vite.config.ts','tools/manual/render.mjs','tools/manual/refresh.mjs'].map(name=>[name,createHash('sha256').update(readFileSync(name)).digest('hex')])),
 files:Object.fromEntries(manualFiles().map(f=>[f.name.replace(/^manual\//,''),createHash('sha256').update(f.content).digest('hex')]))};
writeFileSync(`${output}/PROVENANCE.json`,JSON.stringify(manifest,null,2)+'\n');
writeFileSync('docs/manual-images/PROVENANCE.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Selected illustrations refreshed; offline manual: ${output}/index.html. Review all images before committing.`);
