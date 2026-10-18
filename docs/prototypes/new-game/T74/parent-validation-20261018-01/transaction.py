from pathlib import Path
import json,hashlib,subprocess,os,shutil,time,signal,sys
root=Path.cwd();out=Path(__file__).resolve().parent;rel=out.relative_to(root);env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
git=lambda *args:subprocess.check_output(['git',*args],env=env).decode().strip()
providers=['generatedGeographyPresentation.ts','generatedGeographyPresentation.worker.ts','generatedGeographyPresentationService.ts'];targets=[root/'src/ui'/n for n in providers];canonical=root/'docs/prototypes/new-game/T74/production-candidate/src/ui'
freeze=json.loads((root/'docs/prototypes/new-game/T74/acceptance/FROZEN-ACCEPTANCE.json').read_text());canonicalHashes={str(canonical/n):sha(canonical/n) for n in providers}
assert all(not p.exists() for p in targets),'Actual provider existed before validation'
assert all(sha(root/p)==h for p,h in freeze['inputs'].items()),'Parent frozen input mismatch'
paths={root/p for p in git('ls-files','-z').split('\0') if p}
for base in ['src','tests','data','tools','docs/tasks','docs/prototypes/new-game/T74']:
 paths.update(p for p in (root/base).rglob('*') if p.is_file() and not p.is_relative_to(out))
paths.update(p for p in root.iterdir() if p.is_file());paths={p for p in paths if p.is_file()}
before={str(p.relative_to(root)):{'sha256':sha(p),'mode':p.stat().st_mode&0o777} for p in sorted(paths)}
indexPath=Path(git('rev-parse','--git-path','index'));head=git('rev-parse','HEAD');index=sha(indexPath);status=subprocess.check_output(['git','status','--porcelain=v1'],env=env).decode()
(out/'input-manifest.json').write_text(json.dumps({'head':head,'index':index,'status':status,'canonicalHashes':canonicalHashes,'frozenAcceptance':sha(root/'docs/prototypes/new-game/T74/acceptance/FROZEN-ACCEPTANCE.json'),'files':before},indent=2));print('Snapshot complete:',len(before),'files; providers absent',flush=True)
backup=out/'saved-preexisting';backup.mkdir()
for name in before:
 if name.startswith(('src/','tests/','data/','tools/','docs/tasks/','docs/prototypes/new-game/T74/acceptance/','docs/prototypes/new-game/T74/production-candidate/')) or '/' not in name:
  dest=backup/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,dest)
cache=root/'node_modules/.vite';cacheExisted=cache.exists();cacheSaved=out/'saved-vite-cache'
if cacheExisted:shutil.copytree(cache,cacheSaved)
dist=root/'dist';distExisted=dist.exists();distSaved=out/'saved-dist'
if distExisted:shutil.copytree(dist,distSaved)
active=[];results={};created=[]
def stop_on_signal(signum,frame):raise KeyboardInterrupt('Validation interrupted')
signal.signal(signal.SIGTERM,stop_on_signal)
def run(name,command):
 unit='mlp-t74-parent-'+name+'-20261018-01';receipt=out/(name+'-result.json');log=rel/(name+'.log')
 launch=['tools/harness/run-unit.sh',unit.removeprefix('mlp-'),str(log),'--','python3',str(rel/'run-command.py'),name,*command]
 subprocess.run(launch,check=True);active.append(unit);print('Running',name,command,flush=True)
 deadline=time.monotonic()+1800
 while not receipt.exists():
  if time.monotonic()>deadline:raise RuntimeError(name+' exceeded bounded30minute job limit')
  time.sleep(2)
 result=json.loads(receipt.read_text());results[name]=result;active.remove(unit);print('Completed',name,result,flush=True);return result['exit']
error=None
try:
 baseline=run('baseline',['npx','vitest','run','tests/ui/generated-geography-presentation.test.ts','tests/ui/generated-geography-presentation-service.test.ts'])
 assert baseline!=0,'Unexpected baseline pass without providers'
 assert all(not p.exists() for p in targets),'Baseline wrote provider source'
 # This is an expected missing-module detector; retain exact import-failure output.
 baselineLog=(out/'baseline.log').read_text();assert 'generatedGeographyPresentation' in baselineLog and ('Failed to load' in baselineLog or 'Cannot find' in baselineLog),'Unexpected baseline failure class'
 for target in targets:
  source=canonical/target.name;shutil.copy2(source,target);created.append(target);assert sha(target)==canonicalHashes[str(source)]
 (out/'temporary-provider-hashes.json').write_text(json.dumps({str(p.relative_to(root)):{'sha256':sha(p),'mode':p.stat().st_mode&0o777} for p in targets},indent=2))
 assert run('npm-test',['npm','test'])==0,'npm test failed; no retry or build'
 assert run('build',['npm','run','build'])==0,'Build failed; no retry'
except BaseException as e:
 error=repr(e);print('STOP:',error,flush=True)
finally:
 for unit in active:subprocess.run(['systemctl','--user','stop',unit],check=False)
 for p in created:
  if p.exists():p.unlink()
 # Preserve build artifacts as owned measurement output, restoring any preexisting dist exactly.
 if dist.exists():shutil.move(str(dist),str(out/'build-output'))
 if distExisted:shutil.copytree(distSaved,dist)
 if cache.exists():shutil.rmtree(cache)
 if cacheExisted:shutil.copytree(cacheSaved,cache)
 restored=[]
 for name,expected in before.items():
  p=root/name
  if (not p.exists() or sha(p)!=expected['sha256'] or (p.stat().st_mode&0o777)!=expected['mode']) and (backup/name).is_file():
   p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(backup/name,p);restored.append(name)
 changed=[]
 for name,expected in before.items():
  p=root/name
  if not p.is_file() or sha(p)!=expected['sha256'] or p.stat().st_mode&0o777!=expected['mode']:changed.append(name)
 final={'results':results,'error':error,'providersOriginallyAbsent':True,'providersRemoved':all(not p.exists() for p in targets),'restoredPreexistingFiles':restored,'changedPreexistingFiles':changed,'protectedFileCount':len(before),'headBefore':head,'headAfter':git('rev-parse','HEAD'),'indexBefore':index,'indexAfter':sha(indexPath),'canonicalHashesBefore':canonicalHashes,'canonicalHashesAfter':{str(canonical/n):sha(canonical/n) for n in providers},'frozenAcceptanceExact':all(sha(root/p)==h for p,h in freeze['inputs'].items()),'distOriginallyPresent':distExisted,'distRestored':dist.exists()==distExisted,'cacheOriginallyPresent':cacheExisted,'cacheRestored':cache.exists()==cacheExisted}
 final['restored']=not changed and final['providersRemoved'] and final['headBefore']==final['headAfter'] and final['indexBefore']==final['indexAfter'] and final['canonicalHashesBefore']==final['canonicalHashesAfter'] and final['frozenAcceptanceExact'] and final['distRestored']
 (out/'restoration.json').write_text(json.dumps(final,indent=2));print(json.dumps(final),flush=True)
if error or not final['restored']:sys.exit(1)
