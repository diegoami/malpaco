from pathlib import Path
import subprocess,tempfile,json,hashlib
r=Path('/home/diego/projects/malpaco/.cache/t65-work');d=r/'docs/prototypes/new-game/T65';out=Path(tempfile.mkdtemp(prefix='mock-',dir=d/'evidence'))
paths=[d/'borders.mjs',r/'src/ui/referenceMapView.ts',d/'board.json',d/'map.svg',d/'preview.html']
saved={p:p.read_bytes() if p.exists() else None for p in paths}
for j,(p,b) in enumerate(saved.items()):
 if b is not None:(out/f'original-{j}').write_bytes(b)
rows=[]
try:
 (d/'borders.mjs').write_text("import fs from 'node:fs';\nconst board=JSON.parse(fs.readFileSync(new URL('./acceptance/board.json',import.meta.url)));\nexport function naturalizeBorders(input,seed=input.seed){const output=structuredClone(board);return output;}\n")
 # The mock proves native browser constraints only; seed invariants are separately proved by the probe.
 subprocess.run(['node','--input-type=module','-e',"import fs from 'node:fs';import{svg,html}from'./docs/prototypes/new-game/T64/render.mjs';const b=JSON.parse(fs.readFileSync('./docs/prototypes/new-game/T65/acceptance/board.json'));for(const[n,s]of Object.entries({'board.json':JSON.stringify(b,null,2)+'\\n','map.svg':svg(b),'preview.html':html(b)}))fs.writeFileSync('./docs/prototypes/new-game/T65/'+n,s);"],cwd=r,check=True)
 p=r/'src/ui/referenceMapView.ts';p.write_bytes(saved[p].replace(b'T64/map.svg',b'T65/map.svg'))
 for command in [['python3','docs/prototypes/new-game/T65/run.py']]:
  with(out/'output.txt').open('wb')as log:result=subprocess.run(command,cwd=r,stdout=log,stderr=subprocess.STDOUT)
  rows.append({'command':command,'exit':result.returncode})
finally:
 restored={}
 for p,b in saved.items():
  if b is None:
   if p.exists():
    (out/('mock-'+p.name)).write_bytes(p.read_bytes());p.unlink()
  else:p.write_bytes(b)
  restored[str(p.relative_to(r))]=(p.read_bytes()==b if b is not None else not p.exists())
 (out/'report.json').write_text(json.dumps({'results':rows,'restored':restored},indent=2)+'\n')
 print(json.dumps({'output':str(out.relative_to(r)),'results':rows,'restored':restored}))
