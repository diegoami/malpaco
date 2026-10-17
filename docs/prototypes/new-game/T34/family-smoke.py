from pathlib import Path
import subprocess,json,hashlib,tempfile
D=Path(__file__).resolve().parent;R=D.parents[3];p=R/'src/core/island-geography.ts';original=p.read_bytes();candidate=(D/'family-candidate.ts').read_bytes();out=Path(tempfile.mkdtemp(prefix='family-smoke-',dir=D/'evidence'))
try:
 p.write_bytes(candidate)
 r=subprocess.run(['python3',str(D/'run-command.py'),'family-feasibility','node',str(D/'family-smoke.mjs')],cwd=R,capture_output=True)
 (out/'output.txt').write_bytes(r.stdout+r.stderr)
finally:p.write_bytes(original)
(out/'report.json').write_text(json.dumps({'exit':r.returncode,'restored':p.read_bytes()==original,'originalSha256':hashlib.sha256(original).hexdigest(),'candidateSha256':hashlib.sha256(candidate).hexdigest()},indent=2)+'\n');print(str(out));assert r.returncode==0 and p.read_bytes()==original
