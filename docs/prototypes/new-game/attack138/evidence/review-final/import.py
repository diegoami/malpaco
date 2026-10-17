from pathlib import Path
import json,hashlib,shutil,tarfile
repo=Path('/home/diego/projects/malpaco/.cache/attack138-work')
root=repo/'docs/prototypes/new-game/attack138'
retained=Path('/home/diego/projects/malpaco/.cache/attack138-review-retained/146-review-4078203b')
out=root/'evidence/review-final'
assert retained.is_dir(), 'Review retention not available yet'
assert not out.exists(), 'Refuse overwrite'
out.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
fresh={}
for p in retained.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(retained)
 if 'raw' in rel.parts:continue
 if (root/rel).exists() and (root/rel).read_bytes()==p.read_bytes():continue
 dest=out/'measured'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 fresh[str(rel)]=sha(p.read_bytes())
checks=[]
for p in (out/'measured').rglob('report.json'):
 data=json.loads(p.read_text())
 if not isinstance(data,dict) or 'sourceHashes' not in data:continue
 src=p.parent/'source-inputs.tar.gz';raw=p.parent/'raw-outputs.tar.gz'
 assert sha(raw.read_bytes())==data['archiveSha256']
 with tarfile.open(raw) as tar:
  for name,digest in data['archiveMemberHashes'].items():assert sha(tar.extractfile(name).read())==digest,(p,name)
 with tarfile.open(src) as tar:
  for name,digest in data['sourceHashes'].items():assert sha(tar.extractfile(name).read())==digest,(p,name)
 scratch={n:h for n,h in data['sourceHashes'].items() if n.endswith('.saved')}
 differences={n:h for n,h in data['sourceHashes'].items() if n not in scratch and (not(repo/n).is_file() or sha((repo/n).read_bytes())!=h)}
 row={'report':str(p.relative_to(out)),'exit':data['exit'],'rawArchiveVerified':True,'sourceArchiveVerified':True,'matchesCurrentSourceExcludingScratchCopies':not differences,'sourceDifferences':differences,'reviewerScratchCopies':scratch,'scratchMatchesCorrespondingSource':all((repo/n[:-6]).is_file() and sha((repo/n[:-6]).read_bytes())==h for n,h in scratch.items()),'sourcesUnchangedDuringRun':data['sourcesUnchangedDuringRun']}
 checks.append(row)
assert any(r['exit']==0 and r['matchesCurrentSourceExcludingScratchCopies'] and r['sourcesUnchangedDuringRun'] for r in checks)
for source,name in [('/tmp/malpaco-attack138-session.json','session.json'),('/tmp/malpaco-attack138-review.md','brief.md'),('/tmp/malpaco-attack138-review.log','run-output.txt'),('/tmp/malpaco-attack138-review-final.txt','review.txt')]:shutil.copy2(source,out/name)
session=json.loads((out/'session.json').read_text())
last=[m for m in session['messages'] if m['info']['role']=='assistant'][-1]['info']
report={'session':session['info']['id'],'model':session['info']['model'],'role':'independent reviewer','round':1,'durationSeconds':(last['time']['completed']-session['info']['time']['created'])/1000,'reviewedHead':'2e41aae90a5be07060cd9f8939e2412fec0152ae','freshFiles':fresh,'archiveChecks':checks,'completeLocalRetention':str(retained)}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'freshFiles':len(fresh),'durationSeconds':report['durationSeconds'],'archives':len(checks),'greenCurrentSourceRuns':sum(r['exit']==0 and r['matchesCurrentSourceExcludingScratchCopies'] for r in checks)},indent=2))
