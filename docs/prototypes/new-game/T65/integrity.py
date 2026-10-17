from pathlib import Path
import json,hashlib,tarfile,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3];sha=lambda b:hashlib.sha256(b).hexdigest();rows=[]
for p in sorted((root/'evidence').glob('*/report.json')):
 d=json.loads(p.read_text())
 if 'sourceHashes' not in d:continue
 with tarfile.open(p.parent/'source-inputs.tar.gz')as tar:
  found={m.name:sha(tar.extractfile(m).read())for m in tar if m.isfile()}
 assert all(found.get(n)==h for n,h in d['sourceHashes'].items()),p
 raw=False
 if 'archiveMemberHashes'in d:
  assert sha((p.parent/'raw-outputs.tar.gz').read_bytes())==d['archiveSha256']
  with tarfile.open(p.parent/'raw-outputs.tar.gz')as tar:found={m.name:sha(tar.extractfile(m).read())for m in tar if m.isfile()}
  assert found==d['archiveMemberHashes'],p
  raw=True
 differences=[n for n,h in d['sourceHashes'].items()if not(repo/n).is_file()or sha((repo/n).read_bytes())!=h]
 rows.append({'report':str(p.relative_to(root)),'sourcesVerified':True,'rawVerified':raw,'currentDifferences':differences,'stable':d['sourcesUnchangedDuringRun'],'exit':d.get('exit'),'commands':d.get('commands')})
out=Path(tempfile.mkdtemp(prefix='integrity-',dir=root/'evidence'));(out/'report.json').write_text(json.dumps({'archives':rows},indent=2)+'\n');print(json.dumps({'output':str(out.relative_to(repo)),'archives':len(rows),'currentStableRuns':sum(not x['currentDifferences']and x['stable']for x in rows)}))
