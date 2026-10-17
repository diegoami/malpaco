from pathlib import Path
import subprocess,shutil,json,hashlib,tempfile
P=Path(__file__).resolve().parent
C=json.loads((P/'config.json').read_text()); W=Path(C['worktree']); E=W/'docs/prototypes/new-game/T68'
R=Path(tempfile.mkdtemp(prefix='checks-',dir=P)); results=[]
def run(label,args,expect):
 p=subprocess.run(args,cwd=W,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (R/(label+'.log')).write_bytes(p.stdout)
 ok=(p.returncode==0)==expect; results.append({'label':label,'exit':p.returncode,'expected_success':expect,'passed':ok}); print(label,p.returncode,'PASS' if ok else 'FAIL',p.stdout.decode()[-500:],flush=True)
run('positive',['python3','-I',str(E/'verify.py')],True)
run('whitespace',['git','diff','--check',C['base'],C['head']],True)
def fixture(name):
 d=R/name;d.mkdir();shutil.copy2(E/'assessment.json',d/'assessment.json')
 for a in ['attempt-1','attempt-2','attempt-3']:
  (d/a).mkdir()
  for n in ['receipt.json','prompt.txt','output.jsonl','models.txt','settings-cleanup.json']:
   if (E/a/n).exists():shutil.copy2(E/a/n,d/a/n)
 return d
def js(p,fn):
 v=json.loads(p.read_text());fn(v);p.write_text(json.dumps(v))
def verify(name,d):run(name,['python3','-I',str(E/'verify.py'),str(d)],False)
d=fixture('altered-prompt');f=d/'attempt-3/prompt.txt';f.write_bytes(f.read_bytes()+b'changed');verify('altered-prompt',d)
d=fixture('missing-receipt');(d/'attempt-2/receipt.json').unlink();verify('missing-receipt',d)
d=fixture('false-accepted-denial');js(d/'assessment.json',lambda v:v['attempts']['attempt-1'].update(accepted_review=True));verify('false-accepted-denial',d)
d=fixture('missing-cleanup');(d/'attempt-3/settings-cleanup.json').unlink();verify('missing-cleanup',d)
d=fixture('duplicate-result');f=d/'attempt-3/output.jsonl';events=[json.loads(s) for s in f.read_text().splitlines() if s.strip()];v=next(e for e in events if e.get('event')=='result');f.write_text(f.read_text()+json.dumps(v)+'\n');js(d/'attempt-3/receipt.json',lambda v:v.update(output_sha256=hashlib.sha256(f.read_bytes()).hexdigest()));verify('duplicate-result',d)
(R/'report.json').write_text(json.dumps(results,indent=2)+'\n');print('Retained results:',R,flush=True)
raise SystemExit(0 if all(r['passed'] for r in results) else 1)
