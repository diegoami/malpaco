"""Reproduce the archive-name omission, then verify old and explicitly named archives."""
from pathlib import Path
import subprocess,tempfile,json,hashlib,gzip
D=Path(__file__).resolve().parent;R=D.parents[3];p=D/'verify-evidence.py';current=p.read_bytes();old=b"a=p.parent/'measured-inputs-and-seeds.tar.gz'";new=b"a=p.parent/d.get('archive','measured-inputs-and-seeds.tar.gz')";assert old in current or new in current
final=current.replace(old,new);before=final.replace(new,old);out=Path(tempfile.mkdtemp(prefix='r3-integrity-',dir=D/'evidence'));(out/'original-verifier.py.gz').write_bytes(gzip.compress(before,mtime=0));results=[]
try:
 for label,source,expected in [('r3-verifier-before',before,1),('r3-verifier-after',final,0)]:
  p.write_bytes(source);r=subprocess.run(['python3',str(D/'run-command.py'),label,'python3',str(p)],cwd=R,capture_output=True)
  (out/(label+'.json')).write_text(json.dumps({'exit':r.returncode,'stdout':r.stdout.decode(),'stderr':r.stderr.decode()},indent=2)+'\n');results.append({'label':label,'exit':r.returncode,'expected':expected});print(json.dumps(results[-1]),flush=True);assert (r.returncode==0)==(expected==0)
finally:p.write_bytes(final)
(out/'report.json').write_text(json.dumps({'results':results,'originalSha256':hashlib.sha256(before).hexdigest(),'finalSha256':hashlib.sha256(final).hexdigest(),'finalSourceRestored':p.read_bytes()==final,'scope':'Optional manifest.archive with legacy filename default; actual original fails on the retained named Claude archive, corrected verifier checks both legacy and named member archives.'},indent=2)+'\n');print(str(out),flush=True)
