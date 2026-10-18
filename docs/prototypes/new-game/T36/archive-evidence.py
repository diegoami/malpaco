"""Losslessly archive this task's complete retained tree, keeping loose originals.

The verified receipt uses repository-relative member names. Archive parts are at
most24MiB; hashing, tar verification and concatenation checks stream file contents.
"""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,tarfile,tempfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'evidence'))
(out/'.gitignore').write_text('/originals.tar.gz\n')
def digest_file(path):
 with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
active_log=root/'evidence/final-archive-unit.log'
paths=sorted(p for p in root.rglob('*') if p.is_file() and not p.is_relative_to(out) and p!=active_log)
members={str(p.relative_to(repo)):digest_file(p) for p in paths}
archive=out/'originals.tar.gz'
with tarfile.open(archive,'w:gz',compresslevel=1) as target:
 for i,p in enumerate(paths):
  target.add(p,arcname=str(p.relative_to(repo)),recursive=False)
  if i%200==199:print(json.dumps({'phase':'archiving','members':i+1}),flush=True)
verified={}
with tarfile.open(archive,'r|gz') as source:
 for item in source:
  if item.isfile():verified[item.name]=hashlib.file_digest(source.extractfile(item),'sha256').hexdigest()
assert verified==members
print(json.dumps({'phase':'all-original-members-verified','members':len(members)}),flush=True)
parts=[];joined=hashlib.sha256()
with archive.open('rb') as stream:
 while block:=stream.read(24*1024*1024):
  name='originals.tar.gz.part%02d'%(len(parts)+1);(out/name).write_bytes(block);digest=hashlib.sha256(block).hexdigest();parts.append({'name':name,'bytes':len(block),'sha256':digest});joined.update(block)
assert joined.hexdigest()==digest_file(archive)
assert all(digest_file(out/p['name'])==p['sha256'] and (out/p['name']).stat().st_size==p['bytes'] for p in parts)
receipt={'createdUtc':datetime.now(timezone.utc).isoformat(),'scope':'Complete T36 parent preflight source snapshots, accepted/rejected attempts, command outputs, failed development, controls, corpus, screenshots and final restoration; loose originals preserved.','excludedSelfOutput':['archive output directory','evidence/final-archive-unit.log (retained plain after completion)'],'memberPathBase':'repository','archiveSha256':joined.hexdigest(),'archiveParts':parts,'members':members,'allMembersVerified':True,'allPartsVerified':True}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'output':str(out.relative_to(repo)),'members':len(members),'parts':len(parts),'archiveSha256':joined.hexdigest(),'verified':True}),flush=True)
