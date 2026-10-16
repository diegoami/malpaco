"""Actual production deletion controls; save/restore exact bytes in finally."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='actual-mutations-',dir=root/'evidence'))
selected=set(sys.argv[1:])
files=['src/core/setup.ts','src/core/state.ts','src/core/victory.ts','src/core/rules.ts','src/ui/referenceBattleGame.ts','src/ui/victoryView.ts','src/ui/battleController.ts']
saved={p:(repo/p).read_bytes() for p in files};raw={};sources={f'baseline/{p}':b for p,b in saved.items()};records=[]
core=['npx','vitest','run','tests/core/victory-options.test.ts']
sha=lambda b:hashlib.sha256(b).hexdigest()
def run(name,cmd,want):
 r=subprocess.run(cmd,cwd=repo,capture_output=True);raw[name+'/stdout.txt']=r.stdout;raw[name+'/stderr.txt']=r.stderr
 item={'name':name,'command':cmd,'exit':r.returncode,'wantedSuccess':want,'matched':(r.returncode==0)==want}
 if not want and cmd[:3]==['npx','vitest','run']:item['behavioralFailure']=b'Tests ' in r.stdout and b'failed' in r.stdout
 records.append(item);print(name,r.returncode,flush=True)
 if want:assert item['matched'],name
 return item
mutants=[
 ('origin-metadata','src/core/setup.ts','...(rules.victoryOptions ? { roundOrigin: firstSeat } : {}),',''),
 ('round-wrap','src/core/victory.ts','turnPosition(state, seat) <= turnPosition(state, state.currentPlayer)','seat === 0'),
 ('dead-seat-skip','src/core/victory.ts','if (!state.players[seat]!.eliminated)','if (true)'),
 ('domination-threshold','src/core/victory.ts','(3 * countries + 3) / 4','(4 * countries + 3) / 4'),
 ('domination-toggle','src/core/victory.ts','options.dominationWin && provincesOf','provincesOf'),
 ('domination-own-turn','src/core/victory.ts','provincesOf(state, mover.id).length >= dominationThreshold','standings[0]!.countries >= dominationThreshold'),
 ('complete-round-boundary','src/core/victory.ts','&& completedRound &&','&&'),
 ('country-ranking','src/core/victory.ts','b.countries - a.countries || ',' '),
 ('army-ranking','src/core/victory.ts','b.armies - a.armies\n    || ',' '),
 ('rotated-ranking','src/core/victory.ts','turnPosition(state, b.seat) - turnPosition(state, a.seat)','b.seat - a.seat'),
 ('no-human-loss','src/core/victory.ts','!state.watchingComputers && state.players.some','false && state.players.some'),
 ('all-computer-exemption','src/core/victory.ts','state.players.some(player => player.kind !== "computer")','true'),
 ('watch-suppresses-prompt','src/core/rules.ts','state.watchingComputers = true;','state.watchingComputers = false;'),
 ('watch-clears-result','src/core/rules.ts','delete state.result;',''),
 ('watch-handoff','src/core/rules.ts','    beginNextTurn(state);',''),
 ('stop-freezes','src/core/rules.ts','if (choice === "stopGame") state.phase = "finished";','if (choice === "stopGame") state.phase = "human-loss";'),
 ('choice-phase-gate','src/core/rules.ts','!state.rules.victoryOptions || state.phase !== "human-loss"','!state.rules.victoryOptions'),
 ('watch-rng','src/core/rules.ts','state.watchingComputers = true;','state.watchingComputers = true; state.rng.state += 1;'),
 ('clone-origin','src/core/state.ts','...(state.roundOrigin !== undefined ? { roundOrigin: state.roundOrigin } : {}),',''),
 ('premature-capture-victory','src/core/rules.ts','  delete state.pendingCapture;\n  state.phase = "attack";','  delete state.pendingCapture;\n  state.phase = "attack";\n  if (state.rules.victoryOptions) return completeTurn(state);'),
]
def mutate(name,changes,command):
 try:
  for p,a,b in changes:
   original=(repo/p).read_bytes();assert original.count(a.encode())==1,(name,p,a)
   changed=original.replace(a.encode(),b.encode());(repo/p).write_bytes(changed)
   sources[f'{name}/{p}']=changed
  run(name,command,False)
 finally:
  for p in files:(repo/p).write_bytes(saved[p])
  assert all((repo/p).read_bytes()==b for p,b in saved.items())
try:
 run('baseline-core',core,True)
 for name,p,a,b in mutants:
  if not selected or name in selected:mutate(name,[(p,a,b)],core)
 if not selected or 'controller-revision' in selected:
  run('baseline-controller',['npx','vitest','run','tests/ui/battle-controller.test.ts'],True)
  mutate('controller-revision',[('src/ui/battleController.ts','(revision === undefined || revision === this.current.revision)','true')],['npx','vitest','run','tests/ui/battle-controller.test.ts'])
 run('restored-core',core,True)
 # The full six-case baseline is retained in implementation-browser-2wfu66ao.
 baseline=json.loads((root/'evidence/implementation-browser-2wfu66ao/report.json').read_text())
 assert baseline['exit']==0 and baseline['sourcesUnchangedDuringRun']
 assert all(baseline['sourceHashes'][p]==sha(b) for p,b in saved.items())
 for name,changes,grep in [
  ('result-reason',[('src/ui/victoryView.ts','id: "victory-reason"','id: "missing-victory-reason"')],'domination'),
  ('result-order',[('src/ui/victoryView.ts','...standings.map(row =>','...[...standings].reverse().map(row =>')],'domination'),
  ('finished-phase-controls',[
   ('src/ui/referenceBattleGame.ts','disabled: running || paused || state.phase !== "attack"','disabled: false'),
   ('src/ui/referenceBattleGame.ts','mode === "move" || state.result ? "none" : ""','mode === "move" ? "none" : ""')],'domination'),
  ('watch-button-action',[('src/ui/victoryView.ts','dispatch({ kind: "watchComputers" }, revision)','dispatch({ kind: "stopGame" }, revision)')],'human loss'),
 ]:
  if not selected or name in selected:mutate(name,changes,['python3',str(root/'run-browser.py'),name,'--grep',grep])
 run('restored-core-final',core,True)
finally:
 for p,b in saved.items():(repo/p).write_bytes(b);sources[f'restored/{p}']=(repo/p).read_bytes()
 sources['tool/check-mutations.py']=Path(__file__).read_bytes()
 archives={}
 for name,items in [('raw-logs.tar.gz',raw),('source-snapshots.tar.gz',sources)]:
  with tarfile.open(out/name,'w:gz') as t:
   for n,b in items.items():m=tarfile.TarInfo(n);m.size=len(b);t.addfile(m,io.BytesIO(b))
  with tarfile.open(out/name) as t:assert all(t.extractfile(n).read()==b for n,b in items.items())
  archives[name]={'sha256':sha((out/name).read_bytes()),'members':{n:sha(b) for n,b in items.items()}}
 report={'selection':sorted(selected),'records':records,'archives':archives,'restored':{p:(repo/p).read_bytes()==b for p,b in saved.items()},'baselineBrowser':'evidence/implementation-browser-2wfu66ao','caught':sum(not r['wantedSuccess'] and r['matched'] for r in records),'survivors':[r['name'] for r in records if not r['matched']]}
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(out.relative_to(repo),flush=True)
 assert all(report['restored'].values()) and not report['survivors']
