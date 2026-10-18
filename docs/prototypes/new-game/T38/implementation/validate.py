#!/usr/bin/env python3
"""Sequential T38 validation with immutable per-run raw/source retention."""
from pathlib import Path
import subprocess,datetime,time,json,hashlib,tarfile,os,sys
root=Path.cwd();owned=root/'docs/prototypes/new-game/T38';stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=owned/'implementation'/('validation-'+stamp);out.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
frozen=json.loads((owned/'parent-acceptance/FROZEN-ACCEPTANCE.json').read_text())
paths=sorted(set([p for name in ['src','tests','data'] for p in (root/name).rglob('*') if p.is_file()]+[root/p for p in ['package.json','package-lock.json','tsconfig.json','vite.config.ts','playwright.config.ts']]))
inputs={str(p.relative_to(root)):sha(p) for p in paths}
receipt={'startedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputs':inputs,'frozenAcceptanceMatches':all(sha(root/p)==h for p,h in frozen.items()),'commands':[]}
assert receipt['frozenAcceptanceMatches']
with tarfile.open(out/'source-inputs.tar.gz','w:gz') as archive:
 for p in paths:archive.add(p,arcname=p.relative_to(root),recursive=False)
def save(): (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
save(); print('OUTPUT '+str(out.relative_to(root)),flush=True)
commands=[('sets',['npx','vitest','run','tests/core/card-sets.test.ts']),('replay',['npx','vitest','run','tests/core/card-sets-replay.test.ts']),('units',['npm','test']),('build',['npm','run','build']),('browsers',['docker','run','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(root)+':/work','-w','/work','-e','HOME=/tmp','mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test','tests/e2e/versioned-match.spec.ts','tests/e2e/reference-complete-game.spec.ts','tests/e2e/game-event-log.spec.ts','tests/e2e/geographic-review-guards.spec.ts','--workers=2'])]
for name,args in commands:
 print('START '+name,flush=True);started=time.monotonic()
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:r=subprocess.run(args,stdout=stdout,stderr=stderr)
 entry={'name':name,'argv':args,'exitCode':r.returncode,'durationSeconds':time.monotonic()-started,'inputsUnchanged':all(p.exists() and sha(p)==inputs[str(p.relative_to(root))] for p in paths)}
 receipt['commands'].append(entry);save();print('END '+json.dumps(entry),flush=True)
 if r.returncode:break
if any(c['name']=='browsers' for c in receipt['commands']):
 with tarfile.open(out/'browser-artifacts.tar.gz','w:gz') as archive:
  for name in ['screenshots','test-results','playwright-report']:
   if (root/name).exists():archive.add(root/name,arcname=name)
receipt['frozenAcceptanceMatchesAfter']=all(sha(root/p)==h for p,h in frozen.items());receipt['finishedUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat();receipt['allPassed']=len(receipt['commands'])==len(commands) and all(c['exitCode']==0 and c['inputsUnchanged'] for c in receipt['commands']);save()
(out/'SHA256SUMS').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.is_file() and p.name!='SHA256SUMS'))
print('FINAL '+str(out.relative_to(root))+' '+str(receipt['allPassed']),flush=True);sys.exit(0 if receipt['allPassed'] else 1)
