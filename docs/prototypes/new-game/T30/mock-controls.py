"""Check independent acceptance sensitivity against disposable feasibility code."""
from pathlib import Path
import hashlib,io,json,subprocess,tarfile,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='mock-controls-',dir=root/'preflight'))
paths=['src/core/__t30_mock.ts','src/core/setup.ts','src/core/rules.ts','src/ui/referenceBattleGame.ts']
saved={name:(repo/name).read_bytes() for name in paths}
unit=['npx','vitest','run','tests/core/victory-options.test.ts']
results=[];logs={}
def run(label,command,expected):
 r=subprocess.run(command,cwd=repo,capture_output=True)
 logs[label+'.stdout']=r.stdout;logs[label+'.stderr']=r.stderr
 results.append({'label':label,'command':command,'exit':r.returncode,'expected':expected})
 assert (r.returncode==0)==(expected=='pass'),(label,r.returncode,r.stdout[-1000:],r.stderr[-1000:])
def replace(path,old,new):
 p=repo/path;s=p.read_text();assert s.count(old)==1,(path,old,s.count(old));p.write_text(s.replace(old,new))
cases=[
 ('origin-metadata','src/core/setup.ts','roundOrigin:firstSeat','roundOrigin:0'),
 ('round-boundary','src/core/__t30_mock.ts','function boundary(s:GameState){const origin=s.roundOrigin??0','function boundary(s:GameState){const origin=0'),
 ('skip-dead','src/core/__t30_mock.ts','if(!s.players[i]!.eliminated)return i;','return i;'),
 ('threshold','src/core/__t30_mock.ts','Math.floor((3*s.map.provinces.length+3)/4)','34'),
 ('disabled-domination','src/core/__t30_mock.ts','options.dominationWin&&own.countries','own.countries'),
 ('own-turn-only','src/core/__t30_mock.ts','options.dominationWin&&own.countries>=Math.floor((3*s.map.provinces.length+3)/4)','options.dominationWin&&standings.some(r=>r.countries>=Math.floor((3*s.map.provinces.length+3)/4))'),
 ('complete-round-only','src/core/__t30_mock.ts','options.roundLimit!==null&&boundary(s)&&s.turnNumber','options.roundLimit!==null&&s.turnNumber'),
 ('countries-first','src/core/__t30_mock.ts','b.countries-a.countries||b.armies-a.armies','b.armies-a.armies||b.countries-a.countries'),
 ('army-tie','src/core/__t30_mock.ts','||b.armies-a.armies||order(b.player)','||order(b.player)'),
 ('rotated-tie','src/core/__t30_mock.ts','order(b.player)-order(a.player)','s.players.findIndex(p=>p.id===b.player)-s.players.findIndex(p=>p.id===a.player)'),
 ('human-loss','src/core/__t30_mock.ts','else if(!s.watchingComputers&&s.players.some','else if(false&&s.players.some'),
 ('watch-suppression','src/core/__t30_mock.ts','!s.watchingComputers&&s.players.some','s.players.some'),
 ('watch-handoff','src/core/__t30_mock.ts','s.watchingComputers=true;delete s.result;return handoff(s);','s.watchingComputers=true;delete s.result;s.currentPlayer=nextSeat(s);return handoff(s);'),
 ('stop-freeze','src/core/__t30_mock.ts','s.phase="finished";return {ok:true,state:s,outcome:null};','s.phase="finished";return handoff(s);'),
 ('no-extra-rng','src/core/__t30_mock.ts',' const standings=rows(s),own=',' s.rng.state=(s.rng.state+1)>>>0;const standings=rows(s),own='),
]
try:
 run('baseline',unit,'pass')
 for label,path,old,new in cases:
  try:
   replace(path,old,new);logs[label+'.source.ts']=(repo/path).read_bytes();run(label,unit,'fail')
  finally:
   for name,data in saved.items():(repo/name).write_bytes(data)
 run('restored',unit,'pass')
finally:
 for name,data in saved.items():(repo/name).write_bytes(data)
 with tarfile.open(out/'sources.tar.gz','w:gz') as a:
  for name,data in saved.items():
   m=tarfile.TarInfo(name);m.size=len(data);a.addfile(m,io.BytesIO(data))
 with tarfile.open(out/'raw-logs.tar.gz','w:gz') as a:
  for name,data in logs.items():
   m=tarfile.TarInfo(name);m.size=len(data);a.addfile(m,io.BytesIO(data))
 sha=lambda b:hashlib.sha256(b).hexdigest()
 (out/'report.json').write_text(json.dumps({'results':results,'sourcesRestored':all((repo/n).read_bytes()==b for n,b in saved.items()),'sourceHashes':{n:sha(b) for n,b in saved.items()},'archiveSha256':sha((out/'raw-logs.tar.gz').read_bytes()),'memberHashes':{n:sha(b) for n,b in logs.items()}},indent=2)+'\n')
 print(out.relative_to(repo),len(results))
