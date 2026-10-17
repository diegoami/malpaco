from pathlib import Path
import subprocess,time,json,hashlib,tempfile,tarfile
E=Path(__file__).resolve().parent;R=Path(tempfile.mkdtemp(prefix='validation-',dir=E));out=[]
inputs=[Path(x) for x in subprocess.check_output(['git','ls-files','src','tests','data','tools/harness','package.json','harness.json','docs/harness-claude.md'],text=True).splitlines() if Path(x).is_file()]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
(R/'inputs.json').write_text(json.dumps(before,indent=2)+'\n')
with tarfile.open(R/'inputs.tar.gz','w:gz') as t:
 for p in inputs:t.add(p,arcname=str(p))
for name,args in [('selftest',['node','tools/harness/review.mjs','--self-test']),('units',['npm','test']),('build',['npm','run','build']),('whitespace',['git','diff','--check'])]:
 start=time.monotonic()
 with (R/(name+'.log')).open('wb') as f:p=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
 out.append({'name':name,'exit':p.returncode,'seconds':round(time.monotonic()-start,3),'sha256':hashlib.sha256((R/(name+'.log')).read_bytes()).hexdigest()});print(json.dumps(out[-1]),flush=True)
(R/'report.json').write_text(json.dumps(out,indent=2)+'\n')
stable=all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in before.items())
(R/'stability.json').write_text(json.dumps({'source_stable':stable})+'\n')
raise SystemExit(0 if stable and all(x['exit']==0 for x in out) else 1)
