"""Verify the historical preflight index, recovering preserved historical bytes."""
from pathlib import Path
import hashlib,json,tarfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
sha=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads((root/"preflight/hashes.json").read_text())
archives=[root/"preflight/initial-readme.tar.gz",root/"preflight/initial-runner.tar.gz",root/"preflight/mock-ll1v95aj/raw-mutation-source.tar.gz"]
recovered={}
for archive in archives:
 with tarfile.open(archive) as a:
  for entry in a.getmembers():
   if entry.isfile():recovered[sha(a.extractfile(entry).read())]=(archive,entry.name)
for path,digest in m["files"].items():
 p=repo/path
 if p.is_file() and sha(p.read_bytes())==digest:continue
 assert digest in recovered,path
for path,members in m["archiveMembers"].items():
 with tarfile.open(repo/path) as a:
  for name,digest in members.items():assert sha(a.extractfile(name).read())==digest,(path,name)
print(f"Verified {len(m['files'])} historical files and all historical archive members")
