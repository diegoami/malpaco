"""Archive only this rework's new measurements, retaining and verifying loose originals."""
from pathlib import Path
import hashlib,json,tarfile,datetime
repo=Path.cwd();root=repo/'docs/prototypes/new-game/T36';out=root/'evidence/rework-native1';target=out/'retained-originals';target.mkdir()
sha=lambda p:hashlib.file_digest(p.open('rb'),'sha256').hexdigest()
paths=[]
for folder in [out,*sorted((root/'evidence').glob('rework1-*'))]:
 paths.extend(p for p in folder.rglob('*') if p.is_file() and not p.is_symlink() and not p.is_relative_to(target) and p.name not in ['archive-unit.log'])
paths=sorted(set(paths));members={str(p.relative_to(repo)):sha(p) for p in paths};archive=target/'originals.tar.gz'
with tarfile.open(archive,'w:gz',compresslevel=1) as a:
 for p in paths:a.add(p,arcname=str(p.relative_to(repo)),recursive=False)
actual={}
with tarfile.open(archive,'r|gz') as a:
 for m in a:
  if m.isfile():actual[m.name]=hashlib.file_digest(a.extractfile(m),'sha256').hexdigest()
assert actual==members
parts=[];joined=hashlib.sha256()
with archive.open('rb') as s:
 while block:=s.read(24*1024*1024):
  p=target/f'originals.tar.gz.part{len(parts)+1:02}';p.write_bytes(block);joined.update(block);parts.append({'name':p.name,'bytes':len(block),'sha256':sha(p)})
assert joined.hexdigest()==sha(archive)
(target/'.gitignore').write_text('/originals.tar.gz\n')
(target/'receipt.json').write_text(json.dumps({'createdUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Only fresh native first-rework measurements/helpers/source snapshots and raw outputs. Prior complete archives untouched; all loose originals retained.','members':members,'memberCount':len(members),'archiveParts':parts,'archiveSha256':sha(archive),'membersVerified':True,'partsVerified':True,'exclude':'Own output directory, archive-unit.log and monitoring symlink'},indent=2)+'\n')
print(json.dumps({'members':len(members),'parts':len(parts),'sha256':sha(archive),'verified':True}),flush=True)
