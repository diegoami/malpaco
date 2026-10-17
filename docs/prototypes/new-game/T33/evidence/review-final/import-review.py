from pathlib import Path
import json,hashlib,shutil,tarfile
repo=Path('/home/diego/projects/malpaco/.cache/t33-work');root=repo/'docs/prototypes/new-game/T33'
retained=Path('/home/diego/projects/malpaco/.cache/t33-review-retained/144-review-6a3dc21b');out=root/'evidence/review-final'
assert retained.is_dir() and not out.exists();out.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest();fresh={};incomplete=[]
for p in retained.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(retained)
 if 'raw' in rel.parts:continue
 if (root/rel).is_file() and (root/rel).read_bytes()==p.read_bytes():continue
 dest=out/'measured'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);fresh[str(rel)]=sha(p.read_bytes())
for raw in retained.rglob('raw'):
 if not raw.is_dir() or (raw.parent/'raw-outputs.tar.gz').exists():continue
 rel=raw.parent.relative_to(retained);dest=out/'measured'/rel;dest.mkdir(parents=True,exist_ok=True)
 members={str(p.relative_to(raw)):sha(p.read_bytes()) for p in raw.rglob('*') if p.is_file()}
 with tarfile.open(dest/'interrupted-raw.tar.gz','w:gz')as tar:
  for p in raw.rglob('*'):
   if p.is_file():tar.add(p,arcname=str(p.relative_to(raw)))
 (dest/'interrupted.json').write_text(json.dumps({'completed':False,'rawHashes':members},indent=2)+'\n');incomplete.append(str(rel))
checks=[]
for p in (out/'measured').rglob('report.json'):
 data=json.loads(p.read_text())
 if not isinstance(data,dict)or 'sourceHashes' not in data:continue
 src=p.parent/'source-inputs.tar.gz'
 with tarfile.open(src)as tar:
  observed={m.name:sha(tar.extractfile(m).read()) for m in tar if m.isfile()}
 assert all(observed.get(n)==h for n,h in data['sourceHashes'].items()),p
 if 'archiveMemberHashes' in data:
  raw=p.parent/('raw-logs.tar.gz' if (p.parent/'raw-logs.tar.gz').exists() else 'raw-outputs.tar.gz');assert sha(raw.read_bytes())==data['archiveSha256']
  with tarfile.open(raw)as tar:
   observed={m.name:sha(tar.extractfile(m).read()) for m in tar if m.isfile()}
  assert all(observed.get(n)==h for n,h in data['archiveMemberHashes'].items()),p
 scratch={n:h for n,h in data['sourceHashes'].items()if n.endswith('.saved')}
 differences={n:h for n,h in data['sourceHashes'].items()if n not in scratch and (not(repo/n).is_file()or sha((repo/n).read_bytes())!=h)}
 if data.get('packageSha256'):
  assert sha((p.parent/'malpaco-playable.tar.gz').read_bytes())==data['packageSha256']
 checks.append({'report':str(p.relative_to(out)),'exit':data.get('exit'),'commands':data.get('commands',data.get('command')),'sourceArchiveVerified':True,'rawArchiveVerified':'archiveMemberHashes'in data,'sourceDifferences':differences,'reviewerScratch':scratch,'scratchMatchesOriginal':all((repo/n[:-6]).is_file()and sha((repo/n[:-6]).read_bytes())==h for n,h in scratch.items()),'sourcesUnchangedDuringRun':data['sourcesUnchangedDuringRun']})
for source,name in [('/tmp/malpaco-t33-session.json','session.json'),('/tmp/malpaco-t33-review.md','brief.md'),('/tmp/malpaco-t33-review.log','run-output.txt'),('/tmp/malpaco-t33-review-final.txt','review.txt')]:shutil.copy2(source,out/name)
session=json.loads((out/'session.json').read_text());last=[m for m in session['messages']if m['info']['role']=='assistant'][-1]['info']
report={'session':session['info']['id'],'model':session['info']['model'],'durationSeconds':(last['time']['completed']-session['info']['time']['created'])/1000,'reviewedHead':'f10ce6f25518872264cb06883b95284081ea7a4e','freshFiles':fresh,'archiveChecks':checks,'interruptedRawArchived':incomplete,'completeLocalRetention':str(retained)}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'fresh':len(fresh),'duration':report['durationSeconds'],'archives':len(checks),'interrupted':incomplete}))
