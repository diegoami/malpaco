#!/usr/bin/env python3
"""Parent-only disposable integration; preserve exact production bytes in finally."""
from pathlib import Path
import hashlib,json,subprocess,time,datetime,sys,os
root=Path.cwd(); owned=root/'docs/prototypes/new-game/T39'; mock=owned/'parent-preflight/integrated-mock/src'
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=owned/'parent-acceptance'/('mock-'+stamp);out.mkdir()
replacements={Path(item['path']):(owned/'parent-preflight/integrated-mock'/item['path']).read_bytes() for item in json.loads((owned/'parent-preflight/install-manifest.json').read_text())['files']}
saved={p:(root/p).read_bytes() if (root/p).exists() else None for p in replacements}
sha=lambda b:hashlib.sha256(b).hexdigest()
receipt={'replacements':{str(p):sha(b) for p,b in replacements.items()},'commands':[]}
def run(name,args):
 start=time.monotonic()
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:r=subprocess.run(args,stdout=stdout,stderr=stderr)
 receipt['commands'].append({'name':name,'argv':args,'exit':r.returncode,'durationSeconds':time.monotonic()-start})
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2))
 return r.returncode
assert run('final-baseline',['npx','vitest','run','tests/core/raid-shield.test.ts','tests/core/raid-shield-replay.test.ts'])!=0
try:
 for p,b in replacements.items():
  backup=out/'before'/p;backup.parent.mkdir(parents=True,exist_ok=True)
  if saved[p] is not None:backup.write_bytes(saved[p])
  target=root/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
 tests=['npx','vitest','run','tests/core/raid-shield.test.ts','tests/core/raid-shield-replay.test.ts']
 ok=run('focused',tests)==0
 if ok:
  controls=[('pending-gate','src/core/rules.ts',"  if (state.cards?.pendingRaid && action.kind !== 'raidTarget') return {ok:false,error:'choose an enemy country for the raid'};",''),('friendly-target','src/core/rules.ts','defender===p||',''),('wrong-shield','src/core/rules.ts','hand.splice(shield,1)','hand.splice(0,1)'),('upper-cap','src/core/raid.ts','Math.max(1,Math.floor(armies/2))','Math.min(20,Math.max(1,Math.floor(armies/2)))')]
  for name,path,old,new in controls:
   target=root/path;b=target.read_bytes();old=old.encode();assert b.count(old)==1
   try:
    (out/(name+'-original.ts')).write_bytes(b);target.write_bytes(b.replace(old,new.encode()));assert run(name,tests)!=0,name
   finally:target.write_bytes(b)
  run('units',['npm','test']);run('build',['npm','run','build'])

finally:
 for p,b in saved.items():
  if b is None:(root/p).unlink(missing_ok=True)
  else:(root/p).write_bytes(b)
 receipt['restoredExactly']=all(((root/p).read_bytes()==b if b is not None else not(root/p).exists()) for p,b in saved.items())
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2))
 print(json.dumps({'path':str(out.relative_to(root)),**receipt},indent=2))
