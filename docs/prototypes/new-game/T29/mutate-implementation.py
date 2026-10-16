"""Actual-source deletions: green baseline, behavioral failures, exact finally restore."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='actual-mutations-',dir=root/'evidence'))
paths=['src/core/movement.ts','src/core/rules.ts','src/ui/battleController.ts','src/ui/referenceBattleGame.ts','src/ui/friendlyMoveView.ts']
saved={p:(repo/p).read_bytes() for p in paths};snapshots={'runner.py':Path(__file__).read_bytes(),**{'baseline/'+p:b for p,b in saved.items()}};raw={};records=[]
unit=['npx','vitest','run','tests/core/friendly-move.test.ts','tests/core/friendly-move-edges.test.ts','tests/ui/friendly-move-controller.test.ts']
def browser(label,suites,pattern=None):
 c=['python3',str(root/'run-browser.py'),label,'--suites',suites]
 return c+(['--project','1280x800','--grep',pattern] if pattern else [])
def run(name,command,positive):
 r=subprocess.run(command,cwd=repo,capture_output=True);raw[name+'/stdout.txt']=r.stdout;raw[name+'/stderr.txt']=r.stderr
 records.append({'name':name,'command':command,'exit':r.returncode,'wantedSuccess':positive,'matched':(r.returncode==0)==positive});print(name,r.returncode,flush=True);assert records[-1]['matched'],name
M='src/core/movement.ts';R='src/core/rules.ts';C='src/ui/battleController.ts';H='src/ui/referenceBattleGame.ts';V='src/ui/friendlyMoveView.ts'
mutants=[
 ('quantity',R,'if (!Number.isSafeInteger(amount) || amount < 1 || amount > maximum)','if (false)'),
 ('leave-one',R,'const maximum = state.armies[from]! - 1;','const maximum = state.armies[from]!;'),
 ('adjacency',M,'if (from === to || !neighbours(source).includes(to))','if (false)'),
 ('ownership',M,'if (ownerOf(state, from) !== player || ownerOf(state, to) !== player)','if (false)'),
 ('phase',M,'state.phase !== "attack" || state.pendingCapture','false'),
 ('preset',M,'state.rules.movement !== "adjacent" || ',''),
 ('handoff',R,'return endTurn(state);','return {ok:true,state,outcome:null};'),
 ('conservation',R,'state.armies[from] = state.armies[from]! - amount;','state.armies[from] = state.armies[from]! - amount + 1;'),
 ('default',R,'const amount = requested === undefined ? maximum : requested;','const amount = requested === undefined ? 1 : requested;'),
 ('null-default',R,'const amount = requested === undefined ? maximum : requested;','const amount = requested ?? maximum;'),
 ('rng',R,'state.armies[to] = state.armies[to]! + amount;','state.armies[to] = state.armies[to]! + amount;\n  const rng = DeterministicRng.fromSnapshot(state.rng); rng.rollDie(6); state.rng = rng.snapshot();'),
 ('revision',C,'(revision === undefined || revision === this.current.revision)','true'),
 ('selected-pair',C,'    if (action.kind === "friendlyMove" && (action.from !== this.current.from || action.to !== this.current.to)) return false;\n',''),
 ('hidden-confirm-combined',C,'} else if (action.kind === "friendlyMove") return false;','}'),
 ('running-entry',C,'this.current.mode !== "battle" || this.current.running || this.current.paused || this.pending()','this.current.mode !== "battle" || this.current.paused || this.pending()'),
 ('paused-entry',C,'this.current.mode !== "battle" || this.current.running || this.current.paused || this.pending()','this.current.mode !== "battle" || this.current.running || this.pending()'),
 ('cancel-context',C,'this.publish({ mode: "battle", from, to, effectiveThreshold,','this.publish({ mode: "battle", from: null, to: null, effectiveThreshold,'),
 ('replacement-mode',C,'this.publish({ mode: "battle", state: next,','this.publish({ state: next,'),
 ('disposed-mode',C,'this.publish({ mode: "battle", running: false, paused: false });','this.publish({ running: false, paused: false });'),
]
browsers=[
 ('route-feedback',H,'from !== null && ends.includes(from) && ends.some(id => id !== from && targets.includes(id))','ends.includes(from ?? "")','tests/e2e/friendly-feedback.spec.ts','movement route'),
 ('escape-cancel',H,'    if (this.controller.cancelFriendlyMove()) return;\n','','tests/e2e/friendly-feedback.spec.ts','Escape'),
 ('quantity-default',V,'value:String(maximum)','value:"1"','tests/e2e/friendly-move.spec.ts','friendly maximum'),
]
try:
 run('unit-baseline',unit,True)
 run('browser-baseline',browser('actual-browser-baseline','tests/e2e/friendly-move.spec.ts,tests/e2e/friendly-feedback.spec.ts'),True)
 for label,path,a,b in mutants:
  assert saved[path].count(a.encode())==1,(label,a)
  changed=saved[path].replace(a.encode(),b.encode())
  if label=='hidden-confirm-combined':
   pair=b'    if (action.kind === "friendlyMove" && (action.from !== this.current.from || action.to !== this.current.to)) return false;\n'
   assert changed.count(pair)==1
   changed=changed.replace(pair,b'')
  snapshots[label+'/'+path]=changed
  try:(repo/path).write_bytes(changed);run(label,unit,False)
  finally:(repo/path).write_bytes(saved[path]);assert (repo/path).read_bytes()==saved[path]
 for label,path,a,b,suites,pattern in browsers:
  assert saved[path].count(a.encode())==1,(label,a)
  changed=saved[path].replace(a.encode(),b.encode());snapshots[label+'/'+path]=changed
  try:(repo/path).write_bytes(changed);run(label,browser('actual-mutant-'+label,suites,pattern),False)
  finally:(repo/path).write_bytes(saved[path]);assert (repo/path).read_bytes()==saved[path]
 run('unit-restored',unit,True)
 run('browser-restored',browser('actual-browser-restored','tests/e2e/friendly-move.spec.ts,tests/e2e/friendly-feedback.spec.ts'),True)
finally:
 for p,b in saved.items():(repo/p).write_bytes(b)
 archives={};sha=lambda b:hashlib.sha256(b).hexdigest()
 for name,items in [('raw-logs.tar.gz',raw),('source-snapshots.tar.gz',snapshots)]:
  with tarfile.open(out/name,'w:gz') as t:
   for n,b in items.items():m=tarfile.TarInfo(n);m.size=len(b);t.addfile(m,io.BytesIO(b))
  archives[name]={'sha256':sha((out/name).read_bytes()),'members':{n:sha(b) for n,b in items.items()}}
 (out/'report.json').write_text(json.dumps({'records':records,'archives':archives,'restoration':{p:sha((repo/p).read_bytes())==sha(b) for p,b in saved.items()}},indent=2)+'\n');print(out.relative_to(repo),flush=True)
