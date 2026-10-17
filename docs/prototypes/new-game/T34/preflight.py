from pathlib import Path
import subprocess,tempfile,json,hashlib
root=Path(__file__).resolve().parent;repo=root.parents[3];out=Path(tempfile.mkdtemp(prefix='mock-preflight-',dir=root/'evidence'));target=repo/'src/core/island-geography.ts';original=target.read_bytes();candidate=(root/'candidate.ts').read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();(out/'stub-source.txt').write_bytes(original);(out/'candidate-source.txt').write_bytes(candidate);records=[]
try:
 target.write_bytes(candidate)
 for label,command in [('mock-units',['npx','vitest','run','tests/core/island-geography.test.ts']),('mock-build',['npm','run','build']),('mock-sweep',['node',str(root/'sweep.mjs')])]:
  result=subprocess.run(['python3',str(root/'run-command.py'),label,*command],cwd=repo,capture_output=True)
  (out/(label+'-output.txt')).write_bytes(result.stdout+result.stderr);records.append({'command':command,'exit':result.returncode,'output':label+'-output.txt'});print(label,result.returncode,flush=True)
  if result.returncode:break
finally:
 target.write_bytes(original)
 assert target.read_bytes()==original
 (out/'report.json').write_text(json.dumps({'originalSha256':sha(original),'candidateSha256':sha(candidate),'restoredExactly':True,'commands':records},indent=2)+'\n')
print(out.relative_to(repo));raise SystemExit(0 if len(records)==3 and all(r['exit']==0 for r in records)else 1)
