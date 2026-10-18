#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,subprocess,time,datetime,os,sys
root=Path.cwd();owned=root/'docs/prototypes/new-game/T71';mock=owned/'parent-preflight/mock-src/src'
out=owned/'parent-acceptance'/('mock-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'));out.mkdir()
replacements={Path('src')/p.relative_to(mock):p.read_bytes() for p in mock.rglob('*') if p.is_file()}
saved={p:(root/p).read_bytes() if (root/p).exists() else None for p in replacements};sha=lambda b:hashlib.sha256(b).hexdigest()
receipt={'sources':{str(p):sha(b) for p,b in replacements.items()},'commands':[]}
def run(name,args):
 start=time.monotonic()
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:r=subprocess.run(args,stdout=stdout,stderr=stderr)
 receipt['commands'].append({'name':name,'argv':args,'exit':r.returncode,'seconds':time.monotonic()-start});(out/'receipt.json').write_text(json.dumps(receipt,indent=2));return r.returncode
def browser(name,extra,files=None,custom=True):
 args=['docker','run','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(root)+':/work','-w','/work','-e','HOME=/tmp','-e','COMPACT_PANEL_EVIDENCE_DIR='+str(out.relative_to(root)/(name+'-screenshots')),'-e','COMPACT_PANEL_RESULTS_DIR=/work/'+str(out.relative_to(root)/(name+'-results')),'mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test']
 if custom:args+=['--config','docs/prototypes/new-game/T71/parent-acceptance/playwright.config.ts']
 if files:args+=files
 return run(name,args+extra+['--output','/work/'+str(out.relative_to(root)/(name+'-results')),'--workers=2'])
try:
 if '--remaining' in sys.argv:browser('baseline-human-loss',['-g','human-loss'])
 for p,b in replacements.items():
  backup=out/'before'/p;backup.parent.mkdir(parents=True,exist_ok=True)
  if saved[p] is not None:backup.write_bytes(saved[p])
  (root/p).write_bytes(b)
 if '--battle' in sys.argv:
  run('build',['npm','run','build']);browser('battle-corrected',[],['tests/e2e/battle-controls.spec.ts'],False)
 elif '--remaining' in sys.argv:
  browser('human-loss',['-g','human-loss'])
  target=root/'src/styles.css';b=target.read_bytes();old=b'.battle-reference[data-panel-detail="compact"] .battle-rolls { display:none; }';assert b.count(old)==1
  try:
   target.write_bytes(b.replace(old,old.replace(b'none',b'block')));browser('omit-compact-hiding',['--project','1280x800','-g','reference compact: real computer'])
  finally:target.write_bytes(b)
  try:
   marker=b'/* T71 disposable candidate:';assert b.count(marker)==1;target.write_bytes(b[:b.index(marker)]);browser('omit-stability',['--project','1280x800','-g','reference: computer phase changes'])
  finally:target.write_bytes(b)
  browser('affected',[],['tests/e2e/battle-controls.spec.ts','tests/e2e/friendly-move.spec.ts','tests/e2e/versioned-match.spec.ts','tests/e2e/playback-controls.spec.ts','tests/e2e/playback-edge-cases.spec.ts','tests/e2e/game-event-log.spec.ts','tests/e2e/computer-turn-flow.spec.ts','tests/e2e/reference-complete-game.spec.ts','tests/e2e/geographic-review-guards.spec.ts','tests/e2e/geographic-board.spec.ts'],False)
 else:
  unit=run('focused',['npx','vitest','run','tests/ui/compact-panels.test.ts'])
  result=browser('browsers',[])
  if unit==0 and result==0:run('units',['npm','test']);run('build',['npm','run','build'])
finally:
 for p,b in saved.items():
  if b is None:(root/p).unlink(missing_ok=True)
  else:(root/p).write_bytes(b)
 receipt['restoredExactly']=all(((root/p).read_bytes()==b if b is not None else not(root/p).exists()) for p,b in saved.items());(out/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps({'path':str(out.relative_to(root)),**receipt},indent=2))
