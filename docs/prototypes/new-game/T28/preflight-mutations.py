"""Disposable mock controls: prove Stop and pending-selection acceptance before dispatch."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json
root=Path(__file__).resolve().parent;repo=root.parents[3];out=Path(tempfile.mkdtemp(prefix='mock-controls-',dir=root/'preflight'));p=repo/'src/ui/battleController.ts';original=p.read_bytes();text=original.decode();records=[];inputs={'baseline.ts':original}
try:
 baseline=subprocess.run(['python3',str(root/'run-command.py'),'mock-controls-baseline','npx','vitest','run','tests/ui/battle-controller.test.ts'],cwd=repo,capture_output=True,text=True);print(baseline.stdout,flush=True);assert baseline.returncode==0
 mutants=[('stop',text.replace("stop(revision?:number){if(!this.valid(revision)||(!this.v.running&&!this.v.paused))return false;this.cancel();this.publish();return true;}","stop(revision?:number){if(!this.valid(revision))return false;return true;}")),('pending-selection',text.replace("||this.state.phase!=='attack'||this.state.pendingCapture",'').replace("if(to&&(!from||!attackTargets(this.state,from).includes(to)))return false;",''))]
 for name,mutant in mutants:
  assert mutant!=text
  try:
   p.write_text(mutant);inputs[name+'.ts']=p.read_bytes();r=subprocess.run(['python3',str(root/'run-command.py'),'mock-control-negative-'+name,'npx','vitest','run','tests/ui/battle-controller.test.ts'],cwd=repo,capture_output=True,text=True);print(r.stdout,flush=True);records.append({'name':name,'exit':r.returncode});assert r.returncode==1
  finally:p.write_bytes(original)
finally:
 p.write_bytes(original)
 with tarfile.open(out/'source-inputs.tar.gz','w:gz') as a:
  for name,raw in inputs.items():e=tarfile.TarInfo(name);e.size=len(raw);e.mtime=0;a.addfile(e,io.BytesIO(raw))
 (out/'report.json').write_text(json.dumps({'records':records,'restoredExactly':p.read_bytes()==original,'sourceHashes':{n:hashlib.sha256(b).hexdigest() for n,b in inputs.items()}},indent=2)+'\n')
print(out)
