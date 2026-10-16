"""Preserve final feasibility bytes, then restore every preflight runtime path exactly."""
from pathlib import Path
import hashlib,json,sys,tarfile
root=Path(__file__).resolve().parent;repo=root.parents[3];out=repo/sys.argv[1]
manifest=json.loads((out/'original-manifest.json').read_text())
with tarfile.open(out/'final-mock-sources.tar.gz','x:gz') as a:
 for name in manifest:
  if (repo/name).exists():a.add(repo/name,arcname=name)
with tarfile.open(out/'original-sources.tar.gz') as a:
 for name,digest in manifest.items():
  p=repo/name
  if digest is None:
   if p.exists():p.unlink()
  else:
   data=a.extractfile(name).read();assert hashlib.sha256(data).hexdigest()==digest;p.write_bytes(data)
result={n:(not (repo/n).exists() if h is None else hashlib.sha256((repo/n).read_bytes()).hexdigest()==h) for n,h in manifest.items()}
(out/'restoration.json').write_text(json.dumps(result,indent=2)+'\n');assert all(result.values());print('Restored',len(result),'runtime paths exactly')
