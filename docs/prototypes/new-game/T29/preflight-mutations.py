"""Historical disposable mock mutation controls, with exact restoration."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='mock-controls-',dir=root/'preflight'))
p=repo/'src/core/rules.ts';saved=p.read_bytes();raw={};sources={'baseline/rules.ts':saved};records=[]
cmd=['npx','vitest','run','tests/core/friendly-move.test.ts']
def run(name,want):
 r=subprocess.run(cmd,cwd=repo,capture_output=True);raw[name+'/stdout.txt']=r.stdout;raw[name+'/stderr.txt']=r.stderr
 records.append({'name':name,'command':cmd,'exit':r.returncode,'wantedSuccess':want,'matched':(r.returncode==0)==want});print(name,r.returncode,flush=True);assert records[-1]['matched'],name
mutants=[
 ('quantity','if(!Number.isSafeInteger(n)||n<1||n>max)return {ok:false,error:"quantity out of bounds"};',''),
 ('adjacency','[...p.borders,...p.seaLanes].filter(id=>s.ownerOf[id]===m)','s.map.provinces.map(p=>p.id).filter(id=>s.ownerOf[id]===m)'),
 ('conservation','next.armies[action.from]!-=n;','next.armies[action.from]!-=n-1;'),
 ('handoff','const r=applyInherited(next,{kind:"endTurn"});','const r={ok:true as const,state:next,outcome:null};'),
 ('preset','s.rules.movement!=="adjacent" || ',''),
]
try:
 run('baseline',True)
 for name,a,b in mutants:
  assert saved.count(a.encode())==1,a
  changed=saved.replace(a.encode(),b.encode());sources[name+'/rules.ts']=changed
  try:p.write_bytes(changed);run(name,False)
  finally:p.write_bytes(saved);assert p.read_bytes()==saved
 run('restored',True)
finally:
 p.write_bytes(saved);archives={}
 for name,items in [('raw-logs.tar.gz',raw),('sources.tar.gz',sources)]:
  with tarfile.open(out/name,'w:gz') as t:
   for n,b in items.items():m=tarfile.TarInfo(n);m.size=len(b);t.addfile(m,io.BytesIO(b))
  archives[name]={'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'members':{n:hashlib.sha256(b).hexdigest() for n,b in items.items()}}
 (out/'report.json').write_text(json.dumps({'records':records,'archives':archives,'restored':p.read_bytes()==saved},indent=2)+'\n');print(out.relative_to(repo))
