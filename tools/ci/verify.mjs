import assert from 'node:assert/strict';
import {scopedGit} from './git.mjs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {appendFileSync, existsSync, lstatSync, readFileSync, readlinkSync, writeFileSync, mkdirSync, mkdtempSync} from 'node:fs';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);
const evidenceRoot = join(root, 'docs/prototypes/ci/T91/runs');
mkdirSync(evidenceRoot, {recursive:true});
const evidence = mkdtempSync(join(evidenceRoot, 'verify-'));
const receipt = {schemaVersion:1, evidence:relative(root,evidence), commands:[], browserExecution:false};
function save(name, value) { writeFileSync(join(evidence,name), typeof value === 'string' ? value : JSON.stringify(value,null,2)+'\n', {flag:'wx'}); }
function run(name, executable, args, env=process.env) {
  const start = Date.now();
  const options = {cwd:root,encoding:'utf8',env,maxBuffer:64*1024*1024};
  const result = executable==='git' ? scopedGit(root,args,options) : spawnSync(executable,args,options);
  save(name+'.stdout.txt',result.stdout??''); save(name+'.stderr.txt',result.stderr??'');
  receipt.commands.push({name,command:executable==='git' ? ['git','-c',`safe.directory=${root}`,...args] : [executable,...args],exit:result.status,signal:result.signal,elapsedMs:Date.now()-start});
  assert.equal(result.status,0,`${name} failed; retained ${relative(root,evidence)}: ${result.error?.message??result.stderr}`);
  return result.stdout;
}
const omitted = path => /^docs\/.*\.(?:png|tar\.gz|tgz|zip|webm|mp4|pdf)$/.test(path) || /^docs\/.*\.(?:tar\.gz|tgz|zip)\.part[^/]*$/.test(path);
try {
  // Run the frozen semantic/wiring tests against the actual workflow, without a YAML dependency.
  const guards = run('guards',process.execPath,['--test',...run('guard-files','git',['ls-files','tests/tools/ci-*.test.mjs']).trim().split('\n')]);
  assert.match(guards,/fail 0/);
  const workflow = readFileSync('.github/workflows/ci.yml','utf8');
  const verifyJob = workflow.match(/^  verify:\n([\s\S]*?)(?=^  ci:)/m)?.[1];
  assert.ok(verifyJob,'Missing verify job');
  const sparse = verifyJob.match(/          sparse-checkout: \|\n((?:            .*\n)+)/)?.[1].split('\n').filter(Boolean).map(s=>s.slice(12));
  assert.deepEqual(sparse,['/*','!/docs/**/*.png','!/docs/**/*.tar.gz','!/docs/**/*.tgz','!/docs/**/*.zip','!/docs/**/*.webm','!/docs/**/*.mp4','!/docs/**/*.pdf','!/docs/**/*.tar.gz.part*','!/docs/**/*.tgz.part*','!/docs/**/*.zip.part*']);
  assert.equal((verifyJob.match(/node tools\/ci\/verify\.mjs/g)||[]).length,1);
  assert.doesNotMatch(verifyJob,/npm run build|package:playable|acceptance\.mjs/,'Packaging belongs to this verifier and runs once');
  assert.match(workflow,/CLASSIFICATION_RESULT: \$\{\{ needs\.plan\.result \}\}/);
  assert.match(workflow,/CI_MODE: \$\{\{ needs\.plan\.outputs\.mode \}\}/);
  assert.match(workflow,/VERIFICATION_RESULT: \$\{\{ needs\.verify\.result \}\}/);

  const head = run('head','git',['rev-parse','HEAD']).trim();
  if (process.env.GITHUB_SHA) assert.equal(head,process.env.GITHUB_SHA,'Checkout must match the workflow event SHA');
  receipt.head = head;
  const format = run('object-format','git',['rev-parse','--show-object-format']).trim();
  assert.ok(['sha1','sha256'].includes(format));
  const tree = run('tree','git',['ls-tree','-rlz','HEAD']);
  const retained = []; const exclusions = [];
  for (const entry of tree.split('\0').filter(Boolean)) {
    const match = /^(\d+) blob ([0-9a-f]+) +(\d+)\t([\s\S]+)$/.exec(entry);
    assert.ok(match,`Unsupported Git entry: ${entry.slice(0,100)}`);
    const [,mode,oid,sizeText,path] = match, size=Number(sizeText);
    if (omitted(path)) { exclusions.push({path,oid,size,present:existsSync(path)}); continue; }
    const stat = lstatSync(path);
    const bytes = mode==='120000' ? Buffer.from(readlinkSync(path)) : readFileSync(path);
    assert.ok(mode==='120000' ? stat.isSymbolicLink() : stat.isFile(),`Unexpected input kind: ${path}`);
    const actual = createHash(format).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(actual,oid,`Retained input differs from Git HEAD: ${path}; commit source changes before verification`);
    assert.equal(bytes.length,size,path);
    retained.push({path,oid,size});
  }
  save('retained-inputs.json',retained); save('omitted-evidence.json',exclusions);
  receipt.sparse = {presentExcludedFiles:exclusions.filter(f=>f.present).length,retainedFiles:retained.length,retainedBytes:retained.reduce((s,f)=>s+f.size,0),omittedFiles:exclusions.length,omittedBytes:exclusions.reduce((s,f)=>s+f.size,0)};
  // Follow local assets in the prototype HTML/SVG actually referenced by source/tests.
  // Other nonbinary docs stay present, including dynamically named JSON fixtures/modules.
  const pending = new Set(); const visited = new Set(); const assets=[];
  for (const {path} of retained.filter(f=>/^(?:src|tests)\//.test(f.path)&&/\.(?:ts|mjs)$/.test(f.path))) {
    const text=readFileSync(path,'utf8');
    for(const m of text.matchAll(/["'`]([^"'`\n]*?\.(?:html|svg)(?:\?raw)?)["'`]/g)) {
      const target=m[1].replace(/\?raw$/,'');
      if(target.includes('${')) continue;
      const resolved=target.startsWith('docs/')?resolve(root,target):resolve(dirname(resolve(root,path)),target);
      if(resolved.startsWith(root+'/docs/')) pending.add(resolved);
    }
  }
  while(pending.size) {
    const path=[...pending][0];pending.delete(path);if(visited.has(path))continue;visited.add(path);
    assert.ok(existsSync(path),`Missing tested prototype: ${relative(root,path)}`);
    const text=readFileSync(path,'utf8');
    for(const m of text.matchAll(/(?:\b(?:href|src)\s*=\s*["']([^"']+)["']|(?<![\w])url\(\s*["']?([^)'"\s]+))/gi)) {
      const value=(m[1]??m[2]).trim();
      if(!value || /^(?:#|data:|blob:|https?:|\/\/)/i.test(value))continue;
      const clean=value.split(/[?#]/)[0];if(!clean)continue;
      const target=clean.startsWith('/')?resolve(root,'.'+clean):resolve(dirname(path),clean);
      assert.ok(target.startsWith(root+'/'),`Prototype asset escapes checkout: ${value}`);
      assert.ok(!omitted(relative(root,target)),`Sparse exclusion removes a tested prototype asset: ${relative(root,target)}`);
      assert.ok(existsSync(target),`Missing prototype asset: ${relative(root,target)}`);
      assets.push({from:relative(root,path),to:relative(root,target)});
      if(['.html','.svg'].includes(extname(target)))pending.add(target);
    }
  }
  save('prototype-assets.json',{prototypes:[...visited].map(p=>relative(root,p)),assets});
  receipt.prototypeAssets={prototypes:visited.size,localAssets:assets.length};

  const extracted=mkdtempSync(join(tmpdir(),'malpaco-ci-package-'));
  run('package-acceptance',process.execPath,['docs/prototypes/playable/acceptance.mjs',extracted]);
  const build=JSON.parse(readFileSync(join(extracted,'malpaco-playable/BUILD.json'),'utf8'));
  assert.equal(build.sourceCommit,head,'Packaged source commit must be the real checkout HEAD');
  receipt.package={sourceCommit:build.sourceCommit,extracted};
  const env={...process.env,PLAYABLE_EXTRACTED_DIR:extracted};
  const source=JSON.parse(run('browser-source-inventory','npx',['playwright','test','--list','--reporter=json'],env));
  const release=JSON.parse(run('browser-release-inventory','npx',['playwright','test','--config','playwright.release.config.ts','--list','--reporter=json'],env));
  function identities(report) {
    assert.deepEqual(report.errors,[],'Browser discovery errors');
    const cases=[];
    function visit(suites,parents=[]) {
      for(const suite of suites??[]) {
        const titles=[...parents,suite.title];
        for(const spec of suite.specs??[])for(const test of spec.tests??[])cases.push(JSON.stringify({file:spec.file,line:spec.line,column:spec.column,titles:[...titles,spec.title],project:test.projectName}));
        visit(suite.suites,titles);
      }
    }
    visit(report.suites);assert.ok(cases.length>0);assert.equal(new Set(cases).size,cases.length,'Duplicate browser identity');return cases.sort();
  }
  const sourceIds=identities(source),releaseIds=identities(release);
  assert.deepEqual(releaseIds,sourceIds,'Source and extracted suite must discover identical cases/projects');
  save('browser-identities.json',sourceIds.map(JSON.parse));
  receipt.browserInventory={cases:sourceIds.length,projects:source.config.projects.map(p=>p.name),equal:true};
  assert.deepEqual(release.config.projects.map(p=>p.name),receipt.browserInventory.projects);
  // Keep standard release report paths so the workflow preserves failures from both servers.
  if(process.env.GITHUB_ENV)appendFileSync(process.env.GITHUB_ENV,`PLAYABLE_EXTRACTED_DIR=${extracted}\n`);
  receipt.passed=true;
  console.log(JSON.stringify(receipt,null,2));
} catch(error) {
  receipt.passed=false;receipt.error=error.stack;console.error(error.stack);process.exitCode=1;
} finally {
  save('receipt.json',receipt);
  const names=scopedGit(root,['status','--short'],{encoding:'utf8'}).stdout;
  save('working-tree.txt',names??'');
  console.log(`Verification evidence: ${relative(root,evidence)}`);
}
