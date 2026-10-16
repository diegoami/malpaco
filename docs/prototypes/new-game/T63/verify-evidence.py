"""Verify tracked T63 artifacts and every original archived member."""
from pathlib import Path
import hashlib,json,tarfile
root=Path(__file__).resolve().parent
m=json.loads((root/'artifacts.sha256.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
for name,h in m['hashes'].items():assert sha((root/name).read_bytes())==h,name
count=0
for name,members in m['archiveMembers'].items():
 with tarfile.open(root/name) as archive:
  for member,h in members.items():assert sha(archive.extractfile(member).read())==h,member
  count+=len(members)
print(f"Verified {len(m['hashes'])} files and {count} archived members")
