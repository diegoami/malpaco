"""Verify all recorded source/raw/member hashes, including disclosed supplements."""
from pathlib import Path
import json,tarfile,hashlib,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3];sha=lambda b:hashlib.sha256(b).hexdigest()
def members(p):
 with tarfile.open(p)as t:return {m.name:sha(t.extractfile(m).read())for m in t if m.isfile()}
checks=[]
for p in sorted([*(root/'evidence').rglob('report.json'),*(root/'preflight').rglob('report.json')]):
 if 'sources'in p.parts or 'raw'in p.parts:continue
 d=json.loads(p.read_text())
 if not isinstance(d,dict):continue
 if 'sourceHashes'in d:
  observed={}
  for archive in ['source-inputs.tar.gz','supplemental-inputs.tar.gz']:
   if(p.parent/archive).is_file():observed.update(members(p.parent/archive))
  if not observed:
   if(p.parent/'measured-inputs-and-seeds.tar.gz').is_file():observed={n.removeprefix('sources/'):h for n,h in members(p.parent/'measured-inputs-and-seeds.tar.gz').items()if n.startswith('sources/')}
   elif(p.parent/'sources').is_dir():observed={str(q.relative_to(p.parent/'sources')):sha(q.read_bytes())for q in (p.parent/'sources').rglob('*')if q.is_file()}
  assert all(observed.get(n)==h for n,h in d['sourceHashes'].items()),p
  if 'archiveMemberHashes'in d:
   archive=p.parent/('raw-logs.tar.gz'if(p.parent/'raw-logs.tar.gz').is_file()else'raw-outputs.tar.gz');assert sha(archive.read_bytes())==d['archiveSha256'];assert members(archive)==d['archiveMemberHashes'],p
  checks.append({'report':str(p.relative_to(root)),'sourceAndAvailableRawVerified':True,'exit':d.get('exit'),'targetMet':d.get('targetMet'),'sourcesUnchanged':d.get('sourcesUnchangedDuringRun',d.get('sourcesUnchanged'))})
for p in root.rglob('archive-manifest.json'):
 if 'sources'in p.parts or 'raw'in p.parts:continue
 d=json.loads(p.read_text());a=p.parent/'measured-inputs-and-seeds.tar.gz';assert sha(a.read_bytes())==d['sha256'];assert members(a)==d['members']
out=Path(tempfile.mkdtemp(prefix='integrity-',dir=root/'evidence'));(out/'report.json').write_text(json.dumps({'checks':checks,'verified':len(checks)},indent=2)+'\n');print(json.dumps({'output':str(out.relative_to(repo)),'verified':len(checks)}))
