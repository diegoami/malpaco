"""Actual-source omission controls; originals and every measured output survive."""
from pathlib import Path
import subprocess,tempfile,json,hashlib
root=Path(__file__).resolve().parent;repo=root.parents[3];out=Path(tempfile.mkdtemp(prefix='controls-',dir=root/'evidence'));target=repo/'src/core/island-geography.ts';original=target.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();(out/'original-source.txt').write_bytes(original);records=[]
cases=[('no-subdivision-exchange','flipSubdivisions(geography,rng);','', ['npx','vitest','run','tests/core/island-geography.test.ts']),('no-coast-warp','warp(geography,rng);','',['npx','vitest','run','tests/core/island-geography.test.ts']),('no-port-repair','repairReservations(geography,rng);','',['node',str(root/'sweep.mjs')]),('ignored-attempt-budget','raw=options.attempts??MAX_ATTEMPTS','raw=MAX_ATTEMPTS',['npx','vitest','run','tests/core/island-geography.test.ts'])]
for label,old,new,command in cases:
 assert original.decode().count(old)==1
 mutated=original.decode().replace(old,new).encode();(out/(label+'-source.txt')).write_bytes(mutated)
 try:
  target.write_bytes(mutated);r=subprocess.run(['python3',str(root/'run-command.py'),'control-'+label,*command],cwd=repo,capture_output=True);(out/(label+'-output.txt')).write_bytes(r.stdout+r.stderr);records.append({'label':label,'command':command,'exit':r.returncode,'mutatedSha256':sha(mutated)})
 finally:
  target.write_bytes(original);assert target.read_bytes()==original
  if records:records[-1]['restoredExactly']=True
  (out/'report.json').write_text(json.dumps({'originalSha256':sha(original),'records':records},indent=2)+'\n')
 print(label,r.returncode,flush=True)
 assert r.returncode==1,label
print(out.relative_to(repo))
