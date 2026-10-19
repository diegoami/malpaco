from pathlib import Path
import hashlib,json,stat,sys,tarfile
root=Path(__file__).resolve().parent;name=sys.argv[1];sources=[root/p for p in sys.argv[2:]]
files=sorted(p for source in sources for p in ([source] if source.is_file() else source.rglob('*')) if p.is_file())
archive=root/(name+'.tar.gz');assert not archive.exists()
members=[]
with tarfile.open(archive,'w:gz') as tar:
 for p in files:
  rel=str(p.relative_to(root));data=p.read_bytes();members.append({'path':rel,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'mode':stat.S_IMODE(p.stat().st_mode)})
  tar.add(p,arcname=rel,recursive=False)
with tarfile.open(archive) as tar:
 assert len(tar.getmembers())==len(members)
 for expected,actual in zip(members,tar.getmembers()):
  data=tar.extractfile(actual).read();assert actual.isfile() and actual.name==expected['path'] and actual.mode==expected['mode'] and len(data)==expected['bytes'] and hashlib.sha256(data).hexdigest()==expected['sha256']
parts=[];joined=hashlib.sha256()
with archive.open('rb') as stream:
 while data:=stream.read(16*1024*1024):
  p=root/(archive.name+'.part-'+str(len(parts)).zfill(3));assert not p.exists();p.write_bytes(data);joined.update(data);parts.append({'path':p.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
assert joined.hexdigest()==hashlib.sha256(archive.read_bytes()).hexdigest()
manifest={'archiveBytes':archive.stat().st_size,'archiveSha256':joined.hexdigest(),'parts':parts,'members':members}
(root/(name+'-manifest.json')).write_text(json.dumps(manifest,indent=2)+'\n');print(name,manifest['archiveBytes'],len(members),flush=True)
