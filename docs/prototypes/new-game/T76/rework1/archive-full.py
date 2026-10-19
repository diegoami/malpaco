from pathlib import Path
import hashlib,json,re,stat,tarfile
w=Path(__file__).resolve().parents[5];root=Path(__file__).resolve().parent;validation=root.parent/'validation'
labels=['rework-layout','rework-regression','rework-unit','rework-build','rework-list'];receipts={label:json.loads((validation/label/'receipt.json').read_text()) for label in labels}
identity=None
for label in labels:
 command=json.loads((validation/label/'command.json').read_text());assert receipts[label]['exit']==0,label
 assert command['sourceBefore']==receipts[label]['sourceAfter'],label
 if identity is None:identity=command['sourceBefore']
 assert command['sourceBefore']==identity,label
frozen=hashlib.sha256((w/'tests/e2e/hideable-panels.spec.ts').read_bytes()).hexdigest();assert frozen==json.loads((root.parent/'preflight/restoration.json').read_text())['testsSha256']
stats={label:json.loads((validation/label/'results.json').read_text())['stats'] for label in labels if (validation/label/'results.json').exists()}
assert stats['rework-layout']['expected']==8 and stats['rework-regression']['expected']==116
for value in stats.values():assert value['unexpected']==0 and value['skipped']==0 and value['flaky']==0
count=int(re.search(r'Total: (\d+) tests', (validation/'rework-list/raw.log').read_text()).group(1));assert count==380
files=[p for label in labels for p in (validation/label).rglob('*') if p.is_file()]+[root/'full-unit.log',root/'mutation-assertions.json']
archive=root/'full-validation.tar.gz'
with tarfile.open(archive,'w:gz') as t:
 for p in sorted(files):t.add(p,arcname=str(p.relative_to(root.parent)),recursive=False)
manifest={'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size,'parts':[],'files':[{'path':str(p.relative_to(root.parent)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'mode':stat.S_IMODE(p.stat().st_mode)} for p in sorted(files)]}
with tarfile.open(archive) as t:
 for row in manifest['files']:
  m=t.getmember(row['path']);assert m.isfile() and m.mode==row['mode'];assert hashlib.sha256(t.extractfile(m).read()).hexdigest()==row['sha256']
with archive.open('rb') as stream:
 index=0
 while block:=stream.read(30*1024*1024):
  part=root/f'full-validation.tar.gz.part-{index:03d}';part.write_bytes(block);manifest['parts'].append({'path':part.name,'bytes':len(block),'sha256':hashlib.sha256(block).hexdigest()});index+=1
joined=hashlib.sha256()
for part in manifest['parts']:joined.update((root/part['path']).read_bytes())
assert joined.hexdigest()==manifest['archiveSha256']
(root/'full-validation-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'full-results.json').write_text(json.dumps({'receipts':receipts,'browserStats':stats,'sourceTestCount':count,'frozenTestSha256':frozen,'identicalFinalSourceInputs':identity,'archiveSha256':manifest['archiveSha256']},indent=2)+'\n')
print(json.dumps({'sourceTestCount':count,'archiveBytes':manifest['bytes'],'members':len(files),'parts':len(manifest['parts']),'stats':stats}))
