from pathlib import Path
import subprocess,json
out=Path('docs/prototypes/new-game/T78/preflight');source=Path('src/ui/workspaceState.ts');assert not source.exists()
results=[]
try:
 source.write_text((out/'mock-boundary.txt').read_text())
 for label,command in [('mock-npm-test-01',['npm','test']),('mock-build-01',['npm','run','build'])]:
  with (out/f'{label}.txt').open('w') as stream:p=subprocess.run(command,stdout=stream,stderr=subprocess.STDOUT)
  results.append({'label':label,'command':command,'exit':p.returncode});print(label,p.returncode,flush=True)
  if p.returncode:break
finally:
 if source.exists():source.unlink()
 (out/'regression-results-01.json').write_text(json.dumps(results,indent=2)+'\n')
