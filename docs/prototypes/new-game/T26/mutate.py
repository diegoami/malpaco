"""Prove live reference-map, count, target, route and size-boundary behaviour."""
from pathlib import Path
import subprocess,tempfile,hashlib,json,tarfile,io,re
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='mutations-',dir=root/'evidence'))
sha=lambda b:hashlib.sha256(b).hexdigest()
records=[];logs={};baseline=[]
core=repo/'src/core/reference-game.ts';view=repo/'src/ui/referenceMapView.ts'
core_bytes=core.read_bytes();view_bytes=view.read_bytes()
core_text=core_bytes.decode();view_text=view_bytes.decode()
size='  if (map.provinces.length !== DEAL_COUNTRY_COUNT) {\n    return { ok: false, errors: [`Reference map requires ${DEAL_COUNTRY_COUNT} countries`] };\n  }\n'
count=re.search(r'n\.querySelector\("\.count"\)!\.textContent=`[^`]+`;',view_text).group(0)
cases=[
 ('generated-instead-of-reference',core,'() => ({ ok: true, map })','undefined',['npx','vitest','run','tests/core/reference-game.test.ts']),
 ('size-boundary-deleted',core,size,'',['npx','vitest','run','tests/core/reference-map-validation.test.ts']),
 ('stale-visible-count',view,count,'',['python3','docs/prototypes/new-game/T26/run-browser.py','mutation-count','--grep','reference setup']),
 ('missing-legal-targets',view,'n.dataset["target"]=String(view.targets.includes(id));','n.dataset["target"]="false";',['python3','docs/prototypes/new-game/T26/run-browser.py','mutation-targets','--grep','ordinary reference clicks']),
 ('missing-target-paint',view,'n.classList.toggle("neighbor",view.targets.includes(id));','',['python3','docs/prototypes/new-game/T26/run-browser.py','mutation-target-paint','--grep','ordinary reference clicks']),
 ('wrong-sea-drawing',view,'parseFromString(drawing,"image/svg+xml")',"parseFromString(drawing.replace('points=\"','points=\"0,0 '),\"image/svg+xml\")",['python3','docs/prototypes/new-game/T26/run-browser.py','mutation-route','--grep','reference setup']),
]
try:
 for name,command in [('core',['npx','vitest','run','tests/core/reference-game.test.ts','tests/core/reference-map-validation.test.ts']),('browser',['python3','docs/prototypes/new-game/T26/run-browser.py','mutation-baseline'])]:
  r=subprocess.run(command,cwd=repo,capture_output=True);logs['baseline-'+name+'.stdout.txt']=r.stdout;logs['baseline-'+name+'.stderr.txt']=r.stderr;baseline.append({'name':name,'exit':r.returncode,'command':command});assert r.returncode==0,'Baseline must be green before mutation: '+name
 for name,path,before,after,command in cases:
  original=path.read_bytes();text=original.decode();assert text.count(before)==1,(name,text.count(before))
  try:
   path.write_text(text.replace(before,after));r=subprocess.run(command,cwd=repo,capture_output=True)
   logs[name+'.stdout.txt']=r.stdout;logs[name+'.stderr.txt']=r.stderr
   records.append({'name':name,'command':command,'exit':r.returncode,'mutationSha256':sha(path.read_bytes()),'outputTail':r.stdout.decode(errors='replace')[-5000:]})
   assert r.returncode==1,'Mutation survived or infrastructure error: '+name
   combined=(r.stdout+r.stderr).decode(errors='replace');assert 'failed' in combined.lower(),name
   assert 'SyntaxError' not in combined and 'Error: Process from config.webServer' not in combined,name
  finally:
   path.write_bytes(original);assert path.read_bytes()==original
finally:
 core.write_bytes(core_bytes);view.write_bytes(view_bytes)
 with tarfile.open(out/'raw-logs.tar.gz','w:gz') as a:
  for name,data in logs.items():entry=tarfile.TarInfo(name);entry.size=len(data);entry.mtime=0;a.addfile(entry,io.BytesIO(data))
 with tarfile.open(out/'raw-logs.tar.gz') as a:assert all(a.extractfile(n).read()==data for n,data in logs.items())
 report={'baseline':baseline,'records':records,'restoredExactly':core.read_bytes()==core_bytes and view.read_bytes()==view_bytes,'sourceSha256':{'src/core/reference-game.ts':sha(core_bytes),'src/ui/referenceMapView.ts':sha(view_bytes)},'archiveSha256':sha((out/'raw-logs.tar.gz').read_bytes()),'archiveMemberHashes':{n:sha(b) for n,b in logs.items()}}
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(out.relative_to(repo)),'killed':len(records),'restoredExactly':report['restoredExactly']},indent=2))
assert len(records)==6
