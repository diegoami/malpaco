"""Archive final mock bytes then restore the exact saved preflight base."""
from pathlib import Path
import tarfile,json,hashlib,sys
repo=Path(__file__).resolve().parents[4];out=repo/sys.argv[1]
manifest=json.loads((out/'original-manifest.json').read_text())
assert not (out/'final-mock-sources.tar.gz').exists()
try:
 with tarfile.open(out/'final-mock-sources.tar.gz','w:gz') as a:
  for p in manifest:
   if (repo/p).exists():a.add(repo/p,arcname=p)
finally:
 with tarfile.open(out/'original-sources.tar.gz') as a:
  for p,h in manifest.items():
   if h is not None:
    b=a.extractfile(p).read();assert hashlib.sha256(b).hexdigest()==h;(repo/p).write_bytes(b)
   elif (repo/p).exists():(repo/p).unlink()
 restoration={p:((not (repo/p).exists()) if h is None else hashlib.sha256((repo/p).read_bytes()).hexdigest()==h) for p,h in manifest.items()};assert all(restoration.values())
 (out/'restoration.json').write_text(json.dumps(restoration,indent=2)+'\n');print('exact restoration',len(restoration))
