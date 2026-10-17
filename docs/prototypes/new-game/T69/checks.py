from pathlib import Path
import subprocess,time,json,hashlib,tempfile
E=Path(__file__).resolve().parent;R=Path(tempfile.mkdtemp(prefix='validation-',dir=E));out=[]
for name,args in [('selftest',['node','tools/harness/review.mjs','--self-test']),('units',['npm','test']),('build',['npm','run','build']),('whitespace',['git','diff','--check'])]:
 start=time.monotonic()
 with (R/(name+'.log')).open('wb') as f:p=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
 out.append({'name':name,'exit':p.returncode,'seconds':round(time.monotonic()-start,3),'sha256':hashlib.sha256((R/(name+'.log')).read_bytes()).hexdigest()});print(json.dumps(out[-1]),flush=True)
(R/'report.json').write_text(json.dumps(out,indent=2)+'\n')
raise SystemExit(0 if all(x['exit']==0 for x in out) else 1)
