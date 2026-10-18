#!/usr/bin/env python3
"""Parent-only disposable integration; preserve exact production bytes in finally."""
from pathlib import Path
import hashlib,json,subprocess,time,datetime,sys,os
root=Path.cwd(); owned=root/'docs/prototypes/new-game/T38'; mock=owned/'parent-preflight/mock/src'
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=owned/'parent-acceptance'/('mock-'+stamp);out.mkdir()
replacements={Path(p):(owned/'parent-preflight/mock'/p).read_bytes() for p in json.loads((owned/'parent-preflight/candidate-changed-paths.json').read_text())}
saved={p:(root/p).read_bytes() if (root/p).exists() else None for p in replacements}
sha=lambda b:hashlib.sha256(b).hexdigest()
receipt={'replacements':{str(p):sha(b) for p,b in replacements.items()},'commands':[]}
def run(name,args):
 start=time.monotonic()
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:r=subprocess.run(args,stdout=stdout,stderr=stderr)
 receipt['commands'].append({'name':name,'argv':args,'exit':r.returncode,'durationSeconds':time.monotonic()-start})
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2))
 return r.returncode
try:
 for p,b in replacements.items():
  backup=out/'before'/p;backup.parent.mkdir(parents=True,exist_ok=True)
  if saved[p] is not None:backup.write_bytes(saved[p])
  target=root/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
 if '--remaining' in sys.argv:
  run('build',['npm','run','build'])
  for name,path,old,new in [('wrong-set-value','src/core/rules.ts',"Anchor:5,Compass:8,Lantern:15","Anchor:6,Compass:8,Lantern:15"),('wrong-wild-limit','src/core/cards.ts',"if(!genuine.length)return null;","if(genuine.length<2)return null;")]:
   target=root/path;b=target.read_bytes();old=old.encode();new=new.encode();assert b.count(old)==1
   try:
    target.write_bytes(b.replace(old,new));run(name,['npx','vitest','run','tests/core/card-sets.test.ts','tests/core/card-sets-replay.test.ts'])
   finally:target.write_bytes(b)
  run('browsers',['docker','run','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(root)+':/work','-w','/work','-e','HOME=/tmp','mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test','tests/e2e/versioned-match.spec.ts','tests/e2e/reference-complete-game.spec.ts','tests/e2e/game-event-log.spec.ts','tests/e2e/geographic-review-guards.spec.ts','--workers=2'])
 else:
  ok=run('focused',['npx','vitest','run','tests/core/card-sets.test.ts','tests/core/card-sets-replay.test.ts'])==0
  if ok and '--focused-only' not in sys.argv:
   run('units',['npm','test']);run('build',['npm','run','build'])
finally:
 for p,b in saved.items():
  if b is None:(root/p).unlink(missing_ok=True)
  else:(root/p).write_bytes(b)
 receipt['restoredExactly']=all(((root/p).read_bytes()==b if b is not None else not(root/p).exists()) for p,b in saved.items())
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2))
 print(json.dumps({'path':str(out.relative_to(root)),**receipt},indent=2))
