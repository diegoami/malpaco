from pathlib import Path
import hashlib,json,tarfile,datetime
owned=Path(__file__).resolve().parent;root=Path.cwd();archives=root/'docs/prototypes/new-game/T39/archives';archives.mkdir(parents=True,exist_ok=True)
archive=archives/'implementation-20261018.tar.gz';assert not archive.exists()
sha=lambda data:hashlib.sha256(data).hexdigest()
files=[p for p in sorted(owned.rglob('*')) if p.is_file()]
manifest=[{'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in files]
index=owned/'member-manifest.json';assert not index.exists();index.write_text(json.dumps(manifest,indent=2)+'\n');files.append(index)
expected={str(p.relative_to(root)):sha(p.read_bytes()) for p in files}
with tarfile.open(archive,'w:gz',compresslevel=6) as tar:
 for p in files:tar.add(p,arcname=str(p.relative_to(root)),recursive=False)
with tarfile.open(archive,'r:gz') as tar:
 members=tar.getmembers();assert set(m.name for m in members)==set(expected)
 for member in members:assert member.isfile() and sha(tar.extractfile(member).read())==expected[member.name]
parts=[];combined=hashlib.sha256()
with archive.open('rb') as stream:
 while chunk:=stream.read(16*1024*1024):
  part=Path(str(archive)+'.part-'+str(len(parts)).zfill(3));assert not part.exists();part.write_bytes(chunk);assert part.read_bytes()==chunk;combined.update(part.read_bytes());parts.append({'path':str(part.relative_to(root)),'bytes':len(chunk),'sha256':sha(chunk)})
assert combined.hexdigest()==sha(archive.read_bytes())
receipt={'sourceCommit':json.loads((owned/'final-receipt.json').read_text())['sourceCommit'],'archive':str(archive.relative_to(root)),'bytes':archive.stat().st_size,'sha256':combined.hexdigest(),'verifiedMembers':len(expected),'parts':parts,'allMembersAndPartsVerified':True,'looseOriginalsPreserved':True,'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(archives/'implementation-20261018-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
