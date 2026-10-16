from pathlib import Path
import hashlib,json,tarfile,io,shutil,tempfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3];kept=Path(sys.argv[1]);session=Path('/tmp/t32-review-session.json')
manifest=json.loads((kept/'retention.json').read_text());assert manifest['head']=='b38110183a310303b1f9357272870817f166a16a'
sha=lambda b:hashlib.sha256(b).hexdigest();records=[]
for f in manifest['files']:
 path=f['path'];assert path.startswith('docs/prototypes/new-game/T32/'),path
 source=kept/path;data=source.read_bytes();assert sha(data)==f['sha256'];target=repo/path;assert not target.exists(),path
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target);assert target.read_bytes()==data;records.append(f)
out=Path(tempfile.mkdtemp(prefix='reviewer-final-',dir=root/'evidence'))
(out/'retention-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
payload={'review-session.json':session.read_bytes(),'review.log':Path('/tmp/t32-review.log').read_bytes(),'review-brief.md':Path('/tmp/t32-review.md').read_bytes(),'operational-review.mjs':Path('/home/diego/projects/malpaco/.cache/t25-review-runner/tools/harness/review.mjs').read_bytes()}
with tarfile.open(out/'exact-review-record.tar.gz','w:gz') as a:
 for n,b in payload.items():t=tarfile.TarInfo(n);t.size=len(b);a.addfile(t,io.BytesIO(b))
with tarfile.open(out/'exact-review-record.tar.gz') as a:assert all(a.extractfile(n).read()==b for n,b in payload.items())
checks=[]
for f in records:
 if not f['path'].endswith('/report.json'):continue
 report=json.loads((repo/f['path']).read_text())
 if 'sourceHashes' in report:
  comparisons={p:sha((repo/p).read_bytes())==h for p,h in report['sourceHashes'].items()}
  checks.append({'report':f['path'],'exit':report.get('exit'),'sourcesUnchangedDuringRun':report.get('sourcesUnchangedDuringRun'),'matchesReviewedSources':comparisons})
(out/'import-verification.json').write_text(json.dumps({'reviewedHead':manifest['head'],'retainedFiles':len(records),'filesCopiedAndHashVerified':True,'rawArchiveMembers':{n:sha(b) for n,b in payload.items()},'sourceChecks':checks},indent=2)+'\n')
assert all(all(c['matchesReviewedSources'].values()) for c in checks if c['exit']==0)
print(json.dumps({'output':str(out.relative_to(repo)),'retainedFiles':len(records),'successfulReportsWithExactSources':sum(c['exit']==0 for c in checks)},indent=2))
