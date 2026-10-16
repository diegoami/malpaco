"""Retain byte comparison of every pre-existing test and golden at the T26 base."""
from pathlib import Path
import subprocess,tarfile,io,hashlib,json,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
baseline=subprocess.check_output(['git','rev-parse','c71f9d8'],cwd=repo,text=True).strip()
archive=subprocess.check_output(['git','archive',baseline,'tests'],cwd=repo)
sha=lambda b:hashlib.sha256(b).hexdigest();rows={}
with tarfile.open(fileobj=io.BytesIO(archive)) as a:
 for m in a.getmembers():
  if m.isfile():
   original=a.extractfile(m).read();current=(repo/m.name).read_bytes();rows[m.name]={'before':sha(original),'after':sha(current),'equal':original==current}
out=Path(tempfile.mkdtemp(prefix='existing-tests-',dir=root/'evidence'));(out/'report.json').write_text(json.dumps({'baseline':baseline,'files':rows,'allUnchanged':all(r['equal'] for r in rows.values())},indent=2)+'\n')
print(json.dumps({'output':str(out.relative_to(repo)),'files':len(rows),'allUnchanged':all(r['equal'] for r in rows.values())},indent=2));assert all(r['equal'] for r in rows.values())
