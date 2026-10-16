"""Verify current files and lossless archive members, opening each archive once."""
from pathlib import Path
import hashlib,json,tarfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3];index=root/sys.argv[1]
sha=lambda b:hashlib.sha256(b).hexdigest();records=[]
for part in json.loads(index.read_text())['parts']:
 b=(repo/part['path']).read_bytes();assert sha(b)==part['sha256'],part['path'];records.extend(json.loads(b)['records'])
files=0;members={}
for kind,*item in records:
 if kind=='file':p,h=item;assert sha((repo/p).read_bytes())==h,p;files+=1
 else:p,n,h=item;members.setdefault(p,[]).append((n,h))
for p,items in members.items():
 with tarfile.open(repo/p) as a:
  for n,h in items:assert sha(a.extractfile(n).read())==h,n
print(f'Verified {files} files and {sum(map(len,members.values()))} archived members')
