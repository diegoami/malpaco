from pathlib import Path
import subprocess,json,hashlib
D=Path(__file__).resolve().parent;R=D.parents[4];core=R/'src/core/island-geography.ts';original=core.read_bytes()
selected=[p.parent for p in D.glob('sample-*/report.json') if json.loads(p.read_text())['variant']=='global-label-fortyeight'];assert len(selected)==1
candidate=(selected[0]/'sources/src/core/island-geography.ts').read_bytes()
try:
 core.write_bytes(candidate)
 with (D/'candidate-sweep.txt').open('w') as f:r=subprocess.run(['python3',str(R/'docs/prototypes/new-game/T34/run-command.py'),'broader-candidate-sweep','node','docs/prototypes/new-game/T34/sweep.mjs'],cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=1200)
finally:core.write_bytes(original)
(D/'candidate-sweep-report.json').write_text(json.dumps({'exit':r.returncode,'candidate_sha256':hashlib.sha256(candidate).hexdigest(),'original_sha256':hashlib.sha256(original).hexdigest(),'restored_exact':core.read_bytes()==original,'scope':'Disposable candidate numerical/replay100seed probe only. No production adoption or full breadth acceptance.'},indent=2)+'\n');print('candidate100seed sweep exit',r.returncode,flush=True)
