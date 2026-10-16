"""Verify one immutable T26 revision index and every archived byte."""
from pathlib import Path
import hashlib,json,tarfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
m=json.loads((root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts.sha256.json')).read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for p,h in m['hashes'].items():assert sha((repo/p).read_bytes())==h,p
count=0
for p,members in m['archiveMembers'].items():
 with tarfile.open(repo/p) as a:
  for n,h in members.items():assert sha(a.extractfile(n).read())==h,n
  count+=len(members)
print(f"Verified {len(m['hashes'])} files and {count} archived members")
