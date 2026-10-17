from pathlib import Path
import json,subprocess,tempfile,hashlib,shutil
repo=Path('/home/diego/projects/malpaco/.cache/t64-work');root=repo/'docs/prototypes/new-game/T64'
out=Path(tempfile.mkdtemp(prefix='mock-preflight-',dir=root/'evidence'))
owned=[root/'layout.mjs',repo/'src/ui/referenceMapView.ts',root/'board.json',root/'map.svg',root/'preview.html']
original={p:p.read_bytes() if p.exists() else None for p in owned}
sha=lambda b:hashlib.sha256(b).hexdigest()
for p,b in original.items():
 if b is not None:
  dest=out/'originals'/p.relative_to(repo);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
rows=[]
try:
 (root/'layout.mjs').write_text('''// Disposable static mock, not production implementation.
import fs from 'node:fs';
const reference=JSON.parse(fs.readFileSync(new URL('./acceptance/board.json',import.meta.url)));
export function coastPostprocess(input){
 const b=structuredClone(input);
 for(const p of b.provinces){const target=reference.provinces.find(q=>q.id===p.id);p.polygon=structuredClone(target.polygon);p.labelAt=[...target.labelAt];}
 for(const i of b.islands)i.polygon=structuredClone(reference.islands.find(q=>q.id===i.id).polygon);
 for(const r of b.routes)r.points=structuredClone(reference.routes.find(q=>q.from===r.from&&q.to===r.to).points);
 return b;
}
''')
 source=root/'evidence/dual-probe-APvw3p'
 for name,extension in [('board.json','json'),('map.svg','svg'),('preview.html','html')]:shutil.copy2(source/('spread-0.02.'+extension),root/name)
 p=repo/'src/ui/referenceMapView.ts';text=p.read_text();assert text.count('T63/map.svg?raw')==1;text=text.replace('T63/map.svg?raw','T64/map.svg?raw').replace('x:p.labelAt[0]-25,y:p.labelAt[1]-10','x:Number(n.querySelector(".count")!.getAttribute("x"))-25,y:Number(n.querySelector(".count")!.getAttribute("y"))-28');p.write_text(text)
 for p in owned:
  dest=out/'mock-inputs'/p.relative_to(repo);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 for index,command in enumerate([['python3',str(root/'checks.py'),'--focused'],['python3',str(root/'checks.py')],['python3',str(root/'run.py')]]):
  with (out/f'{index}.txt').open('wb') as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
  rows.append({'command':command,'exit':r.returncode,'output':f'{index}.txt','tail':(out/f'{index}.txt').read_text()[-3500:]})
  if r.returncode:break
finally:
 for p,b in original.items():
  if b is None:
   if p.exists():p.unlink()
  else:p.write_bytes(b)
 restored={str(p.relative_to(repo)):(p.read_bytes()==b if b is not None else not p.exists()) for p,b in original.items()}
 (out/'report.json').write_text(json.dumps({'purpose':'disposable mock-positive proof; all source/assets restored','originalHashes':{str(p.relative_to(repo)):sha(b) if b is not None else None for p,b in original.items()},'restored':restored,'commands':rows},indent=2)+'\n')
 print(json.dumps({'output':str(out.relative_to(repo)),'restored':restored,'commands':rows},indent=2))
assert all(restored.values())
raise SystemExit(any(r['exit'] for r in rows))
