from pathlib import Path
import subprocess,tempfile,json,hashlib
D=Path(__file__).resolve().parent;R=D.parents[3];core=R/'src/core/island-geography.ts';original=core.read_bytes();out=Path(tempfile.mkdtemp(prefix='r1-controls-',dir=D/'evidence'));results=[]
mutations=[('omit-failure-history',b'failures.push({attempt,constraints,candidate:geography});',b'/* failure record omitted */'),('omit-attempt-clamp',b'Math.min(MAX_ATTEMPTS,Math.floor(raw))',b'Math.floor(raw)'),('return-after-first-rejection',b'failures.push({attempt,constraints,candidate:geography});',b'failures.push({attempt,constraints,candidate:geography});return {ok:false,attempts:attempt,failures,rng:rng.snapshot()};')]
for label,before,after in mutations:
 assert before in original
 try:
  core.write_bytes(original.replace(before,after))
  p=subprocess.run(['python3',str(D/'run-command.py'),label,'npx','vitest','run','tests/core/island-geography.test.ts'],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
  (out/(label+'.json')).write_text(json.dumps({'exit':p.returncode,'output':p.stdout},indent=2)+'\n');results.append({'mutation':label,'exit':p.returncode});assert p.returncode!=0
 finally:core.write_bytes(original)
 assert core.read_bytes()==original
for label,cmd in [('r1-final-units',['npm','test']),('r1-final-build',['npm','run','build'])]:
 p=subprocess.run(['python3',str(D/'run-command.py'),label,*cmd],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True);(out/(label+'.json')).write_text(json.dumps({'exit':p.returncode,'output':p.stdout},indent=2)+'\n');results.append({'command':label,'exit':p.returncode});assert p.returncode==0
(out/'report.json').write_text(json.dumps({'results':results,'core_restored':core.read_bytes()==original,'original_sha256':hashlib.sha256(original).hexdigest()},indent=2)+'\n');print(json.dumps({'out':str(out),'results':results}),flush=True)
