from pathlib import Path
import hashlib,json,stat,tarfile
w=Path(__file__).resolve().parents[5];base=w/'docs/prototypes/new-game/T76/validation'
labels=['icons-baseline-final','regression01','focus-edge-red','layout-final','regression-final','unit-final','build-final','corrected-focused','release-build']
receipts={label:json.loads((base/label/'receipt.json').read_text()) for label in labels}
for label in ['regression01','layout-final','regression-final','unit-final','corrected-focused','release-build']:
 assert receipts[label]['exit']==0,(label,receipts[label])
for label in labels:
 command=json.loads((base/label/'command.json').read_text());assert command['sourceBefore']==receipts[label]['sourceAfter'],label
stats={label:json.loads((base/label/'results.json').read_text())['stats'] for label in labels if (base/label/'results.json').exists()}
assert stats['layout-final']['expected']==8 and stats['regression-final']['expected']==112 and stats['corrected-focused']['expected']==32
assert receipts['build-final']['exit']==1
assert stats['icons-baseline-final']['unexpected']==24 and stats['focus-edge-red']['unexpected']==2
assert json.loads((base/'icons-baseline-final/restoration.json').read_text())['restoredExact']
frozen=hashlib.sha256((w/'tests/e2e/hideable-panels.spec.ts').read_bytes()).hexdigest()
assert frozen==json.loads((base.parent/'preflight/restoration.json').read_text())['testsSha256']
files=[]
for label in labels:files.extend(p for p in (base/label).rglob('*') if p.is_file())
files.extend(base/name for name in ['icons-baseline-final-unit.log','regression01-unit.log','focus-edge-red-unit.log','final-checks-unit.log','corrected-focused-unit.log','release-build-unit.log'])
files.extend(p for p in (base/'version-metadata').rglob('*') if p.is_file())
files=sorted(set(files));archive=base/'attempts-02.tar.gz'
with tarfile.open(archive,'w:gz') as t:
 for p in files:t.add(p,arcname=str(p.relative_to(base)),recursive=False)
manifest={'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size,'parts':[],'files':[{'path':str(p.relative_to(base)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'mode':stat.S_IMODE(p.stat().st_mode)} for p in files]}
with tarfile.open(archive) as t:
 for row in manifest['files']:
  member=t.getmember(row['path']);assert member.isfile() and member.mode==row['mode'];assert hashlib.sha256(t.extractfile(member).read()).hexdigest()==row['sha256']
with archive.open('rb') as stream:
 i=0
 while data:=stream.read(30*1024*1024):
  part=base/f'attempts-02.tar.gz.part-{i:03d}';part.write_bytes(data);manifest['parts'].append({'path':part.name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)});i+=1
combined=hashlib.sha256()
for part in manifest['parts']:combined.update((base/part['path']).read_bytes())
assert combined.hexdigest()==manifest['archiveSha256']
(base/'attempts-02-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(base/'final-results.json').write_text(json.dumps({'receipts':receipts,'browserStats':stats,'frozenAcceptanceSha256':frozen,'archiveSha256':manifest['archiveSha256']},indent=2)+'\n')
print(json.dumps({'archiveBytes':manifest['bytes'],'parts':len(manifest['parts']),'members':len(files),'browserStats':stats}))
