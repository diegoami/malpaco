"""Three bounded review guards, actual omissions, exact saved-byte finally restoration."""
from pathlib import Path
import subprocess,json,hashlib,time,datetime
repo=Path.cwd();root=repo/'docs/prototypes/new-game/T36';out=root/'evidence/rework-native1';sha=lambda b:hashlib.sha256(b).hexdigest()
sources={str(p.relative_to(repo)):p.read_bytes() for p in (repo/'src').rglob('*') if p.is_file()}
frozen=json.loads((root/'parent-preflight/parent-acceptance/frozen-acceptance.json').read_text())['frozenAcceptance']
controls=[('keyboard','src/ui/geographicMapView.ts',"if(e.key==='Enter'||e.key===' ')","if(e.key==='__omitted__')",'active geographic Enter'),('versioned-load','src/ui/referenceMatchFiles.ts','(!allowVersionedMaps && loaded.identity.boardGenerator.id !== "fixed-reference")','(false && loaded.identity.boardGenerator.id !== "fixed-reference")','explicit reference rejects'),('responsive','src/styles.css',':is(#reference-game, #geographic-game)','#reference-game','responsive layout')]
results=[]
for name,path,old,new,grep in controls:
 saved=(repo/path).read_bytes();text=saved.decode();assert old in text
 mutated=text.replace(old,new).encode();control=out/name;control.mkdir(exist_ok=True)
 (control/'original').write_bytes(saved);(control/'omitted').write_bytes(mutated)
 prefix='rework1-omit-'+name
 command=['python3',str(root/'run-browser.py'),prefix,'--suites','tests/e2e/geographic-review-guards.spec.ts','--grep',grep]
 print(json.dumps({'phase':'omission','name':name,'command':command}),flush=True)
 try:
  (repo/path).write_bytes(mutated)
  with (control/'wrapper-stdout.txt').open('wb') as log:
   child=subprocess.Popen(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
   while child.poll() is None:
    files=list((root/'evidence').glob(prefix+'-*/raw/output.txt'))
    if files:
     link=out/'current-actual-output.txt'
     if link.is_symlink():link.unlink()
     link.symlink_to(files[0].resolve());break
    time.sleep(.1)
   code=child.wait()
 finally:
  (repo/path).write_bytes(saved)
  assert (repo/path).read_bytes()==saved
 report_path=next((root/'evidence').glob(prefix+'-*/report.json'));r=json.loads(report_path.read_text());tail=r['outputTail']
 assert code==1 and r['exit']==1 and '2 failed' in tail and 'Error: expect' in tail,(name,code,tail)
 assert 'Test timeout of 30000ms' not in tail and 'SyntaxError' not in tail and 'TypeError:' not in tail,tail
 assert r['sourcesUnchangedDuringRun']
 results.append({'name':name,'path':path,'originalSha256':sha(saved),'omittedSha256':sha(mutated),'report':str(report_path.relative_to(repo)),'reportSha256':sha(report_path.read_bytes()),'expectedFail':True,'classification':'Two executed assertion failures, no collection/fixture/type error','restoredExactly':True})
 assert all((repo/p).read_bytes()==b for p,b in sources.items())
 assert all(sha((repo/p).read_bytes())==h for p,h in frozen.items())
 print(json.dumps({'phase':'restored','name':name,'assertionFailures':2}),flush=True)
(out/'controls-report.json').write_text(json.dumps({'endedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':results,'allSensitive':True,'allRuntimeRestored':True,'frozenAcceptanceUnchanged':True,'runtimeHashes':{p:sha(b) for p,b in sources.items()}},indent=2)+'\n')
