"""Claude R1 guard/budget omissions and final test-only checks, with exact restoration."""
from pathlib import Path
import subprocess,tempfile,json,hashlib,gzip,datetime
D=Path(__file__).resolve().parent;R=D.parents[3];core=R/'src/core/island-geography.ts';original=core.read_bytes();out=Path(tempfile.mkdtemp(prefix='r3-controls-',dir=D/'evidence'));results=[]
(out/'original-core.ts.gz').write_bytes(gzip.compress(original,mtime=0));start=datetime.datetime.now(datetime.timezone.utc).isoformat()
def run(label,cmd,expected):
 p=subprocess.run(['python3',str(D/'run-command.py'),label,*cmd],cwd=R,capture_output=True)
 (out/(label+'.json')).write_text(json.dumps({'command':cmd,'exit':p.returncode,'output':p.stdout.decode(),'stderr':p.stderr.decode()},indent=2)+'\n');results.append({'label':label,'exit':p.returncode,'expected':expected});print(json.dumps(results[-1]),flush=True);assert (p.returncode==0)==(expected==0)
cases=[('non-simple','cells: non-simple polygon','refuses non-simple cells'),('outside-frame','cells: outside frame','refuses cells outside'),('island-overlap','cells: islands touch/overlap','refuses islands touching'),('duplicate-pair','crossings: duplicate reserved country pair','refuses duplicate reserved'),('bonus-headroom','crossings: insufficient bonus headroom','refuses insufficient island bonus'),('degree-headroom','degree: insufficient entrance headroom','refuses insufficient country degree')]
for label,constraint,test in cases:
 before=('fail.add("'+constraint+'")').encode();assert original.count(before)==1
 try:core.write_bytes(original.replace(before,b'void 0'));run('r3-omit-'+label,['npx','vitest','run','tests/core/island-geography.test.ts','-t',test],1)
 finally:core.write_bytes(original)
 assert core.read_bytes()==original
for label,before,after,test in [
 ('negative-clamp',b'Math.max(0,Math.min(MAX_ATTEMPTS,Math.floor(raw)))',b'Math.min(MAX_ATTEMPTS,Math.floor(raw))','negative attempt'),
 ('fractional-floor',b'Math.floor(raw)',b'raw','fractional attempt')]:
 assert original.count(before)==1
 try:core.write_bytes(original.replace(before,after));run('r3-omit-'+label,['npx','vitest','run','tests/core/island-geography.test.ts','-t',test],1)
 finally:core.write_bytes(original)
 assert core.read_bytes()==original
for label,cmd in [('r3-focused',['npx','vitest','run','tests/core/island-geography.test.ts']),('r3-units',['npm','test']),('r3-build',['npm','run','build'])]:run(label,cmd,0)
(out/'report.json').write_text(json.dumps({'startUtc':start,'endUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':results,'coreRestored':core.read_bytes()==original,'coreSha256':hashlib.sha256(original).hexdigest(),'originalArchiveSha256':hashlib.sha256((out/'original-core.ts.gz').read_bytes()).hexdigest(),'coreArchiveRestoresExact':gzip.decompress((out/'original-core.ts.gz').read_bytes())==original,'scope':'Test/docs-only rework. No algorithm change; prior independent100-seed sweep and24 browsers remain on identical production bytes.'},indent=2)+'\n');print(str(out),flush=True)
