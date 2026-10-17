from pathlib import Path
import subprocess,tempfile,json,hashlib
D=Path(__file__).resolve().parent;R=D.parents[3];core=R/'src/core/island-geography.ts';original=core.read_bytes();candidate=(D/'family-candidate.ts').read_bytes();out=Path(tempfile.mkdtemp(prefix='r2-mock-',dir=D/'preflight'));locked={p:p.read_bytes() for p in [R/'tests/core/island-geography.test.ts',D/'sweep.mjs']};results=[]
try:
 core.write_bytes(candidate)
 checks=[('mock-r2-focused',['python3',str(D/'run-command.py'),'mock-r2-focused','npx','vitest','run','tests/core/island-geography.test.ts']),('mock-r2-sweep',['python3',str(D/'run-command.py'),'mock-r2-sweep','node','docs/prototypes/new-game/T34/sweep.mjs']),('mock-r2-all',['python3',str(D/'run-command.py'),'mock-r2-all','npm','test']),('mock-r2-build',['python3',str(D/'run-command.py'),'mock-r2-build','npm','run','build']),('mock-r2-browser',['python3',str(D/'run-browser.py'),'mock-r2-browser','--suites','tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts'])]
 for label,cmd in checks:
  with (out/(label+'.txt')).open('w')as f:p=subprocess.run(cmd,cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=1800)
  results.append({'label':label,'exit':p.returncode});print(json.dumps(results[-1]),flush=True)
  if p.returncode:break
finally:core.write_bytes(original)
assert core.read_bytes()==original and all(p.read_bytes()==b for p,b in locked.items())
(out/'report.json').write_text(json.dumps({'results':results,'core_restored':True,'original_sha256':hashlib.sha256(original).hexdigest(),'candidate_sha256':hashlib.sha256(candidate).hexdigest(),'acceptance_locked':True},indent=2)+'\n');assert len(results)==5 and all(r['exit']==0 for r in results)
