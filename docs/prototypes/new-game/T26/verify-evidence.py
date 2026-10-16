"""Verify an immutable T26 revision index and every archived byte."""
from pathlib import Path
import hashlib,json,tarfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
m=json.loads((root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts.v4.sha256.json')).read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
files=members=0
for part in m['parts']:
 p=repo/part['path'];assert sha(p.read_bytes())==part['sha256'],str(p)
 for item in json.loads(p.read_text())['records']:
  if item[0]=='file':
   _,p,h=item;assert sha((repo/p).read_bytes())==h,p;files+=1
  else:
   _,p,n,h=item
   with tarfile.open(repo/p) as a:assert sha(a.extractfile(n).read())==h,n
   members+=1
print(f"Verified {files} files and {members} archived members")
